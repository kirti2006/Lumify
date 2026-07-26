import type { ComponentType } from "react";
import { motion } from "framer-motion";
import { BarChart3, BrainCircuit, Mic, MessageSquare, Target, Zap } from "lucide-react";
import { SectionHeader } from "./SectionHeader";

type Feature = {
  icon: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
  color: string;
  iconColor: string;
};

const features: Feature[] = [
  {
    icon: BrainCircuit,
    title: "Adaptive coaching",
    description: "Questions adjust to your role, level, and previous answers so every session stays relevant.",
    color: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: MessageSquare,
    title: "Specific feedback",
    description: "Review clarity, structure, depth, and confidence with recommendations you can apply immediately.",
    color: "bg-violet-50 dark:bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    icon: BarChart3,
    title: "Progress tracking",
    description: "See your scores and skills evolve across sessions without hunting through reports.",
    color: "bg-emerald-50 dark:bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Target,
    title: "Role-based practice",
    description: "Use job descriptions to create realistic behavioral, technical, product, and leadership prompts.",
    color: "bg-amber-50 dark:bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: Mic,
    title: "Voice input",
    description: "Practice speaking naturally, then refine the substance of your answer from the transcript.",
    color: "bg-rose-50 dark:bg-rose-500/10",
    iconColor: "text-rose-500 dark:text-rose-400",
  },
  {
    icon: Zap,
    title: "Fast sessions",
    description: "Start a short practice round quickly when you need focused reps before a call.",
    color: "bg-cyan-50 dark:bg-cyan-500/10",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <SectionHeader
        align="center"
        title="Everything stays focused on better answers."
        description="A clean preparation workflow for practicing, reviewing, and improving without visual noise."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <motion.article
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className="group rounded-2xl border border-slate-200/60 bg-white/80 p-6 backdrop-blur-sm transition-all hover:border-slate-300/60 hover:shadow-lg dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.05]"
          >
            <div
              className={`mb-5 grid size-12 place-items-center rounded-xl ${feature.color} transition-transform group-hover:scale-105`}
            >
              <feature.icon size={22} className={feature.iconColor} aria-hidden />
            </div>
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
              {feature.title}
            </h3>
            <p className="mt-3 leading-relaxed text-slate-600 dark:text-slate-400">
              {feature.description}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
