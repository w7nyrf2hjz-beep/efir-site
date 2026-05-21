"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import {
  LayoutDashboard, Package, UtensilsCrossed, Users, TrendingUp,
  ChevronRight, Clock, CheckCircle, XCircle, Truck, Eye,
  RefreshCw, AlertTriangle, Plus, Edit2, Trash2, ToggleLeft, ToggleRight
} from "lucide-react";
import {
  formatPrice, formatDateShort, getOrderStatusLabel, getOrderStatusColor,
  getPaymentMethodLabel, getPaymentStatusLabel
} from "@/lib/utils";
import toast from "react-hot-toast";

type Tab = "dashboard" | "orders" | "menu" | "users";
type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "delivered" | "cancelled";

interface StatsData {
  todayOrders: number;
  todayRevenue: number;
  activeOrders: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  total: string;
  deliveryType: string;
  paymentMethod?: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  payment?: { status: string; method: string } | null;
}

interface Dish {
  id: number;
  name: string;
  price: string;
  isAvailable: boolean;
  isPopular: boolean;
  isNew: boolean;
  imageUrl: string | null;
  category?: { name: string } | null;
}

interface AdminUser {
  id: number;
  phone: string;
  name: string | null;
  role: string;
  createdAt: string;
}

const ORDER_STATUSES: { value: OrderStatus; label: string; color: string; emoji: string }[] = [
  { value: "pending",    label: "Ожидает",       color: "text-yellow-400", emoji: "⏳" },
  { value: "confirmed",  label: "Принят",         color: "text-blue-400",   emoji: "✅" },
  { value: "preparing",  label: "Готовится",      color: "text-orange-400", emoji: "👨‍🍳" },
  { value: "ready",      label: "Готов",          color: "text-purple-400", emoji: "🔔" },
  { value: "delivering", label: "Курьер выехал",  color: "text-cyan-400",   emoji: "🚴" },
  { value: "delivered",  label: "Доставлен",      color: "text-green-400",  emoji: "🎉" },
  { value: "cancelled",  label: "Отменён",        color: "text-red-400",    emoji: "❌" },
];

