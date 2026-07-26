import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function LandingCta() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/30 p-10 text-center md:p-16 dark:border-white/[0.06] dark:from-white/[0.03] dark:via-blue-500/[0.03] dark:to-violet-500/[0.03]">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-blue-400/10 blur-[80px] dark:bg-blue-500/[0.06]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-violet-400/10 blur-[80px] dark:bg-violet-500/[0.06]" />

        <h2 className="relative font-serif text-4xl leading-tight tracking-tight text-slate-950 md:text-5xl dark:text-white">
          Walk into the next interview prepared.
        </h2>
        <p className="relative mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          Start with one targeted practice session and let the report guide your
          next improvement.
        </p>
        <Link
          to="/app"
          className="relative mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-white dark:text-zinc-900 dark:shadow-white/10 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-zinc-950"
        >
          Start practicing
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
