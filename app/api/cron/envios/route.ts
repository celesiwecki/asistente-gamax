import { NextResponse } from 'next/server';
import { procesarEnvios } from '@/lib/envios';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/** Vercel llama acá todos los días (ver vercel.json) para mandar los envíos programados. */
export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get('authorization') !== `Bearer ${secreto}`) {
    return new Response('No autorizado', { status: 401 });
  }
  return NextResponse.json(await procesarEnvios());
}
