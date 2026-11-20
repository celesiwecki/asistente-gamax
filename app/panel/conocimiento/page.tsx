import { leerConocimiento } from '@/lib/conocimiento';
import { guardarInfo } from '../acciones';
import { Encabezado } from '@/components/Encabezado';

export default async function Conocimiento({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const texto = await leerConocimiento();
  const faltan = (texto.match(/\[completar[^\]]*\]/gi) || []).length;
  return (
    <>
      <Encabezado titulo="Lo que sabe el asistente" texto="Todo lo que responde sale de este texto: catálogo, precios, horarios, guiones de campañas y cuándo pasar la charla al equipo." />
      {ok && <div className="aviso ok">Guardado. El asistente lo usa desde el próximo mensaje.</div>}
      <form action={guardarInfo} className="bloque">
        <div className="bloque-cab">
          <h2>Información</h2>
          {faltan > 0 ? <span className="pill obra">{faltan} datos para completar</span> : <span className="pill ok">Completo</span>}
        </div>
        <div className="bloque-cuerpo">
          <div className="ayuda">Reemplazá todo lo que diga [completar]. Si falta un dato, el asistente le dice al cliente que lo confirma alguien del equipo, nunca lo inventa.</div>
          <label><span className="sr">Información</span><textarea name="texto" rows={30} defaultValue={texto} style={{ fontSize: 14 }} /></label>
          <div><button className="btn principal-btn" type="submit">Guardar</button></div>
        </div>
      </form>
    </>
  );
}
