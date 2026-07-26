import { motion } from "framer-motion";
import { SectionHeader } from "./SectionHeader";

const steps = [
  {
    label: "01",
    title: "Set the target",
    description: "Choose the role, interview focus, level, and optional job description context.",
    color: "from-blue-500 to-blue-600",
  },
  {
    label: "02",
    title: "Practice in one flow",
    description: "Answer realistic questions with a clear timer, transcript area, and review controls.",
    color: "from-violet-500 to-violet-600",
  },
  {
    label: "03",
    title: "Act on feedback",
    description: "Use detailed reports and progress views to decide exactly what to practice next.",
    color: "from-emerald-500 to-emerald-600",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <SectionHeader
        eyebrow="How it works"
        title="A simple path from practice to polish."
        description="The interface keeps the next step obvious, whether you are starting a session or reviewing the result."
      />
      <div className="relative grid gap-6 md:grid-cols-3">
        {/* Connecting line — desktop only */}
        <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent md:block dark:via-white/10" />

        {steps.map((step, index) => (
          <motion.article
            key={step.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="relative rounded-2xl border border-slate-200/60 bg-white/80 p-7 backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.03]"
          >
            <div
              className={`mb-6 grid size-10 place-items-center rounded-full bg-gradient-to-br ${step.color} text-sm font-bold text-white shadow-sm`}
            >
              {step.label}
            </div>
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              {step.title}
            </h3>
            <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
              {step.description}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
