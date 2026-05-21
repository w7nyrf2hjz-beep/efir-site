import { Flame, Leaf, Award } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <p className="text-amber-500 text-xs font-unbounded uppercase tracking-widest mb-4">
              Наша история
            </p>
            <h2 className="text-3xl md:text-4xl font-unbounded font-bold text-white leading-tight mb-6">
              Ресторан и кулинария{" "}
              <span className="text-gradient">«ЭФИР»</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed mb-6">
              Мы создаём блюда по традиционным казахским рецептам, используя
              только свежие продукты от местных поставщиков. Наша кухня — это
              сочетание домашнего тепла и профессионального мастерства.
            </p>
            <p className="text-zinc-400 leading-relaxed mb-10">
              Каждый заказ готовится индивидуально. Мы не используем
              полуфабрикаты — только настоящая еда, с любовью и заботой о
              каждом госте.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              {[
                { icon: Flame, label: "Горячие блюда", desc: "Из печи — к столу" },
                { icon: Leaf, label: "Натуральные продукты", desc: "Без консервантов" },
                { icon: Award, label: "Качество", desc: "Гарантируем" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="text-amber-500" size={18} />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {item.label}
                    </div>
                    <div className="text-zinc-500 text-xs">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — visual */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-500/10 to-zinc-900 border border-zinc-800 p-12 text-center">
              <div className="text-8xl mb-6">🍽️</div>
              <div className="font-unbounded font-bold text-5xl text-gradient mb-2">
                ЭФИР
              </div>
              <div className="text-zinc-400 text-sm">
                Ресторан и кулинария
              </div>
              {/* Decorative circles */}
              <div className="absolute top-4 right-4 w-20 h-20 border border-amber-500/10 rounded-full" />
              <div className="absolute bottom-4 left-4 w-32 h-32 border border-amber-500/5 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
