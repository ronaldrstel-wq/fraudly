import { buildScamAlertsQuery } from "@/lib/scam-alerts/presentation";
import type { ListFilterKey } from "@/lib/scam-alerts/presentation";
import type { ScamAlertsTimeWindow } from "@/lib/scam-alerts/service";
import { localizedPath } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/locales";

type ScamAlertsLinkParams = {
  locale: Locale;
  time: ScamAlertsTimeWindow;
  filter?: ListFilterKey;
  type?: string;
  page?: number;
};

export function localizedScamAlertsHref({
  locale,
  time,
  filter = "all",
  type = "",
  page = 1
}: ScamAlertsLinkParams): string {
  const base = localizedPath("/scam-alerts", locale);
  const query = buildScamAlertsQuery({
    time,
    filter: filter === "all" ? undefined : filter,
    type: type || undefined,
    page: page === 1 ? undefined : page
  });
  return `${base}${query}`;
}
