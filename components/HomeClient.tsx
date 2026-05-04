"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnalysisPaywall, type PurchaseAction } from "@/components/AnalysisPaywall";
import { BasicResultCard } from "@/components/BasicResultCard";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { trackCheckCompleted, trackCheckFailed, trackCheckStarted } from "@/lib/analytics";
import { billingSnapshotToUser, canViewFullAnalysis, parseBillingSnapshot } from "@/lib/billing";
import { GENERIC_CHECK_ERROR, INVALID_URL_MESSAGE } from "@/lib/messages";
import { isCheckApiResponse, type BasicCheckResult, type BillingSnapshot, type CheckApiResponse, type ScamCheckResult } from "@/types/scam";

const ResultCard = dynamic(() => import("@/components/ResultCard").then((m) => ({ default: m.ResultCard })), {
  loading: () => <div className="min-h-[280px] w-full animate-pulse rounded-xl bg-slate-100" aria-hidden />
});

const FeatureCards = dynamic(() => import("@/components/FeatureCards").then((m) => ({ default: m.FeatureCards })), {
  loading: () => <div className="h-44 w-full animate-pulse rounded-xl bg-slate-100 md:h-36" aria-hidden />
});

const PostScanAppPromo = dynamic(() => import("@/components/PostScanAppPromo").then((m) => ({ default: m.PostScanAppPromo })), {
  loading: () => <div className="h-32 w-full animate-pulse rounded-xl bg-slate-100" aria-hidden />
});

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function canUseFullFromBilling(b: BillingSnapshot | null): boolean {
  if (!b) return false;
  return canViewFullAnalysis(billingSnapshotToUser(b));
}

