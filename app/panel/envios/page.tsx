import Link from 'next/link';
import { q } from '@/lib/db';
import { COSTO_MARKETING_USD, limiteDiario, type Envio } from '@/lib/envios';
import { crearEnvio } from '../acciones';
import { CamposEnvio } from '@/components/CamposEnvio';
import { Encabezado } from '@/components/Encabezado';

const ESTADOS: Record<string, [string, string]> = { borrador: ['Borrador', ''], programado: ['Programado', 'info'], enviando: ['Enviando', 'obra'], enviado: ['Enviado', 'ok'], cancelado: ['Cancelado', 'alerta'] };

export default async function Envios() {
  const lista = await q<Envio & { total: string; listos: string }>(
    `SELECT e.*, (SELECT COUNT(*) FROM envio_destinatarios d WHERE d.envio_id = e.id) AS total,
            (SELECT COUNT(*) FROM envio_destinatarios d WHERE d.envio_id = e.id AND d.estado = 'enviado') AS listos
     FROM envios e ORDER BY e.id DESC`,
  );
  return (
    <>
      <Encabezado titulo="Envíos" texto={`Los mensajes semanales a la base de clientes. Salen solos todos los días a las 10, hasta ${limiteDiario()} clientes por día.`}>
        <a className="btn principal-btn" href="#nuevo">Nuevo envío</a>
      </Encabezado>
      <section className="bloque">
        <div className="tabla"><table>
          <thead><tr><th>Envío</th><th>Para quién</th><th>Fecha</th><th>Estado</th><th className="num-col">Enviados</th><th className="num-col">Costo en Meta</th></tr></thead>
          <tbody>
            {!lista.length && <tr><td colSpan={6}><div className="vacio"><b>Todavía no hay envíos</b>Creá el primero con el formulario de abajo.</div></td></tr>}
            {lista.map((e) => {
              const [txt, cls] = ESTADOS[e.estado] || [e.estado, ''];
              const total = Number(e.total), listos = Number(e.listos);
              return (
                <tr key={e.id}>
                  <td><Link href={`/panel/envios/${e.id}`}>{e.titulo}</Link></td>
                  <td>{e.empresa === 'todas' ? 'Todos' : e.empresa}</td>
                  <td>{e.programado_para ? new Date(e.programado_para).toLocaleDateString('es-AR', { timeZone: 'UTC', day: 'numeric', month: 'short' }) : 'Sin fecha'}</td>
                  <td><span className={`pill ${cls}`}>{txt}</span></td>
                  <td className="num-col">{total ? `${listos} de ${total}` : '—'}</td>
                  <td className="num-col">{total ? `US$${(total * COSTO_MARKETING_USD).toFixed(2)}` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </section>
      <form action={crearEnvio} className="bloque" id="nuevo">
        <div className="bloque-cab"><h2>Nuevo envío</h2><p className="hint">Se guarda como borrador. Después lo revisás y lo programás.</p></div>
        <div className="bloque-cuerpo">
          <CamposEnvio />
          <div><button className="btn principal-btn" type="submit">Guardar borrador</button></div>
        </div>
      </form>
    </>
  );
}
