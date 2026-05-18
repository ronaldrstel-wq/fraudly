"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHomeAuth } from "@/components/home/HomeAuthContext";
import { Hero } from "@/components/Hero";
import { hasUsedAnonymousFreeCheck, markAnonymousFreeCheckUsed } from "@/lib/accessControl";
import {
  trackAnonymousCheckCompleted,
  trackAnonymousCheckStarted,
  trackCheckFailed,
  trackEvent,
  trackRegisteredCheckCompleted,
  trackRegisteredCheckStarted
} from "@/lib/analytics";
import { parseFlexibleWebsiteInput } from "@/lib/check-input/normalizeWebsiteInput";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { Locale } from "@/lib/i18n/locales";
import { GENERIC_CHECK_ERROR } from "@/lib/messages";
import {
  animateHomeScanProgressTo100,
  HOME_SCAN_SIM_INTERVAL_MS,
  homeScanStatusMessage,
  nextHomeScanSimulatedProgress,
  type HomeSearchCardState
} from "@/lib/scan/homeScanProgress";
import { normalizeTrustResult } from "@/lib/trust/normalizeTrustResult";
import { isCheckApiResponse, type ScamCheckResult } from "@/types/scam";

const SCAN_PROGRESS_START = 4;
const RESULT_DISPLAY_HOLD_MS = 520;

async function yieldOneUiFrame() {
  await new Promise((resolve) => setTimeout(resolve, 50));
}

const ResultCard = dynamic(() => import("@/components/ResultCard").then((m) => ({ default: m.ResultCard })), {
  loading: () => <div className="min-h-[280px] w-full animate-pulse rounded-2xl bg-slate-100" aria-hidden />
});

const FeatureCards = dynamic(() => import("@/components/FeatureCards").then((m) => ({ default: m.FeatureCards })), {
  loading: () => <div className="h-44 w-full animate-pulse rounded-2xl bg-slate-100 md:h-36" aria-hidden />
});

const PostScanAppPromo = dynamic(() => import("@/components/PostScanAppPromo").then((m) => ({ default: m.PostScanAppPromo })), {
  loading: () => <div className="h-32 w-full animate-pulse rounded-2xl bg-slate-100" aria-hidden />
});

const SiteFooter = dynamic(() => import("@/components/SiteFooter").then((m) => ({ default: m.SiteFooter })), {
  loading: () => <footer className="min-h-[100px] border-t border-slate-200/80 bg-white/80 py-8" aria-hidden />
});

