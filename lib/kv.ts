/**
 * Almacenamiento de la demo.
 *
 * Habla REST de Redis (Vercel KV / Upstash) por `fetch`, sin SDK: una
 * dependencia menos que pueda cambiar de nombre la semana del evento.
 *
 * Si no hay credenciales, cae a memoria del proceso y lo dice. En Vercel eso
 * significa que el estado no sobrevive entre invocaciones — sirve para `next
 * dev`, no para el stand. `estaConfigurado()` es lo que la app consulta antes
 * de prometerle una llamada a alguien.
 */

const URL_BASE =
  process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN =
  process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export function estaConfigurado(): boolean {
  return Boolean(URL_BASE && TOKEN);
}

type Valor = string | number | null;

const memoria = new Map<string, { valor: string; expira: number | null }>();

function vivo(k: string): string | null {
  const e = memoria.get(k);
  if (!e) return null;
  if (e.expira !== null && Date.now() > e.expira) {
    memoria.delete(k);
    return null;
  }
  return e.valor;
}

async function comando(...partes: (string | number)[]): Promise<Valor> {
  if (!estaConfigurado()) return null;
  const res = await fetch(URL_BASE!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(partes.map(String)),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`kv ${partes[0]}: ${res.status}`);
  const json = (await res.json()) as { result: Valor };
  return json.result;
}

export async function leer<T>(clave: string): Promise<T | null> {
  const crudo = estaConfigurado()
    ? ((await comando("GET", clave)) as string | null)
    : vivo(clave);
  if (crudo === null || crudo === undefined) return null;
  try {
    return JSON.parse(crudo) as T;
  } catch {
    return null;
  }
}

export async function escribir(
  clave: string,
  valor: unknown,
  ttlSegundos?: number,
): Promise<void> {
  const crudo = JSON.stringify(valor);
  if (estaConfigurado()) {
    if (ttlSegundos) await comando("SET", clave, crudo, "EX", ttlSegundos);
    else await comando("SET", clave, crudo);
    return;
  }
  memoria.set(clave, {
    valor: crudo,
    expira: ttlSegundos ? Date.now() + ttlSegundos * 1000 : null,
  });
}

/** Devuelve true si la clave no existía. Es el rate limit y el anti-duplicado. */
export async function marcarUnaVez(
  clave: string,
  ttlSegundos: number,
): Promise<boolean> {
  if (estaConfigurado()) {
    const r = await comando("SET", clave, "1", "NX", "EX", ttlSegundos);
    return r !== null;
  }
  if (vivo(clave) !== null) return false;
  memoria.set(clave, { valor: "1", expira: Date.now() + ttlSegundos * 1000 });
  return true;
}

export async function incrementar(clave: string): Promise<number> {
  if (estaConfigurado()) return Number(await comando("INCR", clave));
  const actual = Number(vivo(clave) ?? 0) + 1;
  memoria.set(clave, { valor: String(actual), expira: null });
  return actual;
}

export async function contar(clave: string): Promise<number> {
  if (estaConfigurado()) {
    const r = await comando("GET", clave);
    return r === null ? 0 : Number(r);
  }
  return Number(vivo(clave) ?? 0);
}

/** Appendea a una lista acotada. La demo no necesita más que esto. */
export async function apilar(clave: string, valor: unknown, tope = 500) {
  if (estaConfigurado()) {
    await comando("LPUSH", clave, JSON.stringify(valor));
    await comando("LTRIM", clave, 0, tope - 1);
    return;
  }
  const lista = JSON.parse(vivo(clave) ?? "[]") as unknown[];
  lista.unshift(valor);
  memoria.set(clave, {
    valor: JSON.stringify(lista.slice(0, tope)),
    expira: null,
  });
}
