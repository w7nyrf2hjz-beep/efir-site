import { NextResponse } from "next/server";
import { queryOne } from "@/db";

export async function GET() {
  try {
    const r = queryOne<{ result: number }>("SELECT 1 as result");
    return NextResponse.json({ status: "ok", db: r?.result === 1 ? "ok" : "error" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
