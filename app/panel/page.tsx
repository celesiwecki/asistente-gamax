import Link from 'next/link';
import { q, uno } from '@/lib/db';
import { enviadosHoy, limiteDiario } from '@/lib/envios';
import { cerrarDerivacion } from './acciones';

export default async function Inicio() {
  const n = async (sql: string) => Number((await uno<{ n: string }>(sql))?.n || 0);
  const [clientes, programados, abiertas, hoy] = await Promise.all([
    n(`SELECT COUNT(*) AS n FROM clientes`),
    n(`SELECT COUNT(*) AS n FROM envios WHERE estado IN ('programado','enviando')`),
    n(`SELECT COUNT(*) AS n FROM derivaciones WHERE estado = 'abierta'`),
    enviadosHoy(),
  ]);
  const derivs = await q<{ id: number; conversacion_id: number; motivo: string; resumen: string; creado: string; nombre: string; telefono: string }>(
    `SELECT d.*, c.nombre, c.telefono FROM derivaciones d JOIN conversaciones c ON c.id = d.conversacion_id
     WHERE d.estado = 'abierta' ORDER BY d.id DESC LIMIT 20`,
  );
  return (
    <>
      <h1>Inicio</h1>
      <p className="sub">Lo que necesita atención del equipo.</p>
      <div className="grid">
        <div className="card"><span className="hint">Charlas para el equipo</span><span className="num">{abiertas}</span></div>
        <div className="card"><span className="hint">Clientes en la base</span><span className="num">{clientes}</span></div>
        <div className="card"><span className="hint">Envíos programados</span><span className="num">{programados}</span></div>
        <div className="card"><span className="hint">Enviados hoy / límite diario</span><span className="num">{hoy} / {limiteDiario()}</span></div>
      </div>
      <div className="card">
        <h2>Charlas que pasó el asistente</h2>
        {!derivs.length && <p className="hint">No hay charlas pendientes.</p>}
        {derivs.map((d) => (
          <div key={d.id} className="fila" style={{ borderTop: '1px solid #EEEAE3', paddingTop: 12 }}>
            <div style={{ flex: '999 1 300px' }}>
              <b>{d.nombre || d.telefono}</b> <span className="pill warn">{d.motivo}</span>
              <p className="hint" style={{ marginTop: 4 }}>{d.resumen}</p>
            </div>
            <Link className="btn" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }} href={`/panel/charlas/${d.conversacion_id}`}>Ver charla</Link>
            <form action={cerrarDerivacion}><input type="hidden" name="id" value={d.id} /><button className="btn ghost" type="submit">Marcar resuelta</button></form>
          </div>
        ))}
      </div>
    </>
  );
}
