import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { isPublicScamAlertsReadSkipped } from "@/lib/scam-alerts/dbErrors";

describe("isPublicScamAlertsReadSkipped", () => {
  it("treats missing column and connection errors as skippable", () => {
    const err = new Prisma.PrismaClientKnownRequestError("column missing", {
      code: "P2022",
      clientVersion: "test"
    });
    expect(isPublicScamAlertsReadSkipped(err)).toBe(true);
  });

  it("does not skip generic errors", () => {
    expect(isPublicScamAlertsReadSkipped(new Error("boom"))).toBe(false);
  });
});
