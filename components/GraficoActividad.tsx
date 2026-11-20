type Dia = { dia: string; clientes: number; asistente: number };

/** Barras agrupadas por día: mensajes de clientes y respuestas del asistente. */
export function GraficoActividad({ datos }: { datos: Dia[] }) {
  const W = 720, H = 220, izq = 34, abajo = 28, arriba = 10;
  const max = Math.max(4, ...datos.map((d) => Math.max(d.clientes, d.asistente)));
  const paso = Math.ceil(max / 4);
  const tope = paso * 4;
  const ancho = (W - izq) / datos.length;
  const barra = Math.max(4, Math.min(14, ancho / 2 - 4));
  const y = (v: number) => arriba + (H - arriba - abajo) * (1 - v / tope);
  const fecha = (s: string) => { const [, m, d] = s.split('-'); return `${Number(d)}/${Number(m)}`; };
  const total = datos.reduce((a, d) => a + d.clientes, 0);
  return (
    <svg className="grafico" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Actividad de los últimos ${datos.length} días: ${total} mensajes de clientes`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <line x1={izq} x2={W} y1={y(i * paso)} y2={y(i * paso)} stroke="#E1E4E2" strokeDasharray={i ? '3 4' : undefined} />
          <text x={izq - 8} y={y(i * paso) + 4} textAnchor="end" fontSize="11" fill="#8A9599">{i * paso}</text>
        </g>
      ))}
      {datos.map((d, i) => {
        const cx = izq + ancho * i + ancho / 2;
        return (
          <g key={d.dia}>
            <rect x={cx - barra - 1} y={y(d.clientes)} width={barra} height={y(0) - y(d.clientes)} rx="2" fill="#1D2A2F"><title>{`${fecha(d.dia)}: ${d.clientes} de clientes`}</title></rect>
            <rect x={cx + 1} y={y(d.asistente)} width={barra} height={y(0) - y(d.asistente)} rx="2" fill="#F2B705"><title>{`${fecha(d.dia)}: ${d.asistente} del asistente`}</title></rect>
            {(i % 2 === 0 || datos.length <= 7) && <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="#8A9599">{fecha(d.dia)}</text>}
          </g>
        );
      })}
    </svg>
  );
}
