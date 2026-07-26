import { Workspace } from "../components/layout/Workspace";
import { PricingPreview } from "../components/marketing/PricingPreview";
import { PageHeader } from "../components/app/PageHeader";
import { Button } from "../components/ui";

export function Upgrade() {
  return (
    <Workspace title="Upgrade Plan">
      <PageHeader 
        title="Upgrade your plan." 
        description="Get more sessions, advanced reports, and deeper AI insights to ace your interviews." 
      />
      
      <div className="mt-8 max-w-5xl mx-auto">
        <PricingPreview />
        
        <div className="mt-12 rounded-3xl border border-blue-200/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-8 dark:border-blue-500/10 dark:from-blue-500/5 dark:to-indigo-500/5">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Need a custom plan?</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md">
                If you are a career coach, university, or enterprise looking to train multiple candidates, contact us for bulk pricing and organizational features.
              </p>
            </div>
            <div className="shrink-0">
              <Button variant="secondary" className="px-6 py-5">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Workspace>
  );
}
