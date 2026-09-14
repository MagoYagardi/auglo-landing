/**
 * `ver_sucursal` — nombre y horarios de atención.
 *
 * La dirección no está, y eso es deliberado: mandar a alguien a una dirección
 * inventada es el peor error posible de una demo, porque se descubre yendo.
 */
import { sucursal } from "@/lib/negocio";
import { consultar } from "@/lib/consulta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return consultar(req, () => sucursal());
}
