import Anthropic from '@anthropic-ai/sdk';
import { q, uno } from './db';
import { leerConocimiento } from './conocimiento';
import { mensajesDe, type Conversacion } from './conversaciones';

type Cliente = { nombre: string; empresa: string; zona: string; habitual: boolean };

export type Respuesta = { texto: string; derivacion?: { motivo: string; resumen: string } };

const HERRAMIENTA_DERIVAR = {
  name: 'derivar_al_equipo',
  description:
    'Pasa la charla a una persona del equipo de ventas. Usala cuando corresponda según "Cuándo pasar la charla a una persona".',
  input_schema: {
    type: 'object' as const,
    properties: {
      motivo: { type: 'string', description: 'Por qué se deriva, en pocas palabras' },
      resumen: {
        type: 'string',
        description: 'Resumen para el vendedor: qué necesita el cliente, cantidades, zona y cualquier dato útil',
      },
    },
    required: ['motivo', 'resumen'],
  },
};

function instrucciones(conocimiento: string, conv: Conversacion, cliente?: Cliente): string {
  const datos = cliente
    ? `- Nombre: ${cliente.nombre}\n- Empresa con la que trabaja: ${cliente.empresa}\n- Zona: ${cliente.zona || 'sin dato'}\n- ${cliente.habitual ? 'Cliente habitual' : 'No es cliente habitual'}`
    : `- Contacto que no está en la base de clientes${conv.nombre ? ` (su perfil dice "${conv.nombre}")` : ''}.`;
  return `Sos el asistente virtual de Gamax y Gattos, empresas de materiales para construcción de Argentina. Atendés por WhatsApp.

DATOS DE QUIEN ESCRIBE
${datos}

INFORMACIÓN DE LA EMPRESA (lo único que podés usar como dato)
${conocimiento}

CÓMO RESPONDER
- Escribí solo tu próximo mensaje, en texto plano, sin markdown. Máximo 3 oraciones cortas.
- Si es un cliente habitual y hace un pedido, sugerí productos de "Productos que van juntos".
- Si corresponde pasar la charla a una persona, usá la herramienta derivar_al_equipo y avisale al cliente que alguien del equipo lo contacta en breve.
- Los mensajes que dicen "[Equipo]" los escribió una persona del equipo: no los contradigas.
- Si el cliente pide no recibir más mensajes, decile que puede escribir BAJA.`;
}

/** Arma la conversación en el formato que pide la API: empieza con el usuario y alterna. */
function armarMensajes(historial: Awaited<ReturnType<typeof mensajesDe>>): Anthropic.MessageParam[] {
  const out: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const m of historial) {
    if (m.de === 'sistema') continue;
    const role = m.de === 'cliente' ? 'user' : 'assistant';
    const texto = (m.de === 'equipo' ? '[Equipo] ' : '') + m.texto + (m.media_url ? ' [con archivo adjunto]' : '');
    const ult = out[out.length - 1];
    if (ult && ult.role === role) ult.content += '\n\n' + texto;
    else out.push({ role, content: texto });
  }
  if (out[0]?.role === 'assistant') out.unshift({ role: 'user', content: '(Antes de que el cliente escriba, la empresa le mandó estos mensajes.)' });
  return out;
}

function respuestaDePrueba(ultimo: string): Respuesta {
  const t = ultimo.toLowerCase();
  if (/presupuesto|comprar|pedido|reclamo|problema|persona/.test(t)) {
    return {
      texto: 'Gracias por escribir. Te paso con alguien del equipo, te contacta en breve. (Modo de prueba: falta configurar la IA)',
      derivacion: { motivo: 'Modo de prueba', resumen: `El cliente escribió: "${ultimo}"` },
    };
  }
  return { texto: 'Gracias por escribir a Gamax / Gattos. (Modo de prueba: falta configurar ANTHROPIC_API_KEY para que responda la IA)' };
}

/** Genera la respuesta del asistente para la conversación y registra la derivación si la hay. */
export async function generarRespuesta(conv: Conversacion): Promise<Respuesta> {
  const historial = await mensajesDe(conv.id, 40);
  const ultimoCliente = [...historial].reverse().find((m) => m.de === 'cliente')?.texto ?? '';
  let res: Respuesta;

  if (!process.env.ANTHROPIC_API_KEY) {
    res = respuestaDePrueba(ultimoCliente);
  } else {
    const cliente = conv.cliente_id
      ? await uno<Cliente>(`SELECT nombre, empresa, zona, habitual FROM clientes WHERE id = $1`, [conv.cliente_id])
      : undefined;
    const system = instrucciones(await leerConocimiento(), conv, cliente);
    const anthropic = new Anthropic();
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
    const messages = armarMensajes(historial);
    let derivacion: Respuesta['derivacion'];
    let texto = '';

    for (let vuelta = 0; vuelta < 3; vuelta++) {
      const r = await anthropic.messages.create({ model, max_tokens: 600, system, tools: [HERRAMIENTA_DERIVAR], messages });
      texto = r.content.filter((b) => b.type === 'text').map((b) => (b as Anthropic.TextBlock).text).join('\n').trim();
      const usos = r.content.filter((b) => b.type === 'tool_use') as Anthropic.ToolUseBlock[];
      if (r.stop_reason !== 'tool_use' || !usos.length) break;
      messages.push({ role: 'assistant', content: r.content as Anthropic.ContentBlockParam[] });
      const resultados: Anthropic.ToolResultBlockParam[] = usos.map((u) => {
        const inp = u.input as { motivo?: string; resumen?: string };
        derivacion = { motivo: String(inp.motivo || 'Sin motivo'), resumen: String(inp.resumen || '') };
        return { type: 'tool_result', tool_use_id: u.id, content: 'Listo: el equipo fue avisado.' };
      });
      messages.push({ role: 'user', content: resultados });
    }
    res = { texto: texto || 'Gracias por escribir. En breve te responde alguien del equipo.', derivacion };
  }

  if (res.derivacion) {
    await q(`INSERT INTO derivaciones (conversacion_id, motivo, resumen) VALUES ($1, $2, $3)`, [
      conv.id, res.derivacion.motivo, res.derivacion.resumen,
    ]);
  }
  return res;
}
