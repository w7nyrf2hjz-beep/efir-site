import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, run } from "@/db";
import { normalizePhone, validateKazakhPhone } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({ phone: z.string().min(10).max(20) });

// Simple in-memory rate limit
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, maxPerWindow: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxPerWindow) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { phone?: string };
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверный формат номера" }, { status: 400 });
    }

    const phone = normalizePhone(parsed.data.phone);
    if (!validateKazakhPhone(phone)) {
      return NextResponse.json({ error: "Введите корректный казахстанский номер (+7XXXXXXXXXX)" }, { status: 400 });
    }

    if (!checkRateLimit(phone, 5, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Слишком много запросов. Подождите 10 минут." }, { status: 429 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Expire old codes
    run("UPDATE sms_codes SET status='expired' WHERE phone=? AND status='pending'", [phone]);
    // Save new code
    run("INSERT INTO sms_codes (phone, code, status, expires_at) VALUES (?, ?, 'pending', ?)", [phone, code, expiresAt]);

    const existingUser = queryOne("SELECT id FROM users WHERE phone=?", [phone]);
    const isNewUser = !existingUser;

    // In dev mode: log to console
    const smsProvider = process.env.SMS_PROVIDER || "dev";
    if (smsProvider === "dev") {
      console.log(`\n🔐 [SMS DEV] Код для ${phone}: ${code}\n`);
    } else {
      // TODO: add Twilio/SMS Aero here
      console.log(`[SMS] Would send ${code} to ${phone}`);
    }

    return NextResponse.json({
      success: true,
      isNewUser,
      message: "Код отправлен",
      ...(smsProvider === "dev" ? { devCode: code } : {}),
    });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
