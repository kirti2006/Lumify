import { Logo } from '../components/layout';

export function Terms() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-300 py-16 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <Logo />
        </div>
        <h1 className="text-4xl font-bold text-white mb-8">Terms & Conditions</h1>
        <div className="space-y-6 text-sm leading-relaxed">
          <p>
            Welcome to Lumify. By accessing or using our website, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, please do not use our services.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Use of Our Services</h2>
          <p>
            You agree to use our services only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the website.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. Intellectual Property</h2>
          <p>
            All content included on the website, such as text, graphics, logos, images, and software, is the property of Lumify or its content suppliers and protected by international copyright laws.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Limitation of Liability</h2>
          <p>
            Lumify shall not be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect.
          </p>
        </div>
      </div>
    </div>
  );
}
