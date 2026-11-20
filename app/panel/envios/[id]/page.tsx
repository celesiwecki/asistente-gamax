import { mostrarTelefono } from '@/lib/telefono';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { q, uno } from '@/lib/db';
import { COSTO_MARKETING_USD, completar, type Envio } from '@/lib/envios';
import { cancelarEnvio, editarEnvio, enviarAhora, programar } from '../../acciones';
import { CamposEnvio } from '@/components/CamposEnvio';
import { Encabezado } from '@/components/Encabezado';

const EST: Record<string, [string, string]> = { pendiente: ['Pendiente', 'info'], enviado: ['Enviado', 'ok'], error: ['Error', 'alerta'], omitido: ['Dio de baja', ''], cancelado: ['Cancelado', ''] };

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
  const enviados = cuenta('enviado');
  return (
    <>
      <p style={{ margin: '0 0 8px' }}><Link className="hint" href="/panel/envios">Envíos</Link></p>
      <Encabezado titulo={e.titulo} texto={`${alcance} clientes. Si ninguno escribió en las últimas 24 horas, cuesta unos US$${(alcance * COSTO_MARKETING_USD).toFixed(2)} en Meta.`} />
      {msg && <div className="aviso ok">{msg}</div>}
      {e.estado !== 'borrador' && (
        <section className="metricas" aria-label="Estado del envío">
          <div className="metrica"><span className="num">{enviados}</span><span className="nom">Enviados</span><span className="barra"><i style={{ width: `${alcance ? (enviados / alcance) * 100 : 0}%` }} /></span></div>
          <div className="metrica"><span className="num">{cuenta('pendiente')}</span><span className="nom">Pendientes</span></div>
          <div className="metrica"><span className="num">{cuenta('error')}</span><span className="nom">Con error</span></div>
          <div className="metrica"><span className="num">{cuenta('omitido')}</span><span className="nom">Dados de baja</span></div>
        </section>
      )}
      <div className="columnas">
        <div>
          {e.estado === 'borrador' ? (
            <form action={editarEnvio} className="bloque">
              <div className="bloque-cab"><h2>Mensaje</h2></div>
              <div className="bloque-cuerpo">
                <input type="hidden" name="id" value={e.id} />
                <CamposEnvio e={e} />
                <div><button className="btn sec" type="submit">Guardar cambios</button></div>
              </div>
            </form>
          ) : (
            <section className="bloque">
              <div className="bloque-cab"><h2>Destinatarios</h2>
                {(e.estado === 'programado' || e.estado === 'enviando') && <div className="acciones">
                  <form action={cancelarEnvio}><input type="hidden" name="id" value={e.id} /><button className="btn sec chico" type="submit">Cancelar pendientes</button></form>
                  <form action={enviarAhora}><input type="hidden" name="id" value={e.id} /><button className="btn principal-btn chico" type="submit">Mandar pendientes ahora</button></form>
                </div>}
              </div>
              <div className="tabla"><table>
                <thead><tr><th>Cliente</th><th>Teléfono</th><th>Estado</th></tr></thead>
                <tbody>{dest.map((d, i) => { const [t, c] = EST[d.estado] || [d.estado, '']; return <tr key={i}><td>{d.nombre}</td><td>{mostrarTelefono(d.telefono)}</td><td><span className={`pill ${c}`}>{t}</span>{d.error && <div className="hint">{d.error}</div>}</td></tr>; })}</tbody>
              </table></div>
            </section>
          )}
        </div>
        <div>
          <section className="bloque">
            <div className="bloque-cab"><h2>Así lo ve el cliente</h2></div>
            <div className="bloque-cuerpo">
              <div className="preview"><div className="b">{e.media_url && <span className="media">{e.media_tipo === 'video' ? 'Video adjunto' : e.media_tipo === 'document' ? 'PDF adjunto' : 'Foto adjunta'}</span>}{ejemplo}</div></div>
            </div>
          </section>
          {e.estado === 'borrador' && (
            <section className="bloque">
              <div className="bloque-cab"><h2>Mandar</h2></div>
              <div className="bloque-cuerpo">
                <form action={programar} className="fila">
                  <input type="hidden" name="id" value={e.id} />
                  <label>Fecha<input type="date" name="fecha" defaultValue={manana} required /></label>
                  <button className="btn" type="submit">Programar</button>
                </form>
                <form action={enviarAhora}><input type="hidden" name="id" value={e.id} /><button className="btn principal-btn" type="submit" style={{ width: '100%' }}>Enviar ahora</button></form>
                <p className="hint">Si son más de lo que permite Meta por día, el resto sale automáticamente los días siguientes.</p>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
