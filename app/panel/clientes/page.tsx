import { mostrarTelefono } from '@/lib/telefono';
import { q, uno } from '@/lib/db';
import { agregarCliente, borrarCliente, cambiarPermiso, importarCsv } from '../acciones';
import { Encabezado } from '@/components/Encabezado';
import { iniciales } from '@/components/ListaCharlas';

type C = { id: number; nombre: string; telefono: string; empresa: string; zona: string; habitual: boolean; acepta_mensajes: boolean };

export default async function Clientes({ searchParams }: { searchParams: Promise<{ msg?: string; b?: string }> }) {
  const { msg, b = '' } = await searchParams;
  const lista = await q<C>(
    `SELECT * FROM clientes WHERE $1 = '' OR nombre ILIKE '%' || $1 || '%' OR telefono LIKE '%' || $1 || '%' OR zona ILIKE '%' || $1 || '%'
     ORDER BY nombre LIMIT 500`, [b],
  );
  const tot = await uno<{ total: string; gamax: string; gattos: string; baja: string }>(
    `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE empresa = 'Gamax') AS gamax, COUNT(*) FILTER (WHERE empresa = 'Gattos') AS gattos, COUNT(*) FILTER (WHERE NOT acepta_mensajes) AS baja FROM clientes`,
  );
  return (
    <>
      <Encabezado titulo="Clientes" texto="La base que recibe los envíos semanales. Si un teléfono ya existe, se actualizan sus datos." />
      {msg && <div className="aviso ok">{msg}</div>}
      <section className="metricas" aria-label="Resumen de clientes">
        <div className="metrica"><span className="num">{tot?.total ?? 0}</span><span className="nom">Clientes en total</span></div>
        <div className="metrica"><span className="num">{tot?.gamax ?? 0}</span><span className="nom">De Gamax</span></div>
        <div className="metrica"><span className="num">{tot?.gattos ?? 0}</span><span className="nom">De Gattos</span></div>
        <div className="metrica"><span className="num">{tot?.baja ?? 0}</span><span className="nom">Pidieron no recibir envíos</span></div>
      </section>
      <div className="columnas">
        <section className="bloque">
          <div className="bloque-cab">
            <form className="fila" style={{ flex: 1 }}><label style={{ flex: '1 1 240px' }}><span className="sr">Buscar</span><input type="search" name="b" defaultValue={b} placeholder="Buscar por nombre, teléfono o zona" /></label><button className="btn sec" type="submit">Buscar</button></form>
          </div>
          <div className="tabla"><table>
            <thead><tr><th>Cliente</th><th>Empresa</th><th>Zona</th><th>Envíos</th><th></th></tr></thead>
            <tbody>
              {!lista.length && <tr><td colSpan={5}><div className="vacio"><b>{b ? 'No hay resultados' : 'Todavía no hay clientes'}</b>{b ? 'Probá con otra búsqueda.' : 'Importá el CSV o agregá un cliente a mano.'}</div></td></tr>}
              {lista.map((c) => (
                <tr key={c.id}>
                  <td><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="avatar">{iniciales(c.nombre)}</span><div><b style={{ fontWeight: 600 }}>{c.nombre}</b><div className="hint">{mostrarTelefono(c.telefono)}{c.habitual ? ', habitual' : ''}</div></div></div></td>
                  <td>{c.empresa}</td><td>{c.zona}</td>
                  <td><form action={cambiarPermiso}><input type="hidden" name="id" value={c.id} />
                    <button type="submit" className={`pill ${c.acepta_mensajes ? 'ok' : 'alerta'}`} style={{ cursor: 'pointer' }} title="Cambiar">{c.acepta_mensajes ? 'Recibe' : 'Dio de baja'}</button></form></td>
                  <td className="num-col"><form action={borrarCliente}><input type="hidden" name="id" value={c.id} /><button className="btn sec chico" type="submit">Borrar</button></form></td>
                </tr>))}
            </tbody>
          </table></div>
        </section>
        <div>
          <form action={importarCsv} className="bloque">
            <div className="bloque-cab"><h2>Importar CSV</h2></div>
            <div className="bloque-cuerpo">
              <p className="hint">Columnas: nombre, telefono, empresa (Gamax o Gattos), zona y habitual (si o no).</p>
              <label>Archivo<input type="file" name="archivo" accept=".csv,text/csv" required /></label>
              <div><button className="btn principal-btn" type="submit">Importar clientes</button></div>
            </div>
          </form>
          <form action={agregarCliente} className="bloque">
            <div className="bloque-cab"><h2>Agregar un cliente</h2></div>
            <div className="bloque-cuerpo">
              <label>Nombre<input type="text" name="nombre" required /></label>
              <label>Teléfono<input type="text" name="telefono" placeholder="11 5555-0001" required /></label>
              <div className="fila">
                <label>Empresa<select name="empresa"><option>Gamax</option><option>Gattos</option></select></label>
                <label>Zona<input type="text" name="zona" /></label>
              </div>
              <label className="check"><input type="checkbox" name="habitual" /> Cliente habitual</label>
              <div><button className="btn" type="submit">Agregar cliente</button></div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
