'use client';
import { useEffect, useRef } from 'react';

/** Mantiene la conversación mostrando el último mensaje. */
export function BajarChat({ children, cantidad }: { children: React.ReactNode; cantidad: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollTo(0, ref.current.scrollHeight); }, [cantidad]);
  return <div className="chat" ref={ref} aria-live="polite">{children}</div>;
}
