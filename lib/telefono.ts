/**
 * Lleva un teléfono argentino al formato que usa WhatsApp: 549 + código de área + número, solo dígitos.
 * Ejemplos: "11 5555-0001" → "5491155550001"; "+54 9 11 5555 0001" → "5491155550001".
 */
export function normalizarTelefono(entrada: string): string {
  let d = (entrada || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54')) {
    d = d.slice(2);
    if (d.startsWith('9')) d = d.slice(1);
  }
  if (d.startsWith('0')) d = d.slice(1);
  // "11 15 5555 0001" → quitar el 15 después del código de área de Buenos Aires
  if (d.length === 12 && d.startsWith('1115')) d = '11' + d.slice(4);
  if (d.length === 10) return '549' + d;
  // número que no parece argentino: se deja como vino
  return (entrada || '').replace(/\D/g, '');
}
