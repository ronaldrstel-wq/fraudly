import type { MetadataRoute } from "next";
import { getAllIntelligencePaths } from "@/lib/blog/registry";
import { allLocalizedMarketingUrls } from "@/lib/i18n/sitemap-paths";
import { SITE_URL } from "@/lib/seo";

const OTHER_PUBLIC_PATHS = [
  "/pulse",
  "/scam-help/netherlands",
  "/scam-help/united-kingdom",
  "/scam-help/germany",
  "/scam-help/united-states",
  "/how-it-works",
  "/features",
  "/learn",
  "/scam-checker",
  "/phishing-checker",
  "/fake-website-checker",
  "/email-scam-checker",
  "/crypto-scam-checker",
  "/website-scam-checker",
  "/check-if-website-is-safe",
  "/fake-webshop-check",
  "/online-scam-detector",
  "/pricing",
  "/privacy",
  "/cookies",
  "/terms",
  "/disclaimer"
] as const;

const PUBLIC_PATHS = [...allLocalizedMarketingUrls(), ...OTHER_PUBLIC_PATHS, ...getAllIntelligencePaths()] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency:
      path === "/" ||
      path.endsWith("/latest-checks") ||
      path.includes("/latest-checks") ||
      path === "/pulse" ||
      path.endsWith("/scam-alerts") ||
      path.includes("/scam-alerts")
        ? "daily"
        : "weekly",
    priority: path === "/" || path === "/nl" || path === "/de" || path === "/fr" ? 1 : 0.8
  }));
}
