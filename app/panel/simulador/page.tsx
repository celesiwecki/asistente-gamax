import { q } from '@/lib/db';
import { modoReal } from '@/lib/whatsapp';
import { Simulador } from '@/components/Simulador';

export default async function PaginaSimulador() {
  const clientes = await q<{ telefono: string; nombre: string; empresa: string }>(`SELECT telefono, nombre, empresa FROM clientes ORDER BY nombre LIMIT 300`);
  return (
    <>
      <h1>Simulador</h1>
      <p className="sub">Probá el asistente escribiendo como un cliente. {modoReal() ? 'Estas charlas no se mandan por WhatsApp.' : 'Acá también ves los envíos que le llegaron a ese cliente.'}</p>
      <Simulador clientes={clientes} />
    </>
  );
}
