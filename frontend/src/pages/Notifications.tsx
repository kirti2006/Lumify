import { CalendarPlus, FileText, Trophy } from "lucide-react";
import { Card } from "../components/ui";
import { Workspace } from "../components/layout/Workspace";
import { PageHeader } from "../components/app/PageHeader";

export function Notifications() {
  return (
    <Workspace title="Notifications">
      <PageHeader title="Updates." description="Alerts about your sessions, feedback reports, and progress." />
      <Card className="max-w-3xl overflow-hidden p-0">
        {[
          {
            text: "Your practice session is ready.",
            time: "Just now",
            icon: CalendarPlus,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-blue-500/10",
          },
          {
            text: "Your feedback report for Product Sense is available.",
            time: "2 hours ago",
            icon: FileText,
            color: "text-violet-600 dark:text-violet-400",
            bg: "bg-violet-50 dark:bg-violet-500/10",
          },
          {
            text: "You improved your average score by 6% this month.",
            time: "Yesterday",
            icon: Trophy,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
          },
        ].map((item, i) => (
          <div
            className="flex gap-4 border-b border-slate-200/60 p-5 transition-colors hover:bg-slate-50 last:border-0 dark:border-white/[0.06] dark:hover:bg-white/[0.03]"
            key={item.text}
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${item.bg}`}>
              <item.icon size={20} className={item.color} />
            </span>
            <div>
              <b className="text-sm font-semibold text-slate-950 dark:text-white">{item.text}</b>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.time}</p>
            </div>
            {i === 0 && (
              <span className="ml-auto size-2 shrink-0 self-center rounded-full bg-blue-500" />
            )}
          </div>
        ))}
      </Card>
    </Workspace>
  );
}
