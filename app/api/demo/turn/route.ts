import type { Sesion, Turno } from "@/lib/sesion";
import { conSesion } from "@/lib/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return conSesion(req, (s: Sesion, cuerpo) => {
    const turno: Turno = {
      rol: cuerpo.rol === "persona" ? "persona" : "agente",
      texto: String(cuerpo.texto ?? "").slice(0, 400),
      ts: Number(cuerpo.ts ?? 0),
    };
    if (!turno.texto) return s;
    // Sólo lo que entra en pantalla. El transcript completo llega en el cierre.
    return {
      ...s,
      estado: s.estado === "cerrada" ? s.estado : "en_curso",
      transcript: [...s.transcript, turno].slice(-14),
    };
  });
}
