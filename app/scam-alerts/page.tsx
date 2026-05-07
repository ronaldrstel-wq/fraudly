import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { listPublishedScamAlerts } from "@/lib/scam-alerts/service";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 10800;

export const metadata: Metadata = {
  title: "Latest Scam Alerts",
  description:
    "Recent phishing, impersonation, crypto scam, and fake refund alerts detected from public threat sources and Fraudly scan trends.",
  alternates: { canonical: `${SITE_URL}/scam-alerts` },
  openGraph: {
    title: "Latest Scam Alerts | Fraudly",
    description:
      "Recent phishing, impersonation, crypto scam, and fake refund alerts detected from public threat sources and Fraudly scan trends.",
    url: `${SITE_URL}/scam-alerts`,
    type: "website"
  }
};

function riskTone(level: string): string {
  if (level === "critical") return "bg-rose-50 text-rose-700 border-rose-200";
  if (level === "high") return "bg-orange-50 text-orange-700 border-orange-200";
  if (level === "medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default async function ScamAlertsPage() {
  const alerts = await listPublishedScamAlerts(60);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-blue-700">Scam Watch</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Latest Scam Alerts</h1>
          <p className="mt-4 text-sm text-slate-600 md:text-base">
            Recent phishing, impersonation, crypto scam, and fake refund alerts detected from public threat sources and
            Fraudly scan trends.
          </p>
        </header>

        <section className="mt-8 space-y-3">
          {alerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
              No published scam alerts yet. This feed refreshes every 3 hours.
            </div>
          ) : (
            alerts.map((alert) => (
              <article key={alert.slug} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${riskTone(alert.riskLevel)}`}>
                    {alert.riskLevel.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500">{alert.scamType}</span>
                  <span className="text-xs text-slate-500">{new Date(alert.generatedAt).toLocaleString("en")}</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  <Link href={`/scam-alerts/${alert.slug}`} className="hover:underline">
                    {alert.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-slate-700">{alert.summary}</p>
                <p className="mt-2 text-xs text-slate-500">Evidence signals: {alert.evidenceCount}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {alert.safetyTips.slice(0, 2).map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </section>

        <div className="mt-8">
          <Link
            href="/#link-check"
            className="inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Check a suspicious website
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
