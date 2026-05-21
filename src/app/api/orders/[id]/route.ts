import { NextRequest, NextResponse } from "next/server";
import { queryOne, run } from "@/db";
import { getAuthFromRequest, getAuthFromCookies } from "@/lib/auth";
import { notifyOrderStatusChanged } from "@/lib/telegram";

const VALID_STATUSES = ["pending","confirmed","preparing","ready","delivering","delivered","cancelled"];

function toOrder(row: Record<string, unknown>) {
  return {
    id: row.id, orderNumber: row.order_number, status: row.status,
    customerName: row.customer_name, customerPhone: row.customer_phone,
    total: row.total, deliveryType: row.delivery_type,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let auth = await getAuthFromRequest(req);
    if (!auth) auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json() as { status?: string };

    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Неверный статус" }, { status: 400 });
    }

    if (body.status === "delivered") {
      run(
        "UPDATE orders SET status=?, delivered_at=datetime('now'), updated_at=datetime('now') WHERE id=?",
        [body.status, id]
      );
    } else {
      run(
        "UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?",
        [body.status, id]
      );
    }

    const row = queryOne<Record<string, unknown>>("SELECT * FROM orders WHERE id=?", [id]);
    if (!row) return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });

    // Notify via Telegram (non-blocking)
    notifyOrderStatusChanged({
      orderNumber: row.order_number as string,
      customerPhone: row.customer_phone as string,
      status: body.status,
    }).catch(console.error);

    return NextResponse.json({ order: toOrder(row) });
  } catch (err) {
    console.error("PATCH /api/orders/[id] error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let auth = await getAuthFromRequest(req);
    if (!auth) auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const row = queryOne<Record<string, unknown>>("SELECT * FROM orders WHERE id=?", [id]);
    if (!row) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

    if (auth.role !== "admin" && Number(row.user_id) !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ order: toOrder(row) });
  } catch (err) {
    console.error("GET /api/orders/[id] error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
