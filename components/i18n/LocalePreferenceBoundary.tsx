"use client";

import { Suspense } from "react";
import { DocumentLangSync } from "@/components/i18n/DocumentLangSync";
import { LocalePreferenceSync } from "@/components/i18n/LocalePreferenceSync";

export function LocalePreferenceBoundary() {
  return (
    <Suspense fallback={null}>
      <DocumentLangSync />
      <LocalePreferenceSync />
    </Suspense>
  );
}
