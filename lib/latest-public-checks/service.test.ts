import { beforeEach, describe, expect, it, vi } from "vitest";

const { countMock, findManyMock } = vi.hoisted(() => ({
  countMock: vi.fn(),
  findManyMock: vi.fn()
}));
const infoMock = vi.spyOn(console, "info").mockImplementation(() => {});

vi.mock("@/lib/db", () => ({
  db: {
    latestPublicCheck: {
      count: countMock,
      findMany: findManyMock
    }
  }
}));

import { listLatestPublicChecksPage } from "@/lib/latest-public-checks/service";

describe("listLatestPublicChecksPage", () => {
  beforeEach(() => {
    countMock.mockReset();
    findManyMock.mockReset();
    infoMock.mockClear();
  });

  it("queries newest-first without user/tenant filtering", async () => {
    countMock.mockResolvedValue(17);
    findManyMock.mockResolvedValue([
      {
        id: "a",
        checkedValue: "https://a.test/",
        entityType: "domain",
        riskScoreSnapshot: 23,
        statusLabel: "Likely safe",
        publicResultPath: "/check/a.test",
        lastSeenAt: new Date("2026-05-07T12:00:00Z")
      }
    ]);

    const rows = await listLatestPublicChecksPage({ skip: 0, take: 10, debugLabel: "unit" });

    expect(rows).toHaveLength(1);
    expect(findManyMock).toHaveBeenCalledWith({
      orderBy: { lastSeenAt: "desc" },
      skip: 0,
      take: 10,
      select: {
        id: true,
        checkedValue: true,
        entityType: true,
        riskScoreSnapshot: true,
        statusLabel: true,
        publicResultPath: true,
        lastSeenAt: true
      }
    });
    expect(infoMock).toHaveBeenCalledWith(
      "[latest-checks] page query",
      expect.objectContaining({
        debugLabel: "unit",
        totalCount: 17,
        returnedCount: 1
      })
    );
  });
});
