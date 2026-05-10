"use client";

import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Hero } from "@/components/Hero";
import { OptionalEvidenceScanSection, type OptionalEvidenceScanValues } from "@/components/OptionalEvidenceScanSection";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
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
import { EN_MESSAGES } from "@/lib/messages.en";
import { GENERIC_CHECK_ERROR } from "@/lib/messages";
import type { WebsiteAnalysisClientEvidence } from "@/lib/evidence/types";
import { isCheckApiResponse, type ScamCheckResult } from "@/types/scam";

const SIMULATED_PROGRESS_MAX = 89;
const SCAN_PROGRESS_START = 5;
const RESULT_DISPLAY_HOLD_MS = 450;
const PROGRESS_SIM_INTERVAL_MS = 440;

function scanPhaseMessage(progress: number): string {
  if (progress >= 100) return EN_MESSAGES.scanProgress.complete;
  if (progress >= 78) return EN_MESSAGES.scanProgress.phaseFinalizing;
  if (progress >= 55) return EN_MESSAGES.scanProgress.phaseScoring;
  if (progress >= 32) return EN_MESSAGES.scanProgress.phaseSignals;
  if (progress >= 15) return EN_MESSAGES.scanProgress.phaseSecurity;
  return EN_MESSAGES.scanProgress.phaseStart;
}

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