export function HomeClient({
  children,
  showFooter = true,
  footerLocale
}: {
  children?: ReactNode;
  showFooter?: boolean;
  footerLocale?: Locale;
}) {
  const { locale: contextLocale } = useLocale();
  const footerLang = footerLocale ?? contextLocale;
  const { signedIn: isSignedIn, isAdmin } = useHomeAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasUsedFreeCheck, setHasUsedFreeCheck] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("");
  const [scanFailed, setScanFailed] = useState(false);
  const [checkedLabel, setCheckedLabel] = useState<string | null>(null);
  const [scanPhaseComplete, setScanPhaseComplete] = useState(false);
  const inFlight = useRef(false);
  const mountedRef = useRef(true);
  const progressSimRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanProgressRef = useRef(0);
  const clearProgressSimulation = () => {
    if (progressSimRef.current) {
      clearInterval(progressSimRef.current);
      progressSimRef.current = null;
    }
  };

  const disabled = useMemo(() => url.trim().length === 0 && !loading, [url, loading]);
  const searchState: HomeSearchCardState = loading ? "scanning" : scanPhaseComplete ? "complete" : "idle";
  const normalizedTrust = useMemo(
    () => (result ? normalizeTrustResult(result, { route: "HomeClient" }) : null),
    [result]
  );
  const displayCheckedLabel = result?.domain ?? checkedLabel;

  useEffect(() => {
    setHasUsedFreeCheck(hasUsedAnonymousFreeCheck());
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (progressSimRef.current) {
        clearInterval(progressSimRef.current);
        progressSimRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    scanProgressRef.current = scanProgress;
  }, [scanProgress]);

  useEffect(() => {
    if (!loading) return;
    const next = homeScanStatusMessage(scanProgress, scanFailed);
    setScanStatus((prev) => (prev === next ? prev : next));
  }, [loading, scanFailed, scanProgress]);

  async function runCheck() {
    if (inFlight.current) return;

    const trimmed = url.trim();

    if (!trimmed) {
      setError(EN_MESSAGES.check.missingUrl);
      return;
    }

    if (!isSignedIn && hasUsedFreeCheck) {
      setShowSignupPrompt(true);
      setError(null);
      trackEvent("second_check_attempted", { url: trimmed });
      trackEvent("signup_prompt_shown", { source: "checker" });
      return;
    }

    const parsedInput = parseFlexibleWebsiteInput(trimmed);
    if (!parsedInput.ok) {
      setError(EN_MESSAGES.check.invalidWebsiteInput);
      trackCheckFailed("invalid_url_client");
      return;
    }

    clearProgressSimulation();
    setResult(null);
    setError(null);
    setShowSignupPrompt(false);
    setScanFailed(false);
    setScanPhaseComplete(false);

    inFlight.current = true;
    setLoading(true);
    setScanProgress(SCAN_PROGRESS_START);
    scanProgressRef.current = SCAN_PROGRESS_START;
    setScanStatus(homeScanStatusMessage(SCAN_PROGRESS_START, false));
    setCheckedLabel(parsedInput.url.hostname);

    await yieldOneUiFrame();

    progressSimRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setScanProgress((p) => {
        const next = nextHomeScanSimulatedProgress(p);
        scanProgressRef.current = next;
        return next;
      });
    }, HOME_SCAN_SIM_INTERVAL_MS);

    try {
      if (isSignedIn) {
        trackRegisteredCheckStarted();
      } else {
        trackAnonymousCheckStarted();
      }

      const response = await fetch("/api/check", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: parsedInput.canonicalHref,
          detailLevel: "full",
          language: "en"
        })
      });

      clearProgressSimulation();

      const rawBody = await response.text();
      let payload: Record<string, unknown> | null = null;
      try {
        payload = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : null;
      } catch {
        payload = null;
      }

      const failStrip = (stripMessage: string) => {
        setScanFailed(true);
        setScanStatus(stripMessage);
        setScanProgress(0);
        scanProgressRef.current = 0;
        setScanPhaseComplete(false);
        setLoading(false);
      };

      if (response.status === 401) {
        setResult(null);
        const msg =
          typeof payload?.message === "string"
            ? payload.message
            : EN_MESSAGES.auth.loginForUrlCheck;
        setError(msg);
        setShowSignupPrompt(true);
        failStrip(EN_MESSAGES.scanProgress.stoppedSignIn);
        trackEvent("signup_prompt_shown", { source: "api_401" });
        trackCheckFailed("unauthorized");
        return;
      }

      if (response.status === 402) {
        setResult(null);
        setShowSignupPrompt(true);
        setError(EN_MESSAGES.auth.loginForAnotherCheck);
        failStrip(EN_MESSAGES.scanProgress.stoppedLimit);
        trackEvent("signup_prompt_shown", { source: "api_402" });
        trackCheckFailed("rate_limit");
        return;
      }

      if (response.status === 429) {
        setResult(null);
        const msg =
          typeof payload?.message === "string" ? payload.message : EN_MESSAGES.rateLimit.generic;
        setError(msg);
        failStrip(msg);
        const reason = typeof payload?.reason === "string" ? payload.reason : "unknown";
        trackCheckFailed(`rate_${reason}`);
        return;
      }

      if (!response.ok) {
        setResult(null);
        const msgFromApi = typeof payload?.message === "string" ? payload.message : null;
        const requestId = typeof payload?.requestId === "string" ? payload.requestId : null;

        // If the backend returns non-JSON (e.g. Next error page), payload will be null.
        const bodySnippet = rawBody
          ? rawBody.replace(/\s+/g, " ").slice(0, 220)
          : "";

        if (process.env.NODE_ENV !== "production") {
          console.error("[/api/check] non-ok", {
            status: response.status,
            requestId,
            msgFromApi,
            bodySnippet
          });
        }

        if (msgFromApi) {
          setError(msgFromApi);
          failStrip(msgFromApi);
        } else if (requestId) {
          setError(`${GENERIC_CHECK_ERROR} Reference: ${requestId}`);
          failStrip(EN_MESSAGES.scanProgress.failedGeneric);
        } else {
          setError(
            process.env.NODE_ENV === "production"
              ? GENERIC_CHECK_ERROR
              : `Request failed (HTTP ${response.status}). ${bodySnippet ? `Body: ${bodySnippet}` : ""}`
          );
          failStrip(EN_MESSAGES.scanProgress.failedGeneric);
        }

        trackCheckFailed(`http_${response.status}`);
        return;
      }

      if (!payload || !isCheckApiResponse(payload)) {
        setResult(null);
        setError(
          process.env.NODE_ENV === "production"
            ? GENERIC_CHECK_ERROR
            : `Unexpected API response (HTTP ${response.status}). Body: ${rawBody.slice(0, 180)}`
        );
        failStrip(EN_MESSAGES.scanProgress.stoppedInvalidResponse);
        trackCheckFailed("invalid_response_shape");
        return;
      }

      await animateHomeScanProgressTo100((value) => {
        setScanProgress(value);
        scanProgressRef.current = value;
      }, scanProgressRef.current);
      setScanStatus(EN_MESSAGES.scanProgress.complete);
      setScanPhaseComplete(true);
      await new Promise((resolve) => setTimeout(resolve, RESULT_DISPLAY_HOLD_MS));

      if (!mountedRef.current) return;

      setResult(payload.result as ScamCheckResult);
      if (!isSignedIn) {
        setHasUsedFreeCheck(true);
        markAnonymousFreeCheckUsed();
      }
      if (isSignedIn) {
        trackRegisteredCheckCompleted(payload.result.score);
      } else {
        trackAnonymousCheckCompleted(payload.result.score);
      }
      setLoading(false);
      window.setTimeout(() => {
        if (mountedRef.current) setScanPhaseComplete(false);
      }, 900);
    } catch (err) {
      clearProgressSimulation();
      setResult(null);
      const message = err instanceof Error ? err.message : "Unknown error";
      if (process.env.NODE_ENV !== "production") {
        console.error("[/api/check] fetch failed", { message });
      }
      setError(process.env.NODE_ENV === "production" ? GENERIC_CHECK_ERROR : `Network error: ${message}`);
      setScanFailed(true);
      setScanStatus(EN_MESSAGES.scanProgress.failedNetwork);
      setScanPhaseComplete(false);
      setLoading(false);
      trackCheckFailed("network");
    } finally {
      clearProgressSimulation();
      inFlight.current = false;
    }
  }

  function handleCheck() {
    runCheck();
  }

  const signInLink = (
    <Link href="/sign-in" className="btn-secondary inline-flex px-5">
      {EN_MESSAGES.auth.loginCta}
    </Link>
  );
  const signUpLink = (
    <Link
      href="/sign-up"
      className="btn-primary inline-flex px-5"
      onClick={() => trackEvent("signup_started", { source: "signup_prompt" })}
    >
      {EN_MESSAGES.freemium.createFreeAccount}
    </Link>
  );

  const belowSearchCard =
    error || result || (showSignupPrompt && !isSignedIn) ? (
      <>
        {error ? (
          <div className="rounded-2xl border border-rose-200/85 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-subtle">
            {error}
            {error.includes("Log in") ? <div className="mt-3 flex justify-center">{signInLink}</div> : null}
          </div>
        ) : null}

        {showSignupPrompt && !isSignedIn ? (
          <div className={`w-full fraudly-cta-panel ${error ? "mt-5" : ""}`}>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">{EN_MESSAGES.freemium.promptTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{EN_MESSAGES.freemium.promptBody}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {signUpLink}
              <Link
                href="/sign-in"
                className="btn-secondary inline-flex px-5"
                onClick={() => trackEvent("login_started", { source: "signup_prompt" })}
              >
                {EN_MESSAGES.auth.loginCta}
              </Link>
            </div>
          </div>
        ) : null}

        {result ? (
          <div className={`home-results-reveal space-y-5 ${error || (showSignupPrompt && !isSignedIn) ? "mt-5" : ""}`}>
            <ResultCard result={result} normalizedTrust={normalizedTrust ?? undefined} />
            <p className="text-center text-sm text-slate-600 md:text-left">
              Share or revisit this snapshot:{" "}
              <Link
                href={`/check/${encodeURIComponent(result.domain)}`}
                className="font-semibold text-blue-600 underline decoration-blue-600/40 underline-offset-2 hover:decoration-blue-600"
              >
                /check/{result.domain}
              </Link>
            </p>
            <PostScanAppPromo />
            {!isSignedIn ? (
              <div className="rounded-2xl border border-slate-200/85 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-subtle">
                {EN_MESSAGES.freemium.afterResultBanner}
              </div>
            ) : null}
          </div>
        ) : null}
      </>
    ) : null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <main className="mx-auto w-full max-w-6xl px-4 pb-14 pt-0">
        <Hero
          url={url}
          onUrlChange={setUrl}
          onSubmit={handleCheck}
          searchState={searchState}
          disabled={disabled}
          scanProgress={scanProgress}
          scanStatus={scanStatus}
          scanFailed={scanFailed}
          checkedLabel={displayCheckedLabel}
          isAdmin={isAdmin}
          belowSearchCard={belowSearchCard}
        />

        {!result && (
          <section className="mt-5 [content-visibility:auto] [contain-intrinsic-size:1px_220px] sm:mt-7">
            <FeatureCards />
          </section>
        )}
        <div className="[content-visibility:auto] [contain-intrinsic-size:1px_2200px]">{children}</div>
      </main>

      {showFooter ? <SiteFooter locale={footerLang} /> : null}
    </div>
  );
}
