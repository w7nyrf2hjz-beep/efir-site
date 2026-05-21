import { Clock, MapPin, Banknote, Smartphone } from "lucide-react";

export function DeliverySection() {
  const features = [
    {
      icon: Clock,
      title: "30–60 минут",
      desc: "Среднее время доставки по городу",
    },
    {
      icon: MapPin,
      title: "Зона доставки",
      desc: "Весь город и ближайшие районы",
    },
    {
      icon: Banknote,
      title: "500 ₸ доставка",
      desc: "Бесплатно при заказе от 3 000 ₸",
    },
    {
      icon: Smartphone,
      title: "Kaspi оплата",
      desc: "Kaspi QR, перевод или наличные",
    },
  ];

  return (
    <section id="delivery" className="py-24 px-4 bg-zinc-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-amber-500 text-xs font-unbounded uppercase tracking-widest mb-3">
            Условия
          </p>
          <h2 className="text-2xl md:text-3xl font-unbounded font-bold text-white">
            Быстрая доставка
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-6 flex flex-col items-center text-center group hover:border-amber-500/30 transition-all duration-300"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="w-14 h-14 bg-amber-500/10 group-hover:bg-amber-500/20 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                <f.icon className="text-amber-500" size={24} />
              </div>
              <h3 className="font-unbounded font-bold text-white text-base mb-2">
                {f.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
