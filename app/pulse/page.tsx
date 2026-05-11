import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { getFraudlyPulseStats, type PulseKpi, type PulseRankItem, type PulseTrendBucket } from "@/lib/pulse/getFraudlyPulseStats";
import { publicRobots } from "@/lib/seo";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fraudly Pulse | Live fraud trends and website risk insights",
  description:
    "Explore live fraud trends, suspicious website patterns, high-risk detections, impersonated brands, and public trust intelligence from Fraudly.",
  robots: publicRobots
};

function reliabilityChip(level: "reliable" | "limited" | "building") {
  if (level === "reliable") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (level === "limited") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function ReliabilityText({ level }: { level: "reliable" | "limited" | "building" }) {
  const label = level === "reliable" ? "Reliable" : level === "limited" ? "Limited data" : "Building";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${reliabilityChip(level)}`}>{label}</span>;
}

function KpiCard({ kpi, icon }: { kpi: PulseKpi; icon: string }) {
  return (
    <article className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{kpi.title}</p>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 text-base text-blue-700">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{kpi.value}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{kpi.explanation}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <ReliabilityText level={kpi.reliability} />
        <p className="text-[11px] text-slate-500">{kpi.trend ?? "Trend data is building."}</p>
      </div>
    </article>
  );
}

function RankedList({ title, items, empty }: { title: string; items: PulseRankItem[]; empty: string }) {
  const max = items.reduce((m, row) => Math.max(m, row.count), 0);
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
      {items.length === 0 ? <p className="mt-3 text-sm text-slate-600">{empty}</p> : null}
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-800">{item.label}</span>
              <span className="font-semibold tabular-nums text-slate-700">{item.count}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                style={{ width: `${max > 0 ? Math.max(8, Math.round((item.count / max) * 100)) : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TrendChart({ buckets }: { buckets: PulseTrendBucket[] }) {
  const last30 = buckets.slice(-30);
  const enough = last30.filter((b) => b.checks > 0).length >= 7;
  if (!enough) {
    return (
      <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Trend graphs</h2>
        <p className="mt-3 text-sm text-slate-600">Trend data is building as more checks are completed.</p>
      </section>
    );
  }
  const maxValue = last30.reduce((m, row) => Math.max(m, row.checks, row.suspicious, row.highRisk, row.alerts), 1);
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">Trend graphs</h2>
      <p className="mt-2 text-xs text-slate-600">
        Trends are grouped by day and only shown when enough data exists to avoid misleading conclusions.
      </p>
      <div className="mt-4 grid gap-2">
        {last30.map((row) => (
          <div key={row.day} className="grid grid-cols-[86px_1fr] items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">{row.day.slice(5)}</span>
            <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="bg-blue-500/70" style={{ width: `${Math.round((row.checks / maxValue) * 100)}%` }} />
              <div className="bg-amber-400/70" style={{ width: `${Math.round((row.suspicious / maxValue) * 100)}%` }} />
              <div className="bg-rose-500/70" style={{ width: `${Math.round((row.highRisk / maxValue) * 100)}%` }} />
              <div className="bg-violet-500/70" style={{ width: `${Math.round((row.alerts / maxValue) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> checks
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> suspicious
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> high-risk
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-violet-500" /> alerts
        </span>
      </div>
    </section>
  );
}

export default async function FraudlyPulsePage() {
  const stats = await getFraudlyPulseStats();
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:pt-10 md:pt-12">
        <section className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white to-slate-50 px-6 py-8 shadow-[0_10px_34px_rgba(15,23,42,0.08)] sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Fraud intelligence</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Fraudly Pulse</h1>
          <p className="mt-3 max-w-3xl text-base text-slate-700">
            Live fraud intelligence from public website checks, scam alerts, and trust signals.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
            Fraudly Pulse shows patterns from recent checks and public threat signals. These insights are informational and may
            change as new data is collected.
          </p>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-500">
            Statistics are based on available Fraudly scan data and public signals. They are not proof that every listed site or
            category is unsafe.
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard kpi={stats.kpis.websitesCheckedToday} icon="◴" />
          <KpiCard kpi={stats.kpis.suspiciousPercentage} icon="△" />
          <KpiCard kpi={stats.kpis.highRiskPercentage} icon="!" />
          <KpiCard kpi={stats.kpis.newScamDomainsDetected} icon="◎" />
          <KpiCard kpi={stats.kpis.averageRiskyDomainAgeDays} icon="⌛" />
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <RankedList
            title="Most impersonated brands"
            items={stats.mostImpersonatedBrands}
            empty="Brand impersonation data is building."
          />
          <RankedList
            title="Most common scam categories"
            items={stats.mostCommonScamCategories}
            empty="Not enough category data yet."
          />
          <RankedList
            title="Top hosting countries for risky sites"
            items={stats.topHostingCountries}
            empty="Hosting country data is not available for enough checks yet."
          />
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Live feed of recent high-risk detections</h2>
          <p className="mt-2 text-xs text-slate-600">
            Recent public checks with strong risk indicators. Insights update as new scans are published.
          </p>
          {stats.recentHighRiskDetections.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No high-risk detections found in this period.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.recentHighRiskDetections.map((row) => (
                <li key={row.id} className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-all text-sm font-semibold text-slate-900">{row.domain}</p>
                      <p className="mt-1 text-xs text-slate-600">{row.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-800">
                        Trust score {row.score}/100
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">{row.checkedAt.toLocaleString("en-GB")}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Link href={row.href} className="text-xs font-semibold text-blue-700 underline underline-offset-2">
                      View result →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-8">
          <TrendChart buckets={stats.trendBuckets} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
