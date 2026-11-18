import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, tokenPanel } from './lib/auth';

export async function middleware(req: NextRequest) {
  if (!process.env.PANEL_PASSWORD) {
    return new NextResponse('Falta configurar PANEL_PASSWORD', { status: 500 });
  }
  if (req.cookies.get(COOKIE)?.value === (await tokenPanel())) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith('/api/')) return new NextResponse('No autorizado', { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

// El webhook de Meta y el cron no usan la contraseña del panel (tienen su propia verificación).
export const config = { matcher: ['/panel/:path*', '/api/simulador/:path*'] };
