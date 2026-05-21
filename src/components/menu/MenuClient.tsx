"use client";
import { useState, useMemo, useCallback } from "react";
import { Search, Plus, Minus, Star, Sparkles, X } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { DishImage } from "@/components/menu/DishImage";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Dish {
  id: number; name: string; nameKz: string | null; price: string;
  imageUrl: string | null; description: string | null; weight: string | null;
  calories: number | null; isNew: boolean; isPopular: boolean;
  isAvailable: boolean; categoryId: number | null;
}
interface Category { id: number; name: string; slug: string; }
interface Props {
  initialDishes: Dish[];
  categories: Category[];
  initialCategory?: string;
  initialSearch?: string;
}

const categoryEmojis: Record<string, string> = {
  "hot-dishes": "🍖", soups: "🍲", salads: "🥗",
  bakery: "🥐", drinks: "🍵", desserts: "🍰", default: "🍽️",
};

export function MenuClient({ initialDishes, categories, initialCategory, initialSearch }: Props) {
  const [search, setSearch] = useState(initialSearch || "");
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory || null);
  const { addItem, items, updateQuantity, removeItem } = useCartStore();

  const getQty = (id: number) => items.find(i => i.id === id)?.quantity ?? 0;

  const handleAdd = useCallback((dish: Dish) => {
    addItem({ id: dish.id, name: dish.name, price: parseFloat(dish.price), imageUrl: dish.imageUrl });
    toast.success(`${dish.name} добавлен`, { duration: 1500 });
  }, [addItem]);

  const handleDec = useCallback((dish: Dish) => {
    const qty = getQty(dish.id);
    if (qty <= 1) removeItem(dish.id);
    else updateQuantity(dish.id, qty - 1);
  }, [items, removeItem, updateQuantity]);

  const filtered = useMemo(() => {
    let result = initialDishes;
    if (activeCategory) {
      const cat = categories.find(c => c.slug === activeCategory);
      if (cat) result = result.filter(d => d.categoryId === cat.id);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [initialDishes, activeCategory, search, categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-amber-500 text-xs font-unbounded uppercase tracking-widest mb-2">Ресторан ЭФИР</p>
        <h1 className="text-3xl md:text-4xl font-unbounded font-bold text-white mb-6">Меню</h1>
        {/* Search */}
        <div className="relative max-w-lg">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск блюд..."
            className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-amber-500/50 text-white placeholder-zinc-500 rounded-xl pl-10 pr-10 py-3 text-sm transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all",
            activeCategory === null
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
              : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
          )}
        >
          Все блюда
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeCategory === cat.slug
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            <span>{categoryEmojis[cat.slug] || categoryEmojis.default}</span>
            {cat.name}
          </button>
        ))}
      </div>

      <p className="text-zinc-500 text-sm mb-6">{filtered.length} блюд</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-white font-semibold text-lg mb-2">Ничего не найдено</h3>
          <p className="text-zinc-500 text-sm">Попробуйте другой запрос или категорию</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(dish => {
            const qty = getQty(dish.id);
            return (
              <div key={dish.id} className="dish-card group bg-zinc-900 border border-zinc-800 hover:border-amber-500/25 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(245,158,11,0.08)] flex flex-col">
                {/* Image with lazy loading */}
                <div className="relative h-48 overflow-hidden">
                  <DishImage src={dish.imageUrl} alt={dish.name} className="dish-image" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 to-transparent pointer-events-none" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {dish.isNew && (
                      <span className="flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        <Sparkles size={8} />Новинка
                      </span>
                    )}
                    {dish.isPopular && (
                      <span className="flex items-center gap-1 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        <Star size={8} fill="currentColor" />Хит
                      </span>
                    )}
                  </div>
                </div>
                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-white text-sm leading-tight mb-1 line-clamp-2">{dish.name}</h3>
                  {dish.description && (
                    <p className="text-zinc-500 text-xs leading-relaxed mb-2 line-clamp-2 flex-1">{dish.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-zinc-600 mb-3">
                    {dish.weight && <span>{dish.weight}</span>}
                    {dish.weight && dish.calories && <span>·</span>}
                    {dish.calories ? <span>{dish.calories} ккал</span> : null}
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-unbounded font-bold text-amber-400 text-base">
                      {formatPrice(parseFloat(dish.price))}
                    </span>
                    {qty > 0 ? (
                      <div className="flex items-center gap-2 bg-zinc-800 rounded-xl p-1">
                        <button onClick={() => handleDec(dish)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-700 text-zinc-300 transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="text-white text-sm font-semibold min-w-[16px] text-center">{qty}</span>
                        <button onClick={() => handleAdd(dish)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleAdd(dish)} className="w-9 h-9 bg-amber-500 hover:bg-amber-400 text-black rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-amber-500/20">
                        <Plus size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
