import { Encabezado } from '@/components/Encabezado';
import { modoReal } from '@/lib/whatsapp';
import { mostrarTelefono } from '@/lib/telefono';

function Logo({ canal }: { canal: 'whatsapp' | 'instagram' | 'facebook' }) {
  const fondo = { whatsapp: '#25D366', instagram: '#C13584', facebook: '#1877F2' }[canal];
  const trazo = {
    whatsapp: <path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z" />,
    instagram: <><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.6" /><circle cx="17" cy="7" r=".6" fill="#fff" /></>,
    facebook: <path d="M14 8h2.5V4.5H14a4 4 0 0 0-4 4V11H7.5v3.5H10V21h3.5v-6.5H16l.5-3.5h-3V8.8c0-.5.3-.8.8-.8Z" />,
  }[canal];
  return (
    <span style={{ width: 44, height: 44, borderRadius: 10, background: fondo, display: 'grid', placeItems: 'center', flex: 'none' }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{trazo}</svg>
    </span>
  );
}

type Canal = { id: 'whatsapp' | 'instagram' | 'facebook'; nombre: string; estado: [string, string]; texto: string; detalle?: string; pasos: string[]; boton: string; habilitado: boolean };

export default function Canales() {
  const real = modoReal();
  const numero = process.env.WHATSAPP_NUMERO_VISIBLE;
  const canales: Canal[] = [
    {
      id: 'whatsapp', nombre: 'WhatsApp',
      estado: real ? ['Conectado', 'ok'] : ['En modo de prueba', 'obra'],
      texto: 'Envíos semanales, respuestas automáticas y derivación al equipo.',
      detalle: real ? (numero ? `Número: ${mostrarTelefono(numero)}` : 'Conectado con la API oficial de Meta') : 'Funciona con el simulador. Nada sale a números reales.',
      pasos: ['Gamax crea su cuenta de Meta Business y verifica la empresa', 'Se registra el número del asistente', 'Se cargan las claves en el sistema y se aprueban las plantillas de los envíos'],
      boton: real ? 'Conectado' : 'Conectar WhatsApp', habilitado: false,
    },
    {
      id: 'instagram', nombre: 'Instagram',
      estado: ['Próximamente', ''],
      texto: 'Responder mensajes directos y comentarios en publicaciones, con un mensaje privado a quien comenta.',
      detalle: 'Llega en la etapa 2.',
      pasos: ['La cuenta de Instagram tiene que ser profesional y estar vinculada a la página de Facebook', 'Meta aprueba los permisos de mensajes y comentarios', 'Se conecta con un clic desde acá'],
      boton: 'Conectar Instagram', habilitado: false,
    },
    {
      id: 'facebook', nombre: 'Facebook',
      estado: ['Próximamente', ''],
      texto: 'Responder mensajes de Messenger y comentarios en la página de la empresa.',
      detalle: 'Llega en la etapa 2.',
      pasos: ['La empresa necesita una página de Facebook', 'Meta aprueba los permisos de Messenger y comentarios', 'Se conecta con un clic desde acá'],
      boton: 'Conectar Facebook', habilitado: false,
    },
  ];
  return (
    <>
      <Encabezado titulo="Canales" texto="Por dónde atiende el asistente. Cada canal se conecta una sola vez con la cuenta de la empresa." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {canales.map((c) => (
          <section key={c.id} className="bloque" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="bloque-cuerpo" style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <Logo canal={c.id} />
                <div style={{ flex: 1 }}><b style={{ fontSize: 17 }}>{c.nombre}</b><div><span className={`pill ${c.estado[1]}`}>{c.estado[0]}</span></div></div>
              </div>
              <p style={{ margin: 0 }}>{c.texto}</p>
              {c.detalle && <p className="hint">{c.detalle}</p>}
              <div>
                <p className="hint" style={{ marginBottom: 6, fontWeight: 600, color: '#1D2A2F' }}>Qué falta para conectarlo</p>
                <ol style={{ margin: 0, paddingLeft: 18, color: '#5A676C', fontSize: 13.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {c.pasos.map((p) => <li key={p}>{p}</li>)}
                </ol>
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #EDEFED' }}>
              <button type="button" className={`btn ${c.estado[1] === 'ok' ? 'sec' : 'principal-btn'}`} style={{ width: '100%' }} disabled={!c.habilitado} aria-describedby={`nota-${c.id}`}>{c.boton}</button>
              {!c.habilitado && c.estado[1] !== 'ok' && <p id={`nota-${c.id}`} className="hint" style={{ marginTop: 8, textAlign: 'center' }}>Se habilita cuando Meta apruebe la conexión.</p>}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
