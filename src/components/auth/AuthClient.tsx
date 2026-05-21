"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { normalizePhone, validateKazakhPhone } from "@/lib/utils";
import { Phone, ArrowRight, ChevronLeft, Shield } from "lucide-react";
import toast from "react-hot-toast";

type Step = "phone" | "code" | "name";

export function AuthClient() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleSendOtp = async () => {
    const normalized = normalizePhone(phone);
    if (!validateKazakhPhone(normalized)) {
      toast.error("Введите корректный номер (+7XXXXXXXXXX)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json() as { isNewUser?: boolean; error?: string; devCode?: string };
      if (!res.ok) {
        toast.error(data.error || "Ошибка отправки");
        return;
      }
      setIsNewUser(!!data.isNewUser);
      setStep("code");
      setCountdown(60);
      toast.success("Код отправлен на ваш номер");
      if (data.devCode) {
        toast(`DEV: код ${data.devCode}`, { icon: "🔧", duration: 10000 });
      }
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
    if (newCode.every((c) => c !== "") && newCode.join("").length === 6) {
      handleVerify(newCode.join(""));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeStr?: string) => {
    const fullCode = codeStr || code.join("");
    if (fullCode.length !== 6) {
      toast.error("Введите 6-значный код");
      return;
    }
    setLoading(true);
    try {
      const normalized = normalizePhone(phone);
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized, code: fullCode, name: isNewUser ? name : undefined }),
      });
      const data = await res.json() as {
        user?: { id: number; phone: string; name: string | null; role: "customer" | "admin" };
        token?: string;
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error || "Неверный код");
        setCode(["", "", "", "", "", ""]);
        codeRefs.current[0]?.focus();
        return;
      }
      if (isNewUser && !name && data.user) {
        setStep("name");
        return;
      }
      if (data.user && data.token) {
        setAuth(data.user, data.token);
        toast.success("Добро пожаловать!");
        router.push("/");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Введите ваше имя");
      return;
    }
    setLoading(true);
    try {
      const normalized = normalizePhone(phone);
      const fullCode = code.join("");
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized, code: fullCode, name }),
      });
      const data = await res.json() as {
        user?: { id: number; phone: string; name: string | null; role: "customer" | "admin" };
        token?: string;
        error?: string;
      };
      if (!res.ok) {
        toast.error(data.error || "Ошибка");
        return;
      }
      if (data.user && data.token) {
        setAuth(data.user, data.token);
        toast.success("Добро пожаловать в ЭФИР!");
        router.push("/");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <span className="font-unbounded font-bold text-black text-lg">Э</span>
          </div>
          <span className="font-unbounded font-bold text-white text-xl">ЭФИР</span>
        </div>

        {/* Step: Phone */}
        {step === "phone" && (
          <div className="animate-fade-in">
            <h1 className="font-unbounded font-bold text-white text-2xl mb-2">Войти</h1>
            <p className="text-zinc-400 text-sm mb-8">
              Введите ваш номер телефона — мы отправим код подтверждения
            </p>
            <div className="mb-5">
              <label className="text-zinc-400 text-xs mb-2 block">Номер телефона</label>
              <div className="relative">
                <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  placeholder="+7 700 000 00 00"
                  className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/50 text-white placeholder-zinc-500 rounded-xl pl-10 pr-4 py-3.5 text-sm transition-colors"
                  autoFocus
                />
              </div>
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold py-3.5 rounded-xl transition-colors"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  Получить код
                  <ArrowRight size={16} />
                </>
              )}
            </button>
            <p className="text-zinc-600 text-xs text-center mt-5">
              Авторизуясь, вы соглашаетесь с условиями использования
            </p>
          </div>
        )}

        {/* Step: Code */}
        {step === "code" && (
          <div className="animate-fade-in">
            <button
              onClick={() => { setStep("phone"); setCode(["", "", "", "", "", ""]); }}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm mb-6 transition-colors"
            >
              <ChevronLeft size={16} />
              Назад
            </button>
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-5">
              <Shield size={22} className="text-amber-400" />
            </div>
            <h2 className="font-unbounded font-bold text-white text-xl mb-2">
              Код подтверждения
            </h2>
            <p className="text-zinc-400 text-sm mb-8">
              Отправили SMS на{" "}
              <span className="text-white">{normalizePhone(phone)}</span>
            </p>

            {/* OTP Input */}
            <div className="flex gap-2 mb-6">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { codeRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className="w-full aspect-square bg-zinc-800 border border-zinc-700 focus:border-amber-500 text-white text-center text-xl font-bold rounded-xl transition-colors"
                />
              ))}
            </div>

            <button
              onClick={() => handleVerify()}
              disabled={loading || code.some((c) => !c)}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold py-3.5 rounded-xl transition-colors mb-4"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : "Подтвердить"}
            </button>

            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-zinc-500 text-sm">
                  Повторная отправка через <span className="text-amber-400">{countdown}с</span>
                </p>
              ) : (
                <button
                  onClick={() => { handleSendOtp(); setCode(["", "", "", "", "", ""]); }}
                  className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
                >
                  Отправить код повторно
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step: Name (new users) */}
        {step === "name" && (
          <div className="animate-fade-in">
            <h2 className="font-unbounded font-bold text-white text-xl mb-2">
              Как вас зовут?
            </h2>
            <p className="text-zinc-400 text-sm mb-8">
              Представьтесь, чтобы нам было удобнее общаться
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              placeholder="Ваше имя"
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-amber-500/50 text-white placeholder-zinc-500 rounded-xl px-4 py-3.5 text-sm transition-colors mb-5"
              autoFocus
            />
            <button
              onClick={handleSaveName}
              disabled={loading || !name.trim()}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold py-3.5 rounded-xl transition-colors"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : "Войти в ЭФИР"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
