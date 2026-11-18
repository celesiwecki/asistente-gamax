import { notFound } from 'next/navigation';
import { q, uno } from '@/lib/db';
import { COSTO_MARKETING_USD, completar, type Envio } from '@/lib/envios';
import { cancelarEnvio, editarEnvio, enviarAhora, programar } from '../../acciones';
import { CamposEnvio } from '@/components/CamposEnvio';

export default async function DetalleEnvio({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const { id } = await params; const { msg } = await searchParams;
  const e = await uno<Envio>(`SELECT * FROM envios WHERE id = $1`, [Number(id)]);
  if (!e) notFound();
  const dest = await q<{ nombre: string; telefono: string; empresa: string; estado: string; error: string | null }>(
    `SELECT c.nombre, c.telefono, c.empresa, d.estado, d.error FROM envio_destinatarios d JOIN clientes c ON c.id = d.cliente_id WHERE d.envio_id = $1 ORDER BY d.id LIMIT 1000`, [e.id],
  );
  const alcance = e.estado === 'borrador'
    ? Number((await uno<{ n: string }>(`SELECT COUNT(*) AS n FROM clientes WHERE acepta_mensajes AND ($1 = 'todas' OR empresa = $1)`, [e.empresa]))?.n || 0)
    : dest.length;
  const cuenta = (s: string) => dest.filter((d) => d.estado === s).length;
  const manana = new Date(Date.now() + 864e5).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  const ejemplo = completar(e.mensaje, { nombre: 'Juan', empresa: e.empresa === 'Gattos' ? 'Gattos' : 'Gamax' });
  return (
    <>
      <h1>{e.titulo}</h1>
      <p className="sub">{alcance} clientes · costo estimado en Meta US${(alcance * COSTO_MARKETING_USD).toFixed(2)} (si ninguno escribió en las últimas 24 hs)</p>
      {msg && <div className="aviso ok">{msg}</div>}
      <div className="card">
        <h2>Así lo ve el cliente</h2>
        <div className="chat" style={{ maxWidth: 420 }}>
          <div className="b asistente">{e.media_url && <span className="media">[{e.media_tipo === 'video' ? 'Video' : e.media_tipo === 'document' ? 'Archivo' : 'Foto'} adjunto]</span>}{ejemplo}</div>
        </div>
      </div>
      {e.estado === 'borrador' && (
        <>
          <form action={editarEnvio} className="card">
            <h2>Editar</h2>
            <input type="hidden" name="id" value={e.id} />
            <CamposEnvio e={e} />
            <div><button className="btn ghost" type="submit">Guardar cambios</button></div>
          </form>
          <div className="card">
            <h2>Mandar</h2>
            <form action={programar} className="fila">
              <input type="hidden" name="id" value={e.id} />
              <label>Fecha<input type="date" name="fecha" defaultValue={manana} required /></label>
              <button className="btn" type="submit">Programar</button>
            </form>
            <form action={enviarAhora}><input type="hidden" name="id" value={e.id} /><button className="btn acc" type="submit">Enviar ahora</button></form>
          </div>
        </>
      )}
      {e.estado !== 'borrador' && (
        <div className="card">
          <h2>Estado</h2>
          <p>Enviados {cuenta('enviado')} · pendientes {cuenta('pendiente')} · con error {cuenta('error')} · dados de baja {cuenta('omitido')}</p>
          <div className="fila">
            {(e.estado === 'programado' || e.estado === 'enviando') && <>
              <form action={enviarAhora} style={{ flex: '0 0 auto' }}><input type="hidden" name="id" value={e.id} /><button className="btn acc" type="submit">Mandar pendientes ahora</button></form>
              <form action={cancelarEnvio} style={{ flex: '0 0 auto' }}><input type="hidden" name="id" value={e.id} /><button className="btn ghost" type="submit">Cancelar pendientes</button></form>
            </>}
          </div>
          <div className="tabla"><table>
            <thead><tr><th>Cliente</th><th>Teléfono</th><th>Estado</th><th>Detalle</th></tr></thead>
            <tbody>{dest.map((d, i) => <tr key={i}><td>{d.nombre}</td><td>{d.telefono}</td><td>{d.estado}</td><td className="hint">{d.error}</td></tr>)}</tbody>
          </table></div>
        </div>
      )}
    </>
  );
}
