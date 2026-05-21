import { NextRequest, NextResponse } from "next/server";
import { queryOne, query } from "@/db";
import { getAuthFromRequest, getAuthFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    let auth = await getAuthFromRequest(req);
    if (!auth) auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const today = new Date().toISOString().slice(0, 10);

    const todayStats = queryOne<{ count: number; revenue: number }>(
      `SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue
       FROM orders WHERE DATE(created_at)=?`,
      [today]
    );

    const activeOrders = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM orders WHERE status IN ('pending','confirmed','preparing','ready','delivering')`
    );

    const totalStats = queryOne<{ count: number; revenue: number }>(
      `SELECT COUNT(*) as count, COALESCE(SUM(total),0) as revenue FROM orders`
    );

    const totalUsers = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM users`
    );

    return NextResponse.json({
      todayOrders: todayStats?.count || 0,
      todayRevenue: todayStats?.revenue || 0,
      activeOrders: activeOrders?.count || 0,
      totalOrders: totalStats?.count || 0,
      totalRevenue: totalStats?.revenue || 0,
      totalUsers: totalUsers?.count || 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
