import type { ScamCheckResult } from "@/types/scam";

interface ResultCardProps {
  result: ScamCheckResult;
}

type TrustBand = "high" | "medium" | "suspicious" | "low";

function trustBandFromScore(trustScore: number): TrustBand {
  if (trustScore >= 75) return "high";
  if (trustScore >= 60) return "medium";
  if (trustScore >= 30) return "suspicious";
  return "low";
}

const trustPresentation: Record<
  TrustBand,
  {
    label: string;
    textColor: string;
    bgColor: string;
    advisory: string;
    advisoryBorder: string;
    advisoryBg: string;
    advisoryText: string;
  }
> = {
  high: {
    label: "Safe",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-100",
    advisory: "This website currently shows mostly positive trust signals.",
    advisoryBorder: "border-emerald-200",
    advisoryBg: "bg-emerald-50",
    advisoryText: "text-emerald-900"
  },
  medium: {
    label: "Likely safe",
    textColor: "text-green-800",
    bgColor: "bg-green-100",
    advisory: "This website shows generally favorable trust signals, but stay alert for unusual requests or payments.",
    advisoryBorder: "border-green-200",
    advisoryBg: "bg-green-50",
    advisoryText: "text-green-900"
  },
  suspicious: {
    label: "Suspicious",
    textColor: "text-orange-700",
    bgColor: "bg-orange-100",
    advisory: "Be careful. This website has mixed or uncertain trust signals.",
    advisoryBorder: "border-amber-200",
    advisoryBg: "bg-amber-50",
    advisoryText: "text-amber-900"
  },
  low: {
    label: "High risk",
    textColor: "text-rose-700",
    bgColor: "bg-rose-100",
    advisory: "Warning. This website shows strong scam indicators.",
    advisoryBorder: "border-rose-200",
    advisoryBg: "bg-rose-50",
    advisoryText: "text-rose-900"
  }
};

