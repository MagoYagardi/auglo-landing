/**
 * Disparar la llamada. Verificado contra la referencia de la API el 2026-09-05:
 * https://elevenlabs.io/docs/api-reference/twilio/outbound-call
 */

const ENDPOINT = "https://api.elevenlabs.io/v1/convai/twilio/outbound-call";

export type ResultadoLlamada = {
  success: boolean;
  message?: string;
  conversation_id?: string | null;
  callSid?: string | null;
};

export function demoHabilitada(): boolean {
  return (
    process.env.DEMO_HABILITADA !== "false" &&
    Boolean(
      process.env.ELEVENLABS_API_KEY &&
        process.env.ELEVENLABS_AGENT_ID &&
        process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID,
    )
  );
}

export async function llamar(opts: {
  telefono: string;
  nombre: string;
  sessionId: string;
}): Promise<ResultadoLlamada> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: process.env.ELEVENLABS_AGENT_ID,
      agent_phone_number_id: process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID,
      to_number: opts.telefono,
      // Es lo único que la demo le devuelve al proyecto.
      call_recording_enabled: true,
      telephony_call_config: { ringing_timeout_seconds: 25 },
      conversation_initiation_client_data: {
        dynamic_variables: {
          nombre: opts.nombre,
          // Ata la llamada a la consola en pantalla. Sin esto no hay demo.
          session_id: opts.sessionId,
        },
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(`elevenlabs ${res.status}: ${detalle.slice(0, 300)}`);
  }
  return (await res.json()) as ResultadoLlamada;
}

/** Las tools del agente se autentican con este Bearer. */
export function autorizado(req: Request): boolean {
  const esperado = process.env.AUGLO_DEMO_SECRET;
  if (!esperado) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token.length !== esperado.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++)
    diff |= token.charCodeAt(i) ^ esperado.charCodeAt(i);
  return diff === 0;
}
