import { NextRequest, NextResponse } from "next/server";
import { queryOne, run } from "@/db";
import { getAuthFromRequest, getAuthFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    let auth = await getAuthFromRequest(req);
    if (!auth) auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orderId = new URL(req.url).searchParams.get("orderId");
    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const payment = queryOne("SELECT * FROM payments WHERE order_id=?", [orderId]);
    const kaspiPhone = process.env.NEXT_PUBLIC_KASPI_PHONE || "+77001234567";

    return NextResponse.json({
      payment,
      kaspiPhone,
      instructions: `Переведите сумму на номер ${kaspiPhone} через Kaspi и сообщите номер заказа`,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
