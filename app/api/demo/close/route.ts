import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { leer, escribir, apilar } from "@/lib/kv";
import { autorizado } from "@/lib/elevenlabs";
import { claveSesion, TTL_SESION, type Sesion } from "@/lib/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook post-llamada de ElevenLabs. Firma HMAC en `ElevenLabs-Signature`,
 * formato `t=<unix>,v0=<hex>` sobre `<t>.<cuerpo crudo>`.
 * https://elevenlabs.io/docs/agents-platform/workflows/post-call-webhooks
 *
 * Se acepta además el Bearer de las tools, por si el cierre se cablea como
 * tool en vez de como webhook. Una de las dos alcanza; ninguna, no.
 */
function firmaValida(crudo: string, header: string | null): boolean {
  const secreto = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secreto || !header) return false;

  const partes = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const t = partes["t"];
  const v0 = partes["v0"];
  if (!t || !v0) return false;

  // Ventana de 30 min: una firma vieja no se replaya.
  if (Math.abs(Date.now() / 1000 - Number(t)) > 1800) return false;

  const esperado = crypto
    .createHmac("sha256", secreto)
    .update(`${t}.${crudo}`)
    .digest("hex");
  const a = Buffer.from(esperado);
  const b = Buffer.from(v0);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const crudo = await req.text();
  const firmado = firmaValida(crudo, req.headers.get("elevenlabs-signature"));
  if (!firmado && !autorizado(req))
    return NextResponse.json({ error: "no_autorizado" }, { status: 401 });

  let cuerpo: Record<string, any>;
  try {
    cuerpo = JSON.parse(crudo);
  } catch {
    return NextResponse.json({ error: "cuerpo_invalido" }, { status: 400 });
  }

  // El payload de ElevenLabs anida los datos; una tool los manda planos.
  const datos = cuerpo.data ?? cuerpo;
  const dinamicas =
    datos?.conversation_initiation_client_data?.dynamic_variables ?? {};
  const id = String(
    cuerpo.session_id ?? cuerpo.sessionId ?? dinamicas.session_id ?? "",
  );
  if (!id)
    return NextResponse.json({ error: "falta_session_id" }, { status: 400 });

  const sesion = await leer<Sesion>(claveSesion(id));
  if (!sesion)
    return NextResponse.json({ error: "sesion_no_existe" }, { status: 404 });

  const cerrada: Sesion = {
    ...sesion,
    estado: "cerrada",
    outcome: cuerpo.outcome ? String(cuerpo.outcome) : sesion.outcome,
    terminacion: cuerpo.terminacion ? String(cuerpo.terminacion) : "normal",
    grabacionLista: true,
  };
  await escribir(claveSesion(id), cerrada, TTL_SESION);

  // Lo único que la demo le debe al proyecto: que el audio y el transcript se
  // puedan recuperar después. Sin spans, sin config_hash, sin ledger.
  await apilar("demo:llamadas", {
    sessionId: id,
    conversationId: datos?.conversation_id ?? sesion.conversationId ?? null,
    telefonoMasked: sesion.telefonoMasked,
    ts: new Date().toISOString(),
    duracionS: datos?.metadata?.call_duration_secs ?? cuerpo.duracion_s ?? null,
    grabacionUrl: cuerpo.grabacion_url ?? null,
    transcriptUrl: cuerpo.transcript_url ?? null,
    captura: cerrada.captura,
  });

  return NextResponse.json({ ok: true });
}
