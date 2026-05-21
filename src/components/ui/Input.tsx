import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-zinc-300">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-zinc-900 border rounded-xl px-4 py-3 text-white placeholder-zinc-500",
            "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500",
            "transition-colors duration-200",
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-zinc-700 hover:border-zinc-600",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {hint && !error && <p className="text-sm text-zinc-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
