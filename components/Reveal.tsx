"use client";

import { useRef, type ReactNode, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Entrada suave al scroll: fade + leve traslado en Y, una sola vez.
 * Si `stagger` > 0, anima los hijos directos en cascada en vez del bloque entero
 * — por eso `as` deja elegir la etiqueta cuando el contenedor tiene que seguir
 * siendo un `ul`/`ol` real (para que los hijos animados sean los `li`).
 */
export function Reveal({
  children,
  as = "div",
  className,
  stagger = 0,
  y = 18,
  start = "top 85%",
}: {
  children: ReactNode;
  as?: "div" | "ul" | "ol";
  className?: string;
  stagger?: number;
  y?: number;
  start?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const nodo = ref.current;
      if (!nodo) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const objetivos = stagger > 0 ? Array.from(nodo.children) : nodo;
      gsap.from(objetivos, {
        opacity: 0,
        y,
        duration: 0.8,
        ease: "power2.out",
        stagger,
        scrollTrigger: { trigger: nodo, start, once: true },
      });
    },
    { scope: ref },
  );

  if (as === "ul")
    return (
      <ul ref={ref as RefObject<HTMLUListElement>} className={className}>
        {children}
      </ul>
    );
  if (as === "ol")
    return (
      <ol ref={ref as RefObject<HTMLOListElement>} className={className}>
        {children}
      </ol>
    );
  return (
    <div ref={ref as RefObject<HTMLDivElement>} className={className}>
      {children}
    </div>
  );
}
