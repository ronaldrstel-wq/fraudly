import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy — Fraudly",
  description: "How Fraudly handles data and your privacy."
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-slate-900 transition hover:text-blue-600">
            ← Fraudly
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Privacy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().toISOString().slice(0, 10)}</p>

        <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700">
          <p>
            Fraudly helps you assess whether a link might be risky. This page describes our MVP approach to data
            and privacy.
          </p>
          <p>
            <strong>Not financial or legal advice.</strong> Fraudly provides automated risk estimates and explanations,
            not guarantees. Outcomes can be wrong; always use your own judgment before clicking links, signing in, or
            sending money.
          </p>
          <p>
            <strong>What we process.</strong> When you submit a URL for analysis, we process that URL and related
            technical metadata (for example, your IP address for rate limiting). Do not submit passwords, payment card
            numbers, government IDs, health information, or other sensitive personal data into Fraudly.
          </p>
          <p>
            <strong>Retention.</strong> In this MVP we aim to keep processing minimal. Specific retention periods may
            evolve as the product matures; we will update this page when they change.
          </p>
          <p>
            <strong>Contact.</strong> Questions about privacy:{" "}
            <a href="mailto:support@fraudly.app" className="font-medium text-blue-600 hover:underline">
              support@fraudly.app
            </a>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
