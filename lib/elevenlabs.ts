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

/**
 * Taggea la conversación en ElevenLabs con el nombre que se usó en el primer
 * mensaje (dynamic variable `nombre`), para poder identificarla de un
 * vistazo en el dashboard sin abrir el transcript.
 *
 * Los tags de ElevenLabs son un vocabulario de workspace (se listan/crean por
 * separado y se asignan por id) — no un campo libre por llamada. Como acá el
 * valor es el nombre de cada contacto, esto va creando un tag nuevo por
 * persona distinta. Es la única forma de que el nombre aparezca en la UI de
 * tags; si el volumen de contactos crece mucho conviene revisar si sigue
 * siendo la herramienta correcta.
 *
 * Best-effort: un fallo acá no debe tumbar el webhook de cierre. La demo ya
 * le debe al proyecto la grabación (ver `close/route.ts`); esto es un extra.
 */
export async function tagConversacion(conversationId: string, nombre: string): Promise<void> {
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) return;
  const headers = { "xi-api-key": process.env.ELEVENLABS_API_KEY! };

  const lista = await fetch("https://api.elevenlabs.io/v1/convai/tags", {
    headers,
    cache: "no-store",
  });
  if (!lista.ok) throw new Error(`convai/tags GET ${lista.status}`);
  const tags = (await lista.json()) as { tags?: { tag_id: string; name: string }[] };

  let tagId = tags.tags?.find(
    (t) => t.name.localeCompare(nombreLimpio, undefined, { sensitivity: "base" }) === 0,
  )?.tag_id;

  if (!tagId) {
    const creado = await fetch("https://api.elevenlabs.io/v1/convai/tags", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ name: nombreLimpio }),
      cache: "no-store",
    });
    if (!creado.ok) throw new Error(`convai/tags POST ${creado.status}`);
    tagId = ((await creado.json()) as { tag_id: string }).tag_id;
  }

  const asignado = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/tags`,
    {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ tag_ids: [tagId] }),
      cache: "no-store",
    },
  );
  if (!asignado.ok) throw new Error(`conversations/tags POST ${asignado.status}`);
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
