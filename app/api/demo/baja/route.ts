import type { Sesion } from "@/lib/sesion";
import { conSesion } from "@/lib/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// `dnc_inmediato_al_pedido`. No se negocia, no se repregunta: se registra y el
// agente corta en el turno siguiente.
export async function POST(req: Request) {
  return conSesion(req, (s: Sesion) => ({
    ...s,
    baja: true,
    outcome: "baja_solicitada",
  }));
}
