import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { cn } from "../../lib/utils";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    description: "For getting comfortable with the workflow.",
    cta: "Get started",
    highlighted: false,
    features: ["1 interview session per month", "Basic AI feedback", "Progress overview"],
  },
  {
    name: "Pro",
    price: "$29",
    description: "For candidates actively preparing for interviews.",
    cta: "Upgrade to Pro",
    highlighted: true,
    features: ["Unlimited sessions", "Granular feedback reports", "Custom job descriptions", "Audio and video-ready workflow"],
  },
];

export function PricingPreview() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <SectionHeader
        align="center"
        title="Simple pricing, clear next steps."
        description="Start free, then upgrade when you need more interview reps and richer feedback."
      />
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {tiers.map((tier) => (
          <article
            key={tier.name}
            className={cn(
              "relative flex flex-col rounded-2xl border bg-white/80 p-8 backdrop-blur-sm transition-all dark:bg-white/[0.03]",
              tier.highlighted
                ? "border-blue-500/40 shadow-lg shadow-blue-500/[0.06] dark:border-blue-400/30 dark:shadow-blue-500/[0.04]"
                : "border-slate-200/60 dark:border-white/[0.06]",
            )}
          >
            {tier.highlighted && (
              <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                Popular
              </span>
            )}
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              {tier.name}
            </h3>
            <p className="mt-2 min-h-12 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {tier.description}
            </p>
            <div className="mt-7 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
              {tier.price}
              <span className="text-base font-medium text-slate-400 dark:text-slate-500">
                {" "}
                /mo
              </span>
            </div>
            <ul className="mt-7 flex-1 grid gap-3">
              {tier.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"
                >
                  <CheckCircle2
                    size={17}
                    className={cn(
                      "shrink-0",
                      tier.highlighted
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400 dark:text-slate-500",
                    )}
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              to="/app"
              className={cn(
                "mt-8 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
                tier.highlighted
                  ? "bg-slate-900 text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-slate-200"
                  : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
              )}
            >
              {tier.cta}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
