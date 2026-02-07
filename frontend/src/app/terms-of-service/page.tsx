export const metadata = {
  title: "Terms of Service | Mintair Cloud",
  description: "Mintair Cloud Terms of Service."
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-8">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <section className="surface-card border-ink-300 p-5">
          <p className="eyebrow text-brand-blue">Legal</p>
          <h1 className="mt-2 text-[2rem] leading-[1.1] text-ink-900">Terms of Service</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            Last updated: February 7, 2026. These Terms govern your access to and use of Mintair Cloud services.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">1. Acceptance of Terms</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            By creating an account or using Mintair Cloud, you agree to these Terms and all applicable laws. If you do not
            agree, do not use the service.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">2. Accounts and Security</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            You are responsible for maintaining account confidentiality and for activity under your account. You must provide
            accurate information and promptly update it if it changes.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">3. Service Use</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            You may use Mintair Cloud only for lawful purposes and in compliance with applicable regulations, including export
            controls and sanctions laws.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">4. Billing and Payments</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            Fees are based on your selected services and usage. You authorize us to charge your payment method for applicable
            charges, taxes, and any overdue balances.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">5. Availability and Changes</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            We may modify, suspend, or discontinue parts of the service at any time. We aim for reliable uptime but do not
            guarantee uninterrupted or error-free operation.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">6. Intellectual Property</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            Mintair Cloud and all related software, marks, and content are owned by us or our licensors. These Terms grant
            you a limited, non-exclusive right to use the service.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">7. Termination</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            You may stop using the service at any time. We may suspend or terminate access for violations of these Terms, abuse,
            or security risks.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">8. Disclaimer and Liability</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            The service is provided "as is" and "as available." To the maximum extent permitted by law, we disclaim warranties
            and limit liability for indirect, incidental, special, consequential, or punitive damages.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">9. Governing Law</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            These Terms are governed by applicable laws of the jurisdiction stated in your service agreement, without regard to
            conflict of law rules.
          </p>
        </section>

        <section className="surface-card border-ink-300 p-5">
          <h2 className="text-xl text-ink-900">10. Contact</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-700">
            Questions about these Terms can be sent to <span className="font-medium">support@mintair.cloud</span>.
          </p>
        </section>
      </div>
    </main>
  );
}
