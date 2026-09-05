import {
  CAMPOS,
  normalizar,
  registrar,
  type Campo,
  type Sesion,
} from "@/lib/sesion";
import { conSesion } from "@/lib/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return conSesion(req, (s: Sesion, cuerpo) => {
    const campo = String(cuerpo.campo ?? "") as Campo;
    if (!CAMPOS.includes(campo)) throw new Error(`campo desconocido: ${campo}`);

    const captura = { ...s.captura };

    // Se preguntó y la persona no lo sabía. Distinto de no haber preguntado, y
    // por eso son dos estados y no uno.
    if (cuerpo.estado === "sin_respuesta") {
      captura[campo] = { ...captura[campo], estado: "sin_respuesta", valor: null };
    } else {
      captura[campo] = registrar(captura[campo], normalizar(campo, cuerpo.valor));
    }

    return { ...s, captura, estado: s.estado === "cerrada" ? s.estado : "en_curso" };
  });
}
