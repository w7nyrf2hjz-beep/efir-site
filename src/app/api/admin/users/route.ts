import { NextRequest, NextResponse } from "next/server";
import { query } from "@/db";
import { getAuthFromRequest, getAuthFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    let auth = await getAuthFromRequest(req);
    if (!auth) auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const rows = query<Record<string, unknown>>(
      "SELECT id, phone, name, role, created_at FROM users ORDER BY created_at DESC LIMIT 200"
    );
    const users = rows.map(r => ({
      id: r.id, phone: r.phone, name: r.name, role: r.role, createdAt: r.created_at,
    }));
    return NextResponse.json({ users });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
