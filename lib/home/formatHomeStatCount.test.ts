import { describe, expect, it } from "vitest";
import { formatHomeStatCount } from "./formatHomeStatCount";

describe("formatHomeStatCount", () => {
  it("formats small counts exactly", () => {
    expect(formatHomeStatCount(42)).toBe("42");
    expect(formatHomeStatCount(0)).toBe("0");
  });

  it("formats thousands compactly", () => {
    expect(formatHomeStatCount(1200)).toBe("1.2k+");
    expect(formatHomeStatCount(10000)).toBe("10k+");
  });
});
