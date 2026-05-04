import type { ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  path: "/cookies",
  titleSegment: "Cookie Policy",
  description:
    "Manage cookie preferences and learn how Fraudly uses necessary, analytics, and marketing cookies."
});

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-bold text-slate-900 md:text-xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700 md:text-base">{children}</div>
    </section>
  );
}

export default function CookiesPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:pt-14 md:pt-16">
        <header className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-blue-100 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
            Cookies
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Cookie Policy</h1>
          <p className="mt-3 text-sm text-slate-600">Last updated: {updated}</p>
        </header>

        <article className="mt-10 space-y-10 rounded-xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60 sm:mt-12 sm:p-8 md:mt-14 md:space-y-12">
          <Section id="overview" title="Overview">
            <p>
              This Cookie Policy explains how fraudly.app (“Fraudly”, “we”, “us”) uses cookies and similar technologies,
              what choices you have, and how to update your preferences. It should be read together with our{" "}
              <Link href="/privacy" className="font-medium text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </Section>

          <Section id="what-we-use" title="What we use cookies for">
            <p>Depending on your choices, we may use technologies for purposes such as:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Necessary:</strong> enabling core site functionality, security, fraud prevention basics, and
                remembering your cookie choices.
              </li>
              <li>
                <strong>Analytics:</strong> understanding aggregate usage to improve performance and product quality—only
                if you opt in.
              </li>
              <li>
                <strong>Marketing:</strong> measuring campaigns or enabling marketing features—only if you opt in.
              </li>
            </ul>
          </Section>

          <Section id="consent" title="Consent and preferences">
            <p>
              Optional analytics and marketing cookies are <strong>off by default</strong> until you allow them. You
              can accept all, reject non-essential categories, or manage categories in detail. You can reopen{" "}
              <strong>Cookie Settings</strong> anytime from the site footer.
            </p>
            <p>
              Your preferences are stored locally in your browser (for example using{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">localStorage</code>
              ). Clearing site data may reset preferences and show the banner again.
            </p>
          </Section>

          <Section id="third-parties" title="Third-party technologies">
            <p>
              If you enable optional categories, certain third-party tools may set or read their own cookies subject to
              their policies. We aim to only load those scripts after consent, so they do not run by default.
            </p>
          </Section>

          <Section id="changes" title="Changes">
            <p>
              We may update this Cookie Policy as Fraudly evolves. The latest version will always be published on this
              page with an updated “Last updated” date.
            </p>
          </Section>

          <Section id="contact" title="Contact">
            <p>
              Questions about cookies? Email{" "}
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
