import { salir } from './acciones';
import { modoReal } from '@/lib/whatsapp';
import { uno } from '@/lib/db';
import { Navegacion } from '@/components/Navegacion';
import { Icono } from '@/components/Icono';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const real = modoReal();
  const ia = !!process.env.ANTHROPIC_API_KEY;
  const p = await uno<{ n: string }>(`SELECT COUNT(*) AS n FROM derivaciones WHERE estado = 'abierta'`);
  return (
    <div className="app">
      <aside className="lateral">
        <div className="marca">
          <span className="marca-logo">GG</span>
          <div><b>Asistente</b><span>Gamax y Gattos</span></div>
        </div>
        <Navegacion pendientes={Number(p?.n || 0)} />
        <div className="lateral-pie">
          <div className="estado"><span className={`punto ${real ? 'ok' : 'prueba'}`} />WhatsApp {real ? 'conectado' : 'en modo de prueba'}</div>
          <div className="estado"><span className={`punto ${ia ? 'ok' : 'prueba'}`} />IA {ia ? 'activa' : 'sin configurar'}</div>
          <form action={salir}><button className="salir" type="submit"><span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Icono n="salir" t={16} />Cerrar sesión</span></button></form>
        </div>
      </aside>
      <main className="principal"><div className="contenido">{children}</div></main>
    </div>
  );
}
