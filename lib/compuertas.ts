/**
 * Lo que frena una llamada antes de discar.
 *
 * No son cautela: `horario_legal_uy` e `identificacion_origen_marca_y_motivo`
 * son `restricciones_duras` del charter `registry/recambio-outbound.yaml`, y
 * salen del Decreto 132/022. Ver `DEMO/04-legal.md` para qué queda cubierto y
 * qué no.
 */

import { marcarUnaVez } from "./kv";

export type Rechazo = { codigo: number; error: string; mensaje: string };

/** Sólo Uruguay. Un +54 tipeado en el stand no se disca. */
export function normalizarTelefonoUy(crudo: string): string | Rechazo {
  const d = crudo.replace(/[^\d+]/g, "");
  let e164: string;
  if (d.startsWith("+598")) e164 = d;
  else if (d.startsWith("598")) e164 = `+${d}`;
  else if (d.startsWith("0")) e164 = `+598${d.slice(1)}`;
  else if (/^\d{8,9}$/.test(d)) e164 = `+598${d}`;
  else if (d.startsWith("+"))
    return {
      codigo: 403,
      error: "numero_no_uy",
      mensaje: "Por ahora la demo sólo llama a números de Uruguay (+598).",
    };
  else
    return {
      codigo: 400,
      error: "numero_invalido",
      mensaje: "Ese número no parece válido. Probá con 09X XXX XXX.",
    };

  if (!/^\+598\d{8,9}$/.test(e164))
    return {
      codigo: 400,
      error: "numero_invalido",
      mensaje: "Ese número no parece válido. Probá con 09X XXX XXX.",
    };
  return e164;
}

/**
 * Decreto 132/022 Art. 6: lun–vie 09:00–21:00, sáb 09:00–19:00, hora de
 * Montevideo. Domingo no se llama. Espejo de `src/dialer.py:67`.
 */
export function dentroDeHorarioUy(ahora = new Date()): Rechazo | null {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Montevideo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(ahora);

  const leer = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  const dia = leer("weekday");
  const hora = Number(leer("hour"));
  const minuto = Number(leer("minute"));
  const enMinutos = hora * 60 + minuto;

  const noSePuede = (detalle: string): Rechazo => ({
    codigo: 403,
    error: "fuera_de_horario",
    mensaje:
      `${detalle} El Decreto 132/022 fija cuándo se puede llamar en Uruguay, ` +
      `y esa compuerta corre antes de discar. Anotate en la lista y te ` +
      `mostramos la demo igual.`,
  });

  if (dia === "Sun") return noSePuede("Hoy es domingo.");
  if (dia === "Sat") {
    if (enMinutos < 9 * 60 || enMinutos >= 19 * 60)
      return noSePuede("Los sábados se llama de 9 a 19.");
    return null;
  }
  if (enMinutos < 9 * 60 || enMinutos >= 21 * 60)
    return noSePuede("De lunes a viernes se llama de 9 a 21.");
  return null;
}

const COOLDOWN_SEGUNDOS = 300;

/** Un número cada 5 minutos, tres por IP en esa misma ventana. */
export async function pasaRateLimit(
  e164: string,
  ip: string,
): Promise<Rechazo | null> {
  const porNumero = await marcarUnaVez(`demo:rate:tel:${e164}`, COOLDOWN_SEGUNDOS);
  if (!porNumero)
    return {
      codigo: 429,
      error: "rate_limited",
      mensaje: "Ese número ya recibió una llamada hace poco. Probá en un rato.",
    };

  for (let i = 1; i <= 3; i++) {
    if (await marcarUnaVez(`demo:rate:ip:${ip}:${i}`, COOLDOWN_SEGUNDOS)) return null;
  }
  return {
    codigo: 429,
    error: "rate_limited",
    mensaje: "Muchas llamadas desde esta conexión. Probá en un rato.",
  };
}

/** El texto exacto que la persona acepta. Se guarda con la sesión. */
export const TEXTO_CONSENTIMIENTO =
  "Pido que un agente de voz de Auglo me llame ahora a este número para " +
  "mostrarme una demostración. Entiendo que la llamada se graba.";