export function HomeClient({ children }: { children?: ReactNode }) {
  const { isSignedIn } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasUsedFreeCheck, setHasUsedFreeCheck] = useState(false);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState("");
  const [scanFailed, setScanFailed] = useState(false);
  const inFlight = useRef(false);
  const mountedRef = useRef(true);
  const progressSimRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [optionalEvidence, setOptionalEvidence] = useState<OptionalEvidenceScanValues>({
    file: null,
    previewUrl: null,
    adText: "",
    sourcePlatform: ""
  });

  const clearProgressSimulation = () => {
    if (progressSimRef.current) {
      clearInterval(progressSimRef.current);
      progressSimRef.current = null;
    }
  };

  const disabled = useMemo(() => url.trim().length === 0 || loading, [url, loading]);

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
    return () => {
      if (optionalEvidence.previewUrl) {
        URL.revokeObjectURL(optionalEvidence.previewUrl);
      }
    };
  }, [optionalEvidence.previewUrl]);

  useEffect(() => {
    if (!loading || scanFailed) return;
    setScanStatus((prev) => {
      const next = scanPhaseMessage(scanProgress);
      return prev === next ? prev : next;
    });
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

    inFlight.current = true;
    setLoading(true);
    setScanProgress(SCAN_PROGRESS_START);
    setScanStatus(EN_MESSAGES.scanProgress.phaseStart);

    await yieldOneUiFrame();

    progressSimRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setScanProgress((p) => {
        if (p >= SIMULATED_PROGRESS_MAX) return p;
        const bump = 2 + Math.floor(Math.random() * 7);
        return Math.min(SIMULATED_PROGRESS_MAX, p + bump);
      });
    }, PROGRESS_SIM_INTERVAL_MS);

    try {
      if (isSignedIn) {
        trackRegisteredCheckStarted();
      } else {
        trackAnonymousCheckStarted();
      }

      let imageAnalysis: WebsiteAnalysisClientEvidence["imageAnalysis"];
      if (optionalEvidence.file && optionalEvidence.file.size > 0) {
        try {
          const fd = new FormData();
          fd.append("file", optionalEvidence.file);
          const imgRes = await fetch("/api/evidence/analyze-image", {
            method: "POST",
            body: fd,
            credentials: "same-origin"
          });
          const imgJson = (await imgRes.json().catch(() => null)) as Record<string, unknown> | null;
          if (imgRes.ok && imgJson && imgJson.ok === true && typeof imgJson.imageHash === "string") {
            imageAnalysis = {
              imageHash: String(imgJson.imageHash).toLowerCase(),
              detectedText: typeof imgJson.detectedText === "string" ? imgJson.detectedText : null,
              extractedSignals:
                typeof imgJson.extractedSignals === "object" && imgJson.extractedSignals !== null
                  ? (imgJson.extractedSignals as Record<string, unknown>)
                  : null,
              summary: typeof imgJson.summary === "string" ? imgJson.summary : null,
              riskDelta: typeof imgJson.riskDelta === "number" ? imgJson.riskDelta : undefined,
              fallbackMessage: typeof imgJson.fallbackMessage === "string" ? imgJson.fallbackMessage : null,
              aiUsed: imgJson.aiUsed === true
            };
          }
        } catch {
          // URL scan continues without image analysis
        }
      }

      const evidencePayload: WebsiteAnalysisClientEvidence | undefined =
        imageAnalysis || optionalEvidence.adText.trim() || optionalEvidence.sourcePlatform.trim()
          ? {
              adText: optionalEvidence.adText.trim() || undefined,
              sourcePlatform: optionalEvidence.sourcePlatform.trim() || undefined,
              imageAnalysis: imageAnalysis ?? undefined
            }
          : undefined;

      const response = await fetch("/api/check", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: parsedInput.canonicalHref,
          detailLevel: "full",
          language: "en",
          ...(evidencePayload ? { evidence: evidencePayload } : {})
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

      setScanProgress(100);
      setScanStatus(EN_MESSAGES.scanProgress.complete);
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

  const signInModalButton = (
    <SignInButton mode="modal">
      <button type="button" className="btn-secondary px-5">
        {EN_MESSAGES.auth.loginCta}
      </button>
    </SignInButton>
  );
  const signUpModalButton = (
    <SignUpButton mode="modal">
      <button
        type="button"
        className="btn-primary px-5"
        onClick={() => trackEvent("signup_started", { source: "signup_prompt" })}
      >
        {EN_MESSAGES.freemium.createFreeAccount}
      </button>
    </SignUpButton>
  );

  const signupPrompt =
    showSignupPrompt && !isSignedIn ? (
      <div className="mx-auto mt-8 w-full max-w-[860px] fraudly-cta-panel">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">{EN_MESSAGES.freemium.promptTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{EN_MESSAGES.freemium.promptBody}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {signUpModalButton}
            <SignInButton mode="modal">
            <button
              type="button"
              className="btn-secondary px-5"
              onClick={() => trackEvent("login_started", { source: "signup_prompt" })}
            >
              {EN_MESSAGES.auth.loginCta}
            </button>
          </SignInButton>
        </div>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 pb-14 pt-0">
        <Hero
          url={url}
          onUrlChange={setUrl}
          onSubmit={handleCheck}
          loading={loading}
          disabled={disabled}
          scanProgress={scanProgress}
          scanStatus={scanStatus}
          scanFailed={scanFailed}
          extraBelowInput={
            <OptionalEvidenceScanSection
              values={optionalEvidence}
              onChange={setOptionalEvidence}
              disabled={loading}
            />
          }
        />

        {error && (
          <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-rose-200/85 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-subtle">
            {error}
            {error.includes("Log in") ? (
              <div className="mt-3 flex justify-center">{signInModalButton}</div>
            ) : null}
          </div>
        )}

        {signupPrompt}

        {result && (
          <>
            <section className="result-in mt-7 grid gap-5 sm:mt-9 lg:grid-cols-[1.7fr_1fr]">
              <div className="min-w-0 space-y-3">
                <ResultCard result={result} />
                <p className="text-center text-sm text-slate-600 md:text-left">
                  Share or revisit this snapshot:{" "}
                  <Link
                    href={`/check/${encodeURIComponent(result.domain)}`}
                    className="font-semibold text-blue-600 underline decoration-blue-600/40 underline-offset-2 hover:decoration-blue-600"
                  >
                    /check/{result.domain}
                  </Link>
                </p>
              </div>
              <div className="min-w-0 lg:pt-0">
                <FeatureCards stacked />
              </div>
            </section>
            <div className="result-in mx-auto mt-5 max-w-3xl">
              <PostScanAppPromo />
            </div>
            {!isSignedIn && (
              <div className="result-in mx-auto mt-5 max-w-3xl rounded-2xl border border-slate-200/85 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-subtle">
                {EN_MESSAGES.freemium.afterResultBanner}
              </div>
            )}
          </>
        )}

        {!result && (
          <section className="mt-5 [content-visibility:auto] [contain-intrinsic-size:1px_220px] sm:mt-7">
            <FeatureCards />
          </section>
        )}
        <div className="[content-visibility:auto] [contain-intrinsic-size:1px_2200px]">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}
