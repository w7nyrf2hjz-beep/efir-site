import { query } from "@/db";
import { MenuClient } from "@/components/menu/MenuClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Меню | ЭФИР" };

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

export default async function MenuPage({ searchParams }: PageProps) {
  const params = await searchParams;

  let dishes: Array<{
    id: number; name: string; nameKz: string | null; price: string;
    imageUrl: string | null; description: string | null; weight: string | null;
    calories: number | null; isNew: boolean; isPopular: boolean;
    isAvailable: boolean; categoryId: number | null;
  }> = [];

  let categories: Array<{ id: number; name: string; slug: string }> = [];

  try {
    const dishRows = query<Record<string, unknown>>(
      "SELECT * FROM dishes WHERE is_available=1 ORDER BY sort_order ASC, id ASC"
    );
    dishes = dishRows.map(r => ({
      id: r.id as number,
      name: r.name as string,
      nameKz: r.name_kz as string | null,
      price: String(r.price),
      imageUrl: r.image_url as string | null,
      description: r.description as string | null,
      weight: r.weight as string | null,
      calories: r.calories as number | null,
      isNew: r.is_new === 1,
      isPopular: r.is_popular === 1,
      isAvailable: r.is_available === 1,
      categoryId: r.category_id as number | null,
    }));

    const catRows = query<Record<string, unknown>>(
      "SELECT id, name, slug FROM categories WHERE is_active=1 ORDER BY sort_order ASC"
    );
    categories = catRows.map(r => ({
      id: r.id as number,
      name: r.name as string,
      slug: r.slug as string,
    }));
  } catch (err) {
    console.error("Menu page DB error:", err);
  }

  return (
    <div className="pt-16 min-h-screen">
      <MenuClient
        initialDishes={dishes}
        categories={categories}
        initialCategory={params.category}
        initialSearch={params.search}
      />
    </div>
  );
}
