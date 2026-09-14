/**
 * `buscar_respuesta` — las preguntas que aparecen en toda demo.
 *
 * "¿De dónde sacaron mi número?" es la primera que hace cualquiera que atiende
 * una llamada que no esperaba, y contestarla mal —o inventarla— es perder a la
 * persona en el segundo turno.
 */
import { faq } from "@/lib/negocio";
import { consultar } from "@/lib/consulta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return consultar(req, (c) => faq(String(c.pregunta ?? "")));
}
