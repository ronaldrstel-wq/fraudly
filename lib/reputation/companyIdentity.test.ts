import { describe, expect, it } from "vitest";
import { extractCompanyIdentity } from "@/lib/reputation/companyIdentity";

describe("extractCompanyIdentity", () => {
  it("extracts og:site_name and strips legal suffixes", () => {
    const html = `
      <html>
        <head>
          <meta property="og:site_name" content="Letsfoil B.V. Official Shop" />
          <title>Letsfoil | Homepage</title>
        </head>
        <body><h1>Welcome</h1></body>
      </html>
    `;
    const identity = extractCompanyIdentity(html, "letsfoil.nl");
    expect(identity.primaryName).toBe("Letsfoil");
    expect(identity.candidates).toContain("Letsfoil");
    expect(identity.evidence.ogSiteName).toContain("Letsfoil");
  });

  it("falls back to domain label when html is missing", () => {
    const identity = extractCompanyIdentity(null, "coolblue.nl");
    expect(identity.primaryName).toBe("Coolblue");
    expect(identity.evidence.domainLabel).toBe("Coolblue");
  });
});
