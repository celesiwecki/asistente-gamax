import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE, tokenPanel } from '@/lib/auth';

async function entrar(form: FormData) {
  'use server';
  if (String(form.get('pass') || '') !== process.env.PANEL_PASSWORD) redirect('/login?error=1');
  (await cookies()).set(COOKIE, await tokenPanel(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 30 });
  redirect('/panel');
}

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="login">
      <form action={entrar} className="card">
        <h1>Panel del asistente</h1>
        <p className="hint">Gamax / Gattos</p>
        {error && <div className="aviso">Contraseña incorrecta.</div>}
        <label>Contraseña<input type="password" name="pass" required autoFocus /></label>
        <button className="btn acc" type="submit">Entrar</button>
      </form>
    </main>
  );
}
