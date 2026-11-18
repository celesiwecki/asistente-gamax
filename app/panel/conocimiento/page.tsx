import { leerConocimiento } from '@/lib/conocimiento';
import { guardarInfo } from '../acciones';

export default async function Conocimiento({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const texto = await leerConocimiento();
  return (
    <>
      <h1>Lo que sabe el asistente</h1>
      <p className="sub">Todo lo que responde sale de este texto: catálogo, precios, horarios, guiones de campañas y cuándo pasar la charla al equipo.</p>
      {ok && <div className="aviso ok">Guardado. El asistente lo usa desde el próximo mensaje.</div>}
      <form action={guardarInfo} className="card">
        <label>Información<textarea name="texto" rows={32} defaultValue={texto} /></label>
        <p className="hint">Reemplazá todo lo que diga [completar]. Si un dato no está, el asistente dice que lo confirma alguien del equipo.</p>
        <div><button className="btn acc" type="submit">Guardar</button></div>
      </form>
    </>
  );
}
