import { SeoToolPageWithChecks } from "@/components/seo/SeoToolPageWithChecks";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { checkIfWebsiteIsSafeLanding } from "@/lib/tool-landings";

export const metadata = buildPageMetadata({
  path: "/check-if-website-is-safe",
  titleSegment: SEO_TITLE.checkIfWebsiteIsSafe,
  description: SEO_DESCRIPTION.checkIfWebsiteIsSafe
});

export default function CheckIfWebsiteIsSafePage() {
  return <SeoToolPageWithChecks {...checkIfWebsiteIsSafeLanding} />;
}
