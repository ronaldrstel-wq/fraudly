"use client";

import type { ReactNode } from "react";
import { EN_MESSAGES } from "@/lib/messages.en";

export type PurchaseAction = "single_check" | "five_checks" | "twenty_checks" | "premium_monthly";

interface AnalysisPaywallProps {
  variant: "unlock" | "no_free_checks";
  checkoutLoading: boolean;
  activePurchase: PurchaseAction | null;
  checkoutError: string | null;
  onPurchase: (action: PurchaseAction) => void;
  /** e.g. Clerk SignInButton when checkout returns 401 */
  checkoutLoginSlot?: ReactNode;
  useCreditRow?: {
    loading: boolean;
    canUse: boolean;
    onUseCredit: () => void;
  };
}

export function AnalysisPaywall({
  variant,
  checkoutLoading,
  activePurchase,
  checkoutError,
  checkoutLoginSlot,
  onPurchase,
  useCreditRow
}: AnalysisPaywallProps) {
  const isNoFree = variant === "no_free_checks";
  const title = isNoFree ? EN_MESSAGES.paywall.titleNoFree : EN_MESSAGES.paywall.titleUnlock;
  const subtitle = isNoFree
    ? EN_MESSAGES.paywall.subtitleNoFree
    : EN_MESSAGES.paywall.subtitleUnlock;

  const rows: { action: PurchaseAction; label: string; primary?: boolean }[] = [
    { action: "single_check", label: EN_MESSAGES.paywall.unlockSingle, primary: true },
    { action: "five_checks", label: EN_MESSAGES.paywall.bundleFive },
    { action: "twenty_checks", label: EN_MESSAGES.paywall.bundleTwenty },
    { action: "premium_monthly", label: EN_MESSAGES.paywall.premiumMonthly }
  ];

  return (
    <div className="mx-auto w-full max-w-[860px] fraudly-cta-panel">
      <h3 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>

      {checkoutError ? (
        <p className="mt-3 rounded-xl border border-rose-200/85 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {checkoutError}
        </p>
      ) : null}

      {checkoutLoginSlot ? <div className="mt-3">{checkoutLoginSlot}</div> : null}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(({ action, label, primary }) => {
          const busy = checkoutLoading && activePurchase === action;
          const isPrimary = Boolean(primary);
          return (
            <button
              key={action}
              type="button"
              disabled={checkoutLoading}
              onClick={() => onPurchase(action)}
              className={
                isPrimary
                  ? "btn-primary w-full text-pretty hover:brightness-[1.02]"
                  : "btn-secondary w-full border-slate-200 text-pretty"
              }
            >
              {busy ? EN_MESSAGES.paywall.working : label}
            </button>
          );
        })}
      </div>

      {useCreditRow ? (
        <div className="mt-4">
          <button
            type="button"
            disabled={!useCreditRow.canUse || useCreditRow.loading || checkoutLoading}
            onClick={useCreditRow.onUseCredit}
            className="btn-credit"
          >
            {useCreditRow.loading
              ? EN_MESSAGES.paywall.working
              : useCreditRow.canUse
                ? EN_MESSAGES.paywall.useCreditPremium
                : EN_MESSAGES.paywall.noCredits}
          </button>
        </div>
      ) : null}
    </div>
  );
}
