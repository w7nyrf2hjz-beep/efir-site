import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, run } from "@/db";
import { getAuthFromRequest, getAuthFromCookies } from "@/lib/auth";
import { normalizePhone, validateKazakhPhone } from "@/lib/utils";
import { notifyNewOrder } from "@/lib/telegram";
import { z } from "zod";

const DELIVERY_FEE = 500;
const FREE_DELIVERY_FROM = 3000;

const createSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerPhone: z.string().min(10).max(20),
  deliveryType: z.enum(["delivery", "pickup"]),
  deliveryAddress: z.string().optional(),
  deliveryApartment: z.string().optional(),
  deliveryEntrance: z.string().optional(),
  deliveryFloor: z.string().optional(),
  comment: z.string().max(500).optional(),
  paymentMethod: z.enum(["cash", "kaspi_qr", "kaspi_transfer"]),
  kaspiPhone: z.string().optional(),
  items: z.array(
    z.object({ dishId: z.number(), quantity: z.number().min(1).max(99) })
  ).min(1).max(50),
});

function toOrder(row: Record<string, unknown>) {
  return {
    id: row.id, orderNumber: row.order_number, userId: row.user_id,
    customerName: row.customer_name, customerPhone: row.customer_phone,
    status: row.status, deliveryType: row.delivery_type,
    deliveryAddress: row.delivery_address, comment: row.comment,
    subtotal: row.subtotal, deliveryFee: row.delivery_fee,
    total: row.total, paymentMethod: row.payment_method,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function toOrderItem(row: Record<string, unknown>) {
  return {
    id: row.id, orderId: row.order_id, dishId: row.dish_id,
    name: row.name, price: row.price, quantity: row.quantity, subtotal: row.subtotal,
  };
}

function toPayment(row: Record<string, unknown>) {
  return {
    id: row.id, orderId: row.order_id, method: row.method,
    amount: row.amount, status: row.status, confirmedAt: row.confirmed_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    let auth = await getAuthFromRequest(req);
    if (!auth) auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    let rows: Record<string, unknown>[];
    if (auth.role === "admin") {
      rows = status
        ? query("SELECT * FROM orders WHERE status=? ORDER BY created_at DESC LIMIT 100", [status])
        : query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 100");
    } else {
      rows = query(
        "SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 50",
        [auth.userId]
      );
    }

    const orders = rows.map((row) => {
      const items = query("SELECT * FROM order_items WHERE order_id=?", [row.id]).map(toOrderItem);
      const paymentRow = queryOne<Record<string, unknown>>(
        "SELECT * FROM payments WHERE order_id=?", [row.id]
      );
      return { ...toOrder(row), items, payment: paymentRow ? toPayment(paymentRow) : null };
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Неверные данные заказа", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const phone = normalizePhone(data.customerPhone);
    if (!validateKazakhPhone(phone)) {
      return NextResponse.json({ error: "Неверный формат номера телефона" }, { status: 400 });
    }

    // Validate all dishes exist
    let subtotal = 0;
    const resolvedItems: Array<{ dishId: number; name: string; price: number; quantity: number }> = [];

    for (const item of data.items) {
      const dish = queryOne<{ id: number; name: string; price: number }>(
        "SELECT id, name, price FROM dishes WHERE id=? AND is_available=1",
        [item.dishId]
      );
      if (!dish) {
        return NextResponse.json({ error: `Блюдо #${item.dishId} недоступно` }, { status: 400 });
      }
      subtotal += Number(dish.price) * item.quantity;
      resolvedItems.push({ dishId: dish.id, name: dish.name, price: Number(dish.price), quantity: item.quantity });
    }

    const deliveryFee =
      data.deliveryType === "pickup" || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
    const total = subtotal + deliveryFee;

    // Find or create user
    let user = queryOne<{ id: number }>("SELECT id FROM users WHERE phone=?", [phone]);
    if (!user) {
      const r = run(
        "INSERT INTO users (phone, name, role) VALUES (?, ?, 'customer')",
        [phone, data.customerName]
      );
      user = { id: Number(r.lastInsertRowid) };
    }

    const orderNumber = `EFR-${Date.now().toString().slice(-7)}`;

    const orderResult = run(
      `INSERT INTO orders (order_number,user_id,customer_name,customer_phone,status,
        delivery_type,delivery_address,delivery_apartment,delivery_entrance,delivery_floor,
        comment,subtotal,delivery_fee,total,payment_method,kaspi_phone)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        orderNumber, user.id, data.customerName, phone, "pending", data.deliveryType,
        data.deliveryAddress || null, data.deliveryApartment || null,
        data.deliveryEntrance || null, data.deliveryFloor || null,
        data.comment || null, subtotal, deliveryFee, total,
        data.paymentMethod, data.kaspiPhone ? normalizePhone(data.kaspiPhone) : null,
      ]
    );
    const orderId = Number(orderResult.lastInsertRowid);

    for (const item of resolvedItems) {
      run(
        "INSERT INTO order_items (order_id,dish_id,name,price,quantity,subtotal) VALUES (?,?,?,?,?,?)",
        [orderId, item.dishId, item.name, item.price, item.quantity, item.price * item.quantity]
      );
    }

    const paymentStatus = data.paymentMethod === "cash" ? "pending" : "awaiting_confirmation";
    run(
      "INSERT INTO payments (order_id,method,amount,status) VALUES (?,?,?,?)",
      [orderId, data.paymentMethod, total, paymentStatus]
    );

    // Send Telegram notification (non-blocking)
    notifyNewOrder({
      orderNumber,
      customerName: data.customerName,
      customerPhone: phone,
      deliveryType: data.deliveryType,
      deliveryAddress: data.deliveryAddress || null,
      paymentMethod: data.paymentMethod,
      total,
      items: resolvedItems,
      comment: data.comment || null,
    }).catch(console.error);

    return NextResponse.json({ success: true, orderNumber, orderId }, { status: 201 });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
