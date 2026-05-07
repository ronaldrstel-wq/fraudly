import { describe, expect, it } from "vitest";
import { analyzeProductMarketplaceSignals } from "@/lib/productMarketplaceSignals";

describe("product marketplace signal analyzer", () => {
  it("returns null when deep scan is disabled", async () => {
    const result = await analyzeProductMarketplaceSignals({
      domain: "example.com",
      websiteText: "shop now product",
      websiteSignals: { title: "", metaDescription: "", bodySnippet: "", text: "", imageUrls: [], productSnippets: [] },
      deepScan: false
    });
    expect(result).toBeNull();
  });

  it("handles limited input without breaking scan flow", async () => {
    const result = await analyzeProductMarketplaceSignals({
      domain: "example.com",
      websiteText: "add to cart collection",
      websiteSignals: {
        title: "Shop",
        metaDescription: "",
        bodySnippet: "shop",
        text: "shop",
        imageUrls: [
          "notaurl",
          "https://cdn.example.com/product-1.jpg",
          "https://cdn.example.com/product-2.jpg",
          "https://cdn.example.com/product-3.jpg",
          "https://cdn.example.com/product-4.jpg",
          "https://cdn.example.com/product-5.jpg"
        ],
        productSnippets: []
      },
      deepScan: true
    });
    expect(result).not.toBeNull();
    expect(result?.matchedImageCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result?.warnings)).toBe(true);
  });
});
