"use client";

export type PurchaseAction = "single_check" | "five_checks" | "twenty_checks" | "premium_monthly";

interface AnalysisPaywallProps {
  variant: "unlock" | "no_free_checks";
  checkoutLoading: boolean;
  activePurchase: PurchaseAction | null;
  checkoutError: string | null;
  onPurchase: (action: PurchaseAction) => void;
  useCreditRow?: {
    loading: boolean;
    canUse: boolean;
    onUseCredit: () => void;
  };
}

const BTN_BASE =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-xl px-3 py-2.5 text-center text-sm font-semibold leading-snug transition disabled:pointer-events-none disabled:opacity-50";

export function AnalysisPaywall({
  variant,
  checkoutLoading,
  activePurchase,
  checkoutError,
  onPurchase,
  useCreditRow
}: AnalysisPaywallProps) {
  const isNoFree = variant === "no_free_checks";
  const title = isNoFree ? "Je gratis checks zijn op" : "Ontgrendel de volledige analyse";
  const subtitle = isNoFree
    ? "Koop losse checks of start Premium om volledige analyses te blijven bekijken."
    : "We tonen nu alleen het basisresultaat. Bekijk de volledige uitleg, risicosignalen en advies voordat je verdergaat.";

  const rows: { action: PurchaseAction; label: string; primary?: boolean }[] = [
    { action: "single_check", label: "Ontgrendel voor €0,99", primary: true },
    { action: "five_checks", label: "5 checks voor €3,99" },
    { action: "twenty_checks", label: "20 checks voor €9,99" },
    { action: "premium_monthly", label: "Premium €6,99/mnd" }
  ];

  return (
    <div className="mx-auto w-full max-w-[860px] rounded-[18px] border border-sky-100 bg-white p-[18px] shadow-md shadow-slate-200/40 md:p-6">
      <h3 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>

      {checkoutError ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
          {checkoutError}
        </p>
      ) : null}

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
                  ? `${BTN_BASE} bg-blue-600 text-white [text-wrap:balance] hover:bg-blue-700`
                  : `${BTN_BASE} border border-slate-200 bg-white text-slate-900 [text-wrap:balance] hover:bg-slate-50`
              }
            >
              {busy ? "Bezig..." : label}
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
            className={`${BTN_BASE} w-full border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100/90 disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {useCreditRow.loading
              ? "Bezig..."
              : useCreditRow.canUse
                ? "Gebruik credit / Premium"
                : "Geen credits beschikbaar"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
