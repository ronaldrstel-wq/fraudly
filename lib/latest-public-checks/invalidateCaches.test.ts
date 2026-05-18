import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidateTag, revalidatePath } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidateTag,
  revalidatePath
}));

import { invalidateLatestPublicChecksCaches } from "@/lib/latest-public-checks/invalidateCaches";

describe("invalidateLatestPublicChecksCaches", () => {
  beforeEach(() => {
    revalidateTag.mockReset();
    revalidatePath.mockReset();
  });

  it("revalidates feed tag, homepage, latest-checks, and locale routes", () => {
    const result = invalidateLatestPublicChecksCaches();
    expect(revalidateTag).toHaveBeenCalledWith("latest-public-checks-feed");
    expect(result.paths).toContain("/");
    expect(result.paths).toContain("/latest-checks");
    expect(result.paths).toContain("/nl/latest-checks");
    expect(result.paths).toContain("/latest-checks?page=2");
    expect(revalidatePath).toHaveBeenCalled();
  });

  it("revalidates check paths and analysis tags for updated domains", () => {
    const result = invalidateLatestPublicChecksCaches({ domains: ["Americatoday.com", "damlabels.com"] });
    expect(result.domainPaths).toEqual(
      expect.arrayContaining(["/check/americatoday.com", "/check/damlabels.com"])
    );
    expect(revalidateTag).toHaveBeenCalledWith("website-analysis-v3:americatoday.com");
    expect(revalidateTag).toHaveBeenCalledWith("website-analysis-v3:damlabels.com");
  });
});
