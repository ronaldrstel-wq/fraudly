import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Terms — Fraudly",
  description: "Terms of use for the Fraudly scam-check MVP."
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Terms of use</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().toISOString().slice(0, 10)}</p>

        <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700">
          <p>
            Welcome to Fraudly. By using this website you agree to these MVP terms. If you do not agree, please do not
            use the service.
          </p>
          <p>
            <strong>Service description.</strong> Fraudly offers automated link risk estimates to help you decide
            whether a URL might be associated with scams, phishing, or deceptive practices. Results are estimates only and
            may be incomplete or incorrect. You remain responsible for your own decisions.
          </p>
          <p>
            <strong>No warranty.</strong> The service is provided “as is” without warranties of any kind, including
            accuracy, availability, or fitness for a particular purpose.
          </p>
          <p>
            <strong>Acceptable use.</strong> Do not misuse Fraudly to harass others, violate law, or probe systems you
            do not own or have permission to test. Do not submit highly sensitive personal data into the URL field.
          </p>
          <p>
            <strong>Limitation of liability.</strong> To the maximum extent permitted by law, Fraudly and its operators
            are not liable for any loss or damage arising from your use of the service or reliance on its output.
          </p>
          <p>
            <strong>Changes.</strong> We may update these terms or the product; continued use after changes constitutes
            acceptance of the updated terms.
          </p>
          <p>
            <strong>Contact.</strong>{" "}
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
