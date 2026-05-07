import type { MetadataRoute } from "next";
import { listPublishedScamAlerts } from "@/lib/scam-alerts/service";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const alerts = await listPublishedScamAlerts(500);
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/latest-checks`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/scam-alerts`, changeFrequency: "hourly", priority: 0.85 }
  ];
  const alertRoutes: MetadataRoute.Sitemap = alerts.map((alert) => ({
    url: `${SITE_URL}/scam-alerts/${alert.slug}`,
    lastModified: alert.updatedAt,
    changeFrequency: "daily",
    priority: 0.7
  }));
  return [...staticRoutes, ...alertRoutes];
}
