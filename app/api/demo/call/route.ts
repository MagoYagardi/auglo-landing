import { NextResponse } from "next/server";
import { escribir, apilar, estaConfigurado } from "@/lib/kv";
import {
  claveSesion,
  sesionNueva,
  TTL_SESION,
  type Sesion,
} from "@/lib/sesion";
import {
  dentroDeHorarioUy,
  normalizarTelefonoUy,
  pasaRateLimit,
  TEXTO_CONSENTIMIENTO,
  type Rechazo,
} from "@/lib/compuertas";
import { demoHabilitada, llamar } from "@/lib/elevenlabs";

// Ensayo: crea la sesión y NO disca. Mismo concepto que `make call DRY=1` en el
// repo. Sirve para probar la ficha sin gastar minutos ni molestar a nadie, y
// para que la página se pueda ensayar sin KV. Nunca se prende en producción.
const ENSAYO = process.env.DEMO_ENSAYO === "1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const no = (r: Rechazo) =>
  NextResponse.json({ error: r.error, mensaje: r.mensaje }, { status: r.codigo });

export async function POST(req: Request) {
  if (!ENSAYO && (!demoHabilitada() || !estaConfigurado()))
    return no({
      codigo: 503,
      error: "demo_offline",
      mensaje:
        "La demo en vivo está fuera de línea en este momento. Anotate en la " +
        "lista y te llamamos nosotros.",
    });

  let cuerpo: { nombre?: string; telefono?: string; consent?: boolean };
  try {
    cuerpo = await req.json();
  } catch {
    return no({
      codigo: 400,
      error: "cuerpo_invalido",
      mensaje: "No se pudo leer el formulario.",
    });
  }

  const nombre = String(cuerpo.nombre ?? "").trim().slice(0, 40);
  if (nombre.length < 2)
    return no({
      codigo: 400,
      error: "nombre_invalido",
      mensaje: "Decime tu nombre para que el agente sepa con quién habla.",
    });

  if (cuerpo.consent !== true)
    return no({
      codigo: 403,
      error: "sin_consentimiento",
      mensaje: "Necesitamos que aceptes recibir la llamada.",
    });

  const telefono = normalizarTelefonoUy(String(cuerpo.telefono ?? ""));
  if (typeof telefono !== "string") return no(telefono);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "desconocida";

  // En ensayo no se disca a nadie, así que las compuertas no tienen qué
  // proteger. En cualquier otro caso corren, y no se saltean.
  if (!ENSAYO) {
    const fueraDeHorario = dentroDeHorarioUy();
    if (fueraDeHorario) return no(fueraDeHorario);

    const limitado = await pasaRateLimit(telefono, ip);
    if (limitado) return no(limitado);
  }

  const sessionId = `dm_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const sesion: Sesion = sesionNueva(sessionId, nombre, telefono);
  await escribir(claveSesion(sessionId), sesion, TTL_SESION);

  // Decreto 132/022 Art. 5: el consentimiento tiene que quedar documentado y
  // preservado por la entidad que realiza la campaña. Acá queda, con su texto
  // exacto, el momento y el origen.
  await apilar("demo:consentimientos", {
    sessionId,
    telefono,
    nombre,
    ip,
    texto: TEXTO_CONSENTIMIENTO,
    ts: new Date().toISOString(),
  });

  if (ENSAYO) {
    await escribir(claveSesion(sessionId), { ...sesion, estado: "discando" }, TTL_SESION);
    return NextResponse.json({ sessionId, estado: "discando", ensayo: true }, { status: 202 });
  }

  try {
    const r = await llamar({ telefono, nombre, sessionId });
    await escribir(
      claveSesion(sessionId),
      { ...sesion, estado: "discando", conversationId: r.conversation_id ?? null },
      TTL_SESION,
    );
  } catch (e) {
    await escribir(claveSesion(sessionId), { ...sesion, estado: "error" }, TTL_SESION);
    console.error("[demo/call]", e);
    return no({
      codigo: 502,
      error: "plataforma_no_responde",
      mensaje: "No se pudo iniciar la llamada. Probá de nuevo en un momento.",
    });
  }

  return NextResponse.json({ sessionId, estado: "discando" }, { status: 202 });
}
