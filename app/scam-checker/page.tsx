import { SeoToolPage } from "@/components/SeoToolPage";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { scamCheckerLanding } from "@/lib/tool-landings";

export const metadata = buildPageMetadata({
  path: "/scam-checker",
  titleSegment: SEO_TITLE.scamChecker,
  description: SEO_DESCRIPTION.scamChecker
});

export default function ScamCheckerPage() {
  return <SeoToolPage {...scamCheckerLanding} />;
}
