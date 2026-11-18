import { after, NextResponse } from 'next/server';
import { firmaValida, leerEntrantes } from '@/lib/whatsapp';
import { procesarEntrante } from '@/lib/procesar';

export const maxDuration = 60;

/** Meta llama acá una vez para verificar el webhook. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  if (u.searchParams.get('hub.mode') === 'subscribe' && u.searchParams.get('hub.verify_token') === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(u.searchParams.get('hub.challenge') ?? '', { status: 200 });
  }
  return new Response('Token incorrecto', { status: 403 });
}

/** Meta avisa acá cada mensaje que llega. Respondemos enseguida y procesamos después. */
export async function POST(req: Request) {
  const cuerpo = await req.text();
  if (!firmaValida(cuerpo, req.headers.get('x-hub-signature-256'))) return new Response('Firma inválida', { status: 401 });
  let payload: unknown;
  try { payload = JSON.parse(cuerpo); } catch { return new Response('JSON inválido', { status: 400 }); }
  const entrantes = leerEntrantes(payload);
  after(async () => {
    for (const m of entrantes) await procesarEntrante('whatsapp', m.de, m.nombre, m.texto, m.id);
  });
  return NextResponse.json({ ok: true });
}
