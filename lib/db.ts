import { neon } from '@neondatabase/serverless';
import { SCHEMA } from './schema';

type Row = Record<string, any>;
type Runner = (text: string, params: unknown[]) => Promise<Row[]>;

const g = globalThis as unknown as { __gamaxDb?: Promise<Runner> };

async function crear(): Promise<Runner> {
  const url = process.env.DATABASE_URL || 'pglite:./.data';
  let run: Runner;
  if (url.startsWith('pglite:')) {
    const { PGlite } = await import('@electric-sql/pglite');
    const dir = url.slice('pglite:'.length);
    const db = dir === 'memoria' ? new PGlite() : new PGlite(dir);
    run = async (text, params) => (await db.query<Row>(text, params as any[])).rows;
  } else {
    const sql = neon(url);
    run = async (text, params) => (await sql.query(text, params as any[])) as Row[];
  }
  for (const stmt of SCHEMA) await run(stmt, []);
  return run;
}

/** Ejecuta una consulta SQL con parámetros ($1, $2...). Crea las tablas la primera vez. */
export async function q<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  if (!g.__gamaxDb) g.__gamaxDb = crear().catch((e) => { g.__gamaxDb = undefined; throw e; });
  const run = await g.__gamaxDb;
  return (await run(text, params)) as T[];
}

export async function uno<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T | undefined> {
  return (await q<T>(text, params))[0];
}
