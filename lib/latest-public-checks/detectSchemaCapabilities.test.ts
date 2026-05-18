import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: vi.fn()
  }
}));

import { db } from "@/lib/db";
import { detectLatestPublicCheckSchemaCapabilities } from "@/lib/latest-public-checks/detectSchemaCapabilities";

describe("detectLatestPublicCheckSchemaCapabilities", () => {
  beforeEach(() => {
    vi.mocked(db.$queryRaw).mockReset();
  });

  it("reports full mode when payload and canonical columns exist", async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue(
      [
        { column_name: "id" },
        { column_name: "riskScoreSnapshot" },
        { column_name: "publicResultPayload" },
        { column_name: "consumerVerdict" },
        { column_name: "consumerVerdictLabel" },
        { column_name: "consumerVerdictBand" },
        { column_name: "normalizedTrustScore" },
        { column_name: "normalizedRiskScore" }
      ] as never
    );

    const caps = await detectLatestPublicCheckSchemaCapabilities();
    expect(caps.backfillSelectMode).toBe("full");
    expect(caps.canWriteCanonicalColumns).toBe(true);
    expect(caps.migrationRequired).toBe(false);
    expect(caps.missingCanonicalColumns).toEqual([]);
  });

  it("reports legacy mode when canonical columns are missing", async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue(
      [{ column_name: "id" }, { column_name: "riskScoreSnapshot" }, { column_name: "publicResultPayload" }] as never
    );

    const caps = await detectLatestPublicCheckSchemaCapabilities();
    expect(caps.backfillSelectMode).toBe("legacy");
    expect(caps.canWriteCanonicalColumns).toBe(false);
    expect(caps.migrationRequired).toBe(true);
    expect(caps.missingCanonicalColumns).toContain("consumerVerdict");
  });
});
