import { q, uno } from './db';

export const CONOCIMIENTO_INICIAL = `GAMAX
- [Qué vende Gamax y para quién: completar]

GATTOS
- [Qué vende Gattos y qué les ofrece a los instaladores: completar]

HORARIOS Y ENTREGAS
- Horario de atención: [completar]
- Zonas de entrega y plazos: [completar]

CATÁLOGO (datos de ejemplo, reemplazar por los reales)
- Cielorraso de PVC: espesores 6 mm y 8 mm; largos de 4, 5 y 6 metros. Precio: [completar]
- Masilla (lata): precio [completar]
- Látex: precio [completar]
- Fijador: precio [completar]
- Adhesivo: precio [completar]
- Placas y perfiles para drywall: [completar]

PRODUCTOS QUE VAN JUNTOS (para sugerir en pedidos de clientes habituales)
- Masilla → látex, fijador, adhesivo
- Cielorraso de PVC → [completar]

CAMPAÑA "SOY INSTALADOR DE DRYWALL" (Gattos)
1. Agradecer y contar en una línea qué ofrece Gattos a los instaladores.
2. Preguntar de qué zona es.
3. Preguntar qué necesita o si tiene una obra en curso.
4. Preguntar si trabaja solo o tiene gente a cargo.
5. Pasar la charla al equipo con un resumen.

CUÁNDO PASAR LA CHARLA A UNA PERSONA
- Pide un presupuesto con cantidades o quiere comprar.
- Confirma un pedido (para que alguien confirme el total).
- Tiene un reclamo o un problema con una entrega.
- Pregunta algo que no está en esta información.
- Pide hablar con una persona.

REGLAS
- Nunca inventar precios, stock ni plazos: si un dato dice [completar] o no figura, decir que lo confirma alguien del equipo.
- Mensajes cortos y claros, tono cercano, en español rioplatense (vos).
- Una o dos preguntas por mensaje, como máximo.`;

export async function leerConocimiento(): Promise<string> {
  const r = await uno<{ valor: string }>(`SELECT valor FROM config WHERE clave = 'conocimiento'`);
  return r?.valor ?? CONOCIMIENTO_INICIAL;
}

export async function guardarConocimiento(texto: string) {
  await q(
    `INSERT INTO config (clave, valor) VALUES ('conocimiento', $1)
     ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor`,
    [texto],
  );
}
