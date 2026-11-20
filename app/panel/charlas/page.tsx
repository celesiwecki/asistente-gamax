import { Encabezado } from '@/components/Encabezado';
import { ListaCharlas } from '@/components/ListaCharlas';
import { Refrescar } from '@/components/Refrescar';

export default async function Charlas({ searchParams }: { searchParams: Promise<{ ver?: string; b?: string }> }) {
  const { ver = 'todas', b = '' } = await searchParams;
  return (
    <>
      <Refrescar />
      <Encabezado titulo="Charlas" texto="Todas las conversaciones con clientes. Se actualiza sola." />
      <div className="bandeja">
        <ListaCharlas ver={ver} b={b} />
        <div className="conv"><div className="conv-vacia"><div><b style={{ color: '#1D2A2F' }}>Elegí una charla</b><p className="hint">Vas a ver la conversación completa y vas a poder responder como equipo.</p></div></div></div>
      </div>
    </>
  );
}
