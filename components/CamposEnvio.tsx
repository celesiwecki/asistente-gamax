type E = { titulo?: string; mensaje?: string; media_tipo?: string | null; media_url?: string | null; plantilla?: string | null; empresa?: string };

export function CamposEnvio({ e = {} }: { e?: E }) {
  return (
    <>
      <div className="fila">
        <label>Título (para el equipo)<input type="text" name="titulo" defaultValue={e.titulo || ''} placeholder="Semana 1: foto de producto" required /></label>
        <label>A quién<select name="empresa" defaultValue={e.empresa || 'todas'}><option value="todas">Todos los clientes</option><option value="Gamax">Solo Gamax</option><option value="Gattos">Solo Gattos</option></select></label>
      </div>
      <label>Mensaje<textarea name="mensaje" rows={5} defaultValue={e.mensaje || ''} required placeholder="Hola, {nombre}. Esta semana en {empresa}..." /></label>
      <p className="hint">{'{nombre}'} y {'{empresa}'} se reemplazan por los datos de cada cliente.</p>
      <div className="fila">
        <label>Foto, video o archivo (link público, opcional)<input type="url" name="media_url" defaultValue={e.media_url || ''} placeholder="https://..." /></label>
        <label>Tipo<select name="media_tipo" defaultValue={e.media_tipo || ''}><option value="">Detectar solo</option><option value="image">Foto</option><option value="video">Video</option><option value="document">Archivo (PDF)</option></select></label>
      </div>
      <label>Nombre de la plantilla aprobada en Meta<input type="text" name="plantilla" defaultValue={e.plantilla || ''} placeholder="envio_semanal_foto" /></label>
      <p className="hint">Con WhatsApp real, a los clientes que no escribieron en las últimas 24 hs se les manda esta plantilla (con su nombre en {'{{1}}'}). A los que sí escribieron, se les manda el mensaje de arriba.</p>
    </>
  );
}
