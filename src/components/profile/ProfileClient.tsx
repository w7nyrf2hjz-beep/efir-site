"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Package, Clock, ChevronRight, RotateCcw, Phone, LogOut,
  AlertCircle
} from "lucide-react";
import {
  formatPrice, formatDate, getOrderStatusLabel, getOrderStatusColor,
  getPaymentMethodLabel
} from "@/lib/utils";
import toast from "react-hot-toast";

interface OrderItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  dishId: number | null;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  total: string;
  deliveryType: string;
  paymentMethod?: string;
  createdAt: string;
  items: OrderItem[];
}

export function ProfileClient() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const addItem = useCartStore((s) => s.addItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "profile">("orders");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) return;
      const data = await res.json() as { orders?: Order[] };
      setOrders(data.orders || []);
    } catch {
      toast.error("Не удалось загрузить заказы");
    } finally {
      setLoading(false);
    }
  };

  const handleRepeatOrder = (order: Order) => {
    clearCart();
    order.items.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        addItem({
          id: item.dishId || item.id,
          name: item.name,
          price: parseFloat(item.price),
          imageUrl: null,
        });
      }
    });
    toast.success("Товары добавлены в корзину");
    router.push("/cart");
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    clearAuth();
    toast.success("Вы вышли из аккаунта");
    router.push("/");
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <p className="text-amber-500 text-xs font-unbounded uppercase tracking-widest mb-1">
          Личный кабинет
        </p>
        <h1 className="font-unbounded font-bold text-2xl md:text-3xl text-white">
          {user?.name || "Профиль"}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-8 w-fit">
        {[
          { id: "orders" as const, label: "Заказы", icon: Package },
          { id: "profile" as const, label: "Профиль", icon: User },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {activeTab === "orders" && (
        <div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-24 rounded-2xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={28} className="text-zinc-600" />
              </div>
              <h3 className="text-white font-semibold mb-2">Нет заказов</h3>
              <p className="text-zinc-400 text-sm mb-6">
                Оформите первый заказ в нашем ресторане
              </p>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Перейти в меню
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-unbounded font-bold text-white text-sm">
                          {order.orderNumber}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getOrderStatusColor(order.status)}`}>
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500 text-xs">
                        <Clock size={11} />
                        {formatDate(order.createdAt)}
                        <span>·</span>
                        <span>{order.deliveryType === "delivery" ? "Доставка" : "Самовывоз"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-unbounded font-bold text-amber-400 text-base">
                        {formatPrice(parseFloat(order.total))}
                      </p>
                      {order.paymentMethod && (
                        <p className="text-zinc-500 text-xs">{getPaymentMethodLabel(order.paymentMethod)}</p>
                      )}
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="text-zinc-400 text-xs mb-4">
                    {order.items.slice(0, 3).map((item, i) => (
                      <span key={item.id}>
                        {item.name} ×{item.quantity}
                        {i < Math.min(order.items.length, 3) - 1 ? ", " : ""}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-zinc-500"> и ещё {order.items.length - 3}</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRepeatOrder(order)}
                    className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-xs font-medium transition-colors"
                  >
                    <RotateCcw size={13} />
                    Повторить заказ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile tab */}
      {activeTab === "profile" && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="font-unbounded font-semibold text-white text-sm mb-5">
              Данные аккаунта
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-zinc-500 text-xs">Имя</label>
                <p className="text-white text-sm mt-1">{user?.name || "Не указано"}</p>
              </div>
              <div>
                <label className="text-zinc-500 text-xs flex items-center gap-1">
                  <Phone size={11} /> Номер телефона
                </label>
                <p className="text-white text-sm mt-1">{user?.phone}</p>
              </div>
              {user?.role === "admin" && (
                <div>
                  <label className="text-zinc-500 text-xs">Роль</label>
                  <p className="text-amber-400 text-sm mt-1 font-medium">Администратор</p>
                </div>
              )}
            </div>
          </div>

          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-colors"
            >
              <div>
                <p className="text-amber-400 font-semibold text-sm">Панель администратора</p>
                <p className="text-zinc-400 text-xs mt-0.5">Управление заказами и меню</p>
              </div>
              <ChevronRight size={18} className="text-amber-400" />
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 border border-zinc-800 hover:border-red-500/30 hover:bg-red-500/5 text-zinc-400 hover:text-red-400 font-medium text-sm py-4 rounded-2xl transition-all"
          >
            <LogOut size={16} />
            Выйти из аккаунта
          </button>
        </div>
      )}
    </div>
  );
}
