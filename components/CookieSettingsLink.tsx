"use client";

import { useCookieConsent } from "@/components/CookieConsentProvider";

export function CookieSettingsLink({ className }: { className?: string }) {
  const { openPreferences } = useCookieConsent();

  return (
    <button
      type="button"
      onClick={openPreferences}
      className={className ?? "font-medium text-slate-700 transition hover:text-slate-900"}
    >
      Cookie Settings
    </button>
  );
}
