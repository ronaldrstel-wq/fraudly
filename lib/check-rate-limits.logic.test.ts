import { afterEach, describe, expect, it, vi } from "vitest";
import { getScanRateEnvLimits, pickRateLimitViolation } from "@/lib/checkRateLimits";

const baseLimits = {
  ipBurst10m: 20,
  abuseKeyBurst10m: 10,
  userIdBurst10m: 10,
  freeUserDaily: 5,
  paidUserDaily: 100,
  freeDeepDaily: 3
};

describe("pickRateLimitViolation", () => {
  it("blocks when IP burst window is full", () => {
    const v = pickRateLimitViolation(
      { ipBurst: 20, abuseBurst: 0, userIdBurst: 0, allowedUserDaily: 0, allowedDeepDaily: 0 },
      baseLimits,
      { authenticated: false, userId: null, paid: false, scanIsDeep: true }
    );
    expect(v).toBe("ip_burst");
  });

  it("blocks when abuse key burst window is full (before authenticated daily checks)", () => {
    const v = pickRateLimitViolation(
      { ipBurst: 0, abuseBurst: 10, userIdBurst: 0, allowedUserDaily: 0, allowedDeepDaily: 0 },
      baseLimits,
      { authenticated: true, userId: "user_1", paid: false, scanIsDeep: true }
    );
    expect(v).toBe("abuse_key_burst");
  });

  it("enforces authenticated user burst per user id", () => {
    const v = pickRateLimitViolation(
      { ipBurst: 2, abuseBurst: 2, userIdBurst: 10, allowedUserDaily: 2, allowedDeepDaily: 1 },
      baseLimits,
      { authenticated: true, userId: "user_other", paid: false, scanIsDeep: true }
    );
    expect(v).toBe("user_burst");
  });

  it("applies shared IP burst across many distinct authenticated users", () => {
    const counts = { ipBurst: 20, abuseBurst: 0, userIdBurst: 0, allowedUserDaily: 1, allowedDeepDaily: 0 };
    expect(
      pickRateLimitViolation(counts, baseLimits, {
        authenticated: true,
        userId: "account_a",
        paid: false,
        scanIsDeep: true
      })
    ).toBe("ip_burst");
    expect(
      pickRateLimitViolation(counts, baseLimits, {
        authenticated: true,
        userId: "account_b",
        paid: false,
        scanIsDeep: true
      })
    ).toBe("ip_burst");
  });

  it("blocks free authenticated users after the daily allowance", () => {
    const v = pickRateLimitViolation(
      { ipBurst: 0, abuseBurst: 0, userIdBurst: 0, allowedUserDaily: 5, allowedDeepDaily: 1 },
      baseLimits,
      { authenticated: true, userId: "u_free", paid: false, scanIsDeep: false }
    );
    expect(v).toBe("user_daily_free");
  });

  it("allows paid users a higher daily cap", () => {
    expect(
      pickRateLimitViolation(
        {
          ipBurst: 0,
          abuseBurst: 0,
          userIdBurst: 0,
          allowedUserDaily: 99,
          allowedDeepDaily: 99
        },
        baseLimits,
        { authenticated: true, userId: "u_paid", paid: true, scanIsDeep: true }
      )
    ).toBeNull();
    expect(
      pickRateLimitViolation(
        {
          ipBurst: 0,
          abuseBurst: 0,
          userIdBurst: 0,
          allowedUserDaily: 100,
          allowedDeepDaily: 40
        },
        baseLimits,
        { authenticated: true, userId: "u_paid", paid: true, scanIsDeep: true }
      )
    ).toBe("user_daily_paid");
  });

  it("caps deep scans for free authenticated users independently of shallow checks", () => {
    expect(
      pickRateLimitViolation(
        {
          ipBurst: 0,
          abuseBurst: 0,
          userIdBurst: 0,
          allowedUserDaily: 2,
          allowedDeepDaily: 3
        },
        baseLimits,
        { authenticated: true, userId: "u", paid: false, scanIsDeep: true }
      )
    ).toBe("deep_daily");
    expect(
      pickRateLimitViolation(
        {
          ipBurst: 0,
          abuseBurst: 0,
          userIdBurst: 0,
          allowedUserDaily: 2,
          allowedDeepDaily: 3
        },
        baseLimits,
        { authenticated: true, userId: "u", paid: false, scanIsDeep: false }
      )
    ).toBeNull();
  });

  it("skips authenticated daily quotas for anonymous-style sessions", () => {
    expect(
      pickRateLimitViolation(
        {
          ipBurst: 0,
          abuseBurst: 0,
          userIdBurst: 0,
          allowedUserDaily: 999,
          allowedDeepDaily: 999
        },
        baseLimits,
        { authenticated: false, userId: null, paid: false, scanIsDeep: true }
      )
    ).toBeNull();
  });

  it("skips deep cap for paying customers", () => {
    expect(
      pickRateLimitViolation(
        {
          ipBurst: 0,
          abuseBurst: 0,
          userIdBurst: 0,
          allowedUserDaily: 5,
          allowedDeepDaily: 50
        },
        baseLimits,
        { authenticated: true, userId: "u", paid: true, scanIsDeep: true }
      )
    ).toBeNull();
  });
});

describe("getScanRateEnvLimits", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads configured env overrides", () => {
    vi.stubEnv("FREE_USER_DAILY_CHECK_LIMIT", "7");
    vi.stubEnv("PAID_USER_DAILY_CHECK_LIMIT", "40");
    vi.stubEnv("FREE_DEEP_SCAN_DAILY_LIMIT", "2");
    vi.stubEnv("IP_BURST_LIMIT_10_MIN", "15");
    vi.stubEnv("USER_BURST_LIMIT_10_MIN", "4");
    vi.stubEnv("ABUSE_KEY_BURST_LIMIT_10_MIN", "6");

    const limits = getScanRateEnvLimits();
    expect(limits.freeUserDaily).toBe(7);
    expect(limits.paidUserDaily).toBe(40);
    expect(limits.freeDeepDaily).toBe(2);
    expect(limits.ipBurst10m).toBe(15);
    expect(limits.userIdBurst10m).toBe(4);
    expect(limits.abuseKeyBurst10m).toBe(6);
  });
});
