import type { Sesion } from "@/lib/sesion";
import { conSesion } from "@/lib/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return conSesion(req, (s: Sesion, cuerpo) => ({
    ...s,
    cita: {
      ref: String(cuerpo.ref ?? `demo-${s.sessionId.slice(-4)}`),
      fecha: cuerpo.fecha ? String(cuerpo.fecha) : null,
      // En la demo la concesionaria está mockeada: la cita es real como dato y
      // ficticia como compromiso. Una tasa que no distingue las dos cosas es un
      // número que después nadie puede defender.
      ejecutable: false as const,
    },
  }));
}
