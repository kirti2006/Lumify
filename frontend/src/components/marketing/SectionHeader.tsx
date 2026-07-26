import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type SectionHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-12 flex flex-col gap-4",
        align === "center" && "mx-auto max-w-3xl items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
          {eyebrow}
        </div>
      )}
      <h2 className="font-serif text-4xl leading-tight tracking-tight text-slate-950 md:text-5xl dark:text-white">
        {title}
      </h2>
      {description && (
        <p className="max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg dark:text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
}
