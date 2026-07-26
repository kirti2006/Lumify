import { useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../components/ui";
import { Workspace } from "../components/layout/Workspace";
import { PageHeader } from "../components/app/PageHeader";
import { getCached } from "../lib/api";
import { Activity, Clock, Target, Award } from "lucide-react";

export function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("6m");

  useEffect(() => {
    getCached("/analytics/dashboard")
      .then(res => {
        setData(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Workspace title="Analytics">
        <div className="p-8 text-center text-slate-400">Loading analytics...</div>
      </Workspace>
    );
  }

  const trend = data?.scoreHistory || [];
  const mix = data?.topicPerformance?.map((t: any) => ({ name: t.topic || "General", value: Number(t.averageScore) || 0 })) || [];
  const skills = data?.topicPerformance?.map((t: any) => ({ skill: t.topic || "General", score: Number(t.averageScore) || 0 })) || [];
  const pieColors = ["#3b82f6", "#10b981", "#f59e0b", "#64748b", "#8b5cf6"];

  const formatTimeS = (seconds: number) => {
    if (!seconds) return "0h 0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const metrics = [
    { label: "Interviews completed", value: data?.totalInterviews || 0, icon: Activity, change: `Total sessions` },
    { label: "Average score", value: data?.averageScore ? Math.round(data.averageScore) : 0, icon: Award, change: "Based on overall performance" },
    { label: "Time practiced", value: formatTimeS(data?.totalPracticeTimeS || 0), icon: Clock, change: "Total time spent" },
    { label: "Top skill", value: data?.strongestTopic || "None yet", icon: Target, change: "Strongest performing area" },
  ];

  return (
    <Workspace title="Analytics">
      <PageHeader
        title="Growth you can see."
        description={
          <>
            Your progress across every interview.
            {(!data || data.totalInterviews === 0) && (
              <span className="mt-1 block font-medium text-blue-500 dark:text-blue-400">
                Complete an interview to see your personalized analytics!
              </span>
            )}
          </>
        }
        action={
          <div className="flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-zinc-900">
            {["7d", "30d", "6m", "1y"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${timeframe === t ? "bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />
      
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((m, i) => (
          <Card key={i} className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{m.label}</span>
              <span className="grid size-8 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <m.icon size={16} />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{m.value}</div>
              <div className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">{m.change}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="analytics-grid">
        <Card className="chart-card wide p-5 flex flex-col">
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">Score progression</h3>
          <div className="mt-4 flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} tickMargin={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} tickMargin={10} />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5 flex flex-col">
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">Interview mix</h3>
          <div className="mt-4 flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mix} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={4}>
                  {pieColors.map((c, i) => (
                    <Cell key={i} fill={c} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
            {mix.map((m: any, i: number) => (
              <div key={m.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: pieColors[i % 5] }} /> 
                <span className="truncate">{m.name}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 flex flex-col">
          <h3 className="text-base font-semibold text-slate-950 dark:text-white">Skill development</h3>
          <div className="mt-6 flex flex-col gap-6">
            {skills.map((s: any) => (
              <div className="flex flex-col gap-2" key={s.skill}>
                <div className="flex items-center justify-between text-sm">
                  <b className="max-w-[200px] truncate pr-2 text-slate-900 dark:text-slate-100">{s.skill}</b>
                  <span className="shrink-0 font-medium text-slate-500">{Math.round(s.score)}/100</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                    style={{ width: `${s.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Workspace>
  );
}
