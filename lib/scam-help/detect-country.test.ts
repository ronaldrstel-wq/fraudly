import { describe, expect, it } from "vitest";
import { detectCountryFromHeaders, isScamHelpCountryCode } from "@/lib/scam-help/detect-country";

function headers(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe("detectCountryFromHeaders", () => {
  it("prefers x-vercel-ip-country", () => {
    const h = headers({
      "x-vercel-ip-country": "NL",
      "cf-ipcountry": "DE",
      "accept-language": "en-US"
    });
    expect(detectCountryFromHeaders(h)).toBe("NL");
  });

  it("falls back to cf-ipcountry", () => {
    const h = headers({ "cf-ipcountry": "gb", "accept-language": "nl" });
    expect(detectCountryFromHeaders(h)).toBe("GB");
  });

  it("maps accept-language hints", () => {
    expect(detectCountryFromHeaders(headers({ "accept-language": "nl-NL,nl;q=0.9" }))).toBe("NL");
    expect(detectCountryFromHeaders(headers({ "accept-language": "en-GB,en;q=0.9" }))).toBe("GB");
    expect(detectCountryFromHeaders(headers({ "accept-language": "de-DE,de;q=0.9" }))).toBe("DE");
    expect(detectCountryFromHeaders(headers({ "accept-language": "fr-FR,fr;q=0.9" }))).toBe("FR");
    expect(detectCountryFromHeaders(headers({ "accept-language": "en-US,en;q=0.9" }))).toBe("US");
  });

  it("returns null when unknown", () => {
    expect(detectCountryFromHeaders(headers({ "accept-language": "ja" }))).toBeNull();
    expect(detectCountryFromHeaders(headers({ "x-vercel-ip-country": "XX" }))).toBeNull();
  });
});

describe("isScamHelpCountryCode", () => {
  it("validates supported codes", () => {
    expect(isScamHelpCountryCode("NL")).toBe(true);
    expect(isScamHelpCountryCode("ZZ")).toBe(false);
  });
});
