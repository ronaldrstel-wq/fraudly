import { describe, expect, it } from "vitest";
import { registrationDateFromRdapEvents } from "@/lib/checks/providers/domain/rdapRegistration";

describe("registrationDateFromRdapEvents", () => {
  it("reads standard registration action", () => {
    const date = registrationDateFromRdapEvents([
      { eventAction: "registration", eventDate: "2010-05-01T00:00:00Z" }
    ]);
    expect(date?.toISOString()).toBe("2010-05-01T00:00:00.000Z");
  });

  it("reads registered action used by some registries", () => {
    const date = registrationDateFromRdapEvents([
      { eventAction: "registered", eventDate: "2015-03-15T12:00:00Z" }
    ]);
    expect(date?.getUTCFullYear()).toBe(2015);
  });
});
