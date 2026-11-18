import { q, uno } from './db';

export type Canal = 'whatsapp' | 'simulador';
export type Conversacion = {
  id: number; canal: Canal; telefono: string; nombre: string; cliente_id: number | null;
  estado: 'asistente' | 'equipo'; ultima_entrada: string | null; actualizado: string;
};
export type Mensaje = {
  id: number; conversacion_id: number; de: 'cliente' | 'asistente' | 'equipo' | 'sistema';
  texto: string; media_url: string | null; creado: string;
};

export async function obtenerOCrearConversacion(canal: Canal, telefono: string, nombre = ''): Promise<Conversacion> {
  const cliente = await uno<{ id: number; nombre: string }>(`SELECT id, nombre FROM clientes WHERE telefono = $1`, [telefono]);
  const conv = await uno<Conversacion>(
    `INSERT INTO conversaciones (canal, telefono, nombre, cliente_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (canal, telefono) DO UPDATE SET
       cliente_id = COALESCE(conversaciones.cliente_id, EXCLUDED.cliente_id),
       nombre = CASE WHEN conversaciones.nombre = '' THEN EXCLUDED.nombre ELSE conversaciones.nombre END
     RETURNING *`,
    [canal, telefono, cliente?.nombre || nombre || '', cliente?.id ?? null],
  );
  return conv!;
}

export async function guardarMensaje(
  conversacionId: number,
  de: Mensaje['de'],
  texto: string,
  extra: { mediaUrl?: string | null; externoId?: string | null; envioId?: number | null } = {},
): Promise<Mensaje | null> {
  const m = await uno<Mensaje>(
    `INSERT INTO mensajes (conversacion_id, de, texto, media_url, externo_id, envio_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (externo_id) DO NOTHING
     RETURNING *`,
    [conversacionId, de, texto, extra.mediaUrl ?? null, extra.externoId ?? null, extra.envioId ?? null],
  );
  if (m) {
    await q(
      `UPDATE conversaciones SET actualizado = NOW()${de === 'cliente' ? ', ultima_entrada = NOW()' : ''} WHERE id = $1`,
      [conversacionId],
    );
  }
  return m ?? null;
}

export async function mensajesDe(conversacionId: number, limite = 200): Promise<Mensaje[]> {
  return q<Mensaje>(
    `SELECT * FROM (SELECT * FROM mensajes WHERE conversacion_id = $1 ORDER BY id DESC LIMIT $2) t ORDER BY id`,
    [conversacionId, limite],
  );
}

/** WhatsApp permite texto libre solo dentro de las 24 hs desde el último mensaje del cliente. */
export function ventanaAbierta(c: Pick<Conversacion, 'ultima_entrada'>): boolean {
  if (!c.ultima_entrada) return false;
  return Date.now() - new Date(c.ultima_entrada).getTime() < 24 * 60 * 60 * 1000;
}
