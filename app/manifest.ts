import type { MetadataRoute } from "next";
import { SEO_DESCRIPTION } from "@/lib/seo-description";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fraudly — Website trust & scam checker",
    short_name: "Fraudly",
    description: SEO_DESCRIPTION.home,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#f9fafb",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
