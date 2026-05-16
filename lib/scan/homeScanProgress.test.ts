import { describe, expect, it } from "vitest";
import {
  HOME_SCAN_PROGRESS_FAST_CAP,
  HOME_SCAN_PROGRESS_SLOW_CAP,
  homeScanStatusMessage,
  nextHomeScanSimulatedProgress
} from "@/lib/scan/homeScanProgress";

describe("homeScanProgress", () => {
  it("maps progress to rotating messages", () => {
    expect(homeScanStatusMessage(5, false)).toContain("SSL");
    expect(homeScanStatusMessage(40, false)).toContain("feeds");
    expect(homeScanStatusMessage(100, false)).toContain("complete");
  });

  it("simulates faster below 70 and slower toward 95", () => {
    let p = 0;
    let reached70 = false;
    let reached95 = false;
    for (let i = 0; i < 80; i++) {
      const prev = p;
      p = nextHomeScanSimulatedProgress(p);
      if (p >= HOME_SCAN_PROGRESS_FAST_CAP && prev < HOME_SCAN_PROGRESS_FAST_CAP) reached70 = true;
      if (p >= HOME_SCAN_PROGRESS_SLOW_CAP) reached95 = true;
    }
    expect(reached70).toBe(true);
    expect(reached95).toBe(true);
    expect(p).toBeLessThanOrEqual(HOME_SCAN_PROGRESS_SLOW_CAP);
  });
});
