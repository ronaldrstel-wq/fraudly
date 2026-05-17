/**
 * Safe database connection metadata for incident response.
 * Never logs or returns passwords, tokens, or full connection strings.
 */

export type DatabaseConnectionDiagnostics = {
  configured: boolean;
  host: string | null;
  database: string | null;
  port: string | null;
  user: string | null;
  sslMode: string | null;
  /** Neon pooler vs direct hints from hostname. */
  neonHints: {
    isNeonHost: boolean;
    poolerLikely: boolean;
    branchSlug: string | null;
  };
  directUrlConfigured: boolean;
  directHost: string | null;
  /** When host differs, production may be reading a different branch than migrations. */
  databaseUrlHostMatchesDirect: boolean | null;
};

function parsePostgresUrlSafe(url: string): Omit<DatabaseConnectionDiagnostics, "configured" | "directUrlConfigured" | "directHost" | "databaseUrlHostMatchesDirect" | "neonHints"> & {
  neonHints: DatabaseConnectionDiagnostics["neonHints"];
} {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname || null;
    const database = parsed.pathname?.replace(/^\//, "") || null;
    const sslMode = parsed.searchParams.get("sslmode");
    const branchSlug = host?.includes(".neon.tech")
      ? host.split(".")[0] ?? null
      : null;
    return {
      host,
      database: database || null,
      port: parsed.port || "5432",
      user: parsed.username || null,
      sslMode,
      neonHints: {
        isNeonHost: Boolean(host?.includes(".neon.tech")),
        poolerLikely: Boolean(host?.includes("-pooler") || host?.includes("pooler")),
        branchSlug
      }
    };
  } catch {
    return {
      host: null,
      database: null,
      port: null,
      user: null,
      sslMode: null,
      neonHints: { isNeonHost: false, poolerLikely: false, branchSlug: null }
    };
  }
}

export function getDatabaseConnectionDiagnostics(): DatabaseConnectionDiagnostics {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  const directUrl = process.env.DIRECT_URL?.trim() ?? "";

  if (!databaseUrl) {
    return {
      configured: false,
      host: null,
      database: null,
      port: null,
      user: null,
      sslMode: null,
      neonHints: { isNeonHost: false, poolerLikely: false, branchSlug: null },
      directUrlConfigured: Boolean(directUrl),
      directHost: directUrl ? parsePostgresUrlSafe(directUrl).host : null,
      databaseUrlHostMatchesDirect: null
    };
  }

  const primary = parsePostgresUrlSafe(databaseUrl);
  const direct = directUrl ? parsePostgresUrlSafe(directUrl) : null;

  return {
    configured: true,
    ...primary,
    directUrlConfigured: Boolean(directUrl),
    directHost: direct?.host ?? null,
    databaseUrlHostMatchesDirect: direct?.host
      ? primary.host === direct.host
      : null
  };
}
