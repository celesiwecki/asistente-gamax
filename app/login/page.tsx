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
      <section className="login-lado">
        <div className="marca" style={{ padding: 0 }}><span className="marca-logo">GG</span><div><b>Asistente</b><span>Gamax y Gattos</span></div></div>
        <div>
          <h2>Cada cliente atendido, a cualquier hora.</h2>
          <p>El asistente responde por WhatsApp con la información del catálogo, manda los envíos de la semana y le pasa al equipo lo que necesita una persona.</p>
        </div>
        <span style={{ fontSize: 13, color: '#8A9AA0' }}>Panel del equipo</span>
      </section>
      <section className="login-form">
        <form action={entrar}>
          <h1>Entrar al panel</h1>
          {error && <div className="aviso alerta" style={{ margin: 0 }}>La contraseña no es correcta. Probá de nuevo.</div>}
          <label>Contraseña<input type="password" name="pass" required autoFocus /></label>
          <button className="btn principal-btn" type="submit">Entrar</button>
        </form>
      </section>
    </main>
  );
}
