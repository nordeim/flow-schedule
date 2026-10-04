// GET /api/health — liveness + DB check (used by smoke scripts and the
// verification gate).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  let database: "up" | "down" = "up";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }
  const body = {
    status: database === "up" ? "ok" : "degraded",
    app: "flow-schedule",
    database,
    ts: new Date().toISOString(),
  };
  return NextResponse.json(body, { status: database === "up" ? 200 : 503 });
}
