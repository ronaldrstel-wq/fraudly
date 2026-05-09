import type { DomainIntelligence } from "@/lib/checks/types";
import { detectFakeWebshopSignals } from "@/lib/fake-webshop/detect";
import { detectSocialAdRisk } from "@/lib/social-ad/detect";
import type { TrustEvidenceBundle, TrustEvidenceSection, TrustEvidenceSignalChip, WebsiteAnalysisClientEvidence } from "@/lib/evidence/types";
import { hasMeaningfulClientEvidence } from "@/lib/evidence/types";

const TOTAL_DELTA_CAP = 35;
const TOTAL_DELTA_FLOOR = -10;

/** Exported for unit tests: combined evidence delta after global cap. */
export function combineEvidenceDeltas(webshop: number, social: number, image: number): number {
  const rawTotal = webshop + social + image;
  return Math.round(Math.min(TOTAL_DELTA_CAP, Math.max(TOTAL_DELTA_FLOOR, rawTotal)));
}

function mapSeverity(s: "low" | "medium" | "high"): TrustEvidenceSignalChip["severity"] {
  return s;
}

function impactFromSignals(signals: TrustEvidenceSignalChip[]): TrustEvidenceSection["impactLevel"] {
  if (signals.some((s) => s.severity === "high")) return "high";
  if (signals.some((s) => s.severity === "medium")) return "medium";
  return "low";
}

function inferPaymentsFromText(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  if (/\bvisa\b/i.test(text)) found.push("visa");
  if (/\bmastercard\b/i.test(text)) found.push("mastercard");
  if (/\bpaypal\b/i.test(text)) found.push("paypal");
  if (/\b(bitcoin|btc|ethereum|eth|usdt)\b/i.test(lower)) found.push("crypto");
  if (/\b(wire transfer|bank transfer)\b/i.test(lower)) found.push("bank_transfer");
  if (/\bideal\b/i.test(lower)) found.push("ideal");
  return found;
}

export function composeTrustEvidenceBundle(options: {
  canonicalUrl: string;
  normalizedDomain: string;
  websiteText: string;
  htmlSnippet?: string;
  domainIntelligence: DomainIntelligence;
  evidence: WebsiteAnalysisClientEvidence;
}): TrustEvidenceBundle | null {
  if (!hasMeaningfulClientEvidence(options.evidence)) return null;

  const ev = options.evidence;
  const imageDeltaRaw = typeof ev.imageAnalysis?.riskDelta === "number" ? ev.imageAnalysis.riskDelta : 0;
  const imageDelta = Math.max(0, Math.min(15, Math.round(imageDeltaRaw)));

  const webshop = detectFakeWebshopSignals({
    url: options.canonicalUrl,
    html: options.htmlSnippet,
    domainAgeDays: options.domainIntelligence.ageDays ?? null,
    pageText: options.websiteText,
    priceText: null,
    hasReviews: null,
    paymentMethods: inferPaymentsFromText(`${options.websiteText}\n${options.htmlSnippet ?? ""}`),
    socialPlatform: ev.sourcePlatform ?? null,
    adText: ev.adText ?? null,
    imageSignals: ev.imageAnalysis?.extractedSignals ?? undefined
  });

  const social = detectSocialAdRisk({
    platform: ev.sourcePlatform ?? null,
    adText: ev.adText ?? null,
    url: options.canonicalUrl,
    domain: options.normalizedDomain
  });

  const webshopChips: TrustEvidenceSignalChip[] = webshop.signals.map((s) => ({
    id: s.id,
    label: s.label,
    severity: mapSeverity(s.severity),
    explanation: s.explanation
  }));

  const socialChips: TrustEvidenceSignalChip[] = social.signals.map((s) => ({
    id: s.id,
    label: s.label,
    severity: mapSeverity(s.severity),
    explanation: s.explanation
  }));

  const appliedRiskDelta = combineEvidenceDeltas(webshop.riskDelta, social.riskDelta, imageDelta);

  const screenshotSection: TrustEvidenceSection | undefined = ev.imageAnalysis?.imageHash
    ? {
        title: "Screenshot / ad context",
        summary: ev.imageAnalysis.summary?.trim() || "A screenshot was supplied for context.",
        impactLevel: imageDelta >= 8 ? "high" : imageDelta >= 4 ? "medium" : "low",
        riskDelta: imageDelta,
        signals: [],
        notes: ev.imageAnalysis.fallbackMessage ?? undefined
      }
    : undefined;

  const webshopSection: TrustEvidenceSection = {
    title: "Fake webshop signals",
    summary: webshop.summary,
    impactLevel: impactFromSignals(webshopChips),
    riskDelta: webshop.riskDelta,
    signals: webshopChips
  };

  const showSocial =
    Boolean(ev.adText?.trim()) ||
    Boolean(ev.sourcePlatform?.trim() && ev.sourcePlatform.trim().toLowerCase() !== "unknown");
  const socialSection: TrustEvidenceSection | undefined =
    showSocial && (social.riskDelta > 0 || socialChips.length > 0)
      ? {
          title: "Social ad risk signals",
          summary: social.summary,
          impactLevel: impactFromSignals(socialChips),
          riskDelta: social.riskDelta,
          signals: socialChips
        }
      : undefined;

  return {
    screenshotAd: screenshotSection,
    webshop: webshopSection,
    socialAd: socialSection,
    appliedRiskDelta,
    imageHash: ev.imageAnalysis?.imageHash ?? null
  };
}
