import type { BlogHeroImage } from "@/lib/blog/types";

const SIZE = { width: 1200, height: 630 } as const;

export function blogHero(slug: string, alt: string): BlogHeroImage {
  return {
    src: `/images/intelligence/${slug}-hero.svg`,
    alt,
    ...SIZE
  };
}
