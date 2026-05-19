"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ResultFlowMessages } from "@/lib/i18n/result-flow";

/** Locale-aware check/result UI copy (from {@link ResultFlowMessages}). */
export function useResultFlow(): ResultFlowMessages {
  return useLocale().dict.resultFlow;
}
