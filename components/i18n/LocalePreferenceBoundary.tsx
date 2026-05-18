"use client";

import { Suspense } from "react";
import { LocalePreferenceSync } from "@/components/i18n/LocalePreferenceSync";

export function LocalePreferenceBoundary() {
  return (
    <Suspense fallback={null}>
      <LocalePreferenceSync />
    </Suspense>
  );
}
