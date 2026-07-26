import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import {
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Download,
  CalendarPlus,
  Trophy,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Card } from "../components/ui";
import { Workspace } from "../components/layout/Workspace";
import { PageHeader } from "../components/app/PageHeader";
import { api, getCached } from "../lib/api";
import { generateProfessionalPDF } from "../lib/generatePDF";

const YoutubeIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.582 6.186a2.6 2.6 0 0 0-1.838-1.838C18.121 4 12 4 12 4s-6.121 0-7.744.348a2.6 2.6 0 0 0-1.838 1.838C2 7.81 2 12 2 12s0 4.19.418 5.814a2.6 2.6 0 0 0 1.838 1.838C5.879 20 12 20 12 20s6.121 0 7.744-.348a2.6 2.6 0 0 0 1.838-1.838C22 16.19 22 12 22 12s0-4.19-.418-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export function Reports() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get("/auth/profile").then(res => setUserProfile(res.data?.data)).catch(() => {});
    getCached("/reports")
      .then(res => {
        setReports(res.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (id) {
      getCached(`/reports/${id}`)
        .then(res => setActiveReport(res.data.data))
        .catch(console.error);
    } else {
      setActiveReport(null);
    }
  }, [id]);

  if (loading) {
    return (
      <Workspace title="Reports">
        <div className="p-8 text-center text-slate-400">Loading reports...</div>
      </Workspace>
    );
  }

  if (id) {
    const report = activeReport;
    if (!report) {
      return (
        <Workspace title="Loading Report">
          <div className="mb-6 flex">
            <Link className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10" to="/app/reports">
              <ArrowLeft size={14} /> Back to Reports
            </Link>
          </div>
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
            <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400 dark:border-t-transparent"></div>
            Loading report details...
          </div>
        </Workspace>
      );
    }

    const totalQs = report.questions?.length || 0;
    const attemptedQs = report.questions?.filter((q: any) => q.answerText && q.answerText.trim().length > 0 && q.answerText.trim() !== "No answer provided.").length || 0;
    const leftQs = totalQs - attemptedQs;

    return (
      <Workspace title={`${report.role || 'Interview'} Report`}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {new Date(report.generatedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
            <h2 className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              {(() => {
                if (report.overallScore == null && !report.questions) return 'Evaluation Complete';
                const maxMarks = (report.totalQuestions || totalQs || 5) * 5;
                const earnedMarks = report.questions ? report.questions.reduce((acc: number, q: any) => acc + (q.score || 0), 0) : 0;
                return `Score: ${earnedMarks}/${maxMarks}`;
              })()}
            </h2>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <button onClick={() => generateProfessionalPDF(report, userProfile)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md dark:bg-blue-500 dark:hover:bg-blue-400">
              <Download size={14} /> Download PDF
            </button>
            <Link className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 no-underline transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06]" to="/app/reports">
              <ArrowLeft size={14} /> Back
            </Link>
          </div>
        </div>

        {/* Summary stats */}
        <Card className="mb-5 p-6">
          <h3 className="mb-4 text-base font-semibold text-slate-950 dark:text-white">Overall Results</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/60 p-4 text-center dark:border-white/[0.06]">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Questions</p>
              <h4 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{totalQs}</h4>
            </div>
            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 text-center dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Attempted</p>
              <h4 className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{attemptedQs}</h4>
            </div>
            <div className="rounded-xl border border-red-200/60 bg-red-50/50 p-4 text-center dark:border-red-500/20 dark:bg-red-500/[0.06]">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-500">Left Unanswered</p>
              <h4 className="mt-1 text-2xl font-bold text-red-500">{leftQs}</h4>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/[0.02]">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={16} /> Strengths
              </h4>
              <ul className="mt-4 grid gap-3 text-sm text-slate-700 dark:text-slate-300">
                {report.strengths?.length ? report.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500/50"></span>
                    <span>{s}</span>
                  </li>
                )) : <li>No notable strengths identified.</li>}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-200/60 bg-amber-50/30 p-5 dark:border-amber-500/20 dark:bg-amber-500/[0.02]">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                <Sparkles size={16} /> Areas for Improvement
              </h4>
              <ul className="mt-4 grid gap-3 text-sm text-slate-700 dark:text-slate-300">
                {report.weaknesses?.length ? report.weaknesses.map((w: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500/50"></span>
                    <span>{w}</span>
                  </li>
                )) : <li>No specific areas identified.</li>}
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-5 dark:bg-white/[0.03]">
            <h4 className="mb-2 text-sm font-semibold text-slate-950 dark:text-white">Feedback Summary</h4>
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <ReactMarkdown>{report.detailedSummary || report.feedback || "No feedback available for this session."}</ReactMarkdown>
            </div>
          </div>
        </Card>

        {/* Question-level feedback */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-200/60 px-6 py-4 dark:border-white/[0.06]">
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">Detailed Feedback</h3>
          </div>
          {report.questions?.map((q: any, i: number) => (
            <div className="border-b border-slate-200/60 p-6 last:border-0 dark:border-white/[0.06]" key={q.id}>
              <div className="flex items-start justify-between gap-4">
                <h4 className="flex items-start gap-3 text-sm font-semibold text-slate-950 dark:text-white">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{q.questionText}</span>
                </h4>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                    q.score >= 4
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}
                >
                  {q.score}/5
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200/60 bg-slate-50/50 p-5 dark:border-white/10 dark:bg-white/[0.02]">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Your Answer</p>
                <p className="text-sm italic leading-relaxed text-slate-600 dark:text-slate-400">
                  "{q.answerText || 'No answer provided.'}"
                </p>
              </div>

              <div className="mt-3 rounded-2xl border border-blue-200/60 bg-blue-50/30 p-5 dark:border-blue-500/20 dark:bg-blue-500/[0.02]">
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    <Sparkles size={14} /> AI Evaluation
                  </p>
                  <div className="flex gap-2">
                    {q.technicalScore != null && (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                        Tech: {q.technicalScore}/10
                      </span>
                    )}
                    {q.communicationScore != null && (
                      <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                        Comm: {q.communicationScore}/10
                      </span>
                    )}
                    {q.confidenceScore != null && (
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                        Conf: {q.confidenceScore}/10
                      </span>
                    )}
                  </div>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
                  <ReactMarkdown>{q.feedback || "No detailed feedback available."}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {(!report.questions || report.questions.length === 0) && (
            <div className="p-6 text-sm text-slate-400">No detailed question feedback available.</div>
          )}
        </Card>

        {/* Learning resources */}
        {report.metadata?.learning_resources && report.metadata.learning_resources.length > 0 && (
          <Card className="mt-5 p-6">
            <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-blue-600 dark:text-blue-400">
              <Sparkles size={18} /> Recommended Resources
            </h3>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              Latest tools and guides dynamically fetched by AI based on your specific weak areas.
            </p>
            <div className="grid gap-3">
              {report.metadata.learning_resources.map((res: any, idx: number) => {
                const isValidUrl = typeof res.url === 'string' && res.url.startsWith('http');
                const CardWrapper = isValidUrl ? 'a' as any : 'div';
                const cardProps = isValidUrl ? { href: res.url, target: "_blank", rel: "noreferrer" } : {};

                const isYoutube = typeof res.url === 'string' && (res.url.includes('youtube.com') || res.url.includes('youtu.be'));

                return (
                  <CardWrapper
                    key={idx}
                    {...cardProps}
                    className={`block rounded-xl border border-slate-200/60 p-4 transition-all hover:border-slate-300 hover:shadow-md dark:border-white/[0.06] dark:hover:border-white/[0.12] ${isValidUrl ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02]' : 'cursor-default'}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
                        {isYoutube && <YoutubeIcon size={18} className="text-[#FF0000]" />}
                        {res.title}
                      </h4>
                      <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        {isYoutube ? 'Video' : (res.type || 'Resource')}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{res.description}</p>
                    {!isValidUrl && typeof res.url === 'string' && res.url.length > 0 && res.url !== 'resource URL' && (
                      <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">Source: {res.url}</p>
                    )}
                  </CardWrapper>
                );
              })}
            </div>
          </Card>
        )}
      </Workspace>
    );
  }

  // Reports list view
  return (
    <Workspace title="Feedback & Reports">
      <PageHeader
        title="Turn feedback into offers."
        description="Actionable insights from your practice sessions."
        action={
          <Link
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-blue-700 hover:shadow-md md:w-auto dark:bg-blue-500 dark:hover:bg-blue-400"
            to="/app/schedule"
          >
            <CalendarPlus size={16} /> Practice again
          </Link>
        }
      />

      <div className="reports-list">
        {reports.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-white/[0.06]">
              <Sparkles className="text-slate-400" size={24} />
            </div>
            <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">No reports yet</h3>
            <p className="mb-6 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Complete a practice interview to receive detailed AI feedback and actionable insights on your performance.
            </p>
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white no-underline shadow-sm transition-all hover:bg-blue-700 hover:shadow-md dark:bg-blue-500 dark:hover:bg-blue-400"
              to="/app/schedule"
            >
              <CalendarPlus size={16} /> Schedule an interview
            </Link>
          </Card>
        ) : (
          <>
            {reports.slice((page - 1) * 5, page * 5).map((r: any) => (
              <Card key={r.id} className="p-5">
                <header className="flex items-start justify-between">
                  <div>
                    <small className="text-xs text-slate-400">{new Date(r.generatedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</small>
                    <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-white flex items-center gap-2">
                      {r.role ? r.role : "Practice Session"}
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold uppercase text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                        {r.interviewType || "General"}
                      </span>
                    </h3>
                  </div>
                  {(() => {
                    const scoreStr = r.sessionOverallScore != null ? r.sessionOverallScore : (r.overallScore != null ? r.overallScore : (r.interview?.overallScore || null));
                    const percentage = scoreStr != null ? Number(scoreStr) : null;
                    const maxMarks = (r.totalQuestions || 5) * 5;
                    const score = r.questions ? r.questions.reduce((acc: number, q: any) => acc + (q.score || 0), 0) : (percentage !== null ? Math.round((percentage / 100) * maxMarks) : null);
                    
                    let colorClass = "text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-white/[0.06]";
                    if (score !== null) {
                      const computedPercentage = (score / maxMarks) * 100;
                      if (computedPercentage >= 80) colorClass = "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10";
                      else if (computedPercentage >= 50) colorClass = "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10";
                      else colorClass = "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10";
                    }
                    return (
                      <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold shadow-sm ${colorClass}`}>
                        <Trophy size={14} /> {score !== null ? `${score}/${maxMarks}` : `--/${maxMarks}`}
                      </span>
                    )
                  })()}
                </header>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {r.detailedSummary ? r.detailedSummary.substring(0, 120) + "..." : "Feedback is processing..."}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Link
                    to={`/app/reports?id=${r.id}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white no-underline transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    Full report <ChevronRight size={13} />
                  </Link>
                  <button
                    onClick={() => { generateProfessionalPDF(r, userProfile); }}
                    className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-400 dark:hover:bg-white/10"
                    aria-label="Download PDF"
                  >
                    <FileText size={13} fill="currentColor" />
                  </button>
                </div>
              </Card>
            ))}
            {reports.length > 5 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500">Page {page} of {Math.ceil(reports.length / 5)}</span>
                <button
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  disabled={page >= Math.ceil(reports.length / 5)}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Workspace>
  );
}
