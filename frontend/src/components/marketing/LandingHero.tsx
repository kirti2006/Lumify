import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Mic, Play, Sparkles } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function LandingHero() {
  return (
    <section className="relative">
      {/* Decorative orb accents */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[120px] dark:bg-blue-500/[0.06]" />
      <div className="pointer-events-none absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-400/10 blur-[100px] dark:bg-violet-500/[0.05]" />

      <div className="mx-auto max-w-5xl px-6 pb-20 pt-24 md:pb-28 md:pt-32">
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08 }}
          className="mx-auto max-w-3xl text-center"
        >
          {/* Eyebrow badge */}
          <motion.div
            variants={fadeUp}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-600 backdrop-blur-sm dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
          >
            <Sparkles size={13} aria-hidden="true" />
            AI-powered interview practice
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="font-serif italic font-extrabold text-[clamp(2.75rem,6vw,5rem)] leading-[1.05] tracking-tight text-slate-950 [-webkit-text-stroke:1.5px_currentColor] dark:text-white"
          >
            Practice with clarity.{" "}
            <span className="bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-transparent dark:from-amber-300 dark:via-orange-400 dark:to-rose-400">
              Interview
            </span>{" "}
            with confidence.
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400"
          >
            Lumify turns job descriptions into focused interview sessions, then
            gives precise feedback you can act on before the real conversation.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
          >
            <Link
              to="/app"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-white dark:text-zinc-900 dark:shadow-white/10 dark:hover:bg-slate-200 dark:focus-visible:ring-offset-zinc-950"
            >
              Start a free interview
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a
              href="#how"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 text-sm font-semibold text-slate-700 backdrop-blur-sm transition-all hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-950"
            >
              <Play size={14} fill="currentColor" aria-hidden="true" />
              See workflow
            </a>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400"
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2
                size={15}
                className="text-emerald-500"
                aria-hidden="true"
              />
              No setup needed
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2
                size={15}
                className="text-emerald-500"
                aria-hidden="true"
              />
              Free to start
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2
                size={15}
                className="text-emerald-500"
                aria-hidden="true"
              />
              Dark mode ready
            </span>
          </motion.div>
        </motion.div>

        {/* Hero Visual — Interview mockup */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="mx-auto mt-16 max-w-3xl"
        >
          <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-2 shadow-2xl shadow-slate-950/[0.06] backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-black/30">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-6 dark:border-white/[0.05] dark:bg-white/[0.02]">
              {/* Mock session header */}
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-xs font-bold text-white">
                  AS
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    Alexandra Stone
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Product manager interview
                  </p>
                </div>
                <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 sm:inline-flex dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Live session
                </span>
              </div>

              {/* Mock question */}
              <div className="mx-auto my-10 max-w-xl">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Question 03
                </p>
                <h2 className="mt-3 font-serif text-2xl leading-snug text-slate-950 md:text-3xl dark:text-white">
                  Tell me about a product decision you made with incomplete
                  information.
                </h2>
                <div
                  className="mt-6 overflow-hidden whitespace-nowrap text-sm tracking-[0.35em] text-slate-300 dark:text-slate-600"
                  aria-hidden="true"
                >
                  ● ● ● ● ● ● ● ● ● ● ● ● ● ●
                </div>
              </div>

              {/* Mock controls */}
              <div className="flex flex-col gap-3 border-t border-slate-200/60 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06] dark:text-slate-400">
                <span>02:48 remaining</span>
                <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 font-semibold text-white shadow-sm hover:bg-blue-700">
                  <Mic size={15} aria-hidden="true" /> Recording
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
