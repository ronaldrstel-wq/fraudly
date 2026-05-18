"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CountrySelector } from "@/components/scam-help/CountrySelector";
import { ReportingLinkCard } from "@/components/scam-help/ReportingLinkCard";
import { SCAM_HELP_COUNTRY_STORAGE_KEY } from "@/lib/scam-help/client-storage";
import { isScamHelpCountryCode, type ScamHelpCountryCode } from "@/lib/scam-help/detect-country";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  SCAM_HELP_IMMEDIATE_ACTIONS,
  scamHelpCountryPath,
  type ScamHelpCountrySummary
} from "@/lib/scam-help/countries";

type CountryAwareScamHelpProps = {
  detectedCountryCode: string | null;
  countries: ScamHelpCountrySummary[];
};

function readStoredCountryCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SCAM_HELP_COUNTRY_STORAGE_KEY);
    if (raw && isScamHelpCountryCode(raw)) return raw;
  } catch {
    /* private mode / blocked storage */
  }
  return null;
}

function writeStoredCountryCode(code: string): void {
  try {
    if (!code) {
      window.localStorage.removeItem(SCAM_HELP_COUNTRY_STORAGE_KEY);
      return;
    }
    if (isScamHelpCountryCode(code)) {
      window.localStorage.setItem(SCAM_HELP_COUNTRY_STORAGE_KEY, code);
    }
  } catch {
    /* ignore */
  }
}

export function CountryAwareScamHelp({ detectedCountryCode, countries }: CountryAwareScamHelpProps) {
  const { dict } = useLocale();
  const t = dict.scamHelp;
  const byCode = useMemo(() => new Map(countries.map((c) => [c.code, c])), [countries]);

  const detectedSupported =
    detectedCountryCode && isScamHelpCountryCode(detectedCountryCode) ? detectedCountryCode : null;

  const [selectedCode, setSelectedCode] = useState<string>("");
  const [usedDetectedHint, setUsedDetectedHint] = useState(false);

  useEffect(() => {
    const stored = readStoredCountryCode();
    if (stored) {
      setSelectedCode(stored);
      setUsedDetectedHint(false);
    } else if (detectedSupported) {
      setSelectedCode(detectedSupported);
      setUsedDetectedHint(true);
    }
  }, [detectedSupported]);

  const handleCountryChange = useCallback((code: string) => {
    setSelectedCode(code);
    writeStoredCountryCode(code);
    setUsedDetectedHint(false);
  }, []);

  const activeCountry = selectedCode ? byCode.get(selectedCode as ScamHelpCountryCode) : undefined;
  const showReporting = Boolean(activeCountry);

  return (
    <div className="mt-12 sm:mt-14">
      <section className="mt-10" aria-labelledby="reporting-options-heading">
        {showReporting && activeCountry ? (
          <>
            <h2 id="reporting-options-heading" className="text-balance text-center text-xl font-bold leading-snug text-slate-900 md:text-2xl">
              {t.reportingForPrefix} {activeCountry.name}
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600">{t.privacyHint}</p>
            {usedDetectedHint && selectedCode === detectedSupported ? (
              <p className="mx-auto mt-2 max-w-xl text-center text-xs text-slate-500">{t.detectedHint}</p>
            ) : null}
            <div className="mx-auto mt-6 max-w-md">
              <CountrySelector countries={countries} value={selectedCode} onChange={handleCountryChange} />
            </div>
            <ul className="mt-8 grid gap-4 md:grid-cols-2">
              {activeCountry.reportingLinks.map((link) => (
                <li key={`${activeCountry.code}-${link.name}`}>
                  <ReportingLinkCard link={link} />
                </li>
              ))}
            </ul>
            {activeCountry.hasDetailPage ? (
              <p className="mt-6 text-center text-sm text-slate-600">
                <Link
                  href={scamHelpCountryPath(activeCountry.slug)}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {t.moreGuidancePrefix} {activeCountry.name} →
                </Link>
              </p>
            ) : null}
          </>
        ) : (
          <>
            <h2 id="reporting-options-heading" className="text-balance text-center text-xl font-bold leading-snug text-slate-900 md:text-2xl">
              {t.chooseCountry}
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600">{t.chooseCountryHint}</p>
            <div className="mx-auto mt-6 max-w-md">
              <CountrySelector countries={countries} value={selectedCode} onChange={handleCountryChange} />
            </div>
          </>
        )}
      </section>

      {showReporting ? (
        <section className="mt-12 sm:mt-14" aria-labelledby="immediate-actions-heading">
          <h2 id="immediate-actions-heading" className="text-balance text-xl font-bold leading-snug text-slate-900 md:text-2xl">
            {t.immediateActions}
          </h2>
          <ul className="mt-6 space-y-3">
            {SCAM_HELP_IMMEDIATE_ACTIONS.map((action) => (
              <li
                key={action}
                className="flex gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-md shadow-slate-200/50 sm:px-5"
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800"
                  aria-hidden
                >
                  ✓
                </span>
                {action}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
