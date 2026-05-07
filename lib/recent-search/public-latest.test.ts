import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRawMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn()
}));
const infoMock = vi.spyOn(console, "info").mockImplementation(() => {});

vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: queryRawMock
  }
}));

import { getPublicLatestScans } from "@/lib/public-feed/service";

describe("getPublicLatestScans", () => {
  beforeEach(() => {
    queryRawMock.mockReset();
    infoMock.mockClear();
  });

  it("returns newest public scans via dedicated view contract", async () => {
    queryRawMock
      .mockResolvedValueOnce([{ totalCount: 12 }])
      .mockResolvedValueOnce([
      {
        id: "row-1",
        normalizedValue: "https://a.example/",
        entityType: "domain",
        score: 75,
        status: "safe",
        publicResultPath: "/check/a.example",
        createdAt: new Date("2026-05-07T14:00:00Z")
      },
      {
        id: "row-2",
        normalizedValue: "https://anon.example/",
        entityType: "domain",
        score: 65,
        status: "unknown",
        publicResultPath: "/check/anon.example",
        createdAt: new Date("2026-05-07T13:59:00Z")
      }
    ]);

    const rows = await getPublicLatestScans({ skip: 0, take: 20, debugLabel: "unit" });

    expect(queryRawMock).toHaveBeenCalledTimes(2);
    expect(rows[0]).toMatchObject({
      id: "row-1",
      checkedValue: "https://a.example/",
      riskScoreSnapshot: 25,
      statusLabel: "safe",
      publicResultPath: "/check/a.example"
    });
    expect(rows[1]).toMatchObject({
      id: "row-2",
      checkedValue: "https://anon.example/",
      riskScoreSnapshot: 35,
      statusLabel: "unknown",
      publicResultPath: "/check/anon.example"
    });

    const forbiddenKeys = [
      "userId",
      "email",
      "ipAddress",
      "anonymousSessionKey",
      "rawResult",
      "metadata",
      "privateNotes"
    ] as const;
    for (const row of rows) {
      for (const key of forbiddenKeys) {
        expect(key in (row as Record<string, unknown>)).toBe(false);
      }
    }

    expect(infoMock).toHaveBeenCalledWith(
      "[latest-checks] public feed view query",
      expect.objectContaining({
        totalCount: 12,
        returnedCount: 2
      })
    );
  });
});
