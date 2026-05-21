/**
 * Telegram notifications for ЭФИР restaurant
 * 
 * Setup:
 * 1. Create bot via @BotFather in Telegram -> get TELEGRAM_BOT_TOKEN
 * 2. Write /start to your bot, then get your chat_id from:
 *    https://api.telegram.org/bot<TOKEN>/getUpdates
 * 3. Add to .env.local:
 *    TELEGRAM_BOT_TOKEN=your_token
 *    TELEGRAM_CHAT_ID=your_chat_id
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}

async function sendMessage(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    // Not configured - skip silently (don't break the app)
    if (process.env.NODE_ENV === "development") {
      console.log("[TELEGRAM] Not configured. Message would be:", text.slice(0, 100));
    }
    return;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
        signal: AbortSignal.timeout(5000), // 5 sec timeout
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("[TELEGRAM] Send failed:", err);
    }
  } catch (err) {
    // Never throw - notification failure should not break order creation
    console.error("[TELEGRAM] Error:", err);
  }
}

// ── Notification templates ─────────────────────────────────────────────────

export async function notifyNewOrder(order: {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryType: string;
  deliveryAddress?: string | null;
  paymentMethod: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  comment?: string | null;
}): Promise<void> {
  const paymentLabels: Record<string, string> = {
    cash: "💵 Наличные",
    kaspi_qr: "📱 Kaspi QR",
    kaspi_transfer: "📲 Kaspi перевод",
  };
  const deliveryLabel = order.deliveryType === "pickup" ? "🏪 Самовывоз" : "🚴 Доставка";

  const itemsList = order.items
    .map(i => `  • ${i.name} × ${i.quantity} = ${(i.price * i.quantity).toLocaleString("ru")} ₸`)
    .join("\n");

  const text = [
    "🔔 <b>НОВЫЙ ЗАКАЗ!</b>",
    "",
    `📋 <b>Номер:</b> ${order.orderNumber}`,
    `👤 <b>Клиент:</b> ${order.customerName}`,
    `📞 <b>Телефон:</b> <a href="tel:${order.customerPhone}">${order.customerPhone}</a>`,
    `${deliveryLabel}${order.deliveryAddress ? ": " + order.deliveryAddress : ""}`,
    `${paymentLabels[order.paymentMethod] || order.paymentMethod}`,
    "",
    "<b>Состав заказа:</b>",
    itemsList,
    "",
    `💰 <b>Итого: ${order.total.toLocaleString("ru")} ₸</b>`,
    order.comment ? `\n💬 <i>${order.comment}</i>` : "",
    "",
    "👉 Панель: /admin",
  ]
    .filter(l => l !== null)
    .join("\n");

  await sendMessage(text);
}

export async function notifyOrderStatusChanged(order: {
  orderNumber: string;
  customerPhone: string;
  status: string;
}): Promise<void> {
  const statusMessages: Record<string, string> = {
    confirmed:  "✅ Ваш заказ принят и подтверждён",
    preparing:  "👨‍🍳 Ваш заказ готовится на кухне",
    ready:      "✅ Ваш заказ готов! Ждёт курьера",
    delivering: "🚴 Курьер выехал! Скоро доставим",
    delivered:  "🎉 Заказ доставлен! Приятного аппетита!",
    cancelled:  "❌ Ваш заказ отменён. Свяжитесь с рестораном",
  };

  const msg = statusMessages[order.status];
  if (!msg) return;

  const text = [
    `📦 <b>Обновление заказа ${order.orderNumber}</b>`,
    "",
    msg,
    "",
    `📞 Вопросы: ${process.env.NEXT_PUBLIC_RESTAURANT_PHONE || "+7 700 123 45 67"}`,
  ].join("\n");

  await sendMessage(text);
}
