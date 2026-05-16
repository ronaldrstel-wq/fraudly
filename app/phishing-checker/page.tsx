import { SeoToolPage } from "@/components/SeoToolPage";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { phishingCheckerLanding } from "@/lib/tool-landings";

export const metadata = buildPageMetadata({
  path: "/phishing-checker",
  titleSegment: SEO_TITLE.phishingChecker,
  description: SEO_DESCRIPTION.phishingChecker
});

export default function PhishingCheckerPage() {
  return <SeoToolPage {...phishingCheckerLanding} />;
}
