import type { PublicScamAlertListItem, ScamAlertsPublicFilter, ScamAlertsTimeWindow } from "@/lib/scam-alerts/service";

export type ListFilterKey = ScamAlertsPublicFilter;
export type { ScamAlertsTimeWindow };

export type AlertSeverity = "critical" | "high" | "suspicious" | "monitoring";

export type AlertSeverityPresentation = {
  severity: AlertSeverity;
  label: string;
  badge: string;
  accessibleDescription: string;
  badgeClass: string;
};

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;

function utcStartOfDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/** Adjusted score 0–100 for severity (confidence + evidence + recency + type hints). */
export function computeSeverityScore(
  alert: Pick<PublicScamAlertListItem, "confidence" | "evidenceCount" | "publishedAt" | "lastSeenAt" | "scamType">,
  now: Date = new Date()
): number {
  let score = Math.max(0, Math.min(100, alert.confidence));
  score += Math.min(10, Math.floor(alert.evidenceCount / 3));
  const ref = alert.publishedAt ?? alert.lastSeenAt;
  if (now.getTime() - ref.getTime() < 36 * MS_HOUR) score += 4;
  const t = alert.scamType.toLowerCase();
  if ((t.includes("phish") || t.includes("malware") || t.includes("trojan")) && score < 92) score += 3;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function severityFromScore(score: number): AlertSeverity {
  if (score >= 90) return "critical";
  if (score >= 75) return "high";
  if (score >= 55) return "suspicious";
  return "monitoring";
}

export function deriveAlertSeverity(
  alert: Pick<PublicScamAlertListItem, "confidence" | "evidenceCount" | "publishedAt" | "lastSeenAt" | "scamType">,
  now: Date = new Date()
): AlertSeverityPresentation {
  const score = computeSeverityScore(alert, now);
  const severity = severityFromScore(score);
  const map: Record<AlertSeverity, Omit<AlertSeverityPresentation, "severity">> = {
    critical: {
      label: "Critical",
      badge: "Critical",
      accessibleDescription: "Critical severity: very high confidence or strong corroborating signals.",
      badgeClass:
        "border-rose-300 bg-rose-50 text-rose-900 ring-1 ring-rose-200 px-1.5 py-0.5 text-[10px] leading-tight sm:px-2 sm:py-0.5 sm:text-xs"
    },
    high: {
      label: "High risk",
      badge: "High risk",
      accessibleDescription: "High risk: elevated confidence from public threat data.",
      badgeClass: "border-orange-300 bg-orange-50 text-orange-900 ring-1 ring-orange-200"
    },
    suspicious: {
      label: "Caution",
      badge: "Caution",
      accessibleDescription: "Caution: worth double-checking until you can verify the source.",
      badgeClass: "border-amber-300 bg-amber-50 text-amber-900 ring-1 ring-amber-200"
    },
    monitoring: {
      label: "Monitoring",
      badge: "Monitoring",
      accessibleDescription: "Monitoring: lower confidence; still worth awareness.",
      badgeClass: "border-slate-300 bg-slate-50 text-slate-800 ring-1 ring-slate-200"
    }
  };
  return { severity, ...map[severity] };
}

export function consumerAlertTitle(alert: Pick<PublicScamAlertListItem, "scamType" | "title">): string {
  const t = alert.scamType.toLowerCase();
  if (t.includes("malware") || t.includes("trojan") || t.includes("virus")) {
    return "Possible malware website detected";
  }
  if (t.includes("phish")) {
    return "Possible phishing page found";
  }
  if (t.includes("fake") && t.includes("shop")) {
    return "Possible fake store reported";
  }
  if (t.includes("brand") || t.includes("impersonat")) {
    return "Possible brand impersonation reported";
  }
  if (t.includes("suspicious") || t.includes("domain")) {
    return "Domain flagged by public scam intelligence feeds";
  }
  if (t.includes("url") || alert.title.toLowerCase().includes("url")) {
    return "Known malicious URL reported";
  }
  return "Website flagged by public threat intelligence feeds";
}

export function whyThisMattersLine(alert: Pick<PublicScamAlertListItem, "scamType" | "domain" | "sourceName">): string {
  const t = alert.scamType.toLowerCase();
  const domainBit = alert.domain ? ` (${alert.domain})` : "";
  if (t.includes("malware")) {
    return `This address has appeared in public malware-related lists${domainBit}. Avoid downloading files or entering passwords until you are sure who sent the link.`;
  }
  if (t.includes("phish")) {
    return `This page resembles a scam or login trap seen in public phishing feeds${domainBit}. Do not enter credentials unless you opened the site yourself from a trusted source.`;
  }
  if (t.includes("fake") && t.includes("shop")) {
    return `This shop-like site has been flagged as suspicious. Take extra care with payments and refunds before you buy.`;
  }
  if (t.includes("brand") || t.includes("impersonat")) {
    return `Public signals suggest this site may be impersonating a known brand. Double-check the web address with the company’s official channels.`;
  }
  return `Fraudly matched this entry to public threat data from ${alert.sourceName}. Treat unexpected links with caution until you verify the sender.`;
}

/** e.g. "9 May 2026" for alert cards. */
export function formatPublishedDateLongEn(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function formatRelativeTimeEn(date: Date, now: Date = new Date()): { label: string; title: string } {
  const title = date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diffSec = (date.getTime() - now.getTime()) / 1000;
  const absSec = Math.abs(diffSec);
  const sign = diffSec < 0 ? -1 : 1;

  if (absSec < 60) return { label: rtf.format(Math.round(diffSec), "second"), title };
  if (absSec < 3600) return { label: rtf.format(sign * Math.round(absSec / 60), "minute"), title };
  if (absSec < MS_DAY / 1000) return { label: rtf.format(sign * Math.round(absSec / 3600), "hour"), title };
  if (absSec < 7 * (MS_DAY / 1000)) return { label: rtf.format(sign * Math.round(absSec / 86400), "day"), title };
  if (absSec < 30 * (MS_DAY / 1000)) return { label: rtf.format(sign * Math.round(absSec / (86400 * 7)), "week"), title };
  if (absSec < 365 * (MS_DAY / 1000)) return { label: rtf.format(sign * Math.round(absSec / (86400 * 30)), "month"), title };
  return { label: rtf.format(sign * Math.round(absSec / (86400 * 365)), "year"), title };
}

/** Normalize domain for “related” hints (best-effort; not a full PSL parser). */
export function clusterDomainKey(domain: string | null | undefined): string | null {
  if (!domain) return null;
  const d = domain.toLowerCase().replace(/^www\./, "").replace(/\.$/, "").trim();
  return d.length > 0 ? d : null;
}

function isNewToday(alert: PublicScamAlertListItem, now: Date): boolean {
  const start = utcStartOfDay(now);
  const ref = alert.publishedAt ?? alert.lastSeenAt;
  return ref.getTime() >= start.getTime();
}

export function alertMatchesListFilter(
  alert: PublicScamAlertListItem,
  filter: ListFilterKey,
  now: Date = new Date()
): boolean {
  if (filter === "all") return true;
  const sev = deriveAlertSeverity(alert, now).severity;
  const t = alert.scamType.toLowerCase();
  /** Aligns with DB filter `confidence >= 75` for the index. */
  if (filter === "high") return alert.confidence >= 75 || sev === "critical" || sev === "high";
  if (filter === "phishing") return t.includes("phish");
  if (filter === "malware") return t.includes("malware") || t.includes("trojan") || t.includes("virus");
  if (filter === "new-today") return isNewToday(alert, now);
  return true;
}

export function filterPublishedAlerts(
  alerts: PublicScamAlertListItem[],
  options: { type?: string; filter: ListFilterKey; now?: Date }
): PublicScamAlertListItem[] {
  const now = options.now ?? new Date();
  const type = options.type?.trim().toLowerCase();
  return alerts.filter((a) => {
    if (type && a.scamType.toLowerCase() !== type) return false;
    return alertMatchesListFilter(a, options.filter, now);
  });
}

const LEGACY_FILTER_MAP: Record<string, ListFilterKey> = {
  critical: "high"
};

export function parseListFilterKey(raw: string | undefined): ListFilterKey {
  const allowed: ListFilterKey[] = ["all", "high", "phishing", "malware", "new-today"];
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (LEGACY_FILTER_MAP[v]) return LEGACY_FILTER_MAP[v];
  return (allowed.includes(v as ListFilterKey) ? v : "all") as ListFilterKey;
}

export function parseScamAlertsTimeWindow(raw: string | undefined): ScamAlertsTimeWindow {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (v === "24h" || v === "last-24h" || v === "last24h") return "24h";
  if (v === "7d" || v === "week" || v === "last-7-days") return "7d";
  if (v === "all") return "all";
  if (v === "today" || v === "") return "today";
  return "today";
}

export function parseScamAlertsPageParam(raw: string | string[] | undefined): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(String(s ?? "1"), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 10_000);
}

export function buildScamAlertsQuery(base: {
  filter?: ListFilterKey;
  type?: string;
  page?: number;
  time?: ScamAlertsTimeWindow;
}): string {
  const p = new URLSearchParams();
  if (base.time && base.time !== "today") p.set("time", base.time);
  if (base.filter && base.filter !== "all") p.set("filter", base.filter);
  if (base.type?.trim()) p.set("type", base.type.trim());
  if (base.page !== undefined && base.page > 1) p.set("page", String(base.page));
  const s = p.toString();
  return s ? `?${s}` : "";
}
