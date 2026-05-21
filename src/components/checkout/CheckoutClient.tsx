"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatPrice, normalizePhone, validateKazakhPhone } from "@/lib/utils";
import { MapPin, ShoppingBag, CreditCard, Banknote, Smartphone, ChevronRight, Check } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const DELIVERY_FEE = 500;
const FREE_DELIVERY_FROM = 3000;

const schema = z.object({
  customerName: z.string().min(2, "Минимум 2 символа").max(100),
  customerPhone: z.string().refine((v) => validateKazakhPhone(v), {
    message: "Введите корректный казахстанский номер (+7XXXXXXXXXX)",
  }),
  deliveryType: z.enum(["delivery", "pickup"]),
  deliveryAddress: z.string().optional(),
  deliveryApartment: z.string().optional(),
  deliveryEntrance: z.string().optional(),
  deliveryFloor: z.string().optional(),
  comment: z.string().max(500).optional(),
  paymentMethod: z.enum(["cash", "kaspi_qr", "kaspi_transfer"]),
  kaspiPhone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const paymentMethods = [
  { value: "cash" as const, label: "Наличные", icon: Banknote, desc: "Оплата при получении" },
  { value: "kaspi_qr" as const, label: "Kaspi QR", icon: Smartphone, desc: "Сканировать QR-код" },
  { value: "kaspi_transfer" as const, label: "Kaspi перевод", icon: CreditCard, desc: "Перевод на номер" },
];

export function CheckoutClient() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [orderNumber, setOrderNumber] = useState("");

  const subtotal = getTotalPrice();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      deliveryType: "delivery",
      paymentMethod: "cash",
      customerPhone: user?.phone || "",
      customerName: user?.name || "",
    },
  });

  const deliveryType = watch("deliveryType");
  const paymentMethod = watch("paymentMethod");
  const deliveryFee = deliveryType === "pickup" ? 0 : subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  if (items.length === 0 && step === "form") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="font-unbounded font-bold text-xl text-white mb-3">Корзина пуста</h2>
        <Link href="/menu" className="inline-flex items-center gap-2 bg-amber-500 text-black font-semibold px-6 py-3 rounded-xl">
          <ShoppingBag size={16} />
          В меню
        </Link>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={36} className="text-green-400" />
        </div>
        <h2 className="font-unbounded font-bold text-2xl text-white mb-3">Заказ принят!</h2>
        <p className="text-zinc-400 mb-2">Номер вашего заказа</p>
        <p className="font-unbounded font-bold text-amber-400 text-xl mb-6">{orderNumber}</p>
        <p className="text-zinc-400 text-sm mb-8">
          Мы позвоним вам для подтверждения заказа в течение нескольких минут.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/profile"
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Мои заказы
            <ChevronRight size={16} />
          </Link>
          <Link
            href="/menu"
            className="text-zinc-400 hover:text-white text-sm transition-colors py-2"
          >
            Вернуться в меню
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const phone = normalizePhone(data.customerPhone);
      const payload = {
        ...data,
        customerPhone: phone,
        kaspiPhone: data.kaspiPhone ? normalizePhone(data.kaspiPhone) : undefined,
        items: items.map((i) => ({ dishId: i.id, quantity: i.quantity })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json() as { orderNumber?: string; error?: string };

      if (!res.ok) {
        toast.error(json.error || "Ошибка при создании заказа");
        return;
      }

      clearCart();
      setOrderNumber(json.orderNumber || "");
      setStep("success");
    } catch {
      toast.error("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <p className="text-amber-500 text-xs font-unbounded uppercase tracking-widest mb-1">
          Последний шаг
        </p>
        <h1 className="font-unbounded font-bold text-2xl md:text-3xl text-white">
          Оформление заказа
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="font-unbounded font-semibold text-white text-sm mb-5">Контактные данные</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Ваше имя *</label>
                  <input
                    {...register("customerName")}
                    placeholder="Имя"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/50 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm transition-colors"
                  />
                  {errors.customerName && (
                    <p className="text-red-400 text-xs mt-1">{errors.customerName.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-zinc-400 text-xs mb-1.5 block">Номер телефона *</label>
                  <input
                    {...register("customerPhone")}
                    placeholder="+7 700 000 00 00"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/50 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm transition-colors"
                  />
                  {errors.customerPhone && (
                    <p className="text-red-400 text-xs mt-1">{errors.customerPhone.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery type */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="font-unbounded font-semibold text-white text-sm mb-5">Способ получения</h2>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { value: "delivery" as const, label: "Доставка", icon: "🚴" },
                  { value: "pickup" as const, label: "Самовывоз", icon: "🏪" },
                ].map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setValue("deliveryType", opt.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium transition-all ${
                      deliveryType === opt.value
                        ? "border-amber-500 bg-amber-500/10 text-amber-400"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>

              {deliveryType === "delivery" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-zinc-400 text-xs mb-1.5 block flex items-center gap-1">
                      <MapPin size={12} /> Адрес доставки *
                    </label>
                    <input
                      {...register("deliveryAddress")}
                      placeholder="Улица, дом"
                      className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/50 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <input
                        {...register("deliveryApartment")}
                        placeholder="Кв."
                        className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/50 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm transition-colors"
                      />
                    </div>
                    <div>
                      <input
                        {...register("deliveryEntrance")}
                        placeholder="Подъезд"
                        className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/50 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm transition-colors"
                      />
                    </div>
                    <div>
                      <input
                        {...register("deliveryFloor")}
                        placeholder="Этаж"
                        className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/50 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {deliveryType === "pickup" && (
                <div className="bg-zinc-800/50 rounded-xl p-4 text-sm text-zinc-400">
                  <p className="font-medium text-white mb-1">Адрес ресторана</p>
                  <p>{process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS || "г. Казахстан, ул. Примерная, 1"}</p>
                  <p className="text-zinc-500 mt-1">Режим работы: {process.env.NEXT_PUBLIC_WORKING_HOURS || "10:00 – 22:00"}</p>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="font-unbounded font-semibold text-white text-sm mb-5">Способ оплаты</h2>
              <div className="space-y-2">
                {paymentMethods.map((method) => (
                  <button
                    type="button"
                    key={method.value}
                    onClick={() => setValue("paymentMethod", method.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-sm transition-all ${
                      paymentMethod === method.value
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-zinc-700 hover:border-zinc-600"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === method.value ? "bg-amber-500/20" : "bg-zinc-800"
                    }`}>
                      <method.icon size={18} className={paymentMethod === method.value ? "text-amber-400" : "text-zinc-400"} />
                    </div>
                    <div className="text-left">
                      <div className={`font-medium ${paymentMethod === method.value ? "text-amber-400" : "text-white"}`}>
                        {method.label}
                      </div>
                      <div className="text-zinc-500 text-xs">{method.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {paymentMethod === "kaspi_transfer" && (
                <div className="mt-4">
                  <label className="text-zinc-400 text-xs mb-1.5 block">Ваш номер Kaspi</label>
                  <input
                    {...register("kaspiPhone")}
                    placeholder="+7 700 000 00 00"
                    className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/50 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm transition-colors"
                  />
                  <p className="text-zinc-500 text-xs mt-2">
                    После оформления заказа вам придёт реквизиты для перевода
                  </p>
                </div>
              )}
            </div>

            {/* Comment */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="font-unbounded font-semibold text-white text-sm mb-4">Комментарий к заказу</h2>
              <textarea
                {...register("comment")}
                rows={3}
                placeholder="Особые пожелания, аллергии, пожелания по упаковке..."
                className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/50 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm transition-colors resize-none"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-20">
              <h2 className="font-unbounded font-bold text-white text-sm mb-5">Состав заказа</h2>

              <div className="space-y-3 mb-5 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="text-zinc-300 truncate block">{item.name}</span>
                      <span className="text-zinc-500 text-xs">× {item.quantity}</span>
                    </div>
                    <span className="text-white ml-2 flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-800 pt-4 space-y-2 text-sm mb-6">
                <div className="flex justify-between text-zinc-400">
                  <span>Сумма</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Доставка</span>
                  <span className={deliveryFee === 0 ? "text-green-400" : "text-white"}>
                    {deliveryFee === 0 ? "Бесплатно" : formatPrice(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-zinc-800">
                  <span className="text-white">Итого</span>
                  <span className="text-amber-400 font-unbounded text-base">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/25"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    Оформить заказ
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
