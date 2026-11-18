export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL UNIQUE,
    empresa TEXT NOT NULL DEFAULT 'Gamax',
    zona TEXT NOT NULL DEFAULT '',
    habitual BOOLEAN NOT NULL DEFAULT FALSE,
    acepta_mensajes BOOLEAN NOT NULL DEFAULT TRUE,
    creado TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS conversaciones (
    id SERIAL PRIMARY KEY,
    canal TEXT NOT NULL,
    telefono TEXT NOT NULL,
    nombre TEXT NOT NULL DEFAULT '',
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    estado TEXT NOT NULL DEFAULT 'asistente',
    ultima_entrada TIMESTAMPTZ,
    actualizado TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (canal, telefono)
  )`,
  `CREATE TABLE IF NOT EXISTS mensajes (
    id SERIAL PRIMARY KEY,
    conversacion_id INTEGER NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
    de TEXT NOT NULL,
    texto TEXT NOT NULL,
    media_url TEXT,
    externo_id TEXT UNIQUE,
    envio_id INTEGER,
    creado TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS mensajes_conv ON mensajes (conversacion_id, id)`,
  `CREATE TABLE IF NOT EXISTS envios (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    media_tipo TEXT,
    media_url TEXT,
    plantilla TEXT,
    empresa TEXT NOT NULL DEFAULT 'todas',
    programado_para DATE,
    estado TEXT NOT NULL DEFAULT 'borrador',
    creado TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS envio_destinatarios (
    id SERIAL PRIMARY KEY,
    envio_id INTEGER NOT NULL REFERENCES envios(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    error TEXT,
    enviado TIMESTAMPTZ,
    UNIQUE (envio_id, cliente_id)
  )`,
  `CREATE TABLE IF NOT EXISTS derivaciones (
    id SERIAL PRIMARY KEY,
    conversacion_id INTEGER NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL,
    resumen TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'abierta',
    creado TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS config (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
  )`,
];
