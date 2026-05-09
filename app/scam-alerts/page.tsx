import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/seo";
import { listPublishedScamAlerts, listPublishedScamTypes } from "@/lib/scam-alerts/service";

export const revalidate = 300;

type PageProps = {
  searchParams: Promise<{ type?: string }>;
};

const typeBadgeTone: Record<string, string> = {
  phishing: "bg-rose-50 text-rose-700 border-rose-200",
  "fake shop": "bg-orange-50 text-orange-700 border-orange-200",
  "brand impersonation": "bg-purple-50 text-purple-700 border-purple-200",
  malware: "bg-amber-50 text-amber-700 border-amber-200",
  "suspicious domain": "bg-slate-100 text-slate-700 border-slate-300"
};

function toneForType(scamType: string): string {
  return typeBadgeTone[scamType.toLowerCase()] ?? "bg-slate-100 text-slate-700 border-slate-300";
}

function confidenceTone(confidence: number): string {
  if (confidence >= 85) return "bg-rose-100 text-rose-800";
  if (confidence >= 70) return "bg-orange-100 text-orange-800";
  if (confidence >= 50) return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-700";
}

export const metadata: Metadata = {
  title: "Latest Scam Alerts | Fraudly",
  description: "View recent scam, phishing, fake webshop and suspicious domain alerts detected from public signals.",
  alternates: { canonical: `${SITE_URL}/scam-alerts` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Latest Scam Alerts | Fraudly",
    description: "View recent scam, phishing, fake webshop and suspicious domain alerts detected from public signals.",
    url: `${SITE_URL}/scam-alerts`,
    type: "website"
  }
};

export default async function ScamAlertsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedType = typeof params.type === "string" ? params.type : "";
  const [types, alerts] = await Promise.all([
    listPublishedScamTypes(),
    listPublishedScamAlerts({ scamType: selectedType || undefined, take: 100 })
  ]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-blue-700">Public intelligence</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Latest scam alerts</h1>
          <p className="mt-3 text-base text-slate-600">
            Recent phishing and scam indicators collected from public threat intelligence and normalized into concise alerts.
          </p>
          <p className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            Fraudly uses public signals and automated analysis. Always verify before taking action.
          </p>
        </header>

        <nav className="mt-6 flex flex-wrap gap-2 text-sm">
          <Link
            href="/scam-alerts"
            className={`rounded-full border px-3 py-1.5 ${selectedType ? "border-slate-200 bg-white text-slate-700" : "border-blue-300 bg-blue-50 text-blue-700"}`}
          >
            All types
          </Link>
          {types.map((type) => (
            <Link
              key={type}
              href={`/scam-alerts?type=${encodeURIComponent(type)}`}
              className={`rounded-full border px-3 py-1.5 ${selectedType === type ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"}`}
            >
              {type}
            </Link>
          ))}
        </nav>

        {alerts.length === 0 ? (
          <section className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <h2 className="text-xl font-semibold text-slate-900">No alerts yet</h2>
            <p className="mt-2 text-sm text-slate-600">
              There are currently no published alerts for this filter. Check back soon as public feeds update daily.
            </p>
            <Link
              href="/#link-check"
              className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110"
            >
              Check a website now
            </Link>
          </section>
        ) : (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert) => (
              <article key={alert.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneForType(alert.scamType)}`}>
                    {alert.scamType}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${confidenceTone(alert.confidence)}`}>
                    Confidence {alert.confidence}%
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold leading-snug text-slate-900">{alert.title}</h2>
                <p className="mt-2 text-sm text-slate-700">{alert.summary}</p>
                <ul className="mt-3 space-y-1 text-xs text-slate-600">
                  {alert.affectedBrand ? <li>Brand: {alert.affectedBrand}</li> : null}
                  {alert.domain ? <li>Domain: {alert.domain}</li> : null}
                  <li>Source: {alert.sourceName}</li>
                  <li>Published: {(alert.publishedAt ?? alert.lastSeenAt).toLocaleString("en")}</li>
                </ul>
                <Link href={`/scam-alerts/${alert.slug}`} className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900">
                  View full alert →
                </Link>
              </article>
            ))}
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
