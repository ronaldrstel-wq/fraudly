import { SeoToolPageWithChecks } from "@/components/seo/SeoToolPageWithChecks";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { fakeWebshopCheckLanding } from "@/lib/tool-landings";

export const metadata = buildPageMetadata({
  path: "/fake-webshop-check",
  titleSegment: SEO_TITLE.fakeWebshopCheck,
  description: SEO_DESCRIPTION.fakeWebshopCheck
});

export default function FakeWebshopCheckPage() {
  return <SeoToolPageWithChecks {...fakeWebshopCheckLanding} />;
}
