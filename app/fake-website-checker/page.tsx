import { SeoToolPage } from "@/components/SeoToolPage";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { fakeWebsiteCheckerLanding } from "@/lib/tool-landings";

export const metadata = buildPageMetadata({
  path: "/fake-website-checker",
  titleSegment: "Fake Website Checker",
  description:
    "Use Fraudly to review unknown shops and copycat websites for common fake-store signals before you share payment or personal information."
});

export default function FakeWebsiteCheckerPage() {
  return <SeoToolPage {...fakeWebsiteCheckerLanding} />;
}
