import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { getTrustCardChrome } from "@/lib/scoring/trust-bands";
import { getFraudlyPulseStats, type PulseHighRiskFeedItem, type PulseKpi, type PulseRankItem, type PulseTrendBucket } from "@/lib/pulse/getFraudlyPulseStats";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const revalidate = 300;
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  path: "/pulse",
  titleSegment: SEO_TITLE.pulse,
  description: SEO_DESCRIPTION.pulse
});

function reliabilityChip(level: "reliable" | "limited" | "building") {
  if (level === "reliable") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (level === "limited") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function ReliabilityText({ level }: { level: "reliable" | "limited" | "building" }) {
  const label = level === "reliable" ? "Reliable" : level === "limited" ? "Limited data" : "Building";
  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${reliabilityChip(level)}`}
    >
      {label}
    </span>
  );
}

function kpiValueIsLongForm(value: string): boolean {
  if (value.includes("Not enough")) return true;
  if (value.length > 14) return true;
  return /\s/.test(value) && value.length > 6;
}

function KpiCard({ kpi, icon }: { kpi: PulseKpi; icon: string }) {
  const longValue = kpiValueIsLongForm(kpi.value);
  const supporting = kpi.trend ?? "Trend data is building.";

  return (
    <article className="flex h-full min-h-[15.25rem] flex-col rounded-2xl border border-slate-200/70 bg-white/95 p-4 pb-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:min-h-[15.75rem] sm:p-5 sm:pb-5">
      <header className="flex items-start justify-between gap-2.5">
        <p className="min-w-0 flex-1 text-balance text-sm font-semibold leading-snug text-slate-900">{kpi.title}</p>
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 text-base text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
          aria-hidden
        >
          {icon}
        </span>
      </header>

      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        <p
          className={
            longValue
              ? "text-[0.95rem] font-semibold leading-snug tracking-tight text-slate-800 sm:text-base"
              : "text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-[1.65rem]"
          }
        >
          {kpi.value}
        </p>
        <p className="mt-2.5 text-xs leading-relaxed text-slate-600">{kpi.explanation}</p>
      </div>

      <footer className="mt-auto border-t border-slate-200/55 pt-3">
        <div className="flex flex-col gap-2">
          <ReliabilityText level={kpi.reliability} />
          <p className="min-w-0 text-[11px] leading-snug text-slate-500">{supporting}</p>
        </div>
      </footer>
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

function pulseDayTotal(row: PulseTrendBucket): number {
  return row.checks + row.suspicious + row.highRisk + row.alerts;
}

function TrendChart({ buckets }: { buckets: PulseTrendBucket[] }) {
  const last30 = buckets.slice(-30);
  const enough = last30.filter((b) => b.checks > 0).length >= 7;
  if (!enough) {
    return (
      <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Activity timeline</h2>
        <p className="mt-3 text-sm text-slate-600">Trend data is building as more checks are completed.</p>
      </section>
    );
  }

  const maxDayTotal = Math.max(1, ...last30.map((r) => pulseDayTotal(r)));
  const maxAlerts = last30.reduce((m, r) => Math.max(m, r.alerts), 0);
  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] md:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">Activity timeline</h2>
      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-600">
        Daily mix of public checks, suspicious or high-risk signals, and published scam alerts. Bars scale to the busiest day
        in this window; days with no activity show the date only.
      </p>

      <div className="mt-5 overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <div className="min-w-[min(100%,320px)] divide-y divide-slate-100/80 sm:min-w-0">
          {last30.map((row) => {
            const hasActivity =
              row.checks > 0 || row.suspicious > 0 || row.highRisk > 0 || row.alerts > 0;
            const dayTotal = pulseDayTotal(row);
            const isToday = row.day === todayKey;
            const barWidthPct = hasActivity ? Math.max(10, Math.round((dayTotal / maxDayTotal) * 100)) : 0;
            const alertHeavy = row.alerts > 0 && maxAlerts > 0 && row.alerts >= Math.max(2, Math.ceil(maxAlerts * 0.45));
            const tooltip = `Checks: ${row.checks} · Suspicious: ${row.suspicious} · High-risk: ${row.highRisk} · Alerts: ${row.alerts}`;

            return (
              <div
                key={row.day}
                className={`group grid grid-cols-[minmax(3.25rem,auto)_1fr] items-center gap-x-2.5 sm:grid-cols-[4.5rem_1fr] ${
                  isToday ? "bg-gradient-to-r from-blue-50/45 via-transparent to-transparent" : ""
                } ${hasActivity ? "py-2.5" : "py-1"}`}
              >
                <div className="flex min-h-[1.25rem] flex-col justify-center">
                  <span
                    className={`text-[11px] tabular-nums tracking-tight ${isToday ? "font-semibold text-blue-800" : hasActivity ? "font-medium text-slate-600" : "text-slate-400"}`}
                    title={row.day}
                  >
                    {row.day.slice(5)}
                  </span>
                  {isToday ? (
                    <span className="text-[9px] font-semibold uppercase tracking-wide text-blue-600/90">Today</span>
                  ) : null}
                </div>

                {hasActivity ? (
                  <div className="min-w-0">
                    <div
                      title={tooltip}
                      className={`fraudly-motion relative w-full transition-opacity duration-200 ease-out group-hover:opacity-95 ${
                        alertHeavy
                          ? "rounded-full shadow-[0_0_22px_rgba(139,92,246,0.22)] ring-1 ring-violet-300/40"
                          : "rounded-full ring-1 ring-slate-200/45"
                      }`}
                    >
                      <div
                        className="motion-safe:animate-pulse-timeline-bar flex h-3.5 origin-left overflow-hidden rounded-full transition-[height,box-shadow] duration-200 ease-out group-hover:h-4 group-hover:shadow-md sm:h-4 sm:group-hover:h-[1.125rem]"
                        style={{ width: `${barWidthPct}%` }}
                      >
                        {row.checks > 0 ? (
                          <div
                            className="bg-gradient-to-b from-blue-500 to-blue-600 transition-[filter] duration-200 group-hover:brightness-105"
                            style={{ width: `${(row.checks / dayTotal) * 100}%` }}
                          />
                        ) : null}
                        {row.suspicious > 0 ? (
                          <div
                            className="bg-gradient-to-b from-amber-400 to-amber-500 transition-[filter] duration-200 group-hover:brightness-105"
                            style={{ width: `${(row.suspicious / dayTotal) * 100}%` }}
                          />
                        ) : null}
                        {row.highRisk > 0 ? (
                          <div
                            className="bg-gradient-to-b from-rose-500 to-rose-600 transition-[filter] duration-200 group-hover:brightness-105"
                            style={{ width: `${(row.highRisk / dayTotal) * 100}%` }}
                          />
                        ) : null}
                        {row.alerts > 0 ? (
                          <div
                            className="bg-gradient-to-b from-violet-500 to-violet-600 transition-[filter] duration-200 group-hover:brightness-105"
                            style={{ width: `${(row.alerts / dayTotal) * 100}%` }}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="min-w-0" aria-hidden />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm shadow-blue-500/30" />
          Checks
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm shadow-amber-400/25" />
          Suspicious
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 shadow-sm shadow-rose-500/25" />
          High-risk
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 shadow-sm shadow-violet-500/30" />
          Alerts
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

        <section className="mt-6 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                <PulseDetectionRow key={row.id} row={row} />
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
