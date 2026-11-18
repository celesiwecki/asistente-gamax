'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Vuelve a pedir la página cada tantos segundos, para ver mensajes nuevos. */
export function Refrescar({ segundos = 8 }: { segundos?: number }) {
  const router = useRouter();
  useEffect(() => { const t = setInterval(() => router.refresh(), segundos * 1000); return () => clearInterval(t); }, [router, segundos]);
  return null;
}
