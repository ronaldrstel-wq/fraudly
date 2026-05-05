/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://fraudly.app",
  generateRobotsTxt: true,
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
    "/settings/*"
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/"
      }
    ],
    additionalSitemaps: ["https://fraudly.app/sitemap.xml"]
  },
  transform: async (config, path) => {
    if (path.startsWith("/api/")) return null;
    return {
      loc: path,
      changefreq: path === "/" ? "daily" : config.changefreq,
      priority: path === "/" ? 1.0 : path.startsWith("/check/") ? 0.8 : 0.7,
      lastmod: new Date().toISOString()
    };
  },
  additionalPaths: async () => {
    return [{ loc: "/check/example.com", changefreq: "daily", priority: 0.8 }];
  }
};
