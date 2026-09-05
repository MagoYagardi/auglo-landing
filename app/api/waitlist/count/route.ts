import { NextResponse } from "next/server";
import { contar } from "@/lib/kv";
import { SEMILLA } from "../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { count: SEMILLA + (await contar("demo:waitlist:count")) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
