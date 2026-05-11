import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const PUBLIC_PATHS = [
  "/",
  "/latest-checks",
  "/scam-alerts",
  "/about",
  "/privacy",
  "/cookies",
  "/terms"
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" || path === "/latest-checks" || path === "/scam-alerts" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.8
  }));
}
