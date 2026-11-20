import { mostrarTelefono } from '@/lib/telefono';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { q, uno } from '@/lib/db';
import { mensajesDe, ventanaAbierta, type Conversacion } from '@/lib/conversaciones';
import { cerrarDerivacion, responderComoEquipo, tomarCharla } from '../../acciones';
import { Burbujas } from '@/components/Burbujas';
import { BajarChat } from '@/components/BajarChat';
import { Encabezado } from '@/components/Encabezado';
import { ListaCharlas, iniciales } from '@/components/ListaCharlas';
import { Refrescar } from '@/components/Refrescar';

export default async function Charla({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ver?: string; b?: string }> }) {
  const { id } = await params; const { ver = 'todas', b = '' } = await searchParams;
  const c = await uno<Conversacion & { zona: string | null; empresa: string | null; habitual: boolean | null }>(
    `SELECT c.*, cl.zona, cl.empresa, cl.habitual FROM conversaciones c LEFT JOIN clientes cl ON cl.id = c.cliente_id WHERE c.id = $1`, [Number(id)],
  );
  if (!c) notFound();
  const [mensajes, derivs] = await Promise.all([
    mensajesDe(c.id),
    q<{ id: number; motivo: string; resumen: string }>(`SELECT * FROM derivaciones WHERE conversacion_id = $1 AND estado = 'abierta' ORDER BY id DESC`, [c.id]),
  ]);
  const abierta = c.canal !== 'whatsapp' || ventanaAbierta(c);
  const datos = [mostrarTelefono(c.telefono), c.empresa, c.zona, c.habitual ? 'cliente habitual' : c.empresa ? 'no habitual' : 'no está en la base', c.canal === 'simulador' ? 'simulador' : 'WhatsApp'].filter(Boolean).join(', ');
  return (
    <>
      <Refrescar />
      <Encabezado titulo="Charlas" texto="Todas las conversaciones con clientes. Se actualiza sola." />
      <div className="bandeja con-conv">
        <ListaCharlas activa={c.id} ver={ver} b={b} />
        <div className="conv">
          <div className="conv-cab">
            <span className="avatar">{iniciales(c.nombre || mostrarTelefono(c.telefono))}</span>
            <div className="txt"><b>{c.nombre || mostrarTelefono(c.telefono)}</b><div className="meta">{datos}</div></div>
            {c.estado === 'equipo' ? <span className="pill info">La atiende el equipo</span> : <span className="pill ok">La atiende el asistente</span>}
            <form action={tomarCharla}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="estado" value={c.estado === 'equipo' ? 'asistente' : 'equipo'} />
              <button className={`btn chico ${c.estado === 'equipo' ? 'sec' : ''}`} type="submit">{c.estado === 'equipo' ? 'Devolver al asistente' : 'Tomar la charla'}</button>
            </form>
            <Link className="btn sec chico solo-cel" href={`/panel/charlas?ver=${ver}`}>Volver a la lista</Link>
          </div>
          {derivs.map((d) => (
            <div key={d.id} className="derivacion">
              <div className="txt"><b>El asistente la pasó al equipo: {d.motivo}.</b> {d.resumen}</div>
              <form action={cerrarDerivacion}><input type="hidden" name="id" value={d.id} /><button className="btn sec chico" type="submit">Marcar resuelta</button></form>
            </div>
          ))}
          <BajarChat cantidad={mensajes.length}><Burbujas mensajes={mensajes} /></BajarChat>
          {abierta ? (
            <form action={responderComoEquipo} className="composer">
              <input type="hidden" name="id" value={c.id} />
              <label style={{ flex: 1 }}><span className="sr" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Responder como equipo</span><textarea name="texto" rows={1} required placeholder={c.estado === 'equipo' ? 'Escribí tu respuesta' : 'Escribí tu respuesta (al enviar, el asistente se pausa en esta charla)'} /></label>
              <button className="btn principal-btn" type="submit">Enviar</button>
            </form>
          ) : (
            <div className="composer"><p className="hint">Pasaron más de 24 horas desde el último mensaje del cliente, y WhatsApp no deja mandar texto libre. Esperá a que escriba o mandale un envío con plantilla.</p></div>
          )}
        </div>
      </div>
    </>
  );
}
