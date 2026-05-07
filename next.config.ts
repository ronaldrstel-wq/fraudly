import type { NextConfig } from "next";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
});

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/domain/:domain", destination: "/check/:domain", permanent: true }];
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
