import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const paths = [
  "/",
  "/about",
  "/how-it-works",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/cookies",
  "/scam-checker",
  "/phishing-checker",
  "/email-scam-checker",
  "/fake-website-checker",
  "/crypto-scam-checker"
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "/" ? ("weekly" as const) : ("monthly" as const),
    priority: path === "/" ? 1 : 0.7
  }));
}
