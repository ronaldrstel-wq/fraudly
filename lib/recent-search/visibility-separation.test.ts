import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyMock, findUniqueMock, updateMock, updateManyMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  updateManyMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  db: {
    recentSearch: {
      findMany: findManyMock,
      findUnique: findUniqueMock,
      update: updateMock,
      updateMany: updateManyMock
    }
  }
}));

import {
  deleteAllRecentSearchesForScope,
  deleteRecentSearchForScope,
  listRecentSearchesForScope
} from "@/lib/recent-search/service";

describe("recent search visibility separation", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    findUniqueMock.mockReset();
    updateMock.mockReset();
    updateManyMock.mockReset();
  });

  it("private list excludes hidden rows", async () => {
    findManyMock.mockResolvedValue([]);
    await listRecentSearchesForScope({ userId: "user_1", anonymousSessionKey: null });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user_1",
          hiddenFromUserAt: null
        })
      })
    );
  });

  it("clear single soft-hides instead of deleting", async () => {
    findUniqueMock.mockResolvedValue({
      id: "row_1",
      userId: "user_1",
      anonymousSessionKey: null
    });
    updateMock.mockResolvedValue({});
    const ok = await deleteRecentSearchForScope("row_1", { userId: "user_1", anonymousSessionKey: null });
    expect(ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "row_1" },
        data: expect.objectContaining({
          hiddenFromUserAt: expect.any(Date),
          hiddenFromUserBy: "user_clear"
        })
      })
    );
  });

  it("clear all soft-hides only scope-visible rows", async () => {
    updateManyMock.mockResolvedValue({ count: 2 });
    const count = await deleteAllRecentSearchesForScope({ userId: "user_1", anonymousSessionKey: null });
    expect(count).toBe(2);
    expect(updateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user_1", hiddenFromUserAt: null },
        data: expect.objectContaining({ hiddenFromUserBy: "user_clear" })
      })
    );
  });
});
