import { NextRequest, NextResponse } from "next/server";
import { query, run } from "@/db";
import { getAuthFromRequest, getAuthFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    let auth = await getAuthFromRequest(req);
    if (!auth) auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Addresses stored in orders history for simplicity
    const addrs = query(
      "SELECT DISTINCT delivery_address, delivery_apartment, delivery_entrance, delivery_floor FROM orders WHERE user_id=? AND delivery_address IS NOT NULL ORDER BY created_at DESC LIMIT 5",
      [auth.userId]
    );
    return NextResponse.json({ addresses: addrs });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
