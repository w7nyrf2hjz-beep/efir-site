import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-zinc-800 text-zinc-300",
    success: "bg-green-500/10 text-green-400",
    warning: "bg-yellow-500/10 text-yellow-400",
    error: "bg-red-500/10 text-red-400",
    info: "bg-blue-500/10 text-blue-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
