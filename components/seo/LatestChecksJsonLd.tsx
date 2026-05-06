import { SITE_URL } from "@/lib/seo";

type Row = {
  checkedValue: string;
  publicResultPath: string;
};

export function LatestChecksJsonLd({ items, positionOffset }: { items: Row[]; positionOffset: number }) {
  if (items.length === 0) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((row, i) => ({
      "@type": "ListItem",
      position: positionOffset + i + 1,
      url: `${SITE_URL}${row.publicResultPath}`,
      name: row.checkedValue
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      suppressHydrationWarning
    />
  );
}
