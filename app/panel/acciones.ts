'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { q, uno } from '@/lib/db';
import { leerCsv } from '@/lib/csv';
import { normalizarTelefono } from '@/lib/telefono';
import { guardarConocimiento } from '@/lib/conocimiento';
import { procesarEnvios, programarEnvio } from '@/lib/envios';
import { guardarMensaje, type Conversacion } from '@/lib/conversaciones';
import { enviarTexto } from '@/lib/whatsapp';
import { COOKIE } from '@/lib/auth';

const s = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const empresaDe = (v: string) => (/^gat/i.test(v) ? 'Gattos' : 'Gamax');
const esSi = (v: string) => /^(si|sí|s|x|1|true|habitual)$/i.test(v.trim());

export async function salir() {
  (await cookies()).delete(COOKIE);
  redirect('/login');
}

/* Clientes */
export async function importarCsv(form: FormData) {
  const f = form.get('archivo');
  if (!(f instanceof File) || !f.size) redirect('/panel/clientes?msg=' + encodeURIComponent('Elegí un archivo CSV.'));
  const filas = leerCsv(await (f as File).text());
  let ok = 0, malos = 0;
  for (const r of filas) {
    const tel = normalizarTelefono(r.telefono || r.celular || r.whatsapp || '');
    const nombre = r.nombre || r.cliente || '';
    if (!tel || !nombre) { malos++; continue; }
    await q(
      `INSERT INTO clientes (nombre, telefono, empresa, zona, habitual) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (telefono) DO UPDATE SET nombre = EXCLUDED.nombre, empresa = EXCLUDED.empresa, zona = EXCLUDED.zona, habitual = EXCLUDED.habitual`,
      [nombre, tel, empresaDe(r.empresa || ''), r.zona || '', esSi(r.habitual || '')],
    );
    ok++;
  }
  revalidatePath('/panel/clientes');
  redirect('/panel/clientes?msg=' + encodeURIComponent(`Cargados ${ok} clientes${malos ? `; ${malos} filas sin nombre o teléfono quedaron afuera` : ''}.`));
}

export async function agregarCliente(form: FormData) {
  const tel = normalizarTelefono(s(form, 'telefono'));
  if (!tel || !s(form, 'nombre')) redirect('/panel/clientes?msg=' + encodeURIComponent('Faltan nombre o teléfono.'));
  await q(
    `INSERT INTO clientes (nombre, telefono, empresa, zona, habitual) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (telefono) DO UPDATE SET nombre = EXCLUDED.nombre, empresa = EXCLUDED.empresa, zona = EXCLUDED.zona, habitual = EXCLUDED.habitual`,
    [s(form, 'nombre'), tel, empresaDe(s(form, 'empresa')), s(form, 'zona'), form.get('habitual') === 'on'],
  );
  revalidatePath('/panel/clientes');
}

export async function cambiarPermiso(form: FormData) {
  await q(`UPDATE clientes SET acepta_mensajes = NOT acepta_mensajes WHERE id = $1`, [Number(form.get('id'))]);
  revalidatePath('/panel/clientes');
}

export async function borrarCliente(form: FormData) {
  await q(`DELETE FROM clientes WHERE id = $1`, [Number(form.get('id'))]);
  revalidatePath('/panel/clientes');
}

/* Envíos */
export async function crearEnvio(form: FormData) {
  const r = await uno<{ id: number }>(
    `INSERT INTO envios (titulo, mensaje, media_tipo, media_url, plantilla, empresa) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [s(form, 'titulo') || 'Envío', s(form, 'mensaje'), s(form, 'media_tipo') || null, s(form, 'media_url') || null, s(form, 'plantilla') || null, s(form, 'empresa') || 'todas'],
  );
  redirect('/panel/envios/' + r!.id);
}

export async function editarEnvio(form: FormData) {
  const id = Number(form.get('id'));
  await q(
    `UPDATE envios SET titulo = $2, mensaje = $3, media_tipo = $4, media_url = $5, plantilla = $6, empresa = $7 WHERE id = $1 AND estado = 'borrador'`,
    [id, s(form, 'titulo'), s(form, 'mensaje'), s(form, 'media_tipo') || null, s(form, 'media_url') || null, s(form, 'plantilla') || null, s(form, 'empresa') || 'todas'],
  );
  revalidatePath('/panel/envios/' + id);
}

export async function programar(form: FormData) {
  const id = Number(form.get('id'));
  await programarEnvio(id, s(form, 'fecha'));
  revalidatePath('/panel/envios');
  redirect('/panel/envios/' + id);
}

export async function enviarAhora(form: FormData) {
  const id = Number(form.get('id'));
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  const e = await uno<{ estado: string }>(`SELECT estado FROM envios WHERE id = $1`, [id]);
  if (e?.estado === 'borrador') await programarEnvio(id, hoy);
  else await q(`UPDATE envios SET programado_para = LEAST(programado_para, $2::date) WHERE id = $1`, [id, hoy]);
  const r = await procesarEnvios();
  const msg = `Enviados ${r.enviados}${r.errores ? `, con error ${r.errores}` : ''}.` + (r.limiteAlcanzado ? ` Se llegó al límite diario: ${r.pendientes} quedan para mañana.` : '');
  redirect(`/panel/envios/${id}?msg=` + encodeURIComponent(msg));
}

export async function cancelarEnvio(form: FormData) {
  const id = Number(form.get('id'));
  await q(`UPDATE envio_destinatarios SET estado = 'cancelado' WHERE envio_id = $1 AND estado = 'pendiente'`, [id]);
  await q(`UPDATE envios SET estado = 'cancelado' WHERE id = $1`, [id]);
  revalidatePath('/panel/envios/' + id);
}

/* Charlas */
export async function tomarCharla(form: FormData) {
  const id = Number(form.get('id'));
  const estado = s(form, 'estado') === 'asistente' ? 'asistente' : 'equipo';
  await q(`UPDATE conversaciones SET estado = $2 WHERE id = $1`, [id, estado]);
  await guardarMensaje(id, 'sistema', estado === 'equipo' ? 'Una persona del equipo tomó la charla' : 'La charla volvió al asistente');
  revalidatePath('/panel/charlas/' + id);
}

export async function responderComoEquipo(form: FormData) {
  const id = Number(form.get('id'));
  const texto = s(form, 'texto');
  if (!texto) return;
  const c = await uno<Conversacion>(`SELECT * FROM conversaciones WHERE id = $1`, [id]);
  if (!c) return;
  const r = c.canal === 'whatsapp' ? await enviarTexto(c.telefono, texto) : { ok: true as const, id: '' };
  await guardarMensaje(id, 'equipo', texto);
  if (c.estado !== 'equipo') {
    await q(`UPDATE conversaciones SET estado = 'equipo' WHERE id = $1`, [id]);
    await guardarMensaje(id, 'sistema', 'Una persona del equipo tomó la charla');
  }
  if (!r.ok) await guardarMensaje(id, 'sistema', `No se pudo enviar por WhatsApp: ${r.error}`);
  revalidatePath('/panel/charlas/' + id);
}

export async function cerrarDerivacion(form: FormData) {
  await q(`UPDATE derivaciones SET estado = 'resuelta' WHERE id = $1`, [Number(form.get('id'))]);
  revalidatePath('/panel/charlas');
  revalidatePath('/panel');
}

/* Conocimiento */
export async function guardarInfo(form: FormData) {
  await guardarConocimiento(String(form.get('texto') ?? ''));
  redirect('/panel/conocimiento?ok=1');
}
