import type { ScamCheckResult } from "@/types/scam";

interface ResultCardProps {
  result: ScamCheckResult;
}

const verdictStyle = {
  safe: {
    label: "Likely safe",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-100",
    progressColor: "bg-emerald-500"
  },
  suspicious: {
    label: "Suspicious",
    textColor: "text-orange-700",
    bgColor: "bg-orange-100",
    progressColor: "bg-orange-500"
  },
  scam: {
    label: "Likely scam",
    textColor: "text-rose-700",
    bgColor: "bg-rose-100",
    progressColor: "bg-rose-500"
  }
} as const;

export function ResultCard({ result }: ResultCardProps) {
  const style = verdictStyle[result.verdict];
  const { reviewSignals } = result;
  const hasPublicReviewData = reviewSignals.trustpilotFound;

  return (
    <div className="w-full rounded-xl bg-white p-6 shadow-lg shadow-slate-200/60 transition-all duration-300">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full border-8 border-white text-2xl font-bold shadow-sm ${style.bgColor} ${style.textColor}`}
          >
            {result.score}%
          </div>
          <div>
            <p className={`text-lg font-semibold ${style.textColor}`}>{style.label}</p>
            <p className="mt-1 text-sm text-slate-500">Fraud risk score</p>
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

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Review signals</p>
        {hasPublicReviewData ? (
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <p>
              Trustpilot score:{" "}
              <span className="font-medium">{reviewSignals.trustpilotScore?.toFixed(1) ?? "n/a"}</span>
            </p>
            <p>
              Review count: <span className="font-medium">{reviewSignals.reviewCount ?? "n/a"}</span>
            </p>
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
      </div>

      <p className="mt-3 text-xs text-slate-500">AI used: {result.aiUsed ? "yes" : "no"}</p>

      {(result.verdict === "scam" || result.verdict === "suspicious") && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Be careful! This link shows strong indicators of being a scam.
        </div>
      )}
    </div>
  );
}
