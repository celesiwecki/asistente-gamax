type E = { titulo?: string; mensaje?: string; media_tipo?: string | null; media_url?: string | null; plantilla?: string | null; empresa?: string };

export function CamposEnvio({ e = {} }: { e?: E }) {
  return (
    <>
      <div className="fila">
        <label>Nombre del envío<input type="text" name="titulo" defaultValue={e.titulo || ''} placeholder="Semana 1: foto de producto" required /></label>
        <label>Para quién<select name="empresa" defaultValue={e.empresa || 'todas'}><option value="todas">Todos los clientes</option><option value="Gamax">Clientes de Gamax</option><option value="Gattos">Clientes de Gattos</option></select></label>
      </div>
      <label>Mensaje<textarea name="mensaje" rows={4} defaultValue={e.mensaje || ''} required placeholder="Hola, {nombre}. Esta semana en {empresa}..." /></label>
      <p className="hint">Escribí {'{nombre}'} y {'{empresa}'} donde quieras el nombre del cliente y de la empresa.</p>
      <div className="fila">
        <label>Foto, video o PDF (link, opcional)<input type="url" name="media_url" defaultValue={e.media_url || ''} placeholder="https://..." /></label>
        <label>Tipo de archivo<select name="media_tipo" defaultValue={e.media_tipo || ''}><option value="">Detectar automáticamente</option><option value="image">Foto</option><option value="video">Video</option><option value="document">PDF</option></select></label>
      </div>
      <label>Plantilla aprobada en Meta<input type="text" name="plantilla" defaultValue={e.plantilla || ''} placeholder="envio_semanal_foto" /></label>
      <p className="hint">Con WhatsApp conectado, a quien no escribió en las últimas 24 horas se le manda esta plantilla. A quien sí escribió, se le manda el mensaje de arriba.</p>
    </>
  );
}
