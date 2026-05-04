import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Terms of Service — Fraudly",
  description: "Terms and conditions for using fraudly.app."
};

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-bold text-slate-900 md:text-xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700 md:text-base">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:pt-14 md:pt-16">
        <header className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-blue-100 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
            Legal
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-slate-500">Terms &amp; Conditions</p>
          <p className="mt-3 text-sm text-slate-600">Last updated: {updated}</p>
        </header>

        <article className="mt-10 space-y-10 rounded-xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60 sm:mt-12 sm:p-8 md:mt-14 md:space-y-12">
          <Section id="introduction" title="Introduction">
            <p>
              These Terms of Service (“Terms”) govern your access to and use of fraudly.app and related services
              (“Fraudly”, “we”, “us”, “our”). fraudly.app is a platform that helps you detect and assess potential fraud
              risks through informational tools and insights.
            </p>
            <p>
              By using Fraudly — for example by visiting the site, running a check, or creating an account if we offer
              one — you agree to these Terms. If you do not agree, please stop using the service.
            </p>
            <p>
              For how we handle personal data, see our{" "}
              <Link href="/privacy" className="font-medium text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              . For limitations of automated assessments, see our{" "}
              <Link href="/disclaimer" className="font-medium text-blue-600 hover:underline">
                Disclaimer
              </Link>
              .
            </p>
          </Section>

          <Section id="use-of-service" title="Use of the service">
            <p>You agree to use Fraudly only in a lawful and respectful way. In particular, you must not:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Violate applicable laws or regulations, or infringe others’ rights.</li>
              <li>Misuse, harass, or abuse the platform, our team, or other users.</li>
              <li>
                Attempt to break, overload, or circumvent security, rate limits, or technical controls — including
                probing systems you do not own or have permission to test.
              </li>
              <li>
                Submit illegal content, malware, or highly sensitive personal data (such as passwords or full payment
                card numbers) into the service.
              </li>
            </ul>
            <p>We may refuse service or block behaviour that we reasonably believe breaches these rules.</p>
          </Section>

          <Section id="no-professional-advice" title="No professional advice">
            <p>
              Fraudly provides <strong>informational tools and explanations only</strong>. Nothing on the site or in our
              outputs is legal, financial, tax, or other professional advice. You should consult a qualified
              professional when you need advice tailored to your situation.
            </p>
          </Section>

          <Section id="no-guarantees" title="No guarantees">
            <p>
              We do <strong>not</strong> guarantee that Fraudly will detect or prevent fraud, scams, phishing, or any
              specific outcome. Scores, labels, and AI summaries are estimates based on available signals and may be
              wrong, incomplete, or outdated. Always use your own judgment.
            </p>
          </Section>

          <Section id="user-responsibility" title="User responsibility">
            <p>
              You are solely responsible for decisions you make after using Fraudly — including whether to visit a
              site, share personal data, log in, download files, or pay a third party. We are not responsible for losses
              arising from your reliance on our outputs or from your interaction with third-party websites.
            </p>
          </Section>

          <Section id="intellectual-property" title="Intellectual property">
            <p>
              Fraudly’s name, branding, logos, text, graphics, software, models, and other materials are owned by us or
              our licensors and are protected by intellectual property laws. We grant you a limited, non-exclusive,
              non-transferable licence to use the service for personal, non-commercial purposes in line with these
              Terms. You may not copy, modify, distribute, or reverse engineer our technology except where the law
              allows without our consent.
            </p>
          </Section>

          <Section id="limitation-of-liability" title="Limitation of liability">
            <p>
              To the fullest extent permitted by applicable law, Fraudly and its operators, affiliates, and suppliers
              shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any
              loss of profits, data, goodwill, or business opportunities — whether based on contract, tort, or otherwise
              — arising from your use of or inability to use the service.
            </p>
            <p>
              Where liability cannot be excluded, our total aggregate liability for claims relating to the service in any
              twelve-month period is limited to the greater of (a) the amount you paid us for the service in that
              period, or (b) zero if the service was free.
            </p>
            <p>Some jurisdictions do not allow certain limitations; in those cases, our liability is limited to the maximum extent allowed by law.</p>
          </Section>

          <Section id="availability" title="Availability">
            <p>
              We aim to keep Fraudly available, but we do not promise uninterrupted access. The service may change, be
              updated, paused, or temporarily unavailable for maintenance, security, or operational reasons. We may add
              or remove features as the product evolves.
            </p>
          </Section>

          <Section id="third-party-services" title="Third-party services">
            <p>
              Fraudly may rely on or link to third-party services (for example hosting, AI providers, or data APIs). We do
              not control those services and are not responsible for their content, availability, accuracy, or terms. Your
              use of third-party sites is at your own risk and subject to their policies.
            </p>
          </Section>

          <Section id="termination" title="Termination">
            <p>
              We may suspend or terminate access to Fraudly — in whole or in part — if we reasonably believe you have
              breached these Terms, pose a security risk, or where required by law. You may stop using the service at any
              time. Provisions that by their nature should survive (such as liability limits and intellectual property)
              will survive termination.
            </p>
          </Section>

          <Section id="governing-law" title="Governing law">
            <p>
              These Terms are governed by the laws of the <strong>Netherlands</strong>, without regard to conflict-of-law
              rules that would apply another jurisdiction’s laws. Where mandatory EU consumer protections apply to you,
              those rights remain unaffected.
            </p>
            <p>
              Unless otherwise required by law, courts in the Netherlands shall have exclusive jurisdiction over
              disputes arising from these Terms — except that consumers may also bring claims in the courts of their
              country of residence where EU law gives them that right.
            </p>
          </Section>

          <Section id="changes" title="Changes to these terms">
            <p>
              We may update these Terms from time to time. The current version will always be posted on this page with an
              updated “Last updated” date. If changes are material, we will take reasonable steps to draw your attention
              to them (for example via the site). Continued use after the effective date of changes constitutes acceptance
              of the updated Terms, unless applicable law requires a different process.
            </p>
          </Section>

          <Section id="contact" title="Contact">
            <p>
              Questions about these Terms? Contact us at:{" "}
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
