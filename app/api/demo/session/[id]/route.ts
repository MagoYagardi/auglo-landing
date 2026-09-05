import { NextResponse } from "next/server";
import { leer } from "@/lib/kv";
import { claveSesion, type Sesion } from "@/lib/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sesion = await leer<Sesion>(claveSesion(id));
  if (!sesion)
    return NextResponse.json({ error: "no_existe" }, { status: 404 });

  const inicio = new Date(sesion.iniciadaEn).getTime();
  return NextResponse.json(
    { ...sesion, duracionS: Math.round((Date.now() - inicio) / 1000) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
