import { Logo } from '../components/layout';

export function Privacy() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-300 py-16 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <Logo />
        </div>
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="space-y-6 text-sm leading-relaxed">
          <p>
            Welcome to Lumify. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
          <p>
            We may collect personal information such as your name, email address, and usage data when you register on our site, place an order, subscribe to our newsletter, or fill out a form.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
          <p>
            The information we collect may be used to personalize your experience, improve our website, improve customer service, process transactions, or send periodic emails regarding your order or other products and services.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">3. Data Security</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information when you enter, submit, or access your personal information. However, no method of transmission over the Internet, or method of electronic storage is 100% secure.
          </p>
          <h2 className="text-xl font-semibold text-white mt-8 mb-4">4. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at support@lumify.ai.
          </p>
        </div>
      </div>
    </div>
  );
}
