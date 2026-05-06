import { describe, expect, it } from "vitest";
import { parseFlexibleWebsiteInput } from "./normalizeWebsiteInput";

function expectOk(input: string) {
  const r = parseFlexibleWebsiteInput(input);
  expect(r.ok).toBe(true);
  if (!r.ok) return null;
  return r;
}

describe("parseFlexibleWebsiteInput", () => {
  it("accepts bare domain and defaults to https", () => {
    const r = expectOk("google.com");
    expect(r?.canonicalHref).toMatch(/^https:\/\/google\.com\/?/i);
    expect(r?.url.hostname).toBe("google.com");
  });

  it("accepts www and path", () => {
    const r = expectOk("www.google.com/search?q=test");
    expect(r?.ok).toBe(true);
    expect(r?.url.pathname).toBe("/search");
    expect(r?.url.searchParams.get("q")).toBe("test");
  });

  it("accepts mixed-case scheme and host", () => {
    const r = expectOk("HTTPS://Example.COM/Path");
    expect(r?.url.protocol).toBe("https:");
    expect(r?.url.hostname).toBe("example.com");
    expect(r?.url.pathname.toLowerCase()).toBe("/path");
  });

  it("accepts explicit http and https", () => {
    expect(parseFlexibleWebsiteInput("http://example.com").ok).toBe(true);
    expect(parseFlexibleWebsiteInput("https://example.com").ok).toBe(true);
  });

  it("normalizes http and bare domain to same host for dedupe flows", () => {
    const a = expectOk("http://example.com/path");
    const b = expectOk("example.com/path");
    expect(a?.url.hostname).toBe(b?.url.hostname);
    expect(a?.url.pathname).toBe(b?.url.pathname);
  });

  it("accepts protocol-relative", () => {
    const r = expectOk("//example.org/login");
    expect(r?.url.protocol).toBe("https:");
    expect(r?.url.hostname).toBe("example.org");
    expect(r?.url.pathname).toBe("/login");
  });

  it("rejects mailto and javascript", () => {
    expect(parseFlexibleWebsiteInput("mailto:a@b.com").ok).toBe(false);
    expect(parseFlexibleWebsiteInput("javascript:alert(1)").ok).toBe(false);
  });

  it("rejects userinfo", () => {
    expect(parseFlexibleWebsiteInput("https://user:pass@example.com").ok).toBe(false);
  });

  it("rejects interior whitespace", () => {
    expect(parseFlexibleWebsiteInput("google .com").ok).toBe(false);
  });

  it("rejects single-label host without localhost", () => {
    expect(parseFlexibleWebsiteInput("nope").ok).toBe(false);
  });

  it("accepts localhost", () => {
    const r = expectOk("localhost:3000");
    expect(r?.url.hostname).toBe("localhost");
  });

  it("preserves query on bare host", () => {
    const r = expectOk("paypal-support-alert.net/reset?x=1");
    expect(r?.url.hostname).toBe("paypal-support-alert.net");
    expect(r?.url.pathname).toBe("/reset");
    expect(r?.url.searchParams.get("x")).toBe("1");
  });
});
