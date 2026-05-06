import { describe, expect, it } from "vitest";
import { getScoreUiModel } from "@/components/ResultCard";

describe("ResultCard score ui model", () => {
  it("renders safely with missing breakdown fields", () => {
    const model = getScoreUiModel(undefined);
    expect(model.confidence).toBe("low");
    expect(model.riskLabels).toEqual([]);
    expect(model.riskLabelDetails).toEqual([]);
    expect(model.scoreCapsApplied).toEqual([]);
    expect(model.scoreBreakdown).toBeUndefined();
  });
});

