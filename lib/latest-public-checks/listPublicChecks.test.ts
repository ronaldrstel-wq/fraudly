import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    latestPublicCheck: {
      findMany: vi.fn()
    }
  }
}));

import { db } from "@/lib/db";
import { fetchLatestPublicChecksPage } from "@/lib/latest-public-checks/listPublicChecks";
import { Prisma } from "@prisma/client";

describe("fetchLatestPublicChecksPage", () => {
  beforeEach(() => {
    vi.mocked(db.latestPublicCheck.findMany).mockReset();
  });

  it("returns rows on success", async () => {
    const row = {
      id: "c1",
      normalizedValue: "example.com",
      checkedValue: "example.com",
      entityType: "domain",
      riskScoreSnapshot: 30,
      statusLabel: "Lower risk context snapshot",
      publicResultPath: "/check/example.com",
      lastSeenAt: new Date("2026-01-01T00:00:00.000Z")
    };
    vi.mocked(db.latestPublicCheck.findMany).mockResolvedValue([row] as never);

    const result = await fetchLatestPublicChecksPage(0, 10);
    expect(result.loadFailed).toBe(false);
    expect(result.rows).toHaveLength(1);
    expect(db.latestPublicCheck.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: expect.objectContaining({ id: true, riskScoreSnapshot: true }) })
    );
  });

  it("returns empty list without throwing on Prisma errors", async () => {
    vi.mocked(db.latestPublicCheck.findMany).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("column does not exist", {
        code: "P2022",
        clientVersion: "test"
      })
    );

    const result = await fetchLatestPublicChecksPage(0, 10);
    expect(result.loadFailed).toBe(true);
    expect(result.rows).toEqual([]);
  });

  it("returns empty list without throwing on generic errors", async () => {
    vi.mocked(db.latestPublicCheck.findMany).mockRejectedValue(new Error("connection refused"));

    const result = await fetchLatestPublicChecksPage(0, 10);
    expect(result.loadFailed).toBe(true);
    expect(result.rows).toEqual([]);
  });
});
