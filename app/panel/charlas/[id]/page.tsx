import { notFound } from 'next/navigation';
import { q, uno } from '@/lib/db';
import { mensajesDe, ventanaAbierta, type Conversacion } from '@/lib/conversaciones';
import { cerrarDerivacion, responderComoEquipo, tomarCharla } from '../../acciones';
import { Burbujas } from '@/components/Burbujas';
import { Refrescar } from '@/components/Refrescar';

export default async function Charla({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await uno<Conversacion>(`SELECT * FROM conversaciones WHERE id = $1`, [Number(id)]);
  if (!c) notFound();
  const [mensajes, derivs] = await Promise.all([
    mensajesDe(c.id),
    q<{ id: number; motivo: string; resumen: string }>(`SELECT * FROM derivaciones WHERE conversacion_id = $1 AND estado = 'abierta' ORDER BY id DESC`, [c.id]),
  ]);
  const abierta = c.canal !== 'whatsapp' || ventanaAbierta(c);
  return (
    <>
      <Refrescar />
      <h1>{c.nombre || c.telefono}</h1>
      <p className="sub">{c.telefono} · {c.canal === 'simulador' ? 'Simulador' : 'WhatsApp'} · {c.estado === 'equipo' ? 'la atiende el equipo (el asistente no responde)' : 'la atiende el asistente'}</p>
      {derivs.map((d) => (
        <div key={d.id} className="aviso fila" style={{ alignItems: 'center' }}>
          <div style={{ flex: '999 1 300px' }}><b>Pasada al equipo: {d.motivo}.</b> {d.resumen}</div>
          <form action={cerrarDerivacion} style={{ flex: '0 0 auto' }}><input type="hidden" name="id" value={d.id} /><button className="btn ghost" type="submit">Marcar resuelta</button></form>
        </div>
      ))}
      <div className="card">
        <div className="chat"><Burbujas mensajes={mensajes} /></div>
        <form action={tomarCharla}>
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="estado" value={c.estado === 'equipo' ? 'asistente' : 'equipo'} />
          <button className="btn ghost" type="submit">{c.estado === 'equipo' ? 'Devolver al asistente' : 'Tomar la charla (pausar el asistente)'}</button>
        </form>
        {abierta ? (
          <form action={responderComoEquipo} className="fila">
            <input type="hidden" name="id" value={c.id} />
            <label>Responder como equipo<textarea name="texto" rows={2} required /></label>
            <button className="btn acc" type="submit">Enviar</button>
          </form>
        ) : (
          <p className="hint">Pasaron más de 24 hs desde el último mensaje del cliente: WhatsApp no deja mandar texto libre. Esperá a que escriba o mandale un envío con plantilla.</p>
        )}
      </div>
    </>
  );
}
