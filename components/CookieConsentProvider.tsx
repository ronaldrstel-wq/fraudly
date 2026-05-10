"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CookieBanner } from "@/components/CookieBanner";
import type { CookiePreferencesModalProps } from "@/components/CookiePreferencesModal";
import { loadStoredConsent, saveStoredConsent, type StoredConsent } from "@/lib/consent";

type CookieConsentContextValue = {
  openPreferences: () => void;
  consent: StoredConsent | null;
  refreshConsent: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);
const CookiePreferencesModal = dynamic<CookiePreferencesModalProps>(
  () => import("@/components/CookiePreferencesModal").then((m) => m.CookiePreferencesModal),
  { ssr: false }
);

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [consent, setConsent] = useState<StoredConsent | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerReady, setBannerReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const refreshConsent = useCallback(() => {
    setConsent(loadStoredConsent());
  }, []);

  useEffect(() => {
    setMounted(true);
    const stored = loadStoredConsent();
    setConsent(stored);
    setBannerVisible(!stored);
  }, []);

  useEffect(() => {
    if (!mounted || !bannerVisible) {
      setBannerReady(false);
      return;
    }

    let cancelled = false;
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(
        () => {
          if (!cancelled) setBannerReady(true);
        },
        { timeout: 2000 }
      );
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = setTimeout(() => {
      if (!cancelled) setBannerReady(true);
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [mounted, bannerVisible]);

  useEffect(() => {
    const onChange = () => refreshConsent();
    window.addEventListener("fraudly-consent-changed", onChange);
    return () => window.removeEventListener("fraudly-consent-changed", onChange);
  }, [refreshConsent]);

  const persist = useCallback((analytics: boolean, marketing: boolean) => {
    const next = saveStoredConsent({ analytics, marketing });
    setConsent(next);
    setBannerVisible(false);
    setModalOpen(false);
  }, []);

  const openPreferences = useCallback(() => {
    setModalOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      openPreferences,
      consent,
      refreshConsent
    }),
    [openPreferences, consent, refreshConsent]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {mounted && bannerVisible && bannerReady && (
        <CookieBanner
          onAcceptAll={() => persist(true, true)}
          onRejectAll={() => persist(false, false)}
          onManagePreferences={() => setModalOpen(true)}
        />
      )}
      <CookiePreferencesModal
        open={modalOpen}
        initialAnalytics={consent?.analytics ?? false}
        initialMarketing={consent?.marketing ?? false}
        onClose={() => setModalOpen(false)}
        onAcceptAll={() => persist(true, true)}
        onRejectAll={() => persist(false, false)}
        onSave={(prefs) => persist(prefs.analytics, prefs.marketing)}
      />
    </CookieConsentContext.Provider>
  );
}
