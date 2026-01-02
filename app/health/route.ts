import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "hexa-console",
      version: "1.0.0",
      region: "us-east",
      ts: new Date().toISOString(),
    },
    { status: 200 }
  );
}
