import { DeleteAccountPageView } from "@/components/pages/DeleteAccountPageView";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  path: "/delete-account",
  titleSegment: "Delete Account",
  titleAbsolute: "Delete Account | Fraudly",
  description: "Learn how to request deletion of your Fraudly account and associated personal data."
});

export default function DeleteAccountPage() {
  const dict = getDictionary("en");
  return <DeleteAccountPageView locale="en" dict={dict} />;
}
