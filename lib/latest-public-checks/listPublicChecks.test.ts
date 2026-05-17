import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown) => fn
}));

vi.mock("@/lib/db", () => ({
  db: {
    latestPublicCheck: {
      findMany: vi.fn()
    }
  }
}));

import { db } from "@/lib/db";
import {
  fetchLatestPublicChecksPage,
  latestPublicChecksCacheKey
} from "@/lib/latest-public-checks/listPublicChecks";
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

  it("falls back to legacy select when canonical columns are missing (P2022)", async () => {
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
    vi.mocked(db.latestPublicCheck.findMany)
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("column does not exist", {
          code: "P2022",
          clientVersion: "test"
        })
      )
      .mockResolvedValueOnce([row] as never);

    const result = await fetchLatestPublicChecksPage(0, 10);
    expect(result.loadFailed).toBe(false);
    expect(result.rows).toHaveLength(1);
    expect(db.latestPublicCheck.findMany).toHaveBeenCalledTimes(2);
  });

  it("returns loadFailed when both canonical and legacy selects fail", async () => {
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

  it("includes skip and take in cache key per page", () => {
    expect(latestPublicChecksCacheKey(0, 11)).toEqual(["latest-public-checks-page", "0", "11"]);
    expect(latestPublicChecksCacheKey(10, 11)).toEqual(["latest-public-checks-page", "10", "11"]);
    expect(latestPublicChecksCacheKey(20, 11)).toEqual(["latest-public-checks-page", "20", "11"]);
  });

  it("returns empty list without throwing on generic errors", async () => {
    vi.mocked(db.latestPublicCheck.findMany).mockRejectedValue(new Error("connection refused"));

    const result = await fetchLatestPublicChecksPage(0, 10);
    expect(result.loadFailed).toBe(true);
    expect(result.rows).toEqual([]);
  });
});
