import { NextRequest, NextResponse } from "next/server";
import { run } from "@/db";
import { getAuthFromRequest, getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    let auth = await getAuthFromRequest(req);
    if (!auth) auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { orderId } = await params;
    run(
      "UPDATE payments SET status='confirmed', confirmed_at=datetime('now'), updated_at=datetime('now') WHERE order_id=?",
      [orderId]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
