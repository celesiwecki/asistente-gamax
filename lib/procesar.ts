import { q } from './db';
import { generarRespuesta } from './asistente';
import { guardarMensaje, obtenerOCrearConversacion, type Canal } from './conversaciones';
import { enviarTexto } from './whatsapp';

const BAJA = /^\s*(baja|stop|no quiero (recibir )?(mas|más) mensajes)\s*[.!]*\s*$/i;

/** Procesa un mensaje que llega de un cliente: lo guarda, y si corresponde responde el asistente. */
export async function procesarEntrante(canal: Canal, telefono: string, nombre: string, texto: string, externoId?: string) {
  const conv = await obtenerOCrearConversacion(canal, telefono, nombre);
  const guardado = await guardarMensaje(conv.id, 'cliente', texto, { externoId: externoId ?? null });
  if (!guardado) return; // ya lo habíamos recibido (Meta a veces reenvía)

  const responder = async (t: string) => {
    const r = canal === 'whatsapp' ? await enviarTexto(telefono, t) : { ok: true as const, id: '' };
    await guardarMensaje(conv.id, 'asistente', t);
    if (!r.ok) await guardarMensaje(conv.id, 'sistema', `No se pudo enviar por WhatsApp: ${r.error}`);
  };

  if (BAJA.test(texto)) {
    await q(`UPDATE clientes SET acepta_mensajes = FALSE WHERE telefono = $1`, [telefono]);
    await responder('Listo, no te vamos a mandar más mensajes automáticos. Si necesitás algo, escribinos cuando quieras.');
    return;
  }
  if (conv.estado === 'equipo') return; // una persona del equipo tomó la charla

  try {
    const r = await generarRespuesta(conv);
    await responder(r.texto);
    if (r.derivacion) await guardarMensaje(conv.id, 'sistema', `Charla pasada al equipo: ${r.derivacion.motivo}`);
  } catch (e: any) {
    console.error('Error del asistente', e);
    await guardarMensaje(conv.id, 'sistema', `El asistente no pudo responder: ${e?.message || e}`);
  }
}
