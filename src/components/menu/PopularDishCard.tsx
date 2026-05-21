"use client";
import Image from "next/image";
import { Plus, Star } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

interface Dish {
  id: number;
  name: string;
  price: string;
  imageUrl: string | null;
  description: string | null;
  weight: string | null;
  isNew: boolean;
  isPopular: boolean;
}

interface Props {
  dish: Dish;
  index: number;
}

export function PopularDishCard({ dish, index }: Props) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    addItem({
      id: dish.id,
      name: dish.name,
      price: parseFloat(dish.price),
      imageUrl: dish.imageUrl,
    });
    toast.success(`${dish.name} добавлен в корзину`);
  };

  return (
    <div
      className="dish-card group relative bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)] animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
    >
      {/* Image */}
      <div className="relative h-48 bg-zinc-800 overflow-hidden">
        {dish.imageUrl ? (
          <Image
            src={dish.imageUrl}
            alt={dish.name}
            fill
            className="dish-image"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🍽️
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {dish.isNew && (
            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Новинка
            </span>
          )}
          {dish.isPopular && (
            <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
              <Star size={8} fill="currentColor" />
              Хит
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white text-sm leading-tight mb-1 line-clamp-2">
          {dish.name}
        </h3>
        {dish.description && (
          <p className="text-zinc-500 text-xs leading-relaxed mb-3 line-clamp-2">
            {dish.description}
          </p>
        )}
        {dish.weight && (
          <p className="text-zinc-600 text-xs mb-3">{dish.weight}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-unbounded font-bold text-amber-400 text-base">
            {formatPrice(parseFloat(dish.price))}
          </span>
          <button
            onClick={handleAdd}
            className="w-9 h-9 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-amber-500/20"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
