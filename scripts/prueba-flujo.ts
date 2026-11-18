/**
 * Prueba de punta a punta en modo simulado, con una base en memoria.
 * Uso: npm run prueba
 */
process.env.DATABASE_URL = 'pglite:memoria';
process.env.WHATSAPP_MODE = 'simulado';
process.env.MAX_ENVIOS_POR_DIA = '3';
delete process.env.ANTHROPIC_API_KEY;

import { q, uno } from '../lib/db';
import { leerCsv } from '../lib/csv';
import { normalizarTelefono } from '../lib/telefono';
import { procesarEnvios, programarEnvio } from '../lib/envios';
import { procesarEntrante } from '../lib/procesar';
import { leerEntrantes, firmaValida } from '../lib/whatsapp';

let fallas = 0;
const ok = (cond: unknown, que: string) => { console.log(`${cond ? 'OK   ' : 'FALLA'} ${que}`); if (!cond) fallas++; };

async function main() {
  ok(normalizarTelefono('11 5555-0001') === '5491155550001', 'teléfono local → 549...');
  ok(normalizarTelefono('+54 9 11 5555 0001') === '5491155550001', 'teléfono con +54 9');
  ok(normalizarTelefono('011 15 5555-0001') === '5491155550001', 'teléfono con 0 y 15');

  const csv = 'nombre;telefono;empresa;zona;habitual\nJuan Pérez;11 5555-0001;Gamax;Villa del Parque;si\n"Gómez, Marta";11 5555-0002;Gamax;Pilar;si\nLucas Díaz;11 5555-0003;Gattos;Escobar;no\nSofía Ruiz;11 5555-0004;Gattos;Tigre;sí\n';
  const filas = leerCsv(csv);
  ok(filas.length === 4 && filas[1].nombre === 'Gómez, Marta', 'CSV con punto y coma y comillas');
  for (const r of filas) {
    await q(`INSERT INTO clientes (nombre, telefono, empresa, zona, habitual) VALUES ($1,$2,$3,$4,$5)`,
      [r.nombre, normalizarTelefono(r.telefono), r.empresa, r.zona, /^s/i.test(r.habitual)]);
  }

  const e = await uno<{ id: number }>(`INSERT INTO envios (titulo, mensaje, empresa) VALUES ('Semana 1', 'Hola, {nombre}. Novedades de {empresa}.', 'todas') RETURNING id`);
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  await programarEnvio(e!.id, hoy);
  let r = await procesarEnvios();
  ok(r.enviados === 3 && r.limiteAlcanzado && r.pendientes === 1, 'respeta el límite diario (3 de 4, 1 queda para mañana)');
  const m1 = await uno<{ texto: string }>(`SELECT m.texto FROM mensajes m JOIN conversaciones c ON c.id = m.conversacion_id WHERE c.telefono = '5491155550001'`);
  ok(m1?.texto === 'Hola, Juan. Novedades de Gamax.', 'personaliza nombre y empresa');

  // Simula que es otro día: borra la marca de enviado de hoy
  await q(`UPDATE envio_destinatarios SET enviado = enviado - INTERVAL '1 day'`);
  r = await procesarEnvios();
  ok(r.enviados === 1 && r.pendientes === 0, 'al día siguiente manda el que faltaba');
  const est = await uno<{ estado: string }>(`SELECT estado FROM envios WHERE id = $1`, [e!.id]);
  ok(est?.estado === 'enviado', 'el envío queda como enviado');

  // Llega un mensaje por el webhook
  const aviso = { entry: [{ changes: [{ value: { contacts: [{ wa_id: '5491155550001', profile: { name: 'Juan' } }], messages: [{ from: '5491155550001', id: 'wamid.1', type: 'text', text: { body: 'Quiero presupuesto para 40 m2 de PVC' } }] } }] }] };
  const ent = leerEntrantes(aviso);
  ok(ent.length === 1 && ent[0].texto.includes('presupuesto'), 'lee el mensaje del webhook');
  ok(firmaValida('{}', null), 'sin APP_SECRET no exige firma');
  for (const m of ent) await procesarEntrante('whatsapp', m.de, m.nombre, m.texto, m.id);
  for (const m of ent) await procesarEntrante('whatsapp', m.de, m.nombre, m.texto, m.id); // reenvío de Meta
  const msgs = await q<{ de: string }>(`SELECT m.de FROM mensajes m JOIN conversaciones c ON c.id = m.conversacion_id WHERE c.telefono = '5491155550001' ORDER BY m.id`);
  ok(msgs.filter((m) => m.de === 'cliente').length === 1, 'no duplica un mensaje reenviado');
  ok(msgs.some((m) => m.de === 'asistente'), 'el asistente responde');
  const d = await uno<{ n: string }>(`SELECT COUNT(*) AS n FROM derivaciones`);
  ok(Number(d?.n) === 1, 'deriva al equipo un pedido de presupuesto');

  // Equipo toma la charla: el asistente no responde
  await q(`UPDATE conversaciones SET estado = 'equipo' WHERE telefono = '5491155550001'`);
  await procesarEntrante('whatsapp', '5491155550001', 'Juan', 'Hola?', 'wamid.2');
  const ult = await uno<{ de: string }>(`SELECT m.de FROM mensajes m JOIN conversaciones c ON c.id = m.conversacion_id WHERE c.telefono = '5491155550001' ORDER BY m.id DESC LIMIT 1`);
  ok(ult?.de === 'cliente', 'con la charla tomada por el equipo, el asistente no contesta');

  // Baja
  await procesarEntrante('whatsapp', '5491155550003', 'Lucas', 'BAJA', 'wamid.3');
  const baja = await uno<{ acepta_mensajes: boolean }>(`SELECT acepta_mensajes FROM clientes WHERE telefono = '5491155550003'`);
  ok(baja?.acepta_mensajes === false, 'BAJA saca al cliente de los envíos');
  const e2 = await uno<{ id: number }>(`INSERT INTO envios (titulo, mensaje) VALUES ('Semana 2', 'Hola') RETURNING id`);
  await programarEnvio(e2!.id, hoy);
  const n2 = await uno<{ n: string }>(`SELECT COUNT(*) AS n FROM envio_destinatarios WHERE envio_id = $1`, [e2!.id]);
  ok(Number(n2?.n) === 3, 'el siguiente envío ya no lo incluye');

  console.log(fallas ? `\n${fallas} prueba(s) fallaron` : '\nTodo OK');
  process.exit(fallas ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
