/**
 * Los filetes de columna del héroe.
 *
 * Caen sobre los bordes de columna del contenedor, no del viewport: son el
 * marco de medición de lo que hay adentro. Sin animación a propósito — el único
 * momento orquestado de la página es la llamada, y una grilla que se dibuja
 * sola le compite.
 */
export function Filetes({ cols = 4 }: { cols?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-full max-w-[1280px] -translate-x-1/2 px-6 md:block lg:px-10"
    >
      <div
        className="grid h-full"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols - 1 }, (_, i) => (
          <span key={i} className="border-r border-rule-hi" />
        ))}
      </div>
    </div>
  );
}
