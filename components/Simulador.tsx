'use client';
import { useEffect, useRef, useState } from 'react';

type Cli = { telefono: string; nombre: string; empresa: string };
type M = { id: number; de: string; texto: string; media_url: string | null; creado: string };

const PRUEBAS = ['¿Qué medidas de cielorraso de PVC tienen?', 'Necesito 10 latas de masilla para el jueves', 'Quiero presupuesto para 40 m² de PVC de 8 mm', 'Soy instalador de drywall', 'Tuve un problema con la última entrega', 'BAJA'];

export function Simulador({ clientes }: { clientes: Cli[] }) {
  const [tel, setTel] = useState(clientes[0]?.telefono || '1100000000');
  const [nuevo, setNuevo] = useState(!clientes.length);
  const [msgs, setMsgs] = useState<M[]>([]);
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const caja = useRef<HTMLDivElement>(null);
  const cli = clientes.find((c) => c.telefono === tel);

  useEffect(() => {
    fetch('/api/simulador?telefono=' + encodeURIComponent(tel)).then((r) => r.json()).then((j) => setMsgs(j.mensajes || [])).catch(() => {});
  }, [tel]);
  useEffect(() => { caja.current?.scrollTo(0, caja.current.scrollHeight); }, [msgs, ocupado]);

  async function enviar(t: string) {
    t = t.trim(); if (!t || ocupado) return;
    setOcupado(true); setError(''); setTexto('');
    setMsgs((m) => [...m, { id: -Date.now(), de: 'cliente', texto: t, media_url: null, creado: new Date().toISOString() }]);
    try {
      const r = await fetch('/api/simulador', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ telefono: tel, nombre: nuevo ? 'Contacto nuevo' : cli?.nombre, texto: t }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'No se pudo enviar el mensaje.');
      setMsgs(j.mensajes);
    } catch (e: any) { setError(e.message || 'No se pudo enviar el mensaje.'); }
    setOcupado(false);
  }
  async function borrar() {
    await fetch('/api/simulador?telefono=' + encodeURIComponent(tel), { method: 'DELETE' });
    setMsgs([]);
  }
  const nombre = nuevo ? 'Contacto nuevo' : cli?.nombre || 'Cliente';

  return (
    <div className="columnas">
      <div className="bandeja con-conv" style={{ gridTemplateColumns: 'minmax(0,1fr)', height: 'calc(100vh - 190px)' }}>
        <div className="conv">
          <div className="conv-cab"><div className="txt"><b>{nombre}</b><div className="meta">Así ve la charla el equipo en el panel</div></div><button type="button" className="btn sec chico" onClick={borrar}>Borrar charla</button></div>
          <div className="chat" ref={caja} aria-live="polite">
            {!msgs.length && <div className="sys">Escribí como si fueras el cliente.</div>}
            {msgs.map((m) => m.de === 'sistema'
              ? <div key={m.id} className="sys">{m.texto}</div>
              : <div key={m.id} className={`b ${m.de}`}>{m.media_url && <span className="media">Archivo adjunto</span>}{m.texto}</div>)}
            {ocupado && <div className="sys">El asistente está escribiendo</div>}
          </div>
          {error && <div className="aviso alerta" style={{ margin: '0 16px 12px' }}>{error}</div>}
          <form className="composer" onSubmit={(e) => { e.preventDefault(); enviar(texto); }}>
            <label style={{ flex: 1 }}><span className="sr">Mensaje del cliente</span><input type="text" value={texto} onChange={(e) => setTexto(e.target.value)} disabled={ocupado} placeholder={`Escribí como ${nombre}`} /></label>
            <button className="btn principal-btn" type="submit" disabled={ocupado}>Enviar</button>
          </form>
        </div>
      </div>
      <div>
        <section className="bloque">
          <div className="bloque-cab"><h2>Quién escribe</h2></div>
          <div className="bloque-cuerpo">
            <label>Cliente
              <select value={nuevo ? '__nuevo' : tel} onChange={(e) => { if (e.target.value === '__nuevo') { setNuevo(true); setTel('1100000000'); } else { setNuevo(false); setTel(e.target.value); } }}>
                {clientes.map((c) => <option key={c.telefono} value={c.telefono}>{c.nombre} ({c.empresa})</option>)}
                <option value="__nuevo">Contacto nuevo (no está en la base)</option>
              </select>
            </label>
          </div>
        </section>
        <section className="bloque">
          <div className="bloque-cab"><h2>Mensajes de prueba</h2></div>
          <div className="bloque-cuerpo" style={{ gap: 8 }}>
            {PRUEBAS.map((p) => <button key={p} type="button" className="btn sec" style={{ justifyContent: 'flex-start', whiteSpace: 'normal', textAlign: 'left', padding: '8px 14px' }} onClick={() => enviar(p)} disabled={ocupado}>{p}</button>)}
          </div>
        </section>
      </div>
    </div>
  );
}
