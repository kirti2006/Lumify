import { Footer, PublicNav } from "../components/layout";
import { FeatureGrid } from "../components/marketing/FeatureGrid";
import { HowItWorks } from "../components/marketing/HowItWorks";
import { LandingCta } from "../components/marketing/LandingCta";
import { LandingHero } from "../components/marketing/LandingHero";
import { PricingPreview } from "../components/marketing/PricingPreview";

export function Landing() {
  return (
    <>
      <main className="mesh-gradient min-h-screen text-slate-950 dark:text-white">
        <PublicNav />
        <LandingHero />
        <FeatureGrid />
        <HowItWorks />
        <PricingPreview />
        <LandingCta />
      </main>
      <Footer />
    </>
  );
}
