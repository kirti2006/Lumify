import type { CSSProperties, ReactNode } from "react";
import { cn } from "../lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  glass?: boolean;
};

export function Card({ children, className, style, glass }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-colors dark:border-white/[0.06] dark:bg-white/[0.03]",
        glass &&
          "bg-white/70 backdrop-blur-xl dark:bg-white/[0.04] dark:backdrop-blur-xl",
        className,
      )}
      style={style}
    >
      {children}
    </section>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "outline" | "danger" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({
  children,
  className,
  variant,
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-zinc-950",
        // Sizes
        size === "sm" && "min-h-9 px-3 text-xs",
        size === "md" && "min-h-11 px-5 text-sm",
        size === "lg" && "min-h-12 px-6 text-sm",
        // Variants
        variant === "outline" || variant === "secondary"
          ? "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          : variant === "danger"
            ? "bg-red-500 text-white hover:bg-red-600 shadow-sm"
            : variant === "ghost"
              ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              : "bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md dark:bg-blue-500 dark:hover:bg-blue-400",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
