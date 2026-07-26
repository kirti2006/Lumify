import { PublicNav, Footer } from "../components/layout";
import { LandingCta } from "../components/marketing/LandingCta";
import { PricingPreview } from "../components/marketing/PricingPreview";

export function Pricing() {
  return (
    <>
      <main className="mesh-gradient min-h-screen text-slate-950 dark:text-white">
        <PublicNav />
        <div className="mx-auto max-w-7xl px-6 pt-20 text-center md:pt-28">
          <p className="mx-auto mb-5 w-fit rounded-full border border-blue-200/60 bg-blue-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
            Simple pricing
          </p>
          <h1 className="font-serif text-[clamp(2.75rem,6vw,5rem)] leading-[1.05] tracking-tight text-slate-950 dark:text-white">
            Practice on your terms.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Start free. Upgrade when you need more sessions, deeper reports, and
            role-specific practice.
          </p>
        </div>
        <PricingPreview />
        <LandingCta />
      </main>
      <Footer />
    </>
  );
}
