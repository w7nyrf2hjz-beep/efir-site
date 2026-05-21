import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 ₸";
  return new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("ru-RU", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) return `+7${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith("7")) return `+${cleaned}`;
  if (cleaned.length === 11 && cleaned.startsWith("8")) return `+7${cleaned.slice(1)}`;
  if (cleaned.startsWith("7") && cleaned.length === 12) return `+${cleaned}`;
  return `+${cleaned}`;
}

export function validateKazakhPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+7[0-9]{10}$/.test(normalized);
}

export function getOrderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Ожидает",
    confirmed: "Принят",
    preparing: "Готовится",
    ready: "Готов",
    delivering: "В пути",
    delivered: "Доставлен",
    cancelled: "Отменён",
  };
  return map[status] || status;
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-400",
    confirmed: "bg-blue-500/10 text-blue-400",
    preparing: "bg-orange-500/10 text-orange-400",
    ready: "bg-purple-500/10 text-purple-400",
    delivering: "bg-cyan-500/10 text-cyan-400",
    delivered: "bg-green-500/10 text-green-400",
    cancelled: "bg-red-500/10 text-red-400",
  };
  return map[status] || "bg-zinc-500/10 text-zinc-400";
}

export function getPaymentMethodLabel(method: string): string {
  const map: Record<string, string> = {
    cash: "Наличные",
    kaspi_qr: "Kaspi QR",
    kaspi_transfer: "Kaspi перевод",
  };
  return map[method] || method;
}

export function getPaymentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Ожидает",
    awaiting_confirmation: "Проверяется",
    confirmed: "Оплачено",
    failed: "Ошибка",
    refunded: "Возврат",
  };
  return map[status] || status;
}
