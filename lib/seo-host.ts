/** Hostnames that serve the public, indexable production site (middleware / edge–safe; no `next` imports). */
const PRODUCTION_SITE_HOSTS = new Set(["fraudly.app", "www.fraudly.app"]);

export function isProductionPublicSiteHost(host: string): boolean {
  const normalized = host.trim().toLowerCase().split(":")[0] ?? "";
  return PRODUCTION_SITE_HOSTS.has(normalized);
}
