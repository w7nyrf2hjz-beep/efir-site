import Link from "next/link";

interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
}

const categoryEmojis: Record<string, string> = {
  "hot-dishes": "🍖",
  soups: "🍲",
  salads: "🥗",
  bakery: "🥐",
  drinks: "🍵",
  desserts: "🍰",
  snacks: "🥙",
  sauces: "🫙",
  default: "🍽️",
};

export function CategoryCard({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  const emoji = categoryEmojis[category.slug] || categoryEmojis.default;

  return (
    <Link
      href={`/menu?category=${category.slug}`}
      className="group flex flex-col items-center p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-800/50 transition-all duration-300 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
    >
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
        {emoji}
      </div>
      <span className="text-zinc-300 group-hover:text-amber-400 text-xs font-medium text-center leading-tight transition-colors">
        {category.name}
      </span>
    </Link>
  );
}
