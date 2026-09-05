"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Sesion } from "@/lib/sesion";
import { Ficha } from "./Ficha";

const TERMINALES = new Set(["cerrada", "no_atendida", "rechazada", "error"]);

export function Demo() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [consent, setConsent] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const idRef = useRef<string | null>(null);

  const sondear = useCallback(async () => {
    const id = idRef.current;
    if (!id) return;
    try {
      const res = await fetch(`/api/demo/session/${id}`, { cache: "no-store" });
      if (!res.ok) return;
      const s = (await res.json()) as Sesion;
      setSesion(s);
      if (TERMINALES.has(s.estado)) idRef.current = null;
    } catch {
      /* una sonda perdida no rompe la demo; la siguiente llega en 900 ms */
    }
  }, []);

  useEffect(() => {
    const t = setInterval(sondear, 900);
    return () => clearInterval(t);
  }, [sondear]);

  // `?s=<sessionId>` engancha una llamada ya empezada. En el stand eso permite
  // mostrar la ficha en una segunda pantalla mientras la persona habla por su
  // celular.
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("s");
    if (s) {
      idRef.current = s;
      sondear();
    }
  }, [sondear]);

  async function pedirLlamada(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/demo/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, telefono, consent }),
      });
      const datos = await res.json();
      if (!res.ok) {
        setError(datos.mensaje ?? "No se pudo iniciar la llamada.");
        return;
      }
      idRef.current = datos.sessionId;
      setSesion(null);
      sondear();
    } catch {
      setError("Se cortó la conexión. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const enCurso = idRef.current !== null;

  return (
    <div className="grid gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-start md:gap-12 lg:gap-16">
      <div className="flex flex-col">
        <h1 className="expandido max-w-[16ch] text-balance text-[length:var(--text-display)] font-bold leading-[0.98]">
          El agente que te llama primero.
        </h1>

        <p className="mt-6 max-w-[38ch] text-[1.05rem] leading-relaxed text-dim">
          Auglo automatiza el recambio de vehículos en concesionarias uruguayas.
          Llama, pregunta y deja la ficha armada — a cualquier hora, sin que
          nadie levante el teléfono.
        </p>

        <form onSubmit={pedirLlamada} className="mt-9 flex max-w-[26rem] flex-col gap-3">
          <p className="angosto text-[0.85rem] text-text">
            Dejá tu número y hablás con el agente ahora.
          </p>

          <label className="sr-only" htmlFor="nombre">Tu nombre</label>
          <input
            id="nombre"
            type="text"
            autoComplete="given-name"
            placeholder="Tu nombre"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="h-12 border border-rule-hi bg-surface px-4 text-text placeholder:text-dim/70 focus:border-guinda-hi focus:outline-none"
          />

          <label className="sr-only" htmlFor="telefono">Tu teléfono en Uruguay</label>
          <input
            id="telefono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="099 123 456"
            required
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="tabular h-12 border border-rule-hi bg-surface px-4 text-text placeholder:text-dim/70 focus:border-guinda-hi focus:outline-none"
          />

          <label className="mt-1 flex cursor-pointer items-start gap-3 text-[0.82rem] leading-relaxed text-dim">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-guinda)]"
            />
            <span>
              Pido que el agente me llame ahora a este número y entiendo que la
              llamada se graba.
            </span>
          </label>

          <button
            type="submit"
            disabled={enviando || enCurso}
            className="mt-2 h-12 bg-guinda px-6 text-[0.95rem] font-semibold text-white transition-colors hover:bg-guinda-hi disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-dim"
          >
            {enCurso ? "Llamada en curso" : enviando ? "Marcando…" : "Llamame ahora"}
          </button>

          {error && (
            <p
              role="alert"
              className="border-l-2 border-guinda-hi bg-surface px-4 py-3 text-[0.85rem] leading-relaxed text-text"
            >
              {error}
            </p>
          )}

          <p className="mt-1 text-[0.75rem] leading-relaxed text-dim">
            Sólo números de Uruguay, dentro del horario que fija el Decreto
            132/022. Una llamada por número.
          </p>
        </form>
      </div>

      <div className="md:pt-3">
        <Ficha sesion={sesion} />
      </div>
    </div>
  );
}
