import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, ChevronRight } from "lucide-react";
import { Button, Card } from "../components/ui";
import { Workspace } from "../components/layout/Workspace";
import { PageHeader } from "../components/app/PageHeader";

export function History() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    import("../lib/api").then(({ getCached }) => {
      getCached("/interviews")
        .then((res) => {
          setInterviews(res.data.data || []);
        })
        .catch((err) => {
          console.error("Failed to load history", err);
        })
        .finally(() => {
          setLoading(false);
        });
    });
  }, []);

  const getStatusBadge = (session: any) => {
    if (session.status === 'completed') {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          Completed
        </span>
      );
    }
    if (session.status === 'in_progress') {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400">
          Failed (Aborted)
        </span>
      );
    }
    if (session.status === 'terminated' || session.status === 'cancelled') {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400">
          Failed
        </span>
      );
    }
    if (session.status === 'scheduled') {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          Scheduled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-white/[0.06] dark:text-slate-400">
        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
      </span>
    );
  };

  const getScoreBadge = (session: any) => {
    if (session.overallScore != null) {
      const maxMarks = (session.totalQuestions || 5) * 5;
      const percentage = Number(session.overallScore);
      const score = Math.round((percentage / 100) * maxMarks);
      let colorClass = "text-slate-900 dark:text-white";
      if (percentage >= 80) colorClass = "text-emerald-600 dark:text-emerald-400";
      else if (percentage >= 50) colorClass = "text-amber-600 dark:text-amber-400";
      else colorClass = "text-red-600 dark:text-red-400";
      return (
        <span className={`inline-flex items-center font-bold ${colorClass}`}>
          {score}/{maxMarks}
        </span>
      );
    }
    return <span className="text-slate-400">—</span>;
  };

  return (
    <Workspace title="Interview history">
      <PageHeader
        title="Your sessions."
        description="Review each practice session and track your improvement over time."
        action={
          <Link
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-blue-700 hover:shadow-md md:w-auto dark:bg-blue-500 dark:hover:bg-blue-400"
            to="/app/schedule"
          >
            <CalendarPlus size={16} /> New interview
          </Link>
        }
      />
      <Card className="overflow-hidden p-0">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_80px_100px] items-center gap-4 border-b border-slate-200/60 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-white/[0.06] dark:text-slate-500">
          <span>Date</span>
          <span>Role</span>
          <span>Focus</span>
          <span>Status</span>
          <span>Score</span>
          <span>Action</span>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-400">Loading history...</p>
        ) : interviews.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No interviews found. Schedule one to get started!</p>
        ) : (
          <>
            {interviews.slice((page - 1) * 5, page * 5).map((session: any) => (
              <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_80px_100px] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0 dark:border-white/[0.06]" key={session.id}>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(session.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
                <b className="text-sm text-slate-900 dark:text-white">{session.role || "Practice Interview"}</b>
                <span className="text-sm capitalize text-slate-500 dark:text-slate-400">{session.interviewType || "General"}</span>
                <div>{getStatusBadge(session)}</div>
                <div>{getScoreBadge(session)}</div>
                {session.reportId ? (
                  <Link className="inline-flex w-fit items-center gap-1 rounded-md text-sm font-semibold text-blue-600 no-underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" to={`/app/reports?id=${session.reportId}`}>
                    View <ChevronRight size={14} />
                  </Link>
                ) : (
                  <span className="text-xs text-slate-400">N/A</span>
                )}
              </div>
            ))}
            {interviews.length > 5 && (
              <div className="flex items-center justify-center gap-3 border-t border-slate-200/60 px-5 py-4 dark:border-white/[0.06]">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
                <span className="text-sm text-slate-500">Page {page} of {Math.ceil(interviews.length / 5)}</span>
                <Button variant="outline" size="sm" disabled={page >= Math.ceil(interviews.length / 5)} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </Card>
    </Workspace>
  );
}
