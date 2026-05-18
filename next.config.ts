import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/latest",
        destination: "/latest-checks",
        permanent: true
      },
      {
        source: "/sitemap-0.xml",
        destination: "/sitemap.xml",
        permanent: true
      },
      {
        source: "/blog",
        destination: "/intelligence",
        permanent: true
      },
      {
        source: "/blog/:slug",
        destination: "/intelligence/:slug",
        permanent: true
      }
    ];
  },
  async headers() {
    return [
      {
        source: "/icon.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }]
      },
      {
        source: "/logo.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }]
      }
    ];
  }
};

export default nextConfig;
