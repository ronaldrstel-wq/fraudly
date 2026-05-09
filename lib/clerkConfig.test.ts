import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logClerkProductionMisconfigWarnings } from "@/lib/clerkConfig";

describe("logClerkProductionMisconfigWarnings", () => {
  const err = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    err.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    delete process.env.CLERK_SECRET_KEY;
  });

  it("warns when production uses pk_test publishable key", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_abc";
    process.env.CLERK_SECRET_KEY = "sk_test_xyz";
    logClerkProductionMisconfigWarnings();
    expect(err).toHaveBeenCalledWith(expect.stringContaining("pk_test"));
  });

  it("warns on live secret + test publishable mismatch", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_abc";
    process.env.CLERK_SECRET_KEY = "sk_live_xyz";
    logClerkProductionMisconfigWarnings();
    expect(err).toHaveBeenCalledWith(expect.stringContaining("Mismatch"));
  });

  it("no-ops outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_abc";
    logClerkProductionMisconfigWarnings();
    expect(err).not.toHaveBeenCalled();
  });

  afterAll(() => {
    err.mockRestore();
  });
});
