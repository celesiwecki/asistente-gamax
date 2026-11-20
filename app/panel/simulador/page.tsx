import { q } from '@/lib/db';
import { modoReal } from '@/lib/whatsapp';
import { Simulador } from '@/components/Simulador';
import { Encabezado } from '@/components/Encabezado';

export default async function PaginaSimulador() {
  const clientes = await q<{ telefono: string; nombre: string; empresa: string }>(`SELECT telefono, nombre, empresa FROM clientes ORDER BY nombre LIMIT 300`);
  return (
    <>
      <Encabezado titulo="Simulador" texto={`Probá el asistente escribiendo como un cliente. ${modoReal() ? 'Estas charlas no se mandan por WhatsApp.' : 'Acá también ves los envíos que le llegaron a ese cliente.'}`} />
      <Simulador clientes={clientes} />
    </>
  );
}
