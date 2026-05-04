export const CONSENT_STORAGE_KEY = "fraudly_cookie_consent";
export const CONSENT_VERSION = 1 as const;

export type StoredConsent = {
  version: typeof CONSENT_VERSION;
  decidedAt: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

function parseStored(raw: string | null): StoredConsent | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<StoredConsent>;
    if (data.version !== CONSENT_VERSION) return null;
    if (data.necessary !== true) return null;
    if (typeof data.analytics !== "boolean" || typeof data.marketing !== "boolean") return null;
    if (typeof data.decidedAt !== "string") return null;
    return {
      version: CONSENT_VERSION,
      decidedAt: data.decidedAt,
      necessary: true,
      analytics: data.analytics,
      marketing: data.marketing
    };
  } catch {
    return null;
  }
}

export function loadStoredConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  return parseStored(localStorage.getItem(CONSENT_STORAGE_KEY));
}

export function saveStoredConsent(partial: Pick<StoredConsent, "analytics" | "marketing">): StoredConsent {
  const payload: StoredConsent = {
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    necessary: true,
    analytics: partial.analytics,
    marketing: partial.marketing
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("fraudly-consent-changed"));
  }
  return payload;
}

export function hasConsentDecision(): boolean {
  return loadStoredConsent() !== null;
}

export function isAnalyticsConsentGranted(): boolean {
  return loadStoredConsent()?.analytics === true;
}

export function isMarketingConsentGranted(): boolean {
  return loadStoredConsent()?.marketing === true;
}
