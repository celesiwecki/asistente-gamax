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
      if (!r.ok) throw new Error(j.error || 'Error');
      setMsgs(j.mensajes);
    } catch (e: any) { setError(e.message || 'No se pudo enviar'); }
    setOcupado(false);
  }
  async function borrar() {
    await fetch('/api/simulador?telefono=' + encodeURIComponent(tel), { method: 'DELETE' });
    setMsgs([]);
  }

  return (
    <div className="fila" style={{ alignItems: 'flex-start' }}>
      <div className="card" style={{ flex: '1 1 380px' }}>
        <div className="chat" ref={caja} style={{ minHeight: 420 }} aria-live="polite">
          {!msgs.length && <div className="sys">Escribí como si fueras el cliente.</div>}
          {msgs.map((m) => m.de === 'sistema'
            ? <div key={m.id} className="sys">{m.texto}</div>
            : <div key={m.id} className={`b ${m.de}`}>{m.media_url && <span className="media">[Archivo adjunto]</span>}{m.texto}</div>)}
          {ocupado && <div className="sys">El asistente está escribiendo…</div>}
        </div>
        {error && <div className="aviso">{error}</div>}
        <form className="fila" onSubmit={(e) => { e.preventDefault(); enviar(texto); }}>
          <label>Mensaje del cliente<input type="text" value={texto} onChange={(e) => setTexto(e.target.value)} disabled={ocupado} /></label>
          <button className="btn acc" type="submit" disabled={ocupado}>Enviar</button>
        </form>
      </div>
      <div className="card" style={{ flex: '1 1 300px' }}>
        <h2>¿Quién escribe?</h2>
        <label>Cliente
          <select value={nuevo ? '__nuevo' : tel} onChange={(e) => { if (e.target.value === '__nuevo') { setNuevo(true); setTel('1100000000'); } else { setNuevo(false); setTel(e.target.value); } }}>
            {clientes.map((c) => <option key={c.telefono} value={c.telefono}>{c.nombre} · {c.empresa}</option>)}
            <option value="__nuevo">Contacto nuevo (no está en la base)</option>
          </select>
        </label>
        <h2>Mensajes de prueba</h2>
        <div className="fila">{PRUEBAS.map((p) => <button key={p} type="button" className="btn ghost" style={{ flex: '0 0 auto' }} onClick={() => enviar(p)} disabled={ocupado}>{p}</button>)}</div>
        <button type="button" className="btn ghost" onClick={borrar}>Borrar esta charla</button>
      </div>
    </div>
  );
}