export function ResultCard({ result }: ResultCardProps) {
  const trustScore = Math.round(100 - result.score);
  const band = trustBandFromScore(trustScore);
  const style = trustPresentation[band];
  const { reviewSignals } = result;
  const hasPublicReviewData = reviewSignals.trustpilotFound || reviewSignals.googleFound;

  return (
    <div className="w-full rounded-xl bg-white p-6 shadow-lg shadow-slate-200/60 transition-all duration-300">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4" aria-label={`Trust score ${trustScore} percent, ${style.label}`}>
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full border-8 border-white text-2xl font-bold shadow-sm ${style.bgColor} ${style.textColor}`}
          >
            {trustScore}%
          </div>
          <div>
            <p className={`text-lg font-semibold ${style.textColor}`}>{style.label}</p>
            <p className="mt-1 text-sm text-slate-500">Trust score</p>
          </div>
        </div>

        <div className="text-sm text-slate-600">
          <p className="font-medium text-slate-900">Analyzed domain</p>
          <p className="mt-1 break-all">{result.domain}</p>
        </div>
      </div>

      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-slate-700">
        {result.reasons.map((reason, index) => (
          <li key={`${index}-${reason.slice(0, 48)}`}>{reason}</li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Risk signals</p>
        {result.trustSignals.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No explicit external trust signals were available in this run.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {result.trustSignals.map((signal, index) => {
              const tone =
                signal.type === "positive"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : signal.type === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-rose-200 bg-rose-50 text-rose-900";
              return (
                <li key={`${index}-${signal.title}`} className={`rounded-lg border px-3 py-2 text-sm ${tone}`}>
                  <p className="font-semibold">{signal.title}</p>
                  <p className="mt-0.5">{signal.description}</p>
                  {signal.source ? <p className="mt-1 text-xs opacity-80">Source: {signal.source}</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Review signals</p>
        {hasPublicReviewData ? (
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            {reviewSignals.googleFound && (
              <div>
                <p className="font-medium text-slate-900">Google</p>
                <p>
                  Rating:{" "}
                  <span className="font-medium">{reviewSignals.googleRating?.toFixed(1) ?? "n/a"}</span>
                </p>
                <p>
                  Review count: <span className="font-medium">{reviewSignals.googleReviewCount ?? "n/a"}</span>
                </p>
              </div>
            )}
            {reviewSignals.trustpilotFound && (
              <div>
                <p className="font-medium text-slate-900">Trustpilot</p>
                <p>
                  Rating:{" "}
                  <span className="font-medium">{reviewSignals.trustpilotRating?.toFixed(1) ?? "n/a"}</span>
                </p>
                <p>
                  Review count: <span className="font-medium">{reviewSignals.trustpilotReviewCount ?? "n/a"}</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No public review data found yet.</p>
        )}

        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {reviewSignals.suspiciousReviewSignals.map((signal, index) => (
            <li key={`${index}-${signal.slice(0, 40)}`}>{signal}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">{result.reviewSummary}</p>
        {reviewSignals.sources.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">Sources: {reviewSignals.sources.join(", ")}</p>
        )}
        {reviewSignals.warnings.length > 0 && (
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-amber-800">
            {reviewSignals.warnings.map((w, i) => (
              <li key={`${i}-${w.slice(0, 40)}`}>{w}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Supply chain</p>
        <p className="mt-2 text-xs text-slate-600">
          Dropshipping: {result.supplyChainSignals.likelyDropshipping ? "likely" : "unlikely"} · China-linked
          fulfillment: {result.supplyChainSignals.likelyChinaShipping ? "likely" : "unlikely"} · Local
          stock/production: {result.supplyChainSignals.likelyLocalProduction ? "likely" : "unlikely"} · Confidence:{" "}
          {result.supplyChainSignals.confidence} · Score nudge: {result.supplyChainSignals.scoreAdjustment > 0 ? "+" : ""}
          {result.supplyChainSignals.scoreAdjustment}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">
          {result.supplyChainSignals.reasons.map((r, i) => (
            <li key={`${i}-${r.slice(0, 48)}`}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Technical checks</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">
          <li>
            HTTPS/TLS:{" "}
            <span className="font-medium">
              {result.ssl.httpsEnabled ? (result.ssl.validCertificate ? "valid certificate" : "certificate issue") : "not available"}
            </span>
          </li>
          <li>
            Certificate issuer: <span className="font-medium">{result.ssl.certificateIssuer ?? "unknown"}</span>
          </li>
          <li>
            Certificate expiry: <span className="font-medium">{result.ssl.certificateExpiry ?? "unknown"}</span>
          </li>
          <li>
            Safe Browsing: <span className="font-medium">{result.safeBrowsing.safeBrowsingStatus}</span>
            {result.safeBrowsing.safeBrowsingThreats.length > 0 ? ` (${result.safeBrowsing.safeBrowsingThreats.join(", ")})` : ""}
          </li>
          <li>
            OpenPhish: <span className="font-medium">{result.openPhish.listed ? "listed" : "not listed"}</span>
          </li>
          <li>
            URLHaus: <span className="font-medium">{result.urlHaus.listed ? "listed" : "not listed"}</span>
          </li>
          <li>
            Dutch police reference:{" "}
            <span className="font-medium">{result.police.listedInPoliceScamDatabase ? "match found" : "no match found"}</span>
          </li>
        </ul>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Domain information</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">
          <li>
            Registration date: <span className="font-medium">{result.domainIntelligence.registrationDate ?? "unknown"}</span>
          </li>
          <li>
            Domain age (days): <span className="font-medium">{result.domainIntelligence.ageDays ?? "unknown"}</span>
          </li>
          <li>
            Registrar: <span className="font-medium">{result.domainIntelligence.registrar ?? "unknown"}</span>
          </li>
          <li>
            Country: <span className="font-medium">{result.domainIntelligence.country ?? "unknown"}</span>
          </li>
          <li>
            Expiration date: <span className="font-medium">{result.domainIntelligence.expirationDate ?? "unknown"}</span>
          </li>
          <li>
            Ownership privacy detected:{" "}
            <span className="font-medium">{result.domainIntelligence.hasPrivacyProtection ? "yes" : "no / unknown"}</span>
          </li>
        </ul>
      </div>

      <p className="mt-3 text-xs text-slate-500">AI used: {result.aiUsed ? "yes" : "no"}</p>

      <div
        className={`mt-6 rounded-xl border px-4 py-3 text-sm ${style.advisoryBorder} ${style.advisoryBg} ${style.advisoryText}`}
      >
        {style.advisory}
      </div>
    </div>
  );
}
