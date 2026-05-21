import { NextRequest, NextResponse } from "next/server";
import { query } from "@/db";

// In-memory cache for menu (resets on server restart - fine for local use)
interface CacheEntry { data: unknown; at: number; }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 1000; // 60 seconds

function getCached(key: string) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.at > CACHE_TTL) { cache.delete(key); return null; }
  return e.data;
}
function setCache(key: string, data: unknown) {
  cache.set(key, { data, at: Date.now() });
}
export function invalidateMenuCache() {
  cache.clear();
}

function toDish(r: Record<string, unknown>) {
  return {
    id: r.id, name: r.name, nameKz: r.name_kz, description: r.description,
    price: r.price, imageUrl: r.image_url, weight: r.weight, calories: r.calories,
    isAvailable: r.is_available === 1, isPopular: r.is_popular === 1,
    isNew: r.is_new === 1, categoryId: r.category_id, sortOrder: r.sort_order,
    category: r.category_name ? { name: r.category_name, slug: r.category_slug } : null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category");
    const popular = searchParams.get("popular");
    const available = searchParams.get("available");
    const search = searchParams.get("search");

    // Only cache simple, parameterless requests
    const cacheKey = available === "all" ? null : `dishes:${categorySlug || ""}:${popular || ""}`;
    if (cacheKey && !search) {
      const cached = getCached(cacheKey);
      if (cached) {
        return NextResponse.json({ dishes: cached, cached: true });
      }
    }

    let sql = `SELECT d.*, c.name as category_name, c.slug as category_slug
               FROM dishes d LEFT JOIN categories c ON d.category_id=c.id WHERE 1=1`;
    const params: unknown[] = [];

    if (available !== "all") { sql += " AND d.is_available=1"; }
    if (popular === "true") { sql += " AND d.is_popular=1"; }
    if (categorySlug) { sql += " AND c.slug=?"; params.push(categorySlug); }
    if (search) {
      sql += " AND (d.name LIKE ? OR d.description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY d.sort_order ASC, d.id ASC";

    const rows = query<Record<string, unknown>>(sql, params);
    const dishes = rows.map(toDish);

    if (cacheKey && !search) setCache(cacheKey, dishes);

    return NextResponse.json({ dishes });
  } catch (err) {
    console.error("GET /api/dishes error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
