import { afterEach, describe, expect, it } from "vitest";
import { getHardDeleteArchivedAfterDays, getScamAlertsMaxNewPerRun } from "@/lib/scam-alerts/service";

describe("getScamAlertsMaxNewPerRun", () => {
  const old = process.env.SCAM_ALERTS_MAX_NEW_PER_RUN;

  afterEach(() => {
    if (old === undefined) delete process.env.SCAM_ALERTS_MAX_NEW_PER_RUN;
    else process.env.SCAM_ALERTS_MAX_NEW_PER_RUN = old;
  });

  it("defaults to 100", () => {
    delete process.env.SCAM_ALERTS_MAX_NEW_PER_RUN;
    expect(getScamAlertsMaxNewPerRun()).toBe(100);
  });

  it("parses positive integer", () => {
    process.env.SCAM_ALERTS_MAX_NEW_PER_RUN = "50";
    expect(getScamAlertsMaxNewPerRun()).toBe(50);
  });

  it("falls back on invalid", () => {
    process.env.SCAM_ALERTS_MAX_NEW_PER_RUN = "0";
    expect(getScamAlertsMaxNewPerRun()).toBe(100);
  });
});

describe("getHardDeleteArchivedAfterDays", () => {
  const old = process.env.SCAM_ALERTS_HARD_DELETE_ARCHIVED_AFTER_DAYS;

  afterEach(() => {
    if (old === undefined) delete process.env.SCAM_ALERTS_HARD_DELETE_ARCHIVED_AFTER_DAYS;
    else process.env.SCAM_ALERTS_HARD_DELETE_ARCHIVED_AFTER_DAYS = old;
  });

  it("defaults to 180", () => {
    delete process.env.SCAM_ALERTS_HARD_DELETE_ARCHIVED_AFTER_DAYS;
    expect(getHardDeleteArchivedAfterDays()).toBe(180);
  });

  it("disables hard delete when never", () => {
    process.env.SCAM_ALERTS_HARD_DELETE_ARCHIVED_AFTER_DAYS = "never";
    expect(getHardDeleteArchivedAfterDays()).toBe(null);
  });
});
