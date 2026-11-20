import { mostrarTelefono } from '@/lib/telefono';
import Link from 'next/link';
import { q, uno } from '@/lib/db';
import { enviadosHoy, limiteDiario } from '@/lib/envios';
import { cerrarDerivacion } from './acciones';
import { Encabezado } from '@/components/Encabezado';
import { GraficoActividad } from '@/components/GraficoActividad';
import { Icono } from '@/components/Icono';

const TZ = 'America/Argentina/Buenos_Aires';
const iniciales = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
const hace = (s: string) => {
  const min = Math.round((Date.now() - new Date(s).getTime()) / 60000);
  if (min < 1) return 'recién'; if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60); if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
};

export default async function Inicio() {
  const n = async (sql: string) => Number((await uno<{ n: string }>(sql))?.n || 0);
  const [clientes, abiertas, hoy, charlasHoy, resueltasIA] = await Promise.all([
    n(`SELECT COUNT(*) AS n FROM clientes WHERE acepta_mensajes`),
    n(`SELECT COUNT(*) AS n FROM derivaciones WHERE estado = 'abierta'`),
    enviadosHoy(),
    n(`SELECT COUNT(DISTINCT conversacion_id) AS n FROM mensajes WHERE de = 'cliente' AND (creado AT TIME ZONE '${TZ}')::date = (NOW() AT TIME ZONE '${TZ}')::date`),
    n(`SELECT COUNT(*) AS n FROM conversaciones c WHERE EXISTS (SELECT 1 FROM mensajes m WHERE m.conversacion_id = c.id AND m.de = 'cliente' AND m.creado > NOW() - INTERVAL '7 days')
       AND NOT EXISTS (SELECT 1 FROM derivaciones d WHERE d.conversacion_id = c.id AND d.creado > NOW() - INTERVAL '7 days')`),
  ]);
  const actividad = await q<{ dia: string; clientes: string; asistente: string }>(
    `SELECT to_char(g.d, 'YYYY-MM-DD') AS dia,
       (SELECT COUNT(*) FROM mensajes m WHERE m.de = 'cliente' AND (m.creado AT TIME ZONE '${TZ}')::date = g.d) AS clientes,
       (SELECT COUNT(*) FROM mensajes m WHERE m.de = 'asistente' AND m.envio_id IS NULL AND (m.creado AT TIME ZONE '${TZ}')::date = g.d) AS asistente
     FROM (SELECT ((NOW() AT TIME ZONE '${TZ}')::date - k) AS d FROM generate_series(0, 13) AS k) g
     ORDER BY g.d`,
  );
  const derivs = await q<{ id: number; conversacion_id: number; motivo: string; resumen: string; creado: string; nombre: string; telefono: string }>(
    `SELECT d.*, c.nombre, c.telefono FROM derivaciones d JOIN conversaciones c ON c.id = d.conversacion_id
     WHERE d.estado = 'abierta' ORDER BY d.id DESC LIMIT 8`,
  );
  const proximos = await q<{ id: number; titulo: string; programado_para: string | null; estado: string }>(
    `SELECT id, titulo, programado_para, estado FROM envios WHERE estado IN ('programado','enviando') ORDER BY programado_para, id LIMIT 4`,
  );
  const limite = limiteDiario();
  return (
    <>
      <Encabezado titulo="Inicio" texto="Lo que pasó con el asistente y lo que necesita una persona del equipo.">
        <Link className="btn principal-btn" href="/panel/envios"><Icono n="mas" t={16} />Nuevo envío</Link>
      </Encabezado>

      <section className="metricas" aria-label="Resumen">
        <div className={`metrica${abiertas ? ' destacada' : ''}`}><span className="num">{abiertas}</span><span className="nom">Charlas para atender</span></div>
        <div className="metrica"><span className="num">{charlasHoy}</span><span className="nom">Clientes que escribieron hoy</span></div>
        <div className="metrica"><span className="num">{resueltasIA}</span><span className="nom">Charlas resueltas solo por el asistente (7 días)</span></div>
        <div className="metrica"><span className="num">{hoy}<span style={{ fontSize: 20, color: '#8A9599' }}> / {limite}</span></span><span className="nom">Envíos de hoy, de {clientes} clientes</span><span className="barra"><i style={{ width: `${Math.min(100, (hoy / limite) * 100)}%` }} /></span></div>
      </section>

      <div className="columnas">
        <section className="bloque">
          <div className="bloque-cab">
            <h2>Actividad de las últimas dos semanas</h2>
            <div className="leyenda"><span><i style={{ background: '#1D2A2F' }} />Mensajes de clientes</span><span><i style={{ background: '#F2B705' }} />Respuestas del asistente</span></div>
          </div>
          <div className="bloque-cuerpo">
            <GraficoActividad datos={actividad.map((a) => ({ dia: a.dia, clientes: Number(a.clientes), asistente: Number(a.asistente) }))} />
          </div>
        </section>

        <section className="bloque">
          <div className="bloque-cab"><h2>Para atender</h2>{derivs.length > 0 && <Link className="hint" href="/panel/charlas?ver=equipo">Ver todas</Link>}</div>
          <div className="bloque-cuerpo sin">
            {!derivs.length && <div className="vacio"><b>Nada pendiente</b>Cuando el asistente pase una charla al equipo, aparece acá.</div>}
            {derivs.map((d) => (
              <div key={d.id} className="pendiente">
                <span className="avatar">{iniciales(d.nombre || mostrarTelefono(d.telefono))}</span>
                <div className="txt">
                  <Link href={`/panel/charlas/${d.conversacion_id}`} style={{ color: 'inherit', textDecoration: 'none' }}><b>{d.nombre || mostrarTelefono(d.telefono)}</b></Link> <span className="pill obra">{d.motivo}</span>
                  <div className="meta">{d.resumen}</div>
                  <div className="meta">{hace(d.creado)}</div>
                </div>
                <form action={cerrarDerivacion}><input type="hidden" name="id" value={d.id} /><button className="btn sec chico" type="submit">Resuelta</button></form>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bloque" style={{ marginTop: 20 }}>
        <div className="bloque-cab"><h2>Próximos envíos</h2><Link className="hint" href="/panel/envios">Ver envíos</Link></div>
        <div className="bloque-cuerpo sin">
          {!proximos.length && <div className="vacio"><b>No hay envíos programados</b>Programá el mensaje de la semana para que salga solo.</div>}
          {proximos.length > 0 && <div className="tabla"><table><tbody>
            {proximos.map((e) => <tr key={e.id}><td><Link href={`/panel/envios/${e.id}`}>{e.titulo}</Link></td><td>{e.programado_para ? new Date(e.programado_para).toLocaleDateString('es-AR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }) : ''}</td><td><span className="pill info">{e.estado === 'enviando' ? 'Enviando' : 'Programado'}</span></td></tr>)}
          </tbody></table></div>}
        </div>
      </section>
    </>
  );
}
