"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnalysisPaywall, type PurchaseAction } from "@/components/AnalysisPaywall";
import { BasicResultCard } from "@/components/BasicResultCard";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { trackCheckCompleted, trackCheckFailed, trackCheckStarted } from "@/lib/analytics";
import { canViewFullFromBillingSnapshot, parseBillingSnapshot } from "@/lib/billing";
import { EN_MESSAGES } from "@/lib/messages.en";
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

const FREE_CHECK_STORAGE_KEY = "fraudly_has_used_free_check";

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function HomeClient() {
  const { isSignedIn, isLoaded } = useAuth();
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
  const [checkoutAuthRequired, setCheckoutAuthRequired] = useState(false);
  const [fullRunPending, setFullRunPending] = useState(false);
  const [hasUsedFreeCheck, setHasUsedFreeCheck] = useState(false);
  const inFlight = useRef(false);
  const checkoutInFlight = useRef(false);

  const disabled = useMemo(() => url.trim().length === 0 || loading, [url, loading]);

  const checkoutBlocked = checkoutLoading || fullRunPending || !isSignedIn || !isLoaded;

  useEffect(() => {
    try {
      const value = window.localStorage.getItem(FREE_CHECK_STORAGE_KEY);
      if (value === "1") setHasUsedFreeCheck(true);
    } catch {
      // Ignore storage access issues (private mode, blocked storage).
    }
  }, []);

  async function runCheck(detailLevel: "basic" | "full") {
    if (inFlight.current) return;

    const trimmed = url.trim();

    if (!trimmed) {
      setFullLocked(false);
      setError(EN_MESSAGES.check.missingUrl);
      return;
    }

    if (!isSignedIn && detailLevel === "full") {
      setError(EN_MESSAGES.auth.loginForFullAnalysis);
      return;
    }

    if (!isSignedIn && hasUsedFreeCheck) {
      setError(EN_MESSAGES.auth.loginForAnotherCheck);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, detailLevel, language: "en" })
      });

      let payload: Record<string, unknown> | null = null;
      try {
        payload = (await response.json()) as Record<string, unknown>;
      } catch {
        payload = null;
      }

      if (response.status === 401) {
        setResult(null);
        setBasicResult(null);
        setApiState(null);
        setFullLocked(false);
        const msg =
          typeof payload?.message === "string"
            ? payload.message
            : EN_MESSAGES.auth.loginForUrlCheck;
        setError(msg);
        trackCheckFailed("unauthorized");
        return;
      }

      if (response.status === 402) {
        const err = typeof payload?.error === "string" ? payload.error : "";
        const snap = parseBillingSnapshot(payload?.billing);
        if (snap) setBilling(snap);

        if (detailLevel === "full" && err === "full_analysis_locked") {
          setError(EN_MESSAGES.check.fullAnalysisLocked);
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
      if (!isSignedIn && payload.detailLevel === "basic") {
        setHasUsedFreeCheck(true);
        try {
          window.localStorage.setItem(FREE_CHECK_STORAGE_KEY, "1");
        } catch {
          // Ignore storage access issues.
        }
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
    if (checkoutInFlight.current || !isSignedIn) {
      if (!isSignedIn) {
        setCheckoutAuthRequired(true);
        setCheckoutError("Log in to continue to checkout.");
      }
      return;
    }
    checkoutInFlight.current = true;
    setCheckoutLoading(true);
    setCheckoutActive(action);
    setCheckoutError(null);
    setCheckoutAuthRequired(false);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseType: action })
      });

      let data: { url?: string; error?: string };
      try {
        data = (await response.json()) as { url?: string; error?: string };
      } catch {
        console.error("[checkout] invalid json response", response.status);
        setCheckoutError(EN_MESSAGES.checkout.invalidResponse);
        return;
      }

      if (response.status === 401) {
        console.error("[checkout] unauthorized", data.error);
        setCheckoutAuthRequired(true);
        setCheckoutError(data.error ?? EN_MESSAGES.auth.loginForCheckout);
        return;
      }

      if (!response.ok) {
        console.error("[checkout] failed", response.status, data.error);
        setCheckoutError(data.error ?? EN_MESSAGES.checkout.checkoutFailed);
        return;
      }

      if (typeof data.url === "string" && data.url.length > 0) {
        window.location.href = data.url;
        return;
      }

      console.error("[checkout] missing url in success response");
      setCheckoutError(EN_MESSAGES.checkout.noCheckoutUrl);
    } catch (e) {
      console.error("[checkout] network", e);
      setCheckoutError(EN_MESSAGES.checkout.networkError);
    } finally {
      checkoutInFlight.current = false;
      setCheckoutLoading(false);
      setCheckoutActive(null);
    }
  }

  function handleUseCredit() {
    setCheckoutError(null);
    setCheckoutAuthRequired(false);
    runCheck("full");
  }

  const paywallVariant = fullLocked ? "no_free_checks" : "unlock";
  const checkoutBusy = checkoutLoading || fullRunPending;
  const canUseFull = billing ? canViewFullFromBillingSnapshot(billing) : false;

  const useCreditRow =
    isSignedIn && isLoaded
      ? {
          loading: fullRunPending,
          canUse: canUseFull,
          onUseCredit: handleUseCredit
        }
      : undefined;

  const signInModalButton = (
    <SignInButton mode="modal">
      <button
        type="button"
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {EN_MESSAGES.auth.loginCta}
      </button>
    </SignInButton>
  );

  const checkoutLoginSlot = checkoutAuthRequired ? (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm text-slate-800">
      <p className="font-medium">{EN_MESSAGES.auth.loginForCheckout}</p>
      <div className="mt-2 flex justify-center">{signInModalButton}</div>
    </div>
  ) : undefined;

  const heroAuthGate =
    isLoaded && !isSignedIn && hasUsedFreeCheck ? (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
        <p className="text-sm font-medium text-slate-800">{EN_MESSAGES.auth.loginForAnotherCheck}</p>
        <div className="mt-3 flex justify-center">{signInModalButton}</div>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:pt-14 md:pt-20">
        <Hero
          url={url}
          onUrlChange={setUrl}
          onSubmit={handleCheck}
          loading={loading}
          disabled={disabled}
          authGate={heroAuthGate}
        />

        {error && (
          <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
            {error.includes("Log in") ? (
              <div className="mt-3 flex justify-center">{signInModalButton}</div>
            ) : null}
          </div>
        )}

        {fullLocked && !basicResult && (
          <div className="result-in mx-auto mt-8 max-w-[860px] sm:mt-10">
            <AnalysisPaywall
              variant={paywallVariant}
              checkoutLoading={checkoutBusy || checkoutBlocked}
              activePurchase={checkoutActive}
              checkoutError={checkoutError}
              checkoutLoginSlot={checkoutLoginSlot}
              onPurchase={handleCheckout}
              useCreditRow={useCreditRow}
            />
          </div>
        )}

        {basicResult && !fullLocked && (
          <section className="result-in mx-auto mt-8 max-w-4xl space-y-5 sm:mt-10 sm:space-y-6">
            <div className="min-w-0">
              <BasicResultCard result={basicResult} />
            </div>
            <div className="min-w-0">
              <AnalysisPaywall
                variant={paywallVariant}
                checkoutLoading={checkoutBusy || checkoutBlocked}
                activePurchase={checkoutActive}
                checkoutError={checkoutError}
                checkoutLoginSlot={checkoutLoginSlot}
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
                {EN_MESSAGES.check.upsellPremium}
                <a href="/pricing" className="ml-2 font-semibold underline">
                  {EN_MESSAGES.check.viewPremium}
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
