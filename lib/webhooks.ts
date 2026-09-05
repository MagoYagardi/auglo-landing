/**
 * Piso común de los webhooks que escribe el agente. Todos hacen lo mismo:
 * autenticar, encontrar la sesión, mutarla, guardarla.
 */
import { NextResponse } from "next/server";
import { leer, escribir } from "@/lib/kv";
import { autorizado } from "@/lib/elevenlabs";
import { claveSesion, TTL_SESION, type Sesion } from "@/lib/sesion";

export async function conSesion(
  req: Request,
  mutar: (s: Sesion, cuerpo: Record<string, unknown>) => Sesion,
): Promise<NextResponse> {
  if (!autorizado(req))
    return NextResponse.json({ error: "no_autorizado" }, { status: 401 });

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "cuerpo_invalido" }, { status: 400 });
  }

  const id = String(cuerpo.session_id ?? cuerpo.sessionId ?? "");
  if (!id)
    return NextResponse.json({ error: "falta_session_id" }, { status: 400 });

  const sesion = await leer<Sesion>(claveSesion(id));
  if (!sesion)
    return NextResponse.json({ error: "sesion_no_existe" }, { status: 404 });

  try {
    await escribir(claveSesion(id), mutar(sesion, cuerpo), TTL_SESION);
  } catch (e) {
    // Un dato implausible se rechaza con 422 y el agente vuelve a preguntar.
    return NextResponse.json(
      { error: "dato_implausible", detalle: String((e as Error).message) },
      { status: 422 },
    );
  }
  return NextResponse.json({ ok: true });
}
