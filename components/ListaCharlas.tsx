import { mostrarTelefono } from '@/lib/telefono';
import Link from 'next/link';
import { q } from '@/lib/db';

const TZ = 'America/Argentina/Buenos_Aires';
export const iniciales = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
function cuando(s: string) {
  const d = new Date(s); const hoy = new Date();
  const mismoDia = d.toLocaleDateString('es-AR', { timeZone: TZ }) === hoy.toLocaleDateString('es-AR', { timeZone: TZ });
  return mismoDia ? d.toLocaleTimeString('es-AR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('es-AR', { timeZone: TZ, day: 'numeric', month: 'short' });
}

export async function ListaCharlas({ activa, ver = 'todas', b = '' }: { activa?: number; ver?: string; b?: string }) {
  const lista = await q<{ id: number; canal: string; nombre: string; telefono: string; estado: string; actualizado: string; abiertas: string; ultimo: string | null; ultimo_de: string | null }>(
    `SELECT c.*, (SELECT COUNT(*) FROM derivaciones d WHERE d.conversacion_id = c.id AND d.estado = 'abierta') AS abiertas,
            u.texto AS ultimo, u.de AS ultimo_de
     FROM conversaciones c
     LEFT JOIN LATERAL (SELECT texto, de FROM mensajes m WHERE m.conversacion_id = c.id AND m.de <> 'sistema' ORDER BY m.id DESC LIMIT 1) u ON TRUE
     WHERE EXISTS (SELECT 1 FROM mensajes m WHERE m.conversacion_id = c.id AND m.de = 'cliente')
       AND ($1 = 'todas' OR ($1 = 'equipo' AND (c.estado = 'equipo' OR EXISTS (SELECT 1 FROM derivaciones d WHERE d.conversacion_id = c.id AND d.estado = 'abierta'))))
       AND ($2 = '' OR c.nombre ILIKE '%' || $2 || '%' OR c.telefono LIKE '%' || $2 || '%')
     ORDER BY c.actualizado DESC LIMIT 200`, [ver, b],
  );
  const q2 = (v: string) => `/panel/charlas${activa ? `/${activa}` : ''}?ver=${v}`;
  return (
    <div className="bandeja-lista">
      <div className="bandeja-filtros">
        <form><input type="search" name="b" defaultValue={b} placeholder="Buscar por nombre o teléfono" aria-label="Buscar charlas" /><input type="hidden" name="ver" value={ver} /></form>
        <div className="pestanas">
          <Link href={q2('todas')} aria-current={ver === 'todas' ? 'page' : undefined}>Todas</Link>
          <Link href={q2('equipo')} aria-current={ver === 'equipo' ? 'page' : undefined}>Para el equipo</Link>
        </div>
      </div>
      <div className="items">
        {!lista.length && <div className="vacio"><b>{ver === 'equipo' ? 'Nada para atender' : 'Todavía no hay charlas'}</b>{ver === 'equipo' ? 'El asistente está resolviendo todo solo.' : 'Cuando un cliente escriba, aparece acá.'}</div>}
        {lista.map((c) => (
          <Link key={c.id} href={`/panel/charlas/${c.id}?ver=${ver}`} className="item" aria-current={activa === c.id ? 'page' : undefined}>
            <span className="avatar">{iniciales(c.nombre || mostrarTelefono(c.telefono))}</span>
            <span className="txt">
              <span className="linea1"><b>{c.nombre || mostrarTelefono(c.telefono)}</b><time>{cuando(c.actualizado)}</time></span>
              <span className="prev" style={{ display: 'block' }}>{c.ultimo_de === 'asistente' ? 'Asistente: ' : c.ultimo_de === 'equipo' ? 'Equipo: ' : ''}{c.ultimo}</span>
              {(Number(c.abiertas) > 0 || c.estado === 'equipo') && (
                <span className="tags">
                  {Number(c.abiertas) > 0 && <span className="pill obra">Para atender</span>}
                  {c.estado === 'equipo' && <span className="pill info">La atiende el equipo</span>}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
