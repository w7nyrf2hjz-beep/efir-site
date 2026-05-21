import { NextResponse } from "next/server";
import { query } from "@/db";

export async function GET() {
  try {
    const rows = query<Record<string, unknown>>(
      "SELECT * FROM categories WHERE is_active=1 ORDER BY sort_order ASC"
    );
    const categories = rows.map(r => ({
      id: r.id, name: r.name, nameKz: r.name_kz, slug: r.slug,
      imageUrl: r.image_url, sortOrder: r.sort_order, isActive: r.is_active === 1,
      createdAt: r.created_at,
    }));
    return NextResponse.json({ categories });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
