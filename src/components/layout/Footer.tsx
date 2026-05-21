import Link from "next/link";
import { Phone, MapPin, Clock, Instagram } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="font-unbounded font-bold text-black text-lg">Э</span>
              </div>
              <span className="font-unbounded font-bold text-white text-xl tracking-wider">ЭФИР</span>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Казахская кухня с доставкой на дом. Готовим с любовью из
              натуральных продуктов.
            </p>
            <a
              href="https://instagram.com"
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-amber-400 text-sm transition-colors"
            >
              <Instagram size={16} />
              @efir_restaurant
            </a>
          </div>

          {/* Menu links */}
          <div className="space-y-4">
            <h3 className="text-white font-unbounded font-semibold text-sm">Меню</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/menu", label: "Все блюда" },
                { href: "/menu?category=hot-dishes", label: "Горячие блюда" },
                { href: "/menu?category=soups", label: "Супы" },
                { href: "/menu?category=salads", label: "Салаты" },
                { href: "/menu?category=bakery", label: "Выпечка" },
                { href: "/menu?category=drinks", label: "Напитки" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-zinc-400 hover:text-amber-400 text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div className="space-y-4">
            <h3 className="text-white font-unbounded font-semibold text-sm">Информация</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/profile", label: "Личный кабинет" },
                { href: "/cart", label: "Корзина" },
                { href: "/#delivery", label: "Условия доставки" },
                { href: "/#about", label: "О ресторане" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-zinc-400 hover:text-amber-400 text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div className="space-y-4">
            <h3 className="text-white font-unbounded font-semibold text-sm">Контакты</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+77001234567"
                  className="flex items-start gap-3 text-zinc-400 hover:text-amber-400 text-sm transition-colors group"
                >
                  <Phone size={15} className="mt-0.5 flex-shrink-0 group-hover:text-amber-400" />
                  <span>{process.env.NEXT_PUBLIC_RESTAURANT_PHONE || "+7 700 123 45 67"}</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-zinc-400 text-sm">
                <MapPin size={15} className="mt-0.5 flex-shrink-0 text-zinc-600" />
                <span>{process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS || "г. Казахстан, ул. Примерная, 1"}</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-400 text-sm">
                <Clock size={15} className="mt-0.5 flex-shrink-0 text-zinc-600" />
                <span>{process.env.NEXT_PUBLIC_WORKING_HOURS || "10:00 – 22:00"}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-zinc-800/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-sm">
            © {year} Ресторан «ЭФИР». Все права защищены.
          </p>
          <p className="text-zinc-700 text-xs">Казахстан</p>
        </div>
      </div>
    </footer>
  );
}
