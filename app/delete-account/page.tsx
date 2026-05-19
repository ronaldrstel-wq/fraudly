import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";

const SUPPORT_EMAIL = "support@fraudly.app";
const DELETE_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Delete Account")}`;

export const metadata: Metadata = buildPageMetadata({
  path: "/delete-account",
  titleSegment: SEO_TITLE.deleteAccount,
  description: SEO_DESCRIPTION.deleteAccount
});

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:pt-14 md:pt-16">
        <header className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-blue-100 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
            Account
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Delete your Fraudly account
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 md:text-base">
            You can request permanent deletion of your Fraudly account and the personal data we associate with it. This
            page explains how to submit a request—no sign-in required.
          </p>
        </header>

        <article className="mt-10 space-y-8 rounded-xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60 sm:mt-12 sm:p-8 md:mt-14">
          <section className="space-y-3 text-sm leading-relaxed text-slate-700 md:text-base">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">How to request deletion</h2>
            <p>
              Email us at{" "}
              <a href={DELETE_MAILTO} className="font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2">
                {SUPPORT_EMAIL}
              </a>{" "}
              with the subject line <strong className="font-semibold text-slate-900">Delete Account</strong>. Please
              include the email address you used to sign up for Fraudly so we can locate your account.
            </p>
            <p>
              We process verified deletion requests within <strong className="font-semibold text-slate-900">30 days</strong>.
              We may contact you if we need to confirm your identity before completing the request.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-slate-700 md:text-base">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">What happens after deletion</h2>
            <p>
              When your request is completed, we delete or anonymize personal data linked to your account, such as your
              profile and private scan history, subject to applicable law.
            </p>
            <p>
              Some limited records may be retained where we are legally required or permitted to do so—for example
              transaction records, fraud-prevention logs, security incident records, or data needed to resolve disputes
              or comply with regulatory obligations.
            </p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-slate-700 md:text-base">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">App store subscriptions</h2>
            <p>
              Deleting your Fraudly account does <strong className="font-semibold text-slate-900">not</strong>{" "}
              automatically cancel an active subscription purchased through the Apple App Store or Google Play. You must
              cancel subscriptions in your Apple or Google Play account settings. Fraudly cannot cancel store billing on
              your behalf.
            </p>
          </section>

          <div className="flex flex-col items-stretch gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={DELETE_MAILTO}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-md hover:brightness-110"
            >
              Email deletion request
            </a>
            <p className="text-center text-xs text-slate-500 sm:text-right">
              <Link href="/privacy" className="font-medium text-blue-600 underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              {" · "}
              <Link href="/terms" className="font-medium text-blue-600 underline-offset-2 hover:underline">
                Terms of Service
              </Link>
            </p>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
