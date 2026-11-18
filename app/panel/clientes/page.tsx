import { q } from '@/lib/db';
import { agregarCliente, borrarCliente, cambiarPermiso, importarCsv } from '../acciones';

type C = { id: number; nombre: string; telefono: string; empresa: string; zona: string; habitual: boolean; acepta_mensajes: boolean };

export default async function Clientes({ searchParams }: { searchParams: Promise<{ msg?: string; b?: string }> }) {
  const { msg, b = '' } = await searchParams;
  const lista = await q<C>(
    `SELECT * FROM clientes WHERE $1 = '' OR nombre ILIKE '%' || $1 || '%' OR telefono LIKE '%' || $1 || '%' OR zona ILIKE '%' || $1 || '%'
     ORDER BY nombre LIMIT 500`, [b],
  );
  return (
    <>
      <h1>Clientes</h1>
      <p className="sub">La base a la que se mandan los envíos semanales.</p>
      {msg && <div className="aviso ok">{msg}</div>}
      <div className="card">
        <h2>Cargar desde CSV</h2>
        <p className="hint">Columnas: <b>nombre, telefono, empresa, zona, habitual</b>. Empresa: Gamax o Gattos. Habitual: si o no. Si un teléfono ya existe, se actualizan sus datos.</p>
        <form action={importarCsv} className="fila">
          <label>Archivo CSV<input type="file" name="archivo" accept=".csv,text/csv" required /></label>
          <button className="btn acc" type="submit">Importar</button>
        </form>
      </div>
      <div className="card">
        <h2>Agregar un cliente</h2>
        <form action={agregarCliente} className="fila">
          <label>Nombre<input type="text" name="nombre" required /></label>
          <label>Teléfono<input type="text" name="telefono" placeholder="11 5555-0001" required /></label>
          <label>Empresa<select name="empresa"><option>Gamax</option><option>Gattos</option></select></label>
          <label>Zona<input type="text" name="zona" /></label>
          <label style={{ flexDirection: 'row', alignItems: 'center', flex: '0 0 auto', minHeight: 44 }}><input type="checkbox" name="habitual" /> Habitual</label>
          <button className="btn" type="submit">Agregar</button>
        </form>
      </div>
      <div className="card">
        <form className="fila"><label>Buscar<input type="text" name="b" defaultValue={b} placeholder="Nombre, teléfono o zona" /></label><button className="btn ghost" type="submit">Buscar</button></form>
        <p className="hint">{lista.length} clientes{lista.length === 500 ? ' (se muestran los primeros 500)' : ''}</p>
        <div className="tabla"><table>
          <thead><tr><th>Nombre</th><th>Teléfono</th><th>Empresa</th><th>Zona</th><th>Habitual</th><th>Mensajes</th><th></th></tr></thead>
          <tbody>{lista.map((c) => (
            <tr key={c.id}>
              <td>{c.nombre}</td><td>{c.telefono}</td><td>{c.empresa}</td><td>{c.zona}</td><td>{c.habitual ? 'Sí' : 'No'}</td>
              <td><form action={cambiarPermiso}><input type="hidden" name="id" value={c.id} />
                <button type="submit" className={`pill ${c.acepta_mensajes ? 'ok' : 'warn'}`} style={{ border: 'none', cursor: 'pointer', minHeight: 32 }}>{c.acepta_mensajes ? 'Recibe' : 'Dio de baja'}</button></form></td>
              <td><form action={borrarCliente}><input type="hidden" name="id" value={c.id} /><button className="btn ghost" style={{ minHeight: 36 }} type="submit">Borrar</button></form></td>
            </tr>))}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
