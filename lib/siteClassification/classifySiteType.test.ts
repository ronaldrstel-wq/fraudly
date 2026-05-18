import { describe, expect, it } from "vitest";
import { classifySiteType } from "@/lib/siteClassification/classifySiteType";

describe("classifySiteType", () => {
  it("detects webshop patterns", () => {
    const c = classifySiteType({
      hostname: "boutique.example",
      pageText:
        "Add to cart — checkout with Visa and PayPal. Free shipping over $50. Return policy and delivery within 3-5 days. Shop our products."
    });
    expect(c.isWebshop).toBe(true);
    expect(c.siteType).toBe("webshop");
  });

  it("detects SaaS landing pages without marking them as webshops", () => {
    const c = classifySiteType({
      hostname: "fraudly.app",
      pageText:
        "Fraudly — website trust checks for consumers. Sign up for free. Pricing plans per month. API docs and dashboard for teams. Get started today."
    });
    expect(c.isWebshop).toBe(false);
    expect(["saas_landing", "company_website", "unknown"]).toContain(c.siteType);
  });

  it("detects blog/content sites", () => {
    const c = classifySiteType({
      pageText: "Latest article on our blog. Read more. Published on March 2026. Categories: security, guides."
    });
    expect(c.isWebshop).toBe(false);
    expect(c.siteType).toBe("blog_content");
  });
});
