import { SeoToolPage } from "@/components/SeoToolPage";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { emailScamCheckerLanding } from "@/lib/tool-landings";

export const metadata = buildPageMetadata({
  path: "/email-scam-checker",
  titleSegment: SEO_TITLE.emailScamChecker,
  description: SEO_DESCRIPTION.emailScamChecker
});

export default function EmailScamCheckerPage() {
  return <SeoToolPage {...emailScamCheckerLanding} />;
}
