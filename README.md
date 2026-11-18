# Asistente virtual · Gamax / Gattos

Asistente con IA para WhatsApp: manda los envíos semanales a la base de clientes, responde las consultas con la información del catálogo y pasa las charlas al equipo cuando hace falta.

**Etapa 1** (este código): envíos semanales, respuestas por WhatsApp, panel del equipo.
Etapas siguientes: Instagram y Facebook (mensajes y comentarios), sugerencias en pedidos.

## Qué tiene el panel

| Sección | Para qué |
|---|---|
| Inicio | Charlas que el asistente pasó al equipo, y cuántos mensajes salieron hoy |
| Charlas | Todas las conversaciones. Se puede tomar una charla (el asistente deja de responder) y contestar como equipo |
| Envíos | Crear el mensaje de la semana, programarlo o mandarlo ya. Respeta el límite diario de Meta |
| Clientes | Importar el CSV, agregar a mano, ver quién pidió la baja |
| Lo que sabe | El texto con catálogo, precios, guiones y reglas. Todo lo que responde el asistente sale de acá |
| Simulador | Escribir como si fueras un cliente para probar las respuestas |

El cliente que escribe **BAJA** deja de recibir envíos.

## Probarlo en tu compu

```bash
npm install
cp .env.example .env.local      # completá PANEL_PASSWORD (y ANTHROPIC_API_KEY si querés que responda la IA)
npm run dev                      # http://localhost:3000
npm run prueba                   # prueba automática de todo el flujo
```

En local la base es un archivo en `.data/` (no hace falta instalar nada). WhatsApp arranca en **modo simulado**: nada sale a ningún número real.

## Subirlo a Vercel + Neon

1. En [Vercel](https://vercel.com/new), importá este repositorio.
2. En el proyecto de Vercel: **Storage → Create → Neon** (Postgres). Esto agrega `DATABASE_URL` sola. Las tablas se crean la primera vez que se usa.
3. En **Settings → Environment Variables**, cargá:

| Variable | Valor |
|---|---|
| `PANEL_PASSWORD` | La contraseña del panel |
| `ANTHROPIC_API_KEY` | Clave de la API de Claude ([console.anthropic.com](https://console.anthropic.com)) |
| `ANTHROPIC_MODEL` | `claude-sonnet-5-5` |
| `WHATSAPP_MODE` | `simulado` hasta tener todo lo de Meta; después `real` |
| `CRON_SECRET` | Una clave larga cualquiera (Vercel la usa para el envío diario) |
| `MAX_ENVIOS_POR_DIA` | `250` al principio; subilo cuando Meta suba el límite |

4. Redeploy. El panel queda en `https://<tu-proyecto>.vercel.app/panel`.

Los envíos programados salen solos **todos los días a las 10** (hora Argentina, ver `vercel.json`).

## Conectar WhatsApp real (Meta)

Esto lo tiene que hacer alguien con acceso a la cuenta de la empresa:

1. Crear una cuenta en [Meta Business](https://business.facebook.com) a nombre de la empresa y **verificar la empresa** (pide datos fiscales; tarda unos días). Sin verificar, el límite es de 250 contactos por día.
2. En [developers.facebook.com](https://developers.facebook.com) crear una app tipo **Business** y agregarle **WhatsApp**.
3. Registrar un **número de teléfono** que no esté usado en otro WhatsApp (o migrar el de WhatsApp Business, que deja de funcionar en el celular).
4. Crear un **usuario del sistema** con permiso sobre la cuenta de WhatsApp y generar un **token permanente**.
5. Cargar en Vercel:

| Variable | De dónde sale |
|---|---|
| `WHATSAPP_TOKEN` | Token permanente del usuario del sistema |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp → Configuración de la API → "Identificador del número de teléfono" |
| `WHATSAPP_APP_SECRET` | Configuración de la app → Básica → Clave secreta |
| `WHATSAPP_VERIFY_TOKEN` | Una palabra secreta que elijas vos |

6. En WhatsApp → Configuración → **Webhook**: URL `https://<tu-proyecto>.vercel.app/api/whatsapp/webhook`, token de verificación = `WHATSAPP_VERIFY_TOKEN`, y suscribirse a **messages**.
7. Agregar una **tarjeta de pago** en Meta (los mensajes de marketing se cobran a la empresa).
8. Cambiar `WHATSAPP_MODE` a `real` y redeploy.

### Plantillas

Fuera de las 24 hs desde el último mensaje del cliente, WhatsApp solo deja mandar **plantillas aprobadas**. Para cada tipo de envío semanal, crear una plantilla en WhatsApp Manager:

- Categoría: **Marketing**. Idioma: **Español (ARG)** (`es_AR`; si usás otro, cambiá `WHATSAPP_TEMPLATE_LANG`).
- Encabezado: Imagen, Video o Documento si el envío lleva archivo.
- Cuerpo con `{{1}}` donde va el nombre del cliente, por ejemplo: `Hola, {{1}}. Te compartimos lo nuevo de esta semana. Si necesitás algo, escribinos por acá.`

En el panel, al crear el envío, se pone el **nombre de la plantilla** y el link del archivo. A quien escribió en las últimas 24 hs se le manda el texto del panel (sin plantilla).

## Costos

- **Meta**: unos US$0,071 por mensaje de marketing entregado en Argentina (cada envío semanal a cada cliente). Las respuestas dentro de las 24 hs salen mucho menos.
- **Claude**: se paga por uso en la consola de Anthropic.
- **Vercel y Neon**: los planes gratis alcanzan para empezar.

## Estructura

```
app/api/whatsapp/webhook   Recibe los mensajes de WhatsApp
app/api/cron/envios        Envío diario automático
app/panel/...              Pantallas del panel
lib/asistente.ts           Arma el pedido a Claude y la derivación al equipo
lib/procesar.ts            Qué pasa cuando llega un mensaje
lib/envios.ts              Envíos semanales y límite diario
lib/whatsapp.ts            Envío a la API de WhatsApp (y modo simulado)
```
