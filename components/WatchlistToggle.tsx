"use client";

import { SignInButton } from "@clerk/nextjs";
import type { ScamVerdict } from "@/types/scam";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { WatchlistItemTypeSlug } from "@/lib/watchlist/types";
import { EyeIcon } from "@/components/watchlist/EyeIcon";
import { useWatchlistItem } from "@/hooks/useWatchlistItem";

export type WatchlistToggleProps = {
  itemType: WatchlistItemTypeSlug;
  /** Lookup value (e.g. hostname for domains). */
  rawKey: string;
  title: string;
  detailPath: string;
  trustScore: number | null;
  verdict: ScamVerdict;
  className?: string;
  /** Compact = icon-first, for dense lists (e.g. latest checks). */
  variant?: "default" | "compact";
};

export function WatchlistToggle({
  itemType,
  rawKey,
  title,
  detailPath,
  trustScore,
  verdict,
  className = "",
  variant = "default"
}: WatchlistToggleProps) {
  const { hydrated, isLoaded, isSignedIn, checking, watched, busy, error, toggleWatched, ariaBusy } = useWatchlistItem({
    itemType,
    rawKey,
    title,
    detailPath,
    trustScore,
    verdict
  });

  const baseDefault =
    "inline-flex max-w-full items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm";
  const baseCompact =
    "inline-flex max-w-full items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition";

  const baseClasses = variant === "compact" ? baseCompact : baseDefault;

  if (!hydrated || !isLoaded) {
    return (
      <span
        className={`${baseClasses} border-slate-200/80 bg-slate-50/90 text-slate-400 ${className}`}
        aria-hidden
      >
        <span className="h-4 w-4 shrink-0 animate-pulse rounded bg-slate-200" />
        {variant === "compact" ? null : <span className="truncate">…</span>}
      </span>
    );
  }

  if (!isSignedIn) {
    return (
      <div className={`flex flex-col items-stretch gap-1 sm:items-end ${className}`}>
        <SignInButton mode="modal">
          <button
            type="button"
            className={`${baseClasses} border-slate-200/90 bg-white/90 text-slate-600 shadow-sm backdrop-blur-[2px] hover:border-slate-300 hover:bg-slate-50`}
            aria-label={`${EN_MESSAGES.watchlist.addToWatchlist} — ${EN_MESSAGES.watchlist.loginToManage}`}
          >
            <EyeIcon active={false} />
            <span className="truncate">
              {variant === "compact" ? EN_MESSAGES.watchlist.watchShortSignedOut : EN_MESSAGES.watchlist.signedOutWatchHint}
            </span>
          </button>
        </SignInButton>
        {error ? <p className="text-right text-xs text-rose-600">{error}</p> : null}
      </div>
    );
  }

  const watchedClasses =
    variant === "compact"
      ? "border-purple-400/70 bg-purple-50/95 text-purple-950 shadow-sm hover:border-purple-500"
      : "border-purple-300 bg-purple-50 text-purple-900 shadow-sm hover:border-purple-400";

  const idleClasses =
    variant === "compact"
      ? "border-slate-200/90 bg-white/90 text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50"
      : "border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:bg-slate-50";

  return (
    <div className={`flex flex-col items-stretch gap-1 sm:items-end ${className}`}>
      <button
        type="button"
        disabled={checking || ariaBusy}
        aria-pressed={watched}
        aria-busy={ariaBusy}
        aria-label={
          watched
            ? `${EN_MESSAGES.watchlist.removeFromWatchlist} (${title})`
            : `${EN_MESSAGES.watchlist.addToWatchlist}: ${title}`
        }
        onClick={() => void toggleWatched()}
        className={`${baseClasses} ${watched ? watchedClasses : idleClasses}`}
      >
        <EyeIcon active={watched} />
        <span className="truncate">
          {checking
            ? EN_MESSAGES.watchlist.stateLoading
            : watched
              ? variant === "compact"
                ? EN_MESSAGES.watchlist.watchingShort
                : EN_MESSAGES.watchlist.watching
              : variant === "compact"
                ? EN_MESSAGES.watchlist.watchShort
                : EN_MESSAGES.watchlist.addToWatchlist}
        </span>
      </button>
      {error ? <p className="text-right text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