export function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/auth");
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      loadData();
    }
  }, [tab, isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === "dashboard") {
        const res = await fetch("/api/admin/stats");
        const data = await res.json() as StatsData;
        setStats(data);
        const ordRes = await fetch("/api/orders?limit=10");
        const ordData = await ordRes.json() as { orders?: Order[] };
        setOrders(ordData.orders || []);
      } else if (tab === "orders") {
        const q = statusFilter !== "all" ? `?status=${statusFilter}` : "";
        const res = await fetch(`/api/orders${q}`);
        const data = await res.json() as { orders?: Order[] };
        setOrders(data.orders || []);
      } else if (tab === "menu") {
        const res = await fetch("/api/dishes?available=all");
        const data = await res.json() as { dishes?: Dish[] };
        setDishes(data.dishes || []);
      } else if (tab === "users") {
        const res = await fetch("/api/admin/users");
        const data = await res.json() as { users?: AdminUser[] };
        setUsers(data.users || []);
      }
    } catch {
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      toast.success(`Статус изменён: ${getOrderStatusLabel(status)}`);
    } catch {
      toast.error("Ошибка изменения статуса");
    }
  };

  const confirmPayment = async (orderId: number) => {
    try {
      const res = await fetch(`/api/payments/${orderId}/confirm`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      toast.success("Оплата подтверждена");
      loadData();
    } catch {
      toast.error("Ошибка подтверждения оплаты");
    }
  };

  const toggleDishAvailability = async (dish: Dish) => {
    try {
      const res = await fetch(`/api/dishes/${dish.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !dish.isAvailable }),
      });
      if (!res.ok) throw new Error();
      setDishes((prev) =>
        prev.map((d) =>
          d.id === dish.id ? { ...d, isAvailable: !d.isAvailable } : d
        )
      );
      toast.success(dish.isAvailable ? "Блюдо скрыто из меню" : "Блюдо добавлено в меню");
    } catch {
      toast.error("Ошибка обновления");
    }
  };

  if (!isAuthenticated || user?.role !== "admin") return null;

  const navItems = [
    { id: "dashboard" as Tab, label: "Обзор", icon: LayoutDashboard },
    { id: "orders" as Tab, label: "Заказы", icon: Package },
    { id: "menu" as Tab, label: "Меню", icon: UtensilsCrossed },
    { id: "users" as Tab, label: "Клиенты", icon: Users },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-zinc-900 border-r border-zinc-800 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="font-unbounded font-bold text-black text-sm">Э</span>
            </div>
            <div>
              <p className="font-unbounded font-bold text-white text-sm">ЭФИР</p>
              <p className="text-zinc-500 text-[10px]">Администратор</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                tab === item.id
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-zinc-900 border-t border-zinc-800 flex z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-[10px] transition-colors ${
              tab === item.id ? "text-amber-400" : "text-zinc-500"
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="p-4 md:p-8">
          {/* Dashboard */}
          {tab === "dashboard" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h1 className="font-unbounded font-bold text-xl md:text-2xl text-white">Обзор</h1>
                <button onClick={loadData} className="text-zinc-500 hover:text-white transition-colors">
                  <RefreshCw size={16} />
                </button>
              </div>

              {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Заказов сегодня", value: stats.todayOrders, icon: Package, color: "text-blue-400" },
                    { label: "Выручка сегодня", value: formatPrice(stats.todayRevenue || 0), icon: TrendingUp, color: "text-green-400" },
                    { label: "Активных заказов", value: stats.activeOrders, icon: Clock, color: "text-amber-400" },
                    { label: "Всего клиентов", value: stats.totalUsers, icon: Users, color: "text-purple-400" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <stat.icon size={18} className={stat.color} />
                      </div>
                      <p className="font-unbounded font-bold text-xl text-white">{stat.value}</p>
                      <p className="text-zinc-500 text-xs mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Telegram setup banner */}
              {!process.env.NEXT_PUBLIC_TELEGRAM_CONFIGURED && (
                <div className="bg-[#0088cc]/10 border border-[#0088cc]/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">📱</span>
                  <div>
                    <p className="text-white text-sm font-semibold mb-1">Подключите Telegram уведомления</p>
                    <p className="text-zinc-400 text-xs">Получайте уведомления о новых заказах прямо в Telegram. Откройте файл .env.local и добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.</p>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-unbounded font-semibold text-white text-sm">Последние заказы</h2>
                  <button onClick={() => setTab("orders")} className="text-amber-400 text-xs hover:text-amber-300 flex items-center gap-1">
                    Все заказы <ChevronRight size={12} />
                  </button>
                </div>
                <div className="space-y-2">
                  {loading ? (
                    [1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)
                  ) : orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-white text-sm font-medium">{order.orderNumber}</p>
                        <p className="text-zinc-500 text-xs">{order.customerName} · {formatDateShort(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getOrderStatusColor(order.status)}`}>
                          {getOrderStatusLabel(order.status)}
                        </span>
                        <span className="text-amber-400 text-sm font-semibold">{formatPrice(parseFloat(order.total))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Orders */}
          {tab === "orders" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-unbounded font-bold text-xl text-white">Заказы</h1>
                <button onClick={loadData} className="text-zinc-500 hover:text-white transition-colors">
                  <RefreshCw size={16} />
                </button>
              </div>

              {/* Status filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                <button
                  onClick={() => { setStatusFilter("all"); loadData(); }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === "all" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  Все
                </button>
                {ORDER_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { setStatusFilter(s.value); }}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === s.value ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                  <Package size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Нет заказов</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                      {/* Header */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white text-sm font-semibold">{order.orderNumber}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${getOrderStatusColor(order.status)}`}>
                                {getOrderStatusLabel(order.status)}
                              </span>
                            </div>
                            <p className="text-zinc-500 text-xs mt-0.5">
                              {order.customerName} · {order.customerPhone} · {formatDateShort(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-amber-400 font-unbounded font-bold text-sm">
                            {formatPrice(parseFloat(order.total))}
                          </span>
                          <ChevronRight
                            size={16}
                            className={`text-zinc-500 transition-transform ${expandedOrder === order.id ? "rotate-90" : ""}`}
                          />
                        </div>
                      </div>

                      {/* Expanded */}
                      {expandedOrder === order.id && (
                        <div className="border-t border-zinc-800 p-4 space-y-4">
                          {/* Items */}
                          <div>
                            <p className="text-zinc-500 text-xs mb-2">Состав заказа</p>
                            <div className="space-y-1">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span className="text-zinc-300">{item.name} × {item.quantity}</span>
                                  <span className="text-zinc-400">{formatPrice(parseFloat(item.price) * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Delivery + Payment */}
                          <div className="flex gap-6 text-xs text-zinc-400">
                            <div>
                              <p className="text-zinc-600 mb-0.5">Доставка</p>
                              <p className="text-white">{order.deliveryType === "delivery" ? "На адрес" : "Самовывоз"}</p>
                            </div>
                            <div>
                              <p className="text-zinc-600 mb-0.5">Оплата</p>
                              <p className="text-white">{getPaymentMethodLabel(order.paymentMethod || "")}</p>
                            </div>
                            {order.payment && (
                              <div>
                                <p className="text-zinc-600 mb-0.5">Статус оплаты</p>
                                <p className={order.payment.status === "confirmed" ? "text-green-400" : "text-yellow-400"}>
                                  {getPaymentStatusLabel(order.payment.status)}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Status change */}
                          <div>
                            <p className="text-zinc-500 text-xs mb-2">Изменить статус</p>
                            <div className="flex flex-wrap gap-2">
                              {ORDER_STATUSES.map((s) => (
                                <button
                                  key={s.value}
                                  onClick={() => updateOrderStatus(order.id, s.value)}
                                  disabled={order.status === s.value}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    order.status === s.value
                                      ? "bg-amber-500 text-black cursor-default"
                                      : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                                  }`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Confirm payment */}
                          {order.payment && order.payment.status === "awaiting_confirmation" && (
                            <button
                              onClick={() => confirmPayment(order.id)}
                              className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 text-xs font-medium px-4 py-2 rounded-xl transition-colors"
                            >
                              <CheckCircle size={14} />
                              Подтвердить оплату Kaspi
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Menu Management */}
          {tab === "menu" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-unbounded font-bold text-xl text-white">Управление меню</h1>
                <button onClick={loadData} className="text-zinc-500 hover:text-white transition-colors">
                  <RefreshCw size={16} />
                </button>
              </div>
              <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-zinc-400 text-xs">
                  Включайте/выключайте блюда, чтобы управлять их видимостью в меню. Для добавления новых блюд используйте API или Swagger.
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {dishes.map((dish) => (
                    <div
                      key={dish.id}
                      className={`flex items-center gap-3 bg-zinc-900 border rounded-xl p-3 transition-all ${
                        dish.isAvailable ? "border-zinc-800" : "border-zinc-800 opacity-50"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${dish.isAvailable ? "text-white" : "text-zinc-500"}`}>
                            {dish.name}
                          </p>
                          {dish.isPopular && <span className="text-amber-500 text-[10px]">★</span>}
                          {dish.isNew && <span className="text-green-500 text-[10px]">New</span>}
                        </div>
                        <p className="text-zinc-500 text-xs">{formatPrice(parseFloat(dish.price))}</p>
                        {dish.category && <p className="text-zinc-600 text-[10px]">{dish.category.name}</p>}
                      </div>
                      <button
                        onClick={() => toggleDishAvailability(dish)}
                        className={`flex-shrink-0 transition-colors ${dish.isAvailable ? "text-green-400 hover:text-red-400" : "text-zinc-600 hover:text-green-400"}`}
                      >
                        {dish.isAvailable ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users */}
          {tab === "users" && (
            <div>
              <h1 className="font-unbounded font-bold text-xl text-white mb-6">Клиенты</h1>
              {loading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
              ) : (
                <div className="space-y-2">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-white text-sm font-medium">{u.name || "Без имени"}</p>
                        <p className="text-zinc-500 text-xs">{u.phone} · {formatDateShort(u.createdAt)}</p>
                      </div>
                      {u.role === "admin" && (
                        <span className="text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded-full">
                          Админ
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
