import { NextRequest, NextResponse } from "next/server";
import { queryOne, run } from "@/db";
import { normalizePhone, validateKazakhPhone } from "@/lib/utils";
import { signToken } from "@/lib/jwt";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(10).max(20),
  code: z.string().length(6),
  name: z.string().min(2).max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { phone?: string; code?: string; name?: string };
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }

    const phone = normalizePhone(parsed.data.phone);
    if (!validateKazakhPhone(phone)) {
      return NextResponse.json({ error: "Неверный формат номера" }, { status: 400 });
    }

    const smsCode = queryOne<{
      id: number; code: string; status: string; expires_at: string; attempts: number;
    }>(
      "SELECT * FROM sms_codes WHERE phone=? AND status='pending' ORDER BY created_at DESC LIMIT 1",
      [phone]
    );

    if (!smsCode) {
      return NextResponse.json({ error: "Код не найден. Запросите новый." }, { status: 400 });
    }
    if (new Date(smsCode.expires_at) < new Date()) {
      run("UPDATE sms_codes SET status='expired' WHERE id=?", [smsCode.id]);
      return NextResponse.json({ error: "Код истёк. Запросите новый." }, { status: 400 });
    }
    if (smsCode.attempts >= 5) {
      return NextResponse.json({ error: "Превышено количество попыток." }, { status: 400 });
    }
    if (smsCode.code !== parsed.data.code) {
      run("UPDATE sms_codes SET attempts=attempts+1 WHERE id=?", [smsCode.id]);
      return NextResponse.json({ error: "Неверный код" }, { status: 400 });
    }

    run("UPDATE sms_codes SET status='verified', verified_at=datetime('now') WHERE id=?", [smsCode.id]);

    // Upsert user
    let user = queryOne<{ id: number; phone: string; name: string | null; role: string }>(
      "SELECT * FROM users WHERE phone=?", [phone]
    );

    if (!user) {
      const result = run(
        "INSERT INTO users (phone, name, role) VALUES (?, ?, 'customer')",
        [phone, parsed.data.name || null]
      );
      user = queryOne<{ id: number; phone: string; name: string | null; role: string }>(
        "SELECT * FROM users WHERE id=?", [result.lastInsertRowid]
      )!;
    } else if (parsed.data.name && !user.name) {
      run("UPDATE users SET name=?, updated_at=datetime('now') WHERE id=?", [parsed.data.name, user.id]);
      user.name = parsed.data.name;
    }

    const token = await signToken({
      userId: user.id,
      phone: user.phone,
      role: user.role as "customer" | "admin",
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
      token,
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
