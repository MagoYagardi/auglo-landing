/**
 * Uruguay como matriz de puntos.
 *
 * El contorno es una simplificación de la frontera (≈35 vértices en lon/lat);
 * los puntos son una grilla filtrada por point-in-polygon. Se calcula una vez,
 * en el módulo, así el SVG sale igual en el servidor y en el cliente.
 */

type Punto = [number, number];

// Sentido horario desde Bella Unión. Aproximado a propósito: es un mapa de
// puntos, no un catastro.
const CONTORNO: Punto[] = [
  [-57.6, -30.25], [-57.1, -30.28], [-56.47, -30.4], [-56.02, -30.8],
  [-55.55, -30.9], [-55.1, -31.1], [-54.6, -31.45], [-54.16, -31.87],
  [-53.8, -32.2], [-53.4, -32.6], [-53.3, -33.1], [-53.55, -33.45],
  [-53.37, -33.69], [-53.8, -34.05], [-54.3, -34.35], [-54.95, -34.97],
  [-55.3, -34.8], [-55.7, -34.78], [-56.16, -34.9], [-56.6, -34.72],
  [-57.2, -34.45], [-57.84, -34.47], [-58.15, -34.2], [-58.4, -33.9],
  [-58.3, -33.12], [-58.15, -32.7], [-58.08, -32.32], [-58.05, -31.85],
  [-57.96, -31.38], [-57.9, -30.95], [-57.75, -30.6],
];

const LON_MIN = -58.45, LON_MAX = -53.25;
const LAT_MIN = -35.05, LAT_MAX = -30.15;
const ANCHO = 460;
const ALTO = Math.round(
  (ANCHO * (LAT_MAX - LAT_MIN)) / ((LON_MAX - LON_MIN) * Math.cos((32.5 * Math.PI) / 180)),
);

const px = (lon: number) => ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * ANCHO;
const py = (lat: number) => ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * ALTO;

function adentro([x, y]: Punto): boolean {
  let dentro = false;
  for (let i = 0, j = CONTORNO.length - 1; i < CONTORNO.length; j = i++) {
    const [xi, yi] = CONTORNO[i];
    const [xj, yj] = CONTORNO[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      dentro = !dentro;
  }
  return dentro;
}

const PASO_LON = 0.105;
const PASO_LAT = 0.09;

const PUNTOS: { x: number; y: number }[] = [];
for (let fila = 0, lat = LAT_MAX; lat > LAT_MIN; lat -= PASO_LAT, fila++) {
  // Filas alternadas corridas media celda: textura de matriz, no de cuadrícula.
  const corrimiento = fila % 2 === 0 ? 0 : PASO_LON / 2;
  for (let lon = LON_MIN + corrimiento; lon < LON_MAX; lon += PASO_LON) {
    if (adentro([lon, lat])) PUNTOS.push({ x: px(lon), y: py(lat) });
  }
}

const MONTEVIDEO = { x: px(-56.16), y: py(-34.9) };

export function MapaUruguay({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      className={className}
      role="img"
      aria-label="Mapa punteado de Uruguay, con Montevideo señalada."
    >
      <g fill="currentColor">
        {PUNTOS.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={1.5} />
        ))}
      </g>
      <circle
        cx={MONTEVIDEO.x}
        cy={MONTEVIDEO.y}
        r={4.5}
        fill="var(--color-guinda-hi)"
      />
      <text
        x={MONTEVIDEO.x + 11}
        y={MONTEVIDEO.y + 4}
        fill="var(--color-text)"
        fontSize={12}
        className="angosto"
      >
        Montevideo
      </text>
    </svg>
  );
}
