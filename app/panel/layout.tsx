import Link from 'next/link';
import { salir } from './acciones';
import { modoReal } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const real = modoReal();
  const ia = !!process.env.ANTHROPIC_API_KEY;
  return (
    <>
      <header className="top">
        <div className="in">
          <span className="marca">Asistente · Gamax / Gattos</span>
          <nav className="nav">
            <Link href="/panel">Inicio</Link>
            <Link href="/panel/charlas">Charlas</Link>
            <Link href="/panel/envios">Envíos</Link>
            <Link href="/panel/clientes">Clientes</Link>
            <Link href="/panel/conocimiento">Lo que sabe</Link>
            <Link href="/panel/simulador">Simulador</Link>
            <form action={salir}><button className="btn ghost" style={{ minHeight: 40 }} type="submit">Salir</button></form>
          </nav>
        </div>
      </header>
      <main>
        {!real && <div className="aviso">WhatsApp en <b>modo simulado</b>: no se manda ningún mensaje real. Los envíos y respuestas quedan guardados para revisar.</div>}
        {!ia && <div className="aviso">Falta configurar la IA (ANTHROPIC_API_KEY): el asistente responde con mensajes fijos de prueba.</div>}
        {children}
      </main>
    </>
  );
}
