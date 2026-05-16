import { describe, expect, it } from "vitest";
import type { TrustSignal } from "@/lib/checks/types";
import {
  assessScamFeedThreatStatus,
  FEED_CLEAN_SUMMARY,
  FEED_HIT_SUMMARY,
  reconcileScamFeedConsumerLines
} from "@/lib/signals/feedConsumerSignals";
import { normalizeConsumerSignals } from "@/lib/signals/normalizeConsumerSignals";

function signal(partial: Partial<TrustSignal> & Pick<TrustSignal, "title" | "type">): TrustSignal {
  return {
    title: partial.title,
    type: partial.type,
    description: partial.description ?? "",
    source: partial.source ?? "test"
  };
}

describe("feedConsumerSignals", () => {
  it("reports hit when a confirmed feed listing exists", () => {
    const signals: TrustSignal[] = [
      signal({ title: "Listed in OpenPhish public feed", type: "danger" }),
      signal({ title: "No URLhaus match found in this snapshot", type: "info" })
    ];
    expect(assessScamFeedThreatStatus(signals)).toBe("hit");
  });

  it("reports clean when only negated feed checks exist", () => {
    const signals: TrustSignal[] = [
      signal({ title: "No OpenPhish match found in this snapshot", type: "info" }),
      signal({ title: "No URLhaus match found in this snapshot", type: "info" })
    ];
    expect(assessScamFeedThreatStatus(signals)).toBe("clean");
  });

  it("reconcile removes contradictory aggregate lines", () => {
    const { helpful, watch } = reconcileScamFeedConsumerLines(
      [FEED_CLEAN_SUMMARY, "Valid SSL"],
      [FEED_HIT_SUMMARY]
    );
    expect(helpful.some((l) => l.includes("No matches were found"))).toBe(false);
    expect(watch).toContain(FEED_HIT_SUMMARY);
  });

  it("normalizeConsumerSignals never emits both feed summaries", () => {
    const signals: TrustSignal[] = [
      signal({ title: "Listed in OpenPhish public feed", type: "danger" }),
      signal({ title: "No OpenPhish match found in this snapshot", type: "info" }),
      signal({ title: "No URLhaus match found in this snapshot", type: "info" })
    ];
    const out = normalizeConsumerSignals(signals);
    const hasHit = out.watch.some((l) => l.includes("appears in known scam"));
    const hasClean = out.helpful.some((l) => l.includes("No matches were found"));
    expect(hasHit).toBe(true);
    expect(hasClean).toBe(false);
  });

  it("clean feeds produce helpful summary only", () => {
    const signals: TrustSignal[] = [
      signal({ title: "No OpenPhish match found in this snapshot", type: "info" }),
      signal({ title: "No URLhaus match found in this snapshot", type: "info" })
    ];
    const out = normalizeConsumerSignals(signals);
    expect(out.helpful.some((l) => l.includes("No matches were found"))).toBe(true);
    expect(out.watch.some((l) => l.includes("appears in known scam"))).toBe(false);
  });
});
