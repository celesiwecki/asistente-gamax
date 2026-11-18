import { q, uno } from './db';
import { guardarMensaje, obtenerOCrearConversacion, ventanaAbierta } from './conversaciones';
import { enviarPlantilla, enviarTexto, modoReal } from './whatsapp';

export const COSTO_MARKETING_USD = 0.071; // por mensaje de marketing entregado en Argentina (tarifa de Meta, puede cambiar)
const TZ = 'America/Argentina/Buenos_Aires';

export type Envio = {
  id: number; titulo: string; mensaje: string; media_tipo: string | null; media_url: string | null;
  plantilla: string | null; empresa: string; programado_para: string | null; estado: string; creado: string;
};

export const completar = (texto: string, c: { nombre: string; empresa: string }) =>
  texto.replaceAll('{nombre}', c.nombre.split(' ')[0] || c.nombre).replaceAll('{empresa}', c.empresa);

export function limiteDiario() {
  const n = Number(process.env.MAX_ENVIOS_POR_DIA || 250);
  return Number.isFinite(n) && n > 0 ? n : 250;
}

export async function enviadosHoy(): Promise<number> {
  const r = await uno<{ n: string }>(
    `SELECT COUNT(DISTINCT cliente_id) AS n FROM envio_destinatarios
     WHERE estado = 'enviado' AND (enviado AT TIME ZONE '${TZ}')::date = (NOW() AT TIME ZONE '${TZ}')::date`,
  );
  return Number(r?.n || 0);
}

/** Deja el envío listo para salir en la fecha indicada y arma la lista de destinatarios. */
export async function programarEnvio(id: number, fecha: string) {
  const e = await uno<Envio>(`SELECT * FROM envios WHERE id = $1`, [id]);
  if (!e) throw new Error('Envío inexistente');
  await q(
    `INSERT INTO envio_destinatarios (envio_id, cliente_id)
     SELECT $1, id FROM clientes WHERE acepta_mensajes AND ($2 = 'todas' OR empresa = $2)
     ON CONFLICT DO NOTHING`,
    [id, e.empresa],
  );
  await q(`UPDATE envios SET estado = 'programado', programado_para = $2 WHERE id = $1`, [id, fecha]);
}

/** Manda los envíos programados hasta hoy, respetando el límite diario de Meta. Lo llama el cron diario. */
export async function procesarEnvios(): Promise<{ enviados: number; errores: number; pendientes: number; limiteAlcanzado: boolean }> {
  let cupo = limiteDiario() - (await enviadosHoy());
  let enviados = 0, errores = 0;
  const lista = await q<Envio>(
    `SELECT * FROM envios WHERE estado IN ('programado', 'enviando')
     AND programado_para <= (NOW() AT TIME ZONE '${TZ}')::date ORDER BY programado_para, id`,
  );
  for (const e of lista) {
    if (cupo <= 0) break;
    await q(`UPDATE envios SET estado = 'enviando' WHERE id = $1`, [e.id]);
    const dest = await q<{ id: number; cliente_id: number; nombre: string; telefono: string; empresa: string; acepta_mensajes: boolean }>(
      `SELECT d.id, d.cliente_id, c.nombre, c.telefono, c.empresa, c.acepta_mensajes
       FROM envio_destinatarios d JOIN clientes c ON c.id = d.cliente_id
       WHERE d.envio_id = $1 AND d.estado = 'pendiente' ORDER BY d.id LIMIT $2`,
      [e.id, cupo],
    );
    for (const d of dest) {
      if (!d.acepta_mensajes) {
        await q(`UPDATE envio_destinatarios SET estado = 'omitido', error = 'Pidió la baja' WHERE id = $1`, [d.id]);
        continue;
      }
      const texto = completar(e.mensaje, d);
      const conv = await obtenerOCrearConversacion('whatsapp', d.telefono, d.nombre);
      let r;
      if (ventanaAbierta(conv)) r = await enviarTexto(d.telefono, texto, e.media_url, e.media_tipo);
      else if (modoReal() && !e.plantilla) r = { ok: false as const, error: 'Falta el nombre de la plantilla aprobada en Meta' };
      else r = await enviarPlantilla(d.telefono, e.plantilla || '', d.nombre.split(' ')[0], e.media_url, e.media_tipo);

      if (r.ok) {
        await q(`UPDATE envio_destinatarios SET estado = 'enviado', enviado = NOW(), error = NULL WHERE id = $1`, [d.id]);
        await guardarMensaje(conv.id, 'asistente', texto, { mediaUrl: e.media_url, envioId: e.id, externoId: r.id || null });
        enviados++; cupo--;
      } else {
        await q(`UPDATE envio_destinatarios SET estado = 'error', error = $2 WHERE id = $1`, [d.id, r.error]);
        errores++;
      }
    }
    const resta = await uno<{ n: string }>(`SELECT COUNT(*) AS n FROM envio_destinatarios WHERE envio_id = $1 AND estado = 'pendiente'`, [e.id]);
    if (Number(resta?.n || 0) === 0) await q(`UPDATE envios SET estado = 'enviado' WHERE id = $1`, [e.id]);
  }
  const p = await uno<{ n: string }>(
    `SELECT COUNT(*) AS n FROM envio_destinatarios d JOIN envios e ON e.id = d.envio_id
     WHERE d.estado = 'pendiente' AND e.estado IN ('programado', 'enviando')`,
  );
  const pendientes = Number(p?.n || 0);
  return { enviados, errores, pendientes, limiteAlcanzado: cupo <= 0 && pendientes > 0 };
}
