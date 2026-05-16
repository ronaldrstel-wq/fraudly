type RdapEvent = { eventAction?: string; eventDate?: string };

export function parseRdapDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const PREFERRED_REGISTRATION_ACTIONS = ["registration", "registered"] as const;

/** Earliest registration-style event from RDAP (registry-specific action names supported). */
export function registrationDateFromRdapEvents(events?: RdapEvent[]): Date | null {
  for (const preferred of PREFERRED_REGISTRATION_ACTIONS) {
    const event = events?.find((e) => e.eventAction?.toLowerCase() === preferred);
    const date = parseRdapDate(event?.eventDate);
    if (date) return date;
  }

  for (const event of events ?? []) {
    const action = event.eventAction?.toLowerCase() ?? "";
    if (!action.includes("registration")) continue;
    if (/\b(last|transfer|renew|expire|delete)\b/.test(action)) continue;
    const date = parseRdapDate(event.eventDate);
    if (date) return date;
  }

  return null;
}
