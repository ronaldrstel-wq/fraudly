import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true"
});

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
        statusCode: 301
      },
      {
        source: "/blog/:slug",
        destination: "/intelligence/:slug",
        statusCode: 301
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

export default withBundleAnalyzer(nextConfig);
