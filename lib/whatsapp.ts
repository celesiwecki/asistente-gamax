import crypto from 'node:crypto';

export const modoReal = () => process.env.WHATSAPP_MODE === 'real';

type Resultado = { ok: true; id: string } | { ok: false; error: string };

async function llamarApi(body: Record<string, unknown>): Promise<Resultado> {
  const v = process.env.WHATSAPP_API_VERSION || 'v23.0';
  const url = `https://graph.facebook.com/${v}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', ...body }),
    });
    const j: any = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: j?.error?.message || `HTTP ${r.status}` };
    return { ok: true, id: j?.messages?.[0]?.id || '' };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Error de red' };
  }
}

function tipoMedia(url: string, tipo?: string | null): 'image' | 'video' | 'document' {
  if (tipo === 'image' || tipo === 'video' || tipo === 'document') return tipo;
  if (/\.(mp4|mov|3gp)(\?|$)/i.test(url)) return 'video';
  if (/\.(pdf|xlsx?|docx?)(\?|$)/i.test(url)) return 'document';
  return 'image';
}

/** Texto libre (con foto, video o archivo opcional). Solo vale dentro de la ventana de 24 hs. */
export async function enviarTexto(telefono: string, texto: string, mediaUrl?: string | null, mediaTipo?: string | null): Promise<Resultado> {
  if (!modoReal()) return { ok: true, id: 'sim-' + crypto.randomUUID() };
  if (mediaUrl) {
    const t = tipoMedia(mediaUrl, mediaTipo);
    const media: Record<string, string> = { link: mediaUrl };
    if (t !== 'video' || texto) media.caption = texto;
    return llamarApi({ to: telefono, type: t, [t]: media });
  }
  return llamarApi({ to: telefono, type: 'text', text: { body: texto, preview_url: true } });
}

/**
 * Plantilla aprobada por Meta (obligatoria fuera de la ventana de 24 hs).
 * La plantilla debe tener {{1}} = nombre del cliente en el cuerpo y, si lleva foto/video/archivo, un encabezado de ese tipo.
 */
export async function enviarPlantilla(
  telefono: string, plantilla: string, nombre: string, mediaUrl?: string | null, mediaTipo?: string | null,
): Promise<Resultado> {
  if (!modoReal()) return { ok: true, id: 'sim-' + crypto.randomUUID() };
  const components: any[] = [{ type: 'body', parameters: [{ type: 'text', text: nombre || 'cliente' }] }];
  if (mediaUrl) {
    const t = tipoMedia(mediaUrl, mediaTipo);
    components.unshift({ type: 'header', parameters: [{ type: t, [t]: { link: mediaUrl } }] });
  }
  return llamarApi({
    to: telefono, type: 'template',
    template: { name: plantilla, language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'es_AR' }, components },
  });
}

/** Verifica que el aviso venga de Meta (firma X-Hub-Signature-256). Sin WHATSAPP_APP_SECRET no se verifica. */
export function firmaValida(cuerpo: string, firma: string | null): boolean {
  const secreto = process.env.WHATSAPP_APP_SECRET;
  if (!secreto) return true;
  if (!firma?.startsWith('sha256=')) return false;
  const esperado = crypto.createHmac('sha256', secreto).update(cuerpo).digest('hex');
  const a = Buffer.from(firma.slice(7)); const b = Buffer.from(esperado);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export type Entrante = { de: string; nombre: string; texto: string; id: string };

/** Saca los mensajes de texto del aviso (webhook) de WhatsApp. */
export function leerEntrantes(payload: any): Entrante[] {
  const out: Entrante[] = [];
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const v = change?.value;
      const nombres = new Map<string, string>((v?.contacts ?? []).map((c: any) => [c.wa_id, c?.profile?.name ?? '']));
      for (const m of v?.messages ?? []) {
        let texto = '';
        if (m.type === 'text') texto = m.text?.body ?? '';
        else if (m.type === 'button') texto = m.button?.text ?? '';
        else if (m.type === 'interactive') texto = m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? '';
        else if (m.type === 'image' || m.type === 'video' || m.type === 'document') texto = m[m.type]?.caption || `[Mandó un ${m.type === 'image' ? 'foto' : m.type === 'video' ? 'video' : 'archivo'}]`;
        else if (m.type === 'audio') texto = '[Mandó un audio]';
        else texto = `[Mensaje de tipo ${m.type}]`;
        out.push({ de: m.from, nombre: nombres.get(m.from) ?? '', texto, id: m.id });
      }
    }
  }
  return out;
}
