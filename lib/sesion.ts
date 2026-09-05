/**
 * El estado de una llamada de demo.
 *
 * Espejo reducido de `src/captura.py` y `src/roi.py:ConversationRecord`. Lo que
 * se conserva del original es lo único que hace legible un campo vacío: el
 * ESTADO. "No se llegó a preguntar" y "se preguntó y no lo sabía" son cosas
 * distintas, y colapsarlas convierte la consola en un adorno.
 */

export const CAMPOS = ["vehiculo", "anio", "km", "vehiculo_de_interes"] as const;
export type Campo = (typeof CAMPOS)[number];

export type EstadoCampo = "no_preguntado" | "sin_respuesta" | "conocido";

export type Dato = {
  estado: EstadoCampo;
  valor: string | number | null;
  historial: (string | number)[];
};

export type EstadoSesion =
  | "solicitada"
  | "discando"
  | "sonando"
  | "atendida"
  | "en_curso"
  | "cerrada"
  | "no_atendida"
  | "rechazada"
  | "error";

export type Turno = { rol: "agente" | "persona"; texto: string; ts: number };

export type Sesion = {
  sessionId: string;
  estado: EstadoSesion;
  nombre: string;
  telefonoMasked: string;
  iniciadaEn: string;
  captura: Record<Campo, Dato>;
  cita: { ref: string | null; fecha: string | null; ejecutable: false };
  transcript: Turno[];
  baja: boolean;
  outcome: string | null;
  terminacion: string | null;
  grabacionLista: boolean;
  conversationId?: string | null;
};

// Rangos de plausibilidad. No son validación de negocio: son la defensa contra
// el STT. "ochenta mil" mal entendido sale 80, y 80 km es un auto que salió
// ayer del salón.
export const ANIO_MIN = 1970;
export const ANIO_MAX = 2030;
export const KM_MIN = 0;
export const KM_MAX = 1_000_000;

export function capturaVacia(): Record<Campo, Dato> {
  return CAMPOS.reduce(
    (acc, c) => {
      acc[c] = { estado: "no_preguntado", valor: null, historial: [] };
      return acc;
    },
    {} as Record<Campo, Dato>,
  );
}

export function sesionNueva(
  sessionId: string,
  nombre: string,
  telefono: string,
): Sesion {
  return {
    sessionId,
    estado: "solicitada",
    nombre,
    telefonoMasked: enmascarar(telefono),
    iniciadaEn: new Date().toISOString(),
    captura: capturaVacia(),
    cita: { ref: null, fecha: null, ejecutable: false },
    transcript: [],
    baja: false,
    outcome: null,
    terminacion: null,
    grabacionLista: false,
  };
}

/** El número completo nunca vuelve al navegador. */
export function enmascarar(e164: string): string {
  const d = e164.replace(/\D/g, "");
  if (d.length < 5) return "•••";
  return `+${d.slice(0, 3)} ${d.slice(3, 4)}• ••• ${d.slice(-3)}`;
}

export class DatoImplausible extends Error {}

/**
 * Normaliza y rechaza. Lo que no puede ser cierto no se guarda: se vuelve a
 * preguntar. No se estima, no se redondea, no se completa con lo plausible.
 */
export function normalizar(campo: Campo, valor: unknown): string | number {
  if (campo === "anio") {
    const n = Math.trunc(Number(valor));
    if (!Number.isFinite(n) || n < ANIO_MIN || n > ANIO_MAX)
      throw new DatoImplausible(`año fuera de ${ANIO_MIN}-${ANIO_MAX}: ${valor}`);
    return n;
  }
  if (campo === "km") {
    const n = Math.trunc(Number(valor));
    if (!Number.isFinite(n) || n < KM_MIN || n > KM_MAX)
      throw new DatoImplausible(`km fuera de ${KM_MIN}-${KM_MAX}: ${valor}`);
    return n;
  }
  const s = String(valor ?? "").trim();
  if (!s) throw new DatoImplausible(`${campo} vacío`);
  if (s.length > 60) throw new DatoImplausible(`${campo} demasiado largo`);
  return s;
}

/**
 * Pisar un dato ya conocido es LEGÍTIMO —"perdón, cincuenta mil"— y por eso no
 * se bloquea. Pero el historial queda: sin él, un número suelto de un turno
 * posterior pisa lo confirmado y nadie puede saber que antes había otra cosa.
 */
export function registrar(dato: Dato, valor: string | number): Dato {
  const historial =
    dato.valor !== valor ? [...dato.historial, valor] : dato.historial;
  return { estado: "conocido", valor, historial };
}

export const claveSesion = (id: string) => `demo:session:${id}`;
export const TTL_SESION = 60 * 60 * 24;
