"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import type { Campo, Dato, Sesion } from "@/lib/sesion";

const ETIQUETAS: Record<Campo, string> = {
  vehiculo: "Vehículo",
  anio: "Año",
  km: "Kilómetros",
  vehiculo_de_interes: "Le interesa",
};

const ORDEN: Campo[] = ["vehiculo", "anio", "km", "vehiculo_de_interes"];

const EN_VIVO = new Set(["discando", "sonando", "atendida", "en_curso"]);

function formatear(campo: Campo, valor: string | number | null) {
  if (valor === null) return "";
  if (campo === "km") return `${Number(valor).toLocaleString("es-UY")} km`;
  return String(valor);
}

/**
 * Una fila de la ficha.
 *
 * Los tres estados se leen por luminancia, no por semáforo. Un semáforo diría
 * "bien / mal", y estos estados no son eso: son cuánto sabemos.
 */
function Fila({ campo, dato }: { campo: Campo; dato: Dato }) {
  const ref = useRef<HTMLDivElement>(null);
  const anterior = useRef<string>("");
  const clave = `${dato.estado}:${dato.valor}`;

  useEffect(() => {
    if (anterior.current && anterior.current !== clave && ref.current) {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.fromTo(
          ref.current,
          { backgroundColor: "rgba(155,32,51,0.14)" },
          { backgroundColor: "rgba(155,32,51,0)", duration: 1.1, ease: "power2.out" },
        );
      }
    }
    anterior.current = clave;
  }, [clave]);

  const corregido = dato.historial.length > 1;

  return (
    <div
      ref={ref}
      className="grid grid-cols-[7.5rem_1fr] items-baseline gap-x-4 px-5 py-3.5 sm:grid-cols-[9rem_1fr] sm:px-7"
    >
      <dt className="angosto text-[0.8rem] text-[color-mix(in_srgb,var(--color-ink)_58%,transparent)]">
        {ETIQUETAS[campo]}
      </dt>
      <dd className="min-w-0">
        {dato.estado === "conocido" && (
          <span className="tabular block text-[1.05rem] font-semibold text-ink sm:text-[1.15rem]">
            {formatear(campo, dato.valor)}
          </span>
        )}

        {dato.estado === "sin_respuesta" && (
          <span className="block text-[0.95rem] italic text-[color-mix(in_srgb,var(--color-ink)_72%,transparent)]">
            no lo sabía
          </span>
        )}

        {dato.estado === "no_preguntado" && (
          <span
            className="mt-2 block h-px w-full max-w-[13rem]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, color-mix(in srgb, var(--color-ink) 30%, transparent) 0 3px, transparent 3px 7px)",
            }}
          >
            <span className="sr-only">todavía no se preguntó</span>
          </span>
        )}

        {corregido && (
          <span className="mt-1 block text-[0.78rem] text-guinda">
            <s>{formatear(campo, dato.historial[dato.historial.length - 2])}</s>
            <span className="ml-2 text-[color-mix(in_srgb,var(--color-ink)_60%,transparent)]">
              se corrigió en la llamada
            </span>
          </span>
        )}
      </dd>
    </div>
  );
}

export function Ficha({ sesion }: { sesion: Sesion | null }) {
  const enVivo = sesion !== null && EN_VIVO.has(sesion.estado);
  const captura = sesion?.captura;

  return (
    <div className="overflow-hidden bg-bone text-ink shadow-[0_1px_0_var(--color-rule-hi),0_30px_70px_-40px_rgba(0,0,0,0.9)]">
      <header className="flex items-baseline justify-between gap-4 border-b border-[color-mix(in_srgb,var(--color-ink)_16%,transparent)] px-5 py-4 sm:px-7">
        <div>
          <h3 className="expandido text-[0.95rem] font-bold">
            Ficha de recambio
          </h3>
          <p className="tabular mt-0.5 text-[0.75rem] text-[color-mix(in_srgb,var(--color-ink)_55%,transparent)]">
            {sesion
              ? `${sesion.sessionId} · ${sesion.telefonoMasked}`
              : "sin llamada en curso"}
          </p>
        </div>
        {enVivo && (
          <span className="flex shrink-0 items-center gap-2 text-[0.75rem] font-medium text-guinda">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-guinda opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-guinda" />
            </span>
            {sesion!.estado === "discando" || sesion!.estado === "sonando"
              ? "llamando"
              : "en línea"}
          </span>
        )}
      </header>

      <dl className="divide-y divide-[color-mix(in_srgb,var(--color-ink)_11%,transparent)]">
        {ORDEN.map((campo) => (
          <Fila
            key={campo}
            campo={campo}
            dato={
              captura?.[campo] ?? {
                estado: "no_preguntado",
                valor: null,
                historial: [],
              }
            }
          />
        ))}
      </dl>

      <div className="border-t border-[color-mix(in_srgb,var(--color-ink)_16%,transparent)] px-5 py-4 sm:px-7">
        {!sesion || sesion.transcript.length === 0 ? (
          <p className="text-[0.85rem] leading-relaxed text-[color-mix(in_srgb,var(--color-ink)_62%,transparent)]">
            {sesion
              ? "El agente está marcando. La ficha se llena mientras hablás."
              : "La ficha se llena mientras hablás. Los campos vacíos no se completan con lo plausible: lo que no se averigua, queda sin averiguar."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sesion.transcript.slice(-4).map((t, i) => (
              <li key={i} className="grid grid-cols-[4.2rem_1fr] gap-3 text-[0.85rem]">
                <span className="angosto text-[color-mix(in_srgb,var(--color-ink)_50%,transparent)]">
                  {t.rol === "agente" ? "Tomás" : "vos"}
                </span>
                <span className="leading-snug">{t.texto}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {sesion?.estado === "cerrada" && (
        <footer className="border-t border-[color-mix(in_srgb,var(--color-ink)_16%,transparent)] bg-bone-2 px-5 py-3 text-[0.78rem] text-[color-mix(in_srgb,var(--color-ink)_70%,transparent)] sm:px-7">
          Llamada cerrada. La grabación queda guardada; nada de esto se escribe
          en el sistema de ninguna concesionaria.
        </footer>
      )}
    </div>
  );
}
