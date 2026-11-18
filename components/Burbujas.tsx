import type { Mensaje } from '@/lib/conversaciones';

const hora = (s: string) => new Date(s).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function Burbujas({ mensajes }: { mensajes: Pick<Mensaje, 'id' | 'de' | 'texto' | 'media_url' | 'creado'>[] }) {
  if (!mensajes.length) return <div className="sys">Sin mensajes todavía.</div>;
  return (
    <>
      {mensajes.map((m) => m.de === 'sistema'
        ? <div key={m.id} className="sys">{m.texto}</div>
        : <div key={m.id} className={`b ${m.de}`}>
            {m.media_url && <a className="media" href={m.media_url} target="_blank" rel="noreferrer">Archivo adjunto</a>}
            {m.texto}
            <small>{m.de === 'equipo' ? 'Equipo · ' : m.de === 'asistente' ? 'Asistente · ' : ''}{hora(m.creado)}</small>
          </div>)}
    </>
  );
}
