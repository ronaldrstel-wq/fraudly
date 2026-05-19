import { getResultFlowMessages } from "@/lib/i18n/result-flow";
import type { ResultFlowMessages } from "@/lib/i18n/result-flow";
import type { Locale } from "@/lib/i18n/locales";

/** Server-safe default; pass {@link ResultFlowMessages} from {@link getResultFlowMessages} when locale is known. */
export function resultFlowOrDefault(flow?: ResultFlowMessages, locale: Locale = "en"): ResultFlowMessages {
  return flow ?? getResultFlowMessages(locale);
}
