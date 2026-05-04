import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Disclaimer — Fraudly",
  description: "Important limitations of fraudly.app: informational use only, no guarantees, and no professional advice."
};

function Section({
  id,
  title,
  children
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-bold text-slate-900 md:text-xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700 md:text-base">{children}</div>
    </section>
  );
}

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:pt-14 md:pt-16">
        <header className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-blue-100 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
            Legal
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Disclaimer</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 md:text-base">
            Please read this page carefully. It explains what fraudly.app is — and what it is not.
          </p>
        </header>

        <article className="mt-10 space-y-10 rounded-xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60 sm:mt-12 sm:p-8 md:mt-14 md:space-y-12">
          <Section id="general-information" title="General Information">
            <p>
              The information and functionalities provided by fraudly.app are intended as general support for
              identifying, assessing, and preventing potential fraud. While we strive to provide accurate and up-to-date
              information, we do not guarantee that all information is complete, accurate, or current.
            </p>
          </Section>

          <Section id="no-professional-advice" title="No Professional Advice">
            <p>
              fraudly.app does not provide legal, financial, or professional advice. Any decisions you make based on
              information or results from fraudly.app are made at your own risk. If in doubt, always consult a qualified
              professional.
            </p>
          </Section>

          <Section id="no-guarantees" title="No Guarantees">
            <p>
              We do not guarantee that fraudly.app will detect or prevent all forms of fraud, scams, or risks. The use
              of fraudly.app does not replace your own judgment, independent research, or professional advice.
            </p>
          </Section>

          <Section id="use-at-your-own-risk" title="Use at Your Own Risk">
            <p>
              You use fraudly.app voluntarily. Outcomes are informational and may be incomplete or incorrect. You
              remain responsible for your own decisions when visiting websites, sharing personal data, or making
              purchases.
            </p>
          </Section>

          <Section id="limitation-of-liability" title="Limitation of Liability">
            <p>
              To the fullest extent permitted by law, fraudly.app shall not be held liable for any direct or indirect
              damages, losses, missed opportunities, incorrect decisions, or other consequences resulting from the use
              of the website, app, information, or tools.
            </p>
          </Section>

          <Section id="third-party-services" title="Third-Party Services">
            <p>
              fraudly.app may contain links to external websites or rely on third-party services. We are not responsible
              for the content, availability, functionality, or privacy practices of such external parties.
            </p>
          </Section>

          <Section id="changes" title="Changes to This Disclaimer">
            <p>
              We reserve the right to update or modify this disclaimer at any time. The most current version will
              always be available on this page.
            </p>
          </Section>

          <Section id="contact" title="Contact">
            <p>
              If you have any questions about this disclaimer, please contact us at:{" "}
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
