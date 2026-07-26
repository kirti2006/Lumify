import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Target,
  Trophy,
  Video,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard } from "../components/app/MetricCard";
import { PageHeader } from "../components/app/PageHeader";
import { Workspace } from "../components/layout/Workspace";
import { Card } from "../components/ui";

// Removed static mock data arrays

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<any>(null);

  useEffect(() => {
    import("../lib/api").then(({ api }) => {
      api.get("/analytics/dashboard").then((res) => setData(res.data.data)).catch(console.error);
      api.get("/interviews").then((res) => {
        const scheduled = res.data.data.find((i: any) => i.status === 'SCHEDULED');
        setUpcoming(scheduled || null);
      }).catch(console.error);
    });
  }, []);

  return (
    <Workspace title="Overview">
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        title="Make today count."
        description="Start a focused practice session, review recent feedback, and keep your interview prep moving."
        action={
          <Link
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-blue-700 hover:shadow-md md:w-auto dark:bg-blue-500 dark:hover:bg-blue-400"
            to="/app/schedule"
          >
            <CalendarPlus size={17} aria-hidden="true" /> New interview
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={Target}
          value={data?.averageScore ? `${data.averageScore}` : "0"}
          label="Average score"
          delta={data?.averageScore > 0 ? "Latest" : "No interviews yet"}
          color="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 dark:bg-blue-500/10"
        />
        <MetricCard
          icon={Video}
          value={data?.totalInterviews ? `${data.totalInterviews}` : "0"}
          label="Interviews completed"
          delta={data?.completedInterviews ? `${data.completedInterviews} completed` : "0 completed"}
          color="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <MetricCard
          icon={Trophy}
          value={data?.averageScore > 0 ? "Top 50%" : "N/A"}
          label="Your percentile"
          delta={data?.averageScore > 0 ? "Keep practicing" : "Complete a session"}
          color="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 dark:bg-amber-500/10"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.65fr_1fr]">
        <Card className="p-5">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-950 dark:text-white">Performance trend</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your interview scores over time</p>
            </div>
            <span className="rounded-full border border-slate-200/60 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-white/[0.06] dark:text-slate-400">
              Last 6 months
            </span>
          </header>
          <div className="mt-4 h-[245px]">
            {data?.scoreHistory && data.scoreHistory.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={data.scoreHistory.map((h: any) => ({ ...h, n: new Date(h.date).toLocaleDateString(undefined, { month: 'short' }) }))}>
                  <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.06} />
                  <XAxis dataKey="n" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area dataKey="score" stroke="#3b82f6" strokeWidth={2.5} fill="#3b82f6" fillOpacity={0.06} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Target size={24} className="mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-950 dark:text-white">No trend data</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Complete sessions to track progress.</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <header className="flex items-start justify-between">
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">Up next</h3>
            <Link className="text-sm font-semibold text-blue-600 no-underline dark:text-blue-400" to="/app/schedule">
              View all
            </Link>
          </header>
          {upcoming ? (
            <>
              <div className="flex gap-4 py-5">
                <div className="grid h-12 w-11 shrink-0 place-content-center rounded-xl bg-blue-50 text-center text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                  <b>{new Date(upcoming.scheduledAt).getDate()}</b>
                  <small className="text-[10px] uppercase">{new Date(upcoming.scheduledAt).toLocaleString('default', { month: 'short' })}</small>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-950 dark:text-white capitalize">{upcoming.role}</h4>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{upcoming.topic || "Practice session"} · {upcoming.duration || 30} min</p>
                  <span className="mt-2 flex items-center gap-1 text-sm text-slate-400 dark:text-slate-500">
                    <Clock3 size={14} aria-hidden="true" /> {new Date(upcoming.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <Link
                className="flex items-center gap-2 border-t border-slate-200/60 pt-4 text-sm font-semibold text-blue-600 no-underline dark:border-white/[0.06] dark:text-blue-400"
                to={`/app/lobby?id=${upcoming.id}`}
              >
                <Video size={16} aria-hidden="true" /> Enter lobby
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="grid size-12 place-items-center rounded-full bg-slate-50 text-slate-400 dark:bg-white/[0.02] dark:text-slate-500">
                <CalendarPlus size={20} />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-950 dark:text-white">No upcoming sessions</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Schedule an interview to see it here.</p>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <header>
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">Skill snapshot</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Based on your latest session</p>
          </header>
          <div className="h-[255px]">
            {data?.topicPerformance && data.topicPerformance.length > 0 ? (
              <ResponsiveContainer>
                <RadarChart data={data.topicPerformance}>
                  <PolarGrid stroke="currentColor" strokeOpacity={0.08} />
                  <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11 }} />
                  <Radar dataKey="averageScore" stroke="#10b981" fill="#10b981" fillOpacity={0.12} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Target size={24} className="mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-950 dark:text-white">No skill data yet</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Complete sessions to build your profile.</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <header className="flex items-start justify-between">
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">Recent feedback</h3>
            <Link className="text-sm font-semibold text-blue-600 no-underline dark:text-blue-400" to="/app/reports">
              All reports
            </Link>
          </header>
          {data?.scoreHistory?.length > 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center py-8 text-center border-t border-slate-100 dark:border-white/[0.04]">
              <div className="grid size-12 place-items-center rounded-full bg-slate-50 text-slate-400 dark:bg-white/[0.02] dark:text-slate-500">
                <CheckCircle2 size={20} />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-950 dark:text-white">Session reviewed</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">View detailed feedback in Reports.</p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center py-8 text-center border-t border-slate-100 dark:border-white/[0.04]">
              <p className="text-sm text-slate-500 dark:text-slate-400">No recent feedback available.</p>
            </div>
          )}
        </Card>
      </div>
    </Workspace>
  );
}
