/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://fraudly.app",
  /** Canonical robots.txt is `app/robots.ts`; avoid overwriting `public/` on build. */
  generateRobotsTxt: false,
  sitemapSize: 5000,
  changefreq: "weekly",
  priority: 0.7,
  exclude: [
    "/api/*",
    "/sign-in",
    "/sign-in/*",
    "/sign-up",
    "/sign-up/*",
    "/payment/*",
    "/pricing",
    "/account",
    "/account/*",
    "/dashboard",
    "/dashboard/*",
    "/checkout",
    "/checkout/*",
    "/settings",
    "/settings/*",
    "/recent-searches"
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/"
      }
    ]
    // Do not set additionalSitemaps to the main sitemap URL: next-sitemap merges
    // robotsTxtOptions.additionalSitemaps into sitemap.xml (index) as child sitemaps,
    // which would create a self-referential index and Google Search Console errors.
    // The index URL is added to robots.txt automatically via generateIndexSitemap.
  },
  transform: async (config, path) => {
    if (path.startsWith("/api/")) return null;
    const isLatestChecks = path === "/latest-checks";
    return {
      loc: path,
      changefreq: path === "/" || isLatestChecks ? "daily" : config.changefreq,
      priority:
        path === "/"
          ? 1.0
          : path.startsWith("/check/") || path.startsWith("/domain/") || isLatestChecks
            ? 0.8
            : 0.7,
      lastmod: new Date().toISOString()
    };
  },
  additionalPaths: async () => {
    return [
      { loc: "/check/example.com", changefreq: "daily", priority: 0.8 },
      { loc: "/domain/example.com", changefreq: "daily", priority: 0.8 },
      { loc: "/latest-checks", changefreq: "daily", priority: 0.8 },
      // Index only: paginated `/scam-alerts?page=N` URLs are intentionally omitted as low unique value for crawlers.
      { loc: "/scam-alerts", changefreq: "daily", priority: 0.8 }
    ];
  }
};
