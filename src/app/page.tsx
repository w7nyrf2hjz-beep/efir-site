import Link from "next/link";
import { query } from "@/db";
import { HeroSection } from "@/components/sections/HeroSection";
import { PopularDishCard } from "@/components/menu/PopularDishCard";
import { CategoryCard } from "@/components/menu/CategoryCard";
import { DeliverySection } from "@/components/sections/DeliverySection";
import { AboutSection } from "@/components/sections/AboutSection";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  let popularDishes: Array<{
    id: number; name: string; price: string; imageUrl: string | null;
    description: string | null; weight: string | null; isNew: boolean; isPopular: boolean;
  }> = [];

  let cats: Array<{ id: number; name: string; slug: string; imageUrl: string | null }> = [];

  try {
    const dishRows = query<Record<string, unknown>>(
      "SELECT * FROM dishes WHERE is_popular=1 AND is_available=1 ORDER BY sort_order ASC LIMIT 8"
    );
    popularDishes = dishRows.map(r => ({
      id: r.id as number,
      name: r.name as string,
      price: String(r.price),
      imageUrl: r.image_url as string | null,
      description: r.description as string | null,
      weight: r.weight as string | null,
      isNew: r.is_new === 1,
      isPopular: r.is_popular === 1,
    }));

    const catRows = query<Record<string, unknown>>(
      "SELECT id, name, slug, image_url FROM categories WHERE is_active=1 ORDER BY sort_order ASC"
    );
    cats = catRows.map(r => ({
      id: r.id as number,
      name: r.name as string,
      slug: r.slug as string,
      imageUrl: r.image_url as string | null,
    }));
  } catch (err) {
    console.error("Home page DB error:", err);
  }

  return (
    <div className="page-enter">
      <HeroSection />

      {cats.length > 0 && (
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-amber-500 text-xs font-unbounded uppercase tracking-widest mb-2">Разделы меню</p>
              <h2 className="text-2xl md:text-3xl font-unbounded font-bold text-white">Что приготовить?</h2>
            </div>
            <Link href="/menu" className="flex items-center gap-1.5 text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors group">
              Всё меню <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {cats.map((cat, i) => <CategoryCard key={cat.id} category={cat} index={i} />)}
          </div>
        </section>
      )}

      {popularDishes.length > 0 && (
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-amber-500 text-xs font-unbounded uppercase tracking-widest mb-2">Хиты продаж</p>
              <h2 className="text-2xl md:text-3xl font-unbounded font-bold text-white">Популярные блюда</h2>
            </div>
            <Link href="/menu" className="flex items-center gap-1.5 text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors group">
              Смотреть все <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {popularDishes.map((dish, i) => (
              <PopularDishCard key={dish.id} dish={dish} index={i} />
            ))}
          </div>
        </section>
      )}

      {popularDishes.length === 0 && cats.length === 0 && (
        <section className="py-24 px-4 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🍽️</span>
            </div>
            <h2 className="text-2xl font-unbounded font-bold mb-4 text-white">Добро пожаловать в ЭФИР!</h2>
            <p className="text-zinc-400 mb-8">Меню загружается. Если страница пустая — перезапустите сайт.</p>
            <Link href="/menu" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors">
              Перейти в меню <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      <DeliverySection />
      <AboutSection />
    </div>
  );
}
