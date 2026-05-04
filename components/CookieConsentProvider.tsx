"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CookieBanner } from "@/components/CookieBanner";
import { CookiePreferencesModal } from "@/components/CookiePreferencesModal";
import { loadStoredConsent, saveStoredConsent, type StoredConsent } from "@/lib/consent";

type CookieConsentContextValue = {
  openPreferences: () => void;
  consent: StoredConsent | null;
  refreshConsent: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

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
      {mounted && bannerVisible && (
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
