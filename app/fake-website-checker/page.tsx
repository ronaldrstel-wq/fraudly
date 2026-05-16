import { SeoToolPage } from "@/components/SeoToolPage";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { fakeWebsiteCheckerLanding } from "@/lib/tool-landings";

export const metadata = buildPageMetadata({
  path: "/fake-website-checker",
  titleSegment: SEO_TITLE.fakeWebsiteChecker,
  description: SEO_DESCRIPTION.fakeWebsiteChecker
});

export default function FakeWebsiteCheckerPage() {
  return <SeoToolPage {...fakeWebsiteCheckerLanding} />;
}
