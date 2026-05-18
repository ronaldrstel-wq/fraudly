import { SeoToolPageWithChecks } from "@/components/seo/SeoToolPageWithChecks";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { onlineScamDetectorLanding } from "@/lib/tool-landings";

export const metadata = buildPageMetadata({
  path: "/online-scam-detector",
  titleSegment: SEO_TITLE.onlineScamDetector,
  description: SEO_DESCRIPTION.onlineScamDetector
});

export default function OnlineScamDetectorPage() {
  return <SeoToolPageWithChecks {...onlineScamDetectorLanding} />;
}
