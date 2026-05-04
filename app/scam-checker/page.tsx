import { SeoToolPage } from "@/components/SeoToolPage";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { scamCheckerLanding } from "@/lib/tool-landings";

export const metadata = buildPageMetadata({
  path: "/scam-checker",
  titleSegment: "Online Scam Checker",
  description:
    "Use Fraudly’s free online scam checker to review suspicious websites and links for common fraud signals before you click or pay."
});

export default function ScamCheckerPage() {
  return <SeoToolPage {...scamCheckerLanding} />;
}
