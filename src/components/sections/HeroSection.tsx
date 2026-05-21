"use client";
import Link from "next/link";
import { ShoppingBag, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-zinc-950">
        {/* Gradient mesh */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/3 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,158,11,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-8"
        >
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-amber-400 text-xs font-unbounded uppercase tracking-widest">
            Доставка за 30–60 минут
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-unbounded font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.0] mb-6"
        >
          <span className="text-white">Ресторан</span>
          <br />
          <span className="text-gradient">ЭФИР</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Казахская кухня, приготовленная с душой. Свежие ингредиенты,
          традиционные рецепты, быстрая доставка прямо к вашей двери.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/menu"
            className="group flex items-center gap-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-unbounded font-semibold text-sm px-8 py-4 rounded-2xl transition-all duration-200 hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] w-full sm:w-auto justify-center"
          >
            <ShoppingBag size={18} />
            Заказать сейчас
          </Link>
          <Link
            href="/#about"
            className="flex items-center gap-2 border border-zinc-700 hover:border-amber-500/50 text-zinc-300 hover:text-amber-400 font-medium text-sm px-8 py-4 rounded-2xl transition-all duration-200 w-full sm:w-auto justify-center"
          >
            О ресторане
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex items-center justify-center gap-10 mt-20 pt-12 border-t border-zinc-800/50"
        >
          {[
            { value: "50+", label: "Блюд в меню" },
            { value: "30–60", label: "Минут доставки" },
            { value: "500₸", label: "Стоимость доставки" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-unbounded font-bold text-2xl text-white mb-1">
                {stat.value}
              </div>
              <div className="text-zinc-500 text-xs">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600"
      >
        <span className="text-xs uppercase tracking-widest">Прокрутите</span>
        <ChevronDown size={16} className="animate-bounce" />
      </motion.div>
    </section>
  );
}
