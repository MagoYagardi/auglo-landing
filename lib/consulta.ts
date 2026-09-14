/**
 * Piso común de las tools de **lectura** del agente.
 *
 * `webhooks.ts` es el piso de las que escriben: autentican, buscan la sesión y
 * la mutan. Éstas no mutan nada — contestan una pregunta — así que exigir una
 * sesión sería pedir un dato que no se usa, y una tool que falla con 404
 * porque le falta un `session_id` que no necesita es una tool que el agente
 * deja de llamar.
 *
 * Lo que sí comparten es la autenticación: son endpoints públicos en Vercel y
 * el Bearer es lo único entre ellos e internet.
 *
 * El `session_id` es **opcional** y sirve para una sola cosa: dejar anotado en
 * la sesión qué hecho se usó, con su fuente, para que la consola lo muestre y
 * para que después se pueda auditar qué afirmó el agente y de dónde lo sacó.
 */
import { NextResponse } from "next/server";
import { leer, escribir } from "@/lib/kv";
import { autorizado } from "@/lib/elevenlabs";
import { claveSesion, TTL_SESION, type Sesion } from "@/lib/sesion";
import type { Respuesta } from "@/lib/negocio";

export async function consultar(
  req: Request,
  responder: (cuerpo: Record<string, unknown>) => Respuesta,
): Promise<NextResponse> {
  if (!autorizado(req))
    return NextResponse.json({ error: "no_autorizado" }, { status: 401 });

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await req.json()) as Record<string, unknown>;
  } catch {
    cuerpo = {};
  }

  const r = responder(cuerpo);

  // Anotar es best-effort: si el KV no está o la sesión venció, la respuesta
  // sale igual. Que la consola se pierda un renglón es mucho menos grave que
  // que el agente se quede sin contestar.
  const id = String(cuerpo.session_id ?? cuerpo.sessionId ?? "");
  if (id && r.hayDatos) {
    try {
      const s = await leer<Sesion>(claveSesion(id));
      if (s)
        await escribir(
          claveSesion(id),
          { ...s, hechos: [...(s.hechos ?? []), ...r.fuentes.map((f, i) => ({ valor: r.datos[i], fuente: f }))] },
          TTL_SESION,
        );
    } catch {
      /* la consola se pierde un renglón; la llamada sigue */
    }
  }

  return NextResponse.json(r);
}
