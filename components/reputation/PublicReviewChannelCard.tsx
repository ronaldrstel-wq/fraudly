import { TrustDataConfidenceBadge } from "@/components/trust/TrustDataConfidenceBadge";
import { ReviewRating } from "@/components/reputation/ReviewRating";
import { reviewChannelConfidenceIndicator, dataConfidenceBadge } from "@/lib/trust/dataConfidence";
import { reputationSourceConfidenceLabel } from "@/lib/reputation/reputationProviderResolver";
import type { NormalizedReviewChannel } from "@/lib/trust/types";
import type { ReviewChannelSource } from "@/lib/reputation/reviewChannelPresentation";

function shellClass(channel: NormalizedReviewChannel): string {
  const base = "rounded-xl border px-3 py-2.5 transition-colors duration-200";
  switch (channel.displayState) {
    case "strong":
      if (channel.reputationLabel === "Positive") {
        return `${base} border-emerald-200/90 bg-emerald-50/75`;
      }
      if (channel.reputationLabel === "Mixed") {
        return `${base} border-amber-200/90 bg-amber-50/75`;
      }
      return `${base} border-rose-200/90 bg-rose-50/75`;
    case "limited":
      return `${base} border-amber-200/85 bg-amber-50/55`;
    case "low_confidence":
      return `${base} border-amber-200/75 bg-amber-50/40`;
    case "none":
    default:
      return `${base} border-slate-200/90 bg-slate-50/65`;
  }
}

function statusTextClass(channel: NormalizedReviewChannel): string {
  if (channel.usedInTrustScore) return "font-medium text-emerald-800";
  if (channel.displayState === "low_confidence") return "font-medium text-amber-900";
  if (channel.displayState === "limited") return "font-medium text-amber-900";
  return "font-medium text-slate-600";
}

function bodyMessage(channel: NormalizedReviewChannel): string {
  if (channel.bodyMessage) return channel.bodyMessage;
  if (channel.displayState === "limited") return "Limited review data";
  if (channel.displayState === "none") return "No public reviews found";
  if (channel.displayState === "low_confidence") {
    return "Possible match found, not used in score";
  }
  return "";
}

function reputationBadgeClass(channel: NormalizedReviewChannel): string {
  if (channel.reputationLabel === "Positive") return "bg-emerald-100/90 text-emerald-900";
  if (channel.reputationLabel === "Mixed") return "bg-amber-100/90 text-amber-950";
  if (channel.reputationLabel === "Poor") return "bg-rose-100/90 text-rose-900";
  return "";
}

export function PublicReviewChannelCard({
  source,
  channel,
  matchNote
}: {
  source: ReviewChannelSource;
  channel: NormalizedReviewChannel;
  matchNote?: string | null;
}) {
  const confidenceBadge = dataConfidenceBadge(reviewChannelConfidenceIndicator(channel));
  const sourceLabel = reputationSourceConfidenceLabel(source, channel);

  return (
    <article className={shellClass(channel)}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">{sourceLabel}</p>
        <TrustDataConfidenceBadge badge={confidenceBadge} />
      </div>
      {channel.showMetrics ? (
        <>
          <ReviewRating
            source={source}
            rating={channel.rating}
            reviewCount={channel.reviewCount}
          />
          {channel.reputationLabel ? (
            <p
              className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${reputationBadgeClass(channel)}`}
            >
              {channel.reputationLabel} public reputation
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="text-sm font-semibold text-slate-900">{source}</p>
          <p className="mt-1.5 text-sm text-slate-700">{bodyMessage(channel)}</p>
        </>
      )}
      <p className={`mt-2 text-xs ${statusTextClass(channel)}`}>{channel.scoreImpactLabel}</p>
      {matchNote ? <p className="mt-1.5 text-xs text-slate-600">{matchNote}</p> : null}
    </article>
  );
}
