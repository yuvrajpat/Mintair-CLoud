export const metadata = {
  title: "Privacy Policy | Mintair Cloud",
  description: "Mintair Cloud Privacy Policy."
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-8">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <section className="surface-card border-ink-300 p-5">
          <p className="eyebrow text-brand-blue">Legal</p>
          <h1 className="mt-2 text-[2rem] leading-[1.1] text-ink-900">Privacy Policy</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            Last updated: February 7, 2026. This policy describes how Mintair Cloud collects, uses, and protects your
            information when you use our website and services.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">1. Information We Collect</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            We may collect account information (name, email, password hash), authentication/session data, billing details,
            support communications, device/browser information, and product usage data such as infrastructure usage metrics,
            logs, and interaction events.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">2. How We Use Information</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            We use data to provide and improve services, authenticate users, operate billing, monitor security, prevent abuse,
            communicate product updates, and meet legal obligations. We do not sell personal data.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">3. Cookies and Session Technologies</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            We use cookies and similar technologies to maintain secure sessions, remember preferences, and understand product
            usage. You can control cookies through browser settings, but disabling required cookies may affect functionality.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">4. Sharing of Information</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            We may share information with trusted service providers (hosting, analytics, payment processing, email delivery)
            under contractual protections, with law enforcement where legally required, or in connection with merger/acquisition
            events.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">5. Data Retention and Security</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            We retain information for as long as needed to provide services, resolve disputes, and comply with legal requirements.
            We use administrative, technical, and organizational safeguards designed to protect data, but no method is perfectly
            secure.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">6. Your Rights</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            Depending on your location, you may have rights to access, correct, delete, export, or restrict processing of your
            personal data. To exercise rights, contact us using the details below.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">7. Contact</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            For privacy questions, contact: <span className="font-medium">support@mintair.cloud</span>.
          </p>
        </section>
      </div>
    </main>
  );
}
