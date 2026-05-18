import { SeoToolPageWithChecks } from "@/components/seo/SeoToolPageWithChecks";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { websiteScamCheckerLanding } from "@/lib/tool-landings";

export const metadata = buildPageMetadata({
  path: "/website-scam-checker",
  titleSegment: SEO_TITLE.websiteScamChecker,
  description: SEO_DESCRIPTION.websiteScamChecker
});

export default function WebsiteScamCheckerPage() {
  return <SeoToolPageWithChecks {...websiteScamCheckerLanding} />;
}
