import { NextRequest, NextResponse } from "next/server";
import { queryOne, run } from "@/db";
import { getAuthFromRequest, getAuthFromCookies } from "@/lib/auth";
import { invalidateMenuCache } from "@/app/api/dishes/route";

function toDish(r: Record<string, unknown>) {
  return {
    id: r.id, name: r.name, price: r.price,
    isAvailable: r.is_available === 1, isPopular: r.is_popular === 1,
    isNew: r.is_new === 1, imageUrl: r.image_url, categoryId: r.category_id,
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
    const body = await req.json() as Record<string, unknown>;
    const fields: string[] = [];
    const vals: unknown[] = [];

    if (body.isAvailable !== undefined) { fields.push("is_available=?"); vals.push(body.isAvailable ? 1 : 0); }
    if (body.isPopular !== undefined) { fields.push("is_popular=?"); vals.push(body.isPopular ? 1 : 0); }
    if (body.isNew !== undefined) { fields.push("is_new=?"); vals.push(body.isNew ? 1 : 0); }
    if (body.price !== undefined) { fields.push("price=?"); vals.push(Number(body.price)); }
    if (body.name !== undefined) { fields.push("name=?"); vals.push(body.name); }
    if (fields.length === 0) return NextResponse.json({ error: "Нет данных" }, { status: 400 });

    fields.push("updated_at=datetime('now')");
    vals.push(id);
    run(`UPDATE dishes SET ${fields.join(",")} WHERE id=?`, vals);

    // Invalidate menu cache so changes appear immediately
    invalidateMenuCache();

    const row = queryOne<Record<string, unknown>>("SELECT * FROM dishes WHERE id=?", [id]);
    return NextResponse.json({ dish: row ? toDish(row) : null });
  } catch (err) {
    console.error("PATCH /api/dishes/[id] error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
