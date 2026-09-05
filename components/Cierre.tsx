"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

// Cambiar por el repo público de la landing cuando exista (DEMO/06 §2).
const GITHUB = "https://github.com/MagoYagardi";
const MAIL = "info@auglo.uy";

function Contador({ valor }: { valor: number | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previo = useRef(0);

  useEffect(() => {
    if (valor === null || !ref.current) return;
    const nodo = ref.current;
    const desde = previo.current;
    previo.current = valor;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodo.textContent = String(valor);
      return;
    }
    const obj = { n: desde };
    const tween = gsap.to(obj, {
      n: valor,
      duration: desde === 0 ? 1.4 : 0.6,
      ease: "power2.out",
      onUpdate: () => {
        nodo.textContent = String(Math.round(obj.n));
      },
    });
    return () => {
      tween.kill();
    };
  }, [valor]);

  return (
    <span
      ref={ref}
      className="tabular expandido block text-[clamp(4rem,11vw,7.5rem)] font-bold leading-none"
    >
      {valor === null ? "—" : "0"}
    </span>
  );
}

export function Cierre() {
  const [total, setTotal] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "listo" | "error">("idle");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch("/api/waitlist/count")
      .then((r) => r.json())
      .then((d) => setTotal(d.count))
      .catch(() => setTotal(27));
  }, []);

  async function anotarse(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const datos = await res.json();
      if (!res.ok) {
        setEstado("error");
        setMensaje(datos.mensaje ?? "No se pudo anotar ese correo.");
        return;
      }
      setTotal(datos.count);
      setEstado("listo");
      setMensaje(datos.yaEstaba ? "Ya estabas en la lista." : "Listo. Te escribimos.");
      setEmail("");
    } catch {
      setEstado("error");
      setMensaje("Se cortó la conexión. Probá de nuevo.");
    }
  }

  return (
    <div className="grid gap-12 md:grid-cols-2 md:gap-16">
      <div>
        <h2 className="expandido text-[length:var(--text-seccion)] font-bold leading-tight">
          Socios e interesados
        </h2>
        <div className="mt-8">
          <Contador valor={total} />
          <p className="mt-3 max-w-[30ch] text-[0.95rem] leading-relaxed text-dim">
            personas anotadas para ver el motor de cerca. El código de esta
            página es público; el del motor, todavía no.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={GITHUB}
            className="inline-flex h-12 items-center border border-rule-hi px-6 text-[0.9rem] font-medium text-text transition-colors hover:border-guinda-hi hover:text-white"
          >
            Ver el código
          </a>
          <a
            href={`mailto:${MAIL}`}
            className="inline-flex h-12 items-center border border-rule-hi px-6 text-[0.9rem] font-medium text-text transition-colors hover:border-guinda-hi hover:text-white"
          >
            {MAIL}
          </a>
        </div>
      </div>

      <div className="md:border-l md:border-rule md:pl-12 lg:pl-16">
        <h2 className="expandido text-[length:var(--text-seccion)] font-bold leading-tight">
          Lista de espera
        </h2>
        <p className="mt-4 max-w-[38ch] text-[0.95rem] leading-relaxed text-dim">
          Para concesionarias que quieren la campaña corriendo sobre su propia
          base. Escribimos cuando hay algo para mostrar, no antes.
        </p>

        <form onSubmit={anotarse} className="mt-8 flex max-w-[26rem] flex-col gap-3">
          <label className="sr-only" htmlFor="email">Tu correo</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vos@concesionaria.uy"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 border border-rule-hi bg-surface px-4 text-text placeholder:text-dim/70 focus:border-guinda-hi focus:outline-none"
          />
          <button
            type="submit"
            disabled={estado === "enviando"}
            className="h-12 bg-bone px-6 text-[0.95rem] font-semibold text-ink transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {estado === "enviando" ? "Anotando…" : "Anotarme"}
          </button>
          {mensaje && (
            <p
              role="status"
              className={`text-[0.85rem] ${estado === "error" ? "text-guinda-hi" : "text-dim"}`}
            >
              {mensaje}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
