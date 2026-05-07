import { describe, expect, it } from "vitest";
import { runWebsiteAnalysis } from "@/lib/analysis/runWebsiteAnalysis";

describe("scan progress orchestration", () => {
  it("emits increasing stage progress and finishes at 100", async () => {
    const updates: number[] = [];
    try {
      await runWebsiteAnalysis("example.com", "en", (p) => {
        updates.push(p.percentage);
      });
    } catch {
      // test is only about progress flow robustness
    }
    expect(updates.length).toBeGreaterThan(0);
    for (let i = 1; i < updates.length; i += 1) {
      expect(updates[i]).toBeGreaterThanOrEqual(updates[i - 1]!);
    }
    expect(updates.at(-1)).toBe(100);
  });
});

