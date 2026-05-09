import { describe, expect, it } from "vitest";
import { detectFakeWebshopSignals } from "@/lib/fake-webshop/detect";

describe("detectFakeWebshopSignals", () => {
  it("flags very new domain with discount hype", () => {
    const r = detectFakeWebshopSignals({
      url: "https://cheap-brand-deals.xyz",
      pageText: "90% off clearance sale today only — buy now",
      domainAgeDays: 10,
      adText: "Limited stock"
    });
    expect(r.riskDelta).toBeGreaterThanOrEqual(8);
    expect(r.riskDelta).toBeLessThanOrEqual(25);
    expect(r.signals.length).toBeGreaterThan(0);
  });

  it("caps risk delta at 25", () => {
    const r = detectFakeWebshopSignals({
      url: "https://fake-nike-outlet.ml",
      pageText:
        "90% off gucci prada today only bitcoin only wire transfer only contact us@gmail.com clearance sale last chance",
      domainAgeDays: 2,
      adText: "Pay shipping only celebrity endorsed"
    });
    expect(r.riskDelta).toBeLessThanOrEqual(25);
  });

  it("can reduce risk when transparency signals exist", () => {
    const r = detectFakeWebshopSignals({
      url: "https://boring-retailer.example",
      pageText:
        "Contact us return policy VAT NL123456789B01 Our address Main Street 1 Amsterdam visa mastercard paypal accepted",
      domainAgeDays: 800,
      hasContactPage: true,
      hasReturnPolicy: true,
      hasCompanyAddress: true,
      hasKvKOrVat: true
    });
    expect(r.riskDelta).toBeGreaterThanOrEqual(-10);
    expect(r.riskDelta).toBeLessThanOrEqual(25);
    expect(r.riskDelta).toBeLessThanOrEqual(0);
  });
});
