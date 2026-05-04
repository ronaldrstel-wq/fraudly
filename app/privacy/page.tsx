import type { ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  path: "/privacy",
  titleSegment: "Privacy Policy",
  description:
    "Learn how Fraudly collects, uses, stores, and protects your personal data and cookie preferences."
});

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-bold text-slate-900 md:text-xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700 md:text-base">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:pt-14 md:pt-16">
        <header className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-blue-100 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
            Privacy
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-slate-600">Last updated: {updated}</p>
        </header>

        <article className="mt-10 space-y-10 rounded-xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60 sm:mt-12 sm:p-8 md:mt-14 md:space-y-12">
          <Section id="introduction" title="Introduction">
            <p>
              fraudly.app (“Fraudly”, “we”, “us”) helps you check websites and links for signs of fraud or low trust
              before you click, buy, or share personal details. We take privacy seriously and aim to be transparent
              about what we collect, why we use it, and what choices you have — including under the EU General Data
              Protection Regulation (“GDPR”).
            </p>
            <p>
              This policy describes our current practices. The product may evolve; when it does, we will update this
              page and adjust the “Last updated” date above.
            </p>
          </Section>

          <Section id="data-we-collect" title="Data we collect">
            <p>Depending on how you use Fraudly, we may process categories such as:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>User-provided data:</strong> for example, URLs you submit for analysis, optional feedback or
                messages you send us, and any other information you voluntarily provide. Please do not submit
                passwords, payment card numbers, government IDs, or other highly sensitive data.
              </li>
              <li>
                <strong>Technical data:</strong> such as IP address, approximate location derived from IP, browser type
                and version, device type, operating system, and timestamps. We use this for security, rate limiting, and
                troubleshooting.
              </li>
              <li>
                <strong>Usage data:</strong> such as pages or screens viewed, interactions with the interface, and
                events related to feature use (for example, starting or completing a check), where we collect this for
                analytics or product improvement.
              </li>
              <li>
                <strong>Cookies and similar technologies:</strong> we use strictly necessary cookies (or local storage)
                where needed for the site to function. Optional analytics or marketing cookies are only used if you allow
                them via our cookie banner and preferences — see the Cookies section below.
              </li>
            </ul>
          </Section>

          <Section id="how-we-use-data" title="How we use data">
            <p>We use personal data for purposes such as:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Providing and improving the service:</strong> running checks, showing results, fixing bugs, and
                developing features.
              </li>
              <li>
                <strong>Fraud detection and prevention:</strong> scoring and explaining risk based on signals you ask
                us to evaluate (this is informational, not a guarantee of safety).
              </li>
              <li>
                <strong>Analytics and performance:</strong> understanding how the product is used, only where allowed by
                your cookie choices.
              </li>
              <li>
                <strong>Security and abuse prevention:</strong> detecting spam, misuse, or attacks, enforcing rate
                limits, and protecting our infrastructure.
              </li>
            </ul>
          </Section>

          <Section id="legal-basis" title="Legal basis (GDPR)">
            <p>Where GDPR applies, we rely on one or more of the following legal bases:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Consent:</strong> for optional cookies and similar technologies (for example analytics or
                marketing), as set in our cookie preference centre. You can withdraw consent at any time via{" "}
                <strong>Cookie Settings</strong> in the site footer; that will not affect the lawfulness of processing
                before withdrawal.
              </li>
              <li>
                <strong>Legitimate interests:</strong> for example operating and securing the service, preventing abuse,
                understanding aggregate usage in a way that respects your rights, and improving Fraudly — balanced
                against your interests and rights.
              </li>
              <li>
                <strong>Contractual necessity:</strong> where we need certain data to perform our agreement with you
                (for example, delivering the check you request when that constitutes a contract under applicable law).
              </li>
              <li>
                <strong>Legal obligation:</strong> where we must retain or disclose data to comply with the law.
              </li>
            </ul>
          </Section>

          <Section id="data-sharing" title="Data sharing">
            <p>We may share data with:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Service providers:</strong> such as hosting (e.g. Vercel), AI providers (e.g. OpenAI for
                explanations), maps/review APIs (e.g. Google), or analytics tools — only what they need to perform
                their services, under appropriate agreements.
              </li>
              <li>
                <strong>Legal and safety:</strong> regulators, courts, or law enforcement when required by law or to
                protect rights, safety, and security.
              </li>
            </ul>
            <p>
              <strong>We do not sell your personal data</strong> as “sale” is commonly understood under privacy laws.
            </p>
          </Section>

          <Section id="retention" title="Data retention">
            <p>
              We keep personal data only for as long as needed for the purposes above — for example, for the duration of
              a session, to enforce rate limits, to satisfy legal obligations, or to resolve disputes. Technical logs
              may be kept for shorter rolling periods. When data is no longer needed, we delete or anonymise it where
              feasible.
            </p>
            <p>Exact retention windows may depend on infrastructure and backups; we will refine this policy as we mature.</p>
          </Section>

          <Section id="your-rights" title="Your rights (GDPR)">
            <p>
              If GDPR applies to our processing of your personal data, you may have the right to: <strong>access</strong>{" "}
              your data; <strong>rectify</strong> inaccurate data; request <strong>erasure</strong> (“right to be
              forgotten”) in certain cases; request <strong>restriction</strong> of processing;{" "}
              <strong>data portability</strong> where processing is based on consent or contract and is automated; and{" "}
              <strong>object</strong> to processing based on legitimate interests. You may also{" "}
              <strong>withdraw consent</strong> for consent-based processing (such as optional cookies) at any time.
            </p>
            <p>
              To exercise these rights, contact us at{" "}
              <a href="mailto:support@fraudly.app" className="font-medium text-blue-600 hover:underline">
                support@fraudly.app
              </a>
              . You may also lodge a complaint with your local supervisory authority.
            </p>
          </Section>

          <Section id="cookies" title="Cookies">
            <p>
              We operate a cookie consent banner and preference centre. Necessary cookies (or equivalent storage) are
              always on so the site can work securely. Optional <strong>analytics</strong> and{" "}
              <strong>marketing</strong> categories are off by default until you opt in. Your choices are stored locally
              in your browser (for example via <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">localStorage</code>
              ) and can be changed anytime using <strong>Cookie Settings</strong> in the footer.
            </p>
            <p>
              For more detail on limitations of automated checks, see our{" "}
              <Link href="/disclaimer" className="font-medium text-blue-600 hover:underline">
                Disclaimer
              </Link>
              .
            </p>
          </Section>

          <Section id="security" title="Security">
            <p>
              We apply reasonable technical and organisational measures designed to protect personal data — for example
              access controls, encryption in transit where appropriate for our stack, and separation of environments.
              No method of transmission or storage is 100% secure; we encourage you to use strong devices and networks
              when handling sensitive decisions.
            </p>
          </Section>

          <Section id="third-parties" title="Third-party services">
            <p>
              Fraudly relies on external providers (for example hosting, AI, or data APIs). Their use of data is
              governed by their own policies and our instructions. We encourage you to read their privacy notices if you
              want detail on how they process data on our behalf.
            </p>
          </Section>

          <Section id="international-transfers" title="International transfers">
            <p>
              Some providers may process data outside the European Economic Area (EEA), including in the United States.
              Where required, we rely on appropriate safeguards recognised under GDPR — for example the EU Commission’s
              standard contractual clauses (SCCs), plus supplementary measures where appropriate — or other lawful
              transfer mechanisms.
            </p>
          </Section>

          <Section id="changes" title="Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. The latest version will always be published on this
              page with an updated “Last updated” date. If changes are material, we will take reasonable steps to inform
              you (for example via the site or email where we have your address).
            </p>
          </Section>

          <Section id="contact" title="Contact">
            <p>
              Questions about this Privacy Policy or your personal data? Contact us at:{" "}
              <a href="mailto:support@fraudly.app" className="font-medium text-blue-600 hover:underline">
                support@fraudly.app
              </a>
              .
            </p>
          </Section>
        </article>

        <p className="mt-8 text-center text-sm text-slate-600">
          <Link href="/" className="font-medium text-blue-600 hover:underline">
            ← Back to Fraudly
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
