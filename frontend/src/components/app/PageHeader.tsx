import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-3xl leading-tight tracking-tight text-slate-950 md:text-4xl dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 md:text-base dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
