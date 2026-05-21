"use client";
import { useCartStore } from "@/store/cart";
import Image from "next/image";
import Link from "next/link";
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const DELIVERY_FEE = 500;
const FREE_DELIVERY_FROM = 3000;
const MIN_ORDER = 1000;

export function CartClient() {
  const { items, addItem, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const subtotal = getTotalPrice();
  const deliveryFee = subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const toFreeDelivery = FREE_DELIVERY_FROM - subtotal;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={36} className="text-zinc-600" />
        </div>
        <h1 className="font-unbounded font-bold text-2xl text-white mb-3">Корзина пуста</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Перейдите в меню и добавьте понравившиеся блюда
        </p>
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <ShoppingBag size={16} />
          Перейти в меню
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-amber-500 text-xs font-unbounded uppercase tracking-widest mb-1">
            Ваш заказ
          </p>
          <h1 className="font-unbounded font-bold text-2xl md:text-3xl text-white">
            Корзина
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-zinc-500 hover:text-red-400 text-sm flex items-center gap-1.5 transition-colors"
        >
          <Trash2 size={14} />
          Очистить
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
            >
              {/* Image */}
              <div className="w-16 h-16 rounded-xl bg-zinc-800 flex-shrink-0 overflow-hidden relative">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-sm font-medium leading-tight mb-1 truncate">
                  {item.name}
                </h3>
                <p className="text-amber-400 text-sm font-unbounded font-semibold">
                  {formatPrice(item.price)}
                </p>
              </div>

              {/* Qty controls */}
              <div className="flex items-center gap-2 bg-zinc-800 rounded-xl p-1 flex-shrink-0">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  {item.quantity === 1 ? <Trash2 size={14} className="text-red-400" /> : <Minus size={14} />}
                </button>
                <span className="text-white text-sm font-semibold min-w-[20px] text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => addItem({ id: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl })}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-400 text-black transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-white text-sm font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-20">
            <h2 className="font-unbounded font-bold text-white text-base mb-6">Итого</h2>

            {/* Free delivery progress */}
            {toFreeDelivery > 0 && (
              <div className="mb-5">
                <div className="flex justify-between text-xs text-zinc-400 mb-2">
                  <span>До бесплатной доставки</span>
                  <span className="text-amber-400 font-medium">{formatPrice(toFreeDelivery)}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((subtotal / FREE_DELIVERY_FROM) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            {toFreeDelivery <= 0 && (
              <div className="mb-5 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5 text-green-400 text-xs text-center">
                🎉 Бесплатная доставка!
              </div>
            )}

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between text-zinc-400">
                <span>Сумма заказа</span>
                <span className="text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Доставка</span>
                <span className={deliveryFee === 0 ? "text-green-400" : "text-white"}>
                  {deliveryFee === 0 ? "Бесплатно" : formatPrice(deliveryFee)}
                </span>
              </div>
              <div className="border-t border-zinc-800 pt-3 flex justify-between font-semibold">
                <span className="text-white">Итого</span>
                <span className="text-amber-400 font-unbounded text-base">{formatPrice(total)}</span>
              </div>
            </div>

            {subtotal < MIN_ORDER ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs text-center mb-4">
                Минимальная сумма заказа — {formatPrice(MIN_ORDER)}
              </div>
            ) : (
              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/25"
              >
                Оформить заказ
                <ArrowRight size={16} />
              </Link>
            )}

            <Link
              href="/menu"
              className="flex items-center justify-center gap-2 w-full mt-3 text-zinc-400 hover:text-amber-400 text-sm py-2 transition-colors"
            >
              Продолжить выбор
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
