import { NextResponse } from "next/server";
import { marcarUnaVez, incrementar, contar, apilar } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Semilla declarada, no un número medido: las 27 personas que ya habían pedido
// entrar antes de que existiera este formulario. El contador de la página es
// esto más los inscriptos reales.
export const SEMILLA = 27;

export async function POST(req: Request) {
  let email = "";
  try {
    email = String(((await req.json()) as { email?: string }).email ?? "")
      .trim()
      .toLowerCase();
  } catch {
    return NextResponse.json({ error: "cuerpo_invalido" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120)
    return NextResponse.json(
      { error: "email_invalido", mensaje: "Ese correo no parece válido." },
      { status: 400 },
    );

  const nuevo = await marcarUnaVez(`demo:waitlist:${email}`, 60 * 60 * 24 * 365);
  if (!nuevo)
    return NextResponse.json({
      count: SEMILLA + (await contar("demo:waitlist:count")),
      yaEstaba: true,
    });

  await apilar("demo:waitlist:emails", { email, ts: new Date().toISOString() }, 5000);
  const total = await incrementar("demo:waitlist:count");
  return NextResponse.json({ count: SEMILLA + total, yaEstaba: false });
}
