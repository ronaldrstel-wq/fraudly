/** ISO 3166-1 alpha-2 codes we map to scam-help reporting data. */
export type ScamHelpCountryCode =
  | "NL"
  | "GB"
  | "DE"
  | "US"
  | "BE"
  | "FR"
  | "ES"
  | "IT"
  | "CA"
  | "AU";

export const SCAM_HELP_SUPPORTED_CODES: ScamHelpCountryCode[] = [
  "NL",
  "GB",
  "DE",
  "US",
  "BE",
  "FR",
  "ES",
  "IT",
  "CA",
  "AU"
];

export function isScamHelpCountryCode(value: string): value is ScamHelpCountryCode {
  return SCAM_HELP_SUPPORTED_CODES.includes(value as ScamHelpCountryCode);
}

/**
 * Privacy-friendly country hint from hosting headers or Accept-Language.
 * Does not use precise geolocation APIs; returns null when unknown.
 */
export function detectCountryFromHeaders(headers: Headers): string | null {
  const vercelCountry = headers.get("x-vercel-ip-country");
  const cloudflareCountry = headers.get("cf-ipcountry");

  const country = vercelCountry || cloudflareCountry;

  if (country && country !== "XX" && country.length === 2) {
    return country.toUpperCase();
  }

  const language = headers.get("accept-language") || "";

  if (language.includes("nl")) return "NL";
  if (language.includes("en-GB")) return "GB";
  if (language.includes("de")) return "DE";
  if (language.includes("fr")) return "FR";
  if (language.includes("es")) return "ES";
  if (language.includes("it")) return "IT";
  if (language.includes("en-US")) return "US";

  return null;
}
