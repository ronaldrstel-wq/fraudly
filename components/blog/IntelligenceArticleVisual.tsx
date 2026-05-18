import Image from "next/image";
import { intelligenceVisualFrame } from "@/components/blog/intelligenceUi";
import type { BlogHeroImage } from "@/lib/blog/types";

type IntelligenceArticleVisualProps = {
  hero: BlogHeroImage;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

/** Light editorial thumbnail — no dark full-bleed treatment. */
export function IntelligenceArticleVisual({
  hero,
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, 400px"
}: IntelligenceArticleVisualProps) {
  return (
    <div className={`${intelligenceVisualFrame} ${className}`}>
      <Image
        src={hero.src}
        alt={hero.alt}
        width={hero.width}
        height={hero.height}
        className="h-full w-full object-contain object-center p-1.5 sm:p-2 contrast-[1.06] saturate-[1.1] brightness-[1.02]"
        priority={priority}
        loading={priority ? undefined : "lazy"}
        sizes={sizes}
      />
    </div>
  );
}
