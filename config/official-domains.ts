/**
 * Central configurable allowlist: official / public-sector and high-trust host patterns.
 * Used to skip fake-authority lexical penalties and lift trust-score caps when appropriate.
 */

/** Full registrable hostnames treated as verified official (ASCII lowercase only). */
export const OFFICIAL_EXACT_REGISTRABLE_HOSTS: ReadonlySet<string> = new Set([
  "overheid.nl",
  "www.overheid.nl",
  "rijksoverheid.nl",
  "www.rijksoverheid.nl",
  "belastingdienst.nl",
  "www.belastingdienst.nl",
  "politie.nl",
  "www.politie.nl"
]);

/**
 * Suffices the **registrable** joined host must equal or end with (`.$suffix`).
 * Example: gov.uk → *.gov.uk; gouv.fr → *.gouv.fr
 */
export const OFFICIAL_REGISTRABLE_SUFFIXES: readonly string[] = [
  ".gov",
  ".gov.uk",
  ".gov.au",
  ".gc.ca",
  ".gouv.fr",
  "gov.uk",
  "gov.au",
  "gc.ca",
  "gouv.fr"
];

/**
 * Returns whether the apex / registrable host should be exempt from spoofing penalties.
 */
export function isOfficialOrGovernmentRegistrableHost(registrableJoinedLowercase: string): boolean {
  const h = registrableJoinedLowercase.toLowerCase().replace(/^\.+/, "");
  if (!h) return false;
  if (OFFICIAL_EXACT_REGISTRABLE_HOSTS.has(h)) return true;
  for (const suffix of OFFICIAL_REGISTRABLE_SUFFIXES) {
    const normalized = suffix.startsWith(".") ? suffix.slice(1) : suffix;
    if (h === normalized || h.endsWith(`.${normalized}`)) return true;
  }
  return false;
}
