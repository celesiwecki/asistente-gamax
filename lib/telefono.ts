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

/** Muestra un teléfono guardado (549 + área + número) de forma legible: "+54 9 11 5555-0001". */
export function mostrarTelefono(t: string): string {
  const d = (t || '').replace(/\D/g, '');
  if (!d.startsWith('549') || d.length !== 13) return t;
  const resto = d.slice(3);
  const area = resto.startsWith('11') ? 2 : 3; // Buenos Aires: 11; la mayoría del interior: 3 cifras
  const a = resto.slice(0, area), n = resto.slice(area);
  return `+54 9 ${a} ${n.slice(0, n.length - 4)}-${n.slice(-4)}`;
}
