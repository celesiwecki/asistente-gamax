'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icono } from './Icono';

const ITEMS = [
  { href: '/panel', n: 'inicio', t: 'Inicio' },
  { href: '/panel/charlas', n: 'charlas', t: 'Charlas' },
  { href: '/panel/envios', n: 'envios', t: 'Envíos' },
  { href: '/panel/clientes', n: 'clientes', t: 'Clientes' },
  { href: '/panel/conocimiento', n: 'saber', t: 'Lo que sabe' },
  { href: '/panel/simulador', n: 'simulador', t: 'Simulador' },
];

export function Navegacion({ pendientes }: { pendientes: number }) {
  const ruta = usePathname();
  return (
    <nav className="nav" aria-label="Secciones">
      {ITEMS.map((i) => {
        const activo = i.href === '/panel' ? ruta === '/panel' : ruta.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={activo ? 'page' : undefined}>
            <Icono n={i.n} />
            <span className="etq">{i.t}</span>
            {i.n === 'charlas' && pendientes > 0 && <span className="cuenta" aria-label={`${pendientes} para atender`}>{pendientes}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
