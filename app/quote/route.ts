import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const symbol = String(body?.symbol ?? "HEXA");
  const size = Number(body?.size ?? 1);

  // placeholder deterministic quote (so UI can call something real)
  const mid = 1 + (symbol.length * 0.07);
  const spread = 0.0025;
  const bid = +(mid * (1 - spread)).toFixed(6);
  const ask = +(mid * (1 + spread)).toFixed(6);

  return NextResponse.json(
    {
      ok: true,
      symbol,
      size,
      bid,
      ask,
      ts: new Date().toISOString(),
    },
    { status: 200 }
  );
}
