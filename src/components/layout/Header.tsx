"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, User, Menu, X, Phone, LogOut } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartItems = useCartStore((s) => s.getTotalItems());
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    clearAuth();
    toast.success("Вы вышли из аккаунта");
    router.push("/");
  };

  const navLinks = [
    { href: "/menu", label: "Меню" },
    { href: "/#about", label: "О нас" },
    { href: "/#delivery", label: "Доставка" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 shadow-xl shadow-black/20"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="font-unbounded font-bold text-black text-base leading-none">
                Э
              </span>
            </div>
            <span className="font-unbounded font-bold text-white text-lg tracking-wider">
              ЭФИР
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-amber-400"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Phone */}
            <a
              href={`tel:${process.env.NEXT_PUBLIC_RESTAURANT_PHONE || "+77001234567"}`}
              className="hidden lg:flex items-center gap-1.5 text-zinc-400 hover:text-amber-500 text-sm transition-colors"
            >
              <Phone size={14} />
              <span>{process.env.NEXT_PUBLIC_RESTAURANT_PHONE || "+7 700 123 45 67"}</span>
            </a>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <ShoppingCart size={20} className="text-zinc-300" />
              {cartItems > 0 && (
                <span className="cart-badge absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartItems > 9 ? "9+" : cartItems}
                </span>
              )}
            </Link>

            {/* Profile */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm transition-colors"
                >
                  <User size={16} />
                  <span className="max-w-[100px] truncate">
                    {user?.name || "Профиль"}
                  </span>
                </Link>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-xs text-amber-500 hover:text-amber-400 px-2 py-1 rounded-lg hover:bg-amber-500/10 transition-colors"
                  >
                    Админ
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="hidden md:flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
              >
                <User size={15} />
                Войти
              </Link>
            )}

            {/* Mobile burger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950 border-t border-zinc-800 py-4 px-4 animate-fade-in">
          <nav className="flex flex-col gap-1 mb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 px-4 text-zinc-300 hover:text-amber-400 hover:bg-zinc-900 rounded-xl text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-zinc-800 pt-4 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 py-3 px-4 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl text-sm"
                >
                  <User size={16} />
                  {user?.name || "Профиль"}
                </Link>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 py-3 px-4 text-amber-400 hover:bg-amber-500/10 rounded-xl text-sm"
                  >
                    Панель администратора
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 py-3 px-4 text-red-400 hover:bg-red-500/10 rounded-xl text-sm"
                >
                  <LogOut size={16} />
                  Выйти
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm py-3 px-4 rounded-xl transition-colors"
              >
                <User size={16} />
                Войти / Зарегистрироваться
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
