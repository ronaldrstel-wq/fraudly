import { describe, expect, it, vi, afterEach } from "vitest";
import { getDatabaseConnectionDiagnostics } from "@/lib/db/connectionDiagnostics";

describe("getDatabaseConnectionDiagnostics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns configured=false when DATABASE_URL is missing", () => {
    vi.stubEnv("DATABASE_URL", "");
    const d = getDatabaseConnectionDiagnostics();
    expect(d.configured).toBe(false);
    expect(d.host).toBeNull();
  });

  it("parses host and database without exposing password", () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://app_user:supersecret@ep-cool-name-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
    );
    const d = getDatabaseConnectionDiagnostics();
    expect(d.configured).toBe(true);
    expect(d.host).toContain("neon.tech");
    expect(d.database).toBe("neondb");
    expect(d.user).toBe("app_user");
    expect(d.neonHints.isNeonHost).toBe(true);
    expect(d.neonHints.poolerLikely).toBe(true);
    expect(JSON.stringify(d)).not.toContain("supersecret");
  });
});
