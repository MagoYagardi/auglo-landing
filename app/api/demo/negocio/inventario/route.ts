/**
 * `ver_inventario` — qué autos hay en el salón.
 *
 * Es la tool que evita que el agente conteste "¿qué modelos tenés?" con lo que
 * el modelo tenga en la cabeza. Lo que no vuelve de acá, no existe.
 */
import { inventario } from "@/lib/negocio";
import { consultar } from "@/lib/consulta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return consultar(req, (c) =>
    inventario(String(c.tipo ?? ""), String(c.caja ?? "")),
  );
}
