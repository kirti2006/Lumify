import type { ComponentType } from "react";
import { Card } from "../ui";
import { cn } from "../../lib/utils";

type MetricCardProps = {
  icon: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  value: string;
  label: string;
  delta?: string;
  color?: string;
  iconBg?: string;
};

export function MetricCard({
  icon: Icon,
  value,
  label,
  delta,
  color = "text-blue-600 dark:text-blue-400",
  iconBg = "bg-blue-50 dark:bg-blue-500/10",
}: MetricCardProps) {
  return (
    <Card className="flex items-start gap-4 p-5">
      <div
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl",
          iconBg,
        )}
      >
        <Icon size={20} className={color} aria-hidden />
      </div>
      <div>
        <b className="block text-3xl font-bold leading-none tracking-tight text-slate-950 dark:text-white">
          {value}
        </b>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{label}</p>
        {delta && (
          <small className="mt-1 block text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {delta}
          </small>
        )}
      </div>
    </Card>
  );
}