export function HomeClient() {
  const [userId, setUserId] = useState("guest");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [basicResult, setBasicResult] = useState<BasicCheckResult | null>(null);
  const [apiState, setApiState] = useState<CheckApiResponse | null>(null);
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullLocked, setFullLocked] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutActive, setCheckoutActive] = useState<PurchaseAction | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [fullRunPending, setFullRunPending] = useState(false);
  const inFlight = useRef(false);
  const checkoutInFlight = useRef(false);

  const disabled = useMemo(() => url.trim().length === 0 || loading, [url, loading]);

  const userReady = userId !== "guest";

  useEffect(() => {
    const key = "fraudly-user-id";
    const existing = window.localStorage.getItem(key);
    if (existing) {
      setUserId(existing);
      return;
    }
    const generated = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `anon-${Date.now()}`;
    window.localStorage.setItem(key, generated);
    setUserId(generated);
  }, []);

  async function runCheck(detailLevel: "basic" | "full") {
    if (inFlight.current) return;

    const trimmed = url.trim();

    if (!trimmed) {
      setFullLocked(false);
      setError("Please enter a URL to check.");
      return;
    }

    if (!isValidUrl(trimmed)) {
      setFullLocked(false);
      setError(INVALID_URL_MESSAGE);
      trackCheckFailed("invalid_url_client");
      return;
    }

    inFlight.current = true;
    setLoading(true);
    setError(null);
    if (detailLevel === "full") {
      setFullRunPending(true);
    } else {
      setFullLocked(false);
    }

    try {
      trackCheckStarted();
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fraudly-user-id": userId },
        body: JSON.stringify({ url: trimmed, detailLevel })
      });

      let payload: Record<string, unknown> | null = null;
      try {
        payload = (await response.json()) as Record<string, unknown>;
      } catch {
        payload = null;
      }

      if (response.status === 402) {
        const err = typeof payload?.error === "string" ? payload.error : "";
        const snap = parseBillingSnapshot(payload?.billing);
        if (snap) setBilling(snap);

        if (detailLevel === "full" && err === "full_analysis_locked") {
          setError("Geen credits beschikbaar voor volledige analyse. Koop checks of Premium.");
          trackCheckFailed("full_locked");
          return;
        }

        if (detailLevel === "basic" && err === "free_limit_reached") {
          setResult(null);
          setBasicResult(null);
          setApiState(null);
          setFullLocked(true);
          setError(null);
          trackCheckFailed("rate_limit");
          return;
        }

        setResult(null);
        setBasicResult(null);
        setApiState(null);
        setFullLocked(true);
        setError(null);
        trackCheckFailed("rate_limit");
        return;
      }

      if (!response.ok) {
        setResult(null);
        setBasicResult(null);
        setApiState(null);
        setFullLocked(false);
        setError(GENERIC_CHECK_ERROR);
        trackCheckFailed(`http_${response.status}`);
        return;
      }

      if (!payload || !isCheckApiResponse(payload)) {
        setResult(null);
        setBasicResult(null);
        setApiState(null);
        setError(GENERIC_CHECK_ERROR);
        trackCheckFailed("invalid_response_shape");
        return;
      }

      setApiState(payload);
      setBilling(payload.billing);
      setFullLocked(false);
      if (payload.detailLevel === "full") {
        setResult(payload.result as ScamCheckResult);
        setBasicResult(null);
      } else {
        setResult(null);
        setBasicResult(payload.result as BasicCheckResult);
      }
      trackCheckCompleted(payload.result.score);
    } catch {
      setResult(null);
      setBasicResult(null);
      setFullLocked(false);
      setError(GENERIC_CHECK_ERROR);
      trackCheckFailed("network");
    } finally {
      inFlight.current = false;
      setLoading(false);
      setFullRunPending(false);
    }
  }

  function handleCheck() {
    runCheck("basic");
  }

  async function handleCheckout(action: PurchaseAction) {
    if (checkoutInFlight.current || !userReady) {
      if (!userReady) setCheckoutError("Een moment, je sessie wordt opgestart…");
      return;
    }
    checkoutInFlight.current = true;
    setCheckoutLoading(true);
    setCheckoutActive(action);
    setCheckoutError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fraudly-user-id": userId },
        body: JSON.stringify({ purchaseType: action })
      });

      let data: { url?: string; error?: string };
      try {
        data = (await response.json()) as { url?: string; error?: string };
      } catch {
        console.error("[checkout] invalid json response", response.status);
        setCheckoutError("Onverwacht antwoord van de server.");
        return;
      }

      if (!response.ok) {
        console.error("[checkout] failed", response.status, data.error);
        setCheckoutError(data.error ?? "Checkout mislukt.");
        return;
      }

      if (typeof data.url === "string" && data.url.length > 0) {
        window.location.href = data.url;
        return;
      }

      console.error("[checkout] missing url in success response");
      setCheckoutError("Geen betaalpagina ontvangen.");
    } catch (e) {
      console.error("[checkout] network", e);
      setCheckoutError("Netwerkfout. Controleer je verbinding.");
    } finally {
      checkoutInFlight.current = false;
      setCheckoutLoading(false);
      setCheckoutActive(null);
    }
  }

  function handleUseCredit() {
    setCheckoutError(null);
    runCheck("full");
  }

  const paywallVariant = fullLocked ? "no_free_checks" : "unlock";
  const checkoutBusy = checkoutLoading || fullRunPending;
  const canUseFull = canUseFullFromBilling(billing);

  const useCreditRow = {
    loading: fullRunPending,
    canUse: canUseFull,
    onUseCredit: handleUseCredit
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:pt-14 md:pt-20">
        <Hero url={url} onUrlChange={setUrl} onSubmit={handleCheck} loading={loading} disabled={disabled} />

        {error && (
          <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {fullLocked && !basicResult && (
          <div className="result-in mx-auto mt-8 max-w-[860px] sm:mt-10">
            <AnalysisPaywall
              variant={paywallVariant}
              checkoutLoading={checkoutBusy || !userReady}
              activePurchase={checkoutActive}
              checkoutError={checkoutError}
              onPurchase={handleCheckout}
              useCreditRow={useCreditRow}
            />
          </div>
        )}

        {basicResult && !fullLocked && (
          <section className="result-in mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,860px)] lg:items-start">
            <div className="min-w-0">
              <BasicResultCard result={basicResult} />
            </div>
            <div className="min-w-0">
              <AnalysisPaywall
                variant={paywallVariant}
                checkoutLoading={checkoutBusy || !userReady}
                activePurchase={checkoutActive}
                checkoutError={checkoutError}
                onPurchase={handleCheckout}
                useCreditRow={useCreditRow}
              />
            </div>
          </section>
        )}

        {result && (
          <>
            <section className="result-in mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[1.7fr_1fr]">
              <div className="min-w-0">
                <ResultCard result={result} />
              </div>
              <div className="min-w-0 lg:pt-0">
                <FeatureCards stacked />
              </div>
            </section>
            <div className="result-in mx-auto mt-6 max-w-3xl">
              <PostScanAppPromo />
            </div>
            {apiState?.upsellPremium && (
              <div className="result-in mx-auto mt-6 max-w-3xl rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                Je hebt al meerdere checks gedaan. Met Premium check je goedkoper en zonder gedoe.
                <a href="/pricing" className="ml-2 font-semibold underline">
                  Bekijk Premium
                </a>
              </div>
            )}
          </>
        )}

        {!result && !basicResult && !fullLocked && (
          <section className="mt-8 sm:mt-10">
            <FeatureCards />
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
