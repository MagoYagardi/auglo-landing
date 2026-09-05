import type { EstadoSesion, Sesion } from "@/lib/sesion";
import { conSesion } from "@/lib/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALIDOS: EstadoSesion[] = [
  "discando",
  "sonando",
  "atendida",
  "en_curso",
  "cerrada",
  "no_atendida",
  "error",
];

export async function POST(req: Request) {
  return conSesion(req, (s: Sesion, cuerpo) => {
    const estado = String(cuerpo.estado ?? "") as EstadoSesion;
    if (!VALIDOS.includes(estado)) throw new Error(`estado inválido: ${estado}`);
    return { ...s, estado };
  });
}
