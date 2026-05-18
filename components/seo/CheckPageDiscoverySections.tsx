import { InternalCheckLinksSection } from "@/components/seo/InternalCheckLinksSection";
import { fetchPublicCheckLinkItems } from "@/lib/seo/public-check-links";
import { pickPeopleAlsoChecked, pickRelatedPublicChecks } from "@/lib/seo/related-checks";

type CheckPageDiscoverySectionsProps = {
  domain: string;
};

export async function CheckPageDiscoverySections({ domain }: CheckPageDiscoverySectionsProps) {
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
          title="Related website checks"
          description="Other recently reviewed sites with similar risk signals, region, or naming patterns."
          items={related}
          compact
        />
      ) : null}
      {alsoChecked.length > 0 ? (
        <InternalCheckLinksSection
          id="people-also-checked"
          title="People also checked"
          description="Recent public checks from the Fraudly feed—explore other domains others are verifying."
          items={alsoChecked}
          compact
          footerHref="/latest-checks"
          footerLabel="View latest checks →"
        />
      ) : null}
    </div>
  );
}

