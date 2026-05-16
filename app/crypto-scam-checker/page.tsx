import { SeoToolPage } from "@/components/SeoToolPage";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { cryptoScamCheckerLanding } from "@/lib/tool-landings";

export const metadata = buildPageMetadata({
  path: "/crypto-scam-checker",
  titleSegment: SEO_TITLE.cryptoScamChecker,
  description: SEO_DESCRIPTION.cryptoScamChecker
});

export default function CryptoScamCheckerPage() {
  return <SeoToolPage {...cryptoScamCheckerLanding} />;
}
