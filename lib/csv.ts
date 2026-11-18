/** Lee un CSV simple (coma o punto y coma, con comillas opcionales). Devuelve filas como objetos con encabezados en minúscula y sin tildes. */
export function leerCsv(texto: string): Record<string, string>[] {
  const lineas = texto.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lineas.length < 2) return [];
  const sep = (lineas[0].match(/;/g)?.length ?? 0) > (lineas[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const partir = (l: string) => {
    const out: string[] = []; let cur = ''; let comillas = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (ch === '"') { if (comillas && l[i + 1] === '"') { cur += '"'; i++; } else comillas = !comillas; }
      else if (ch === sep && !comillas) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const limpiar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const enc = partir(lineas[0]).map(limpiar);
  return lineas.slice(1).map((l) => {
    const v = partir(l);
    return Object.fromEntries(enc.map((h, i) => [h, v[i] ?? '']));
  });
}
