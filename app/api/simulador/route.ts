import { NextResponse } from 'next/server';
import { q, uno } from '@/lib/db';
import { mensajesDe, type Canal } from '@/lib/conversaciones';
import { procesarEntrante } from '@/lib/procesar';
import { modoReal } from '@/lib/whatsapp';
import { normalizarTelefono } from '@/lib/telefono';

export const maxDuration = 60;

// Con WhatsApp simulado, el simulador usa la misma charla que los envíos (así se ve todo junto).
// Con WhatsApp real, usa una charla aparte para no mandarle nada a nadie.
const canal = (): Canal => (modoReal() ? 'simulador' : 'whatsapp');

async function mensajes(telefono: string) {
  const c = await uno<{ id: number }>(`SELECT id FROM conversaciones WHERE canal = $1 AND telefono = $2`, [canal(), telefono]);
  return c ? mensajesDe(c.id) : [];
}

export async function GET(req: Request) {
  const tel = normalizarTelefono(new URL(req.url).searchParams.get('telefono') || '');
  return NextResponse.json({ mensajes: tel ? await mensajes(tel) : [] });
}

export async function POST(req: Request) {
  const { telefono, nombre, texto } = await req.json();
  const tel = normalizarTelefono(String(telefono || ''));
  if (!tel || !String(texto || '').trim()) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  await procesarEntrante(canal(), tel, String(nombre || ''), String(texto).trim());
  return NextResponse.json({ mensajes: await mensajes(tel) });
}

export async function DELETE(req: Request) {
  const tel = normalizarTelefono(new URL(req.url).searchParams.get('telefono') || '');
  await q(`DELETE FROM conversaciones WHERE canal = $1 AND telefono = $2`, [canal(), tel]);
  return NextResponse.json({ mensajes: [] });
}
