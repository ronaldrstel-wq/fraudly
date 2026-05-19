import { InternalCheckLinksSection } from "@/components/seo/InternalCheckLinksSection";
import { fetchPublicCheckLinkItems } from "@/lib/seo/public-check-links";
import { pickPeopleAlsoChecked, pickRelatedPublicChecks } from "@/lib/seo/related-checks";
import type { ResultFlowMessages } from "@/lib/i18n/result-flow";

type CheckPageDiscoverySectionsProps = {
  domain: string;
  copy: ResultFlowMessages["checkPage"]["discovery"];
};

export async function CheckPageDiscoverySections({ domain, copy }: CheckPageDiscoverySectionsProps) {
  const pool = await fetchPublicCheckLinkItems(36);
  if (pool.length === 0) return null;

  const related = pickRelatedPublicChecks(domain, pool, 8);
  const alsoChecked = pickPeopleAlsoChecked(domain, pool, 6);

  if (related.length === 0 && alsoChecked.length === 0) return null;

  return (
    <div className="mx-auto mt-10 max-w-4xl space-y-6">
      {related.length > 0 ? (
        <InternalCheckLinksSection
          id="related-checks"
          title={copy.relatedTitle}
          description={copy.relatedDescription}
          items={related}
          compact
        />
      ) : null}
      {alsoChecked.length > 0 ? (
        <InternalCheckLinksSection
          id="people-also-checked"
          title={copy.alsoCheckedTitle}
          description={copy.alsoCheckedDescription}
          items={alsoChecked}
          compact
          footerHref="/latest-checks"
          footerLabel={copy.footerLatestChecks}
        />
      ) : null}
    </div>
  );
}
