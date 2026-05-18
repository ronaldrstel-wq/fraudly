import type { BlogHeroImage } from "@/lib/blog/types";

const SIZE = { width: 1200, height: 630 } as const;

/** Bump when hero SVG assets change so CDN / Next image cache refreshes. */
const HERO_ASSET_VERSION = "20260516b";

export function blogHero(slug: string, alt: string): BlogHeroImage {
  return {
    src: `/images/intelligence/${slug}-hero.svg?v=${HERO_ASSET_VERSION}`,
    alt,
    ...SIZE
  };
}
