import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { PulseIntelligenceGrid } from "@/components/pulse/PulseIntelligenceGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { getFraudlyPulseStats, type PulseHighRiskFeedItem } from "@/lib/pulse/getFraudlyPulseStats";
import { getTrustCardChrome } from "@/lib/scoring/trust-bands";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  path: "/pulse",
  titleSegment: SEO_TITLE.pulse,
  description: SEO_DESCRIPTION.pulse
});

const PULSE_ROW_ACCENT = "before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r";

function PulseDetectionRow({ row }: { row: PulseHighRiskFeedItem }) {
  const chrome = getTrustCardChrome(row.score);
  return (
    <li
      className={`relative pl-3 ${PULSE_ROW_ACCENT} ${chrome.accentBar} ${chrome.cardShell} ${chrome.cardShellHover}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`break-all text-sm font-semibold ${chrome.headlineText}`}>{row.domain}</p>
          <p className="mt-1 text-xs text-slate-600">{row.reason}</p>
        </div>
        <div className="text-right">
          <p
            className={`inline-flex rounded-lg border px-2 py-1 text-xs font-semibold tabular-nums ${chrome.scorePill}`}
          >
            {row.score}
            <span className={`font-medium ${chrome.scorePillDim}`}> / 100</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">{row.checkedAt.toLocaleString("en-GB")}</p>
        </div>
      </div>
      <div className="mt-2">
        <Link href={row.href} className={`text-xs font-semibold underline underline-offset-2 ${chrome.cta}`}>
          View result →
        </Link>
      </div>
    </li>
  );
}

export default async function FraudlyPulsePage() {
  const stats = await getFraudlyPulseStats();
  const updatedAt = stats.generatedAt.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:pt-10 md:pt-12">
        <section className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 px-6 py-8 shadow-[0_10px_34px_rgba(15,23,42,0.08)] sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Fraud intelligence</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Fraudly Pulse</h1>
          <p className="mt-3 max-w-3xl text-base text-slate-700">
            Live scam intelligence from public website checks, scam alerts, and trust signals.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
            Fraudly Pulse surfaces compact signals from recent checks and published alerts. Patterns update as more data is
            collected—they are informational, not proof that any site is unsafe.
          </p>
          <p className="mt-2 text-xs text-slate-500">Last updated {updatedAt} UTC</p>
        </section>

        <div className="mt-8">
          <PulseIntelligenceGrid tiles={stats.intelligenceTiles} />
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Live high-risk detections</h2>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-600">
            Recent public checks with strong risk indicators. Tap through for the full trust breakdown.
          </p>
          {stats.recentHighRiskDetections.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No high-risk detections found in this period.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.recentHighRiskDetections.map((row) => (
                <PulseDetectionRow key={row.id} row={row} />
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
