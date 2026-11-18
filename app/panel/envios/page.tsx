import Link from 'next/link';
import { q } from '@/lib/db';
import { COSTO_MARKETING_USD, limiteDiario, type Envio } from '@/lib/envios';
import { crearEnvio } from '../acciones';
import { CamposEnvio } from '@/components/CamposEnvio';

const ESTADOS: Record<string, string> = { borrador: 'Borrador', programado: 'Programado', enviando: 'Enviando', enviado: 'Enviado', cancelado: 'Cancelado' };

export default async function Envios() {
  const lista = await q<Envio & { total: string; listos: string }>(
    `SELECT e.*, (SELECT COUNT(*) FROM envio_destinatarios d WHERE d.envio_id = e.id) AS total,
            (SELECT COUNT(*) FROM envio_destinatarios d WHERE d.envio_id = e.id AND d.estado = 'enviado') AS listos
     FROM envios e ORDER BY e.id DESC`,
  );
  return (
    <>
      <h1>Envíos</h1>
      <p className="sub">Los mensajes semanales a toda la base. Se mandan solos todos los días a las 10, hasta {limiteDiario()} clientes por día.</p>
      <div className="card">
        <h2>Envíos</h2>
        <div className="tabla"><table>
          <thead><tr><th>Título</th><th>A quién</th><th>Fecha</th><th>Estado</th><th>Enviados</th><th>Costo estimado</th></tr></thead>
          <tbody>
            {!lista.length && <tr><td colSpan={6} className="hint">Todavía no hay envíos.</td></tr>}
            {lista.map((e) => (
              <tr key={e.id}>
                <td><Link href={`/panel/envios/${e.id}`}>{e.titulo}</Link></td>
                <td>{e.empresa === 'todas' ? 'Todos' : e.empresa}</td>
                <td>{e.programado_para ? new Date(e.programado_para).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : '—'}</td>
                <td><span className={`pill ${e.estado === 'enviado' ? 'ok' : e.estado === 'borrador' ? '' : 'warn'}`}>{ESTADOS[e.estado] || e.estado}</span></td>
                <td>{e.listos} / {e.total}</td>
                <td>US${(Number(e.total) * COSTO_MARKETING_USD).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      <form action={crearEnvio} className="card">
        <h2>Nuevo envío</h2>
        <CamposEnvio />
        <div><button className="btn acc" type="submit">Crear borrador</button></div>
      </form>
    </>
  );
}
