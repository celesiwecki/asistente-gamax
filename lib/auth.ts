export const COOKIE = 'panel_gamax';

/** Valor de la cookie de sesión: un hash de la contraseña del panel (funciona en el middleware y en el servidor). */
export async function tokenPanel(): Promise<string> {
  const pass = process.env.PANEL_PASSWORD || '';
  const data = new TextEncoder().encode('asistente-gamax:' + pass);
  const h = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
