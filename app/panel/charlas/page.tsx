import Link from 'next/link';
import { q } from '@/lib/db';
import { Refrescar } from '@/components/Refrescar';

export default async function Charlas({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver = 'todas' } = await searchParams;
  const lista = await q<{ id: number; canal: string; nombre: string; telefono: string; estado: string; actualizado: string; abiertas: string; ultimo: string | null }>(
    `SELECT c.*, (SELECT COUNT(*) FROM derivaciones d WHERE d.conversacion_id = c.id AND d.estado = 'abierta') AS abiertas,
            (SELECT texto FROM mensajes m WHERE m.conversacion_id = c.id AND m.de <> 'sistema' ORDER BY m.id DESC LIMIT 1) AS ultimo
     FROM conversaciones c
     WHERE EXISTS (SELECT 1 FROM mensajes m WHERE m.conversacion_id = c.id AND m.de = 'cliente')
       AND ($1 = 'todas' OR ($1 = 'equipo' AND (c.estado = 'equipo' OR EXISTS (SELECT 1 FROM derivaciones d WHERE d.conversacion_id = c.id AND d.estado = 'abierta'))))
     ORDER BY c.actualizado DESC LIMIT 200`, [ver],
  );
  return (
    <>
      <Refrescar />
      <h1>Charlas</h1>
      <p className="sub">Las conversaciones donde el cliente escribió. Se actualiza solo.</p>
      <div className="fila" style={{ marginBottom: 16 }}>
        <Link className={`btn ${ver === 'todas' ? '' : 'ghost'}`} style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} href="/panel/charlas">Todas</Link>
        <Link className={`btn ${ver === 'equipo' ? '' : 'ghost'}`} style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} href="/panel/charlas?ver=equipo">Para el equipo</Link>
      </div>
      <div className="card">
        {!lista.length && <p className="hint">No hay charlas.</p>}
        <div className="tabla"><table>
          <thead><tr><th>Contacto</th><th>Último mensaje</th><th>Canal</th><th>Estado</th></tr></thead>
          <tbody>{lista.map((c) => (
            <tr key={c.id}>
              <td><Link href={`/panel/charlas/${c.id}`}>{c.nombre || c.telefono}</Link></td>
              <td className="hint">{(c.ultimo || '').slice(0, 90)}</td>
              <td>{c.canal === 'simulador' ? 'Simulador' : 'WhatsApp'}</td>
              <td>{Number(c.abiertas) > 0 && <span className="pill warn">Pasada al equipo</span>} {c.estado === 'equipo' && <span className="pill">La atiende el equipo</span>}</td>
            </tr>))}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
