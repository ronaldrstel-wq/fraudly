function readToggle(primary: string, legacyKeys: string[], defaultEnabled: boolean): boolean {
  for (const key of [primary, ...legacyKeys]) {
    const raw = process.env[key];
    if (raw != null && String(raw).trim() !== "") {
      return String(raw).trim().toLowerCase() === "true";
    }
  }
  return defaultEnabled;
}

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function readCacheMs(name: string, fallbackHours: number): number {
  return readNumber(name, fallbackHours * 60 * 60 * 1000);
}

/**
 * Central feature flags and timing for modular trust-intelligence providers.
 * New env keys are preferred; legacy aliases remain supported where noted.
 */
export const checksConfig = {
  googleSafeBrowsing: readToggle("ENABLE_GOOGLE_SAFE_BROWSING", ["ENABLE_SAFE_BROWSING"], true),
  urlHaus: readToggle("ENABLE_URLHAUS", ["ENABLE_URLHAUS_CHECK"], true),
  openPhish: readToggle("ENABLE_OPENPHISH", ["ENABLE_OPENPHISH_CHECK"], true),
  policeNl: readToggle("ENABLE_POLICE_NL", ["ENABLE_POLICE_CHECK"], true),
  rdap: readToggle("ENABLE_RDAP", ["ENABLE_RDAP_CHECK"], true),
  ssl: readToggle("ENABLE_SSL_CHECK", [], true),

  /** Tier 2: surface “pending integration” signals only when explicitly enabled */
  phishTank: readToggle("ENABLE_PHISHTANK", [], false),
  abuseIpdb: readToggle("ENABLE_ABUSEIPDB", [], false),
  virusTotal: readToggle("ENABLE_VIRUSTOTAL", [], false),
  tranco: readToggle("ENABLE_TRANCO", [], false),
  umbrella: readToggle("ENABLE_UMBRELLA", [], false),
  govUk: readToggle("ENABLE_GOV_CYBER_UK", [], false),
  govUs: readToggle("ENABLE_GOV_CYBER_US", [], false),
  govDe: readToggle("ENABLE_GOV_CYBER_DE", [], false),
  govFr: readToggle("ENABLE_GOV_CYBER_FR", [], false),

  providerDeadlineMs: readNumber("PROVIDER_TIMEOUT_MS", 12_000),
  fetchTimeoutMs: readNumber("PROVIDER_FETCH_TIMEOUT_MS", 5000),

  cacheTtlMs: {
    safeBrowsing: readCacheMs("CACHE_TTL_SAFE_BROWSING_MS", 2),
    openPhish: readCacheMs("CACHE_TTL_OPENPHISH_MS", 1),
    urlHaus: readCacheMs("CACHE_TTL_URLHAUS_MS", 1),
    policeNl: readCacheMs("CACHE_TTL_POLICE_NL_MS", 6),
    rdap: readCacheMs("CACHE_TTL_RDAP_MS", 24),
    ssl: readCacheMs("CACHE_TTL_SSL_MS", 6)
  }
};
