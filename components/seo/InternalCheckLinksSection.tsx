import Link from "next/link";
import type { PublicCheckLinkItem } from "@/lib/seo/public-check-links";

type InternalCheckLinksSectionProps = {
  id: string;
  title: string;
  description?: string;
  items: PublicCheckLinkItem[];
  compact?: boolean;
  footerHref?: string;
  footerLabel?: string;
};

export function InternalCheckLinksSection({
  id,
  title,
  description,
  items,
  compact = false,
  footerHref,
  footerLabel
}: InternalCheckLinksSectionProps) {
  if (items.length === 0) return null;

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-subtle ${compact ? "p-4 sm:p-5" : "p-5 sm:p-6"}`}
    >
      <h2 id={`${id}-heading`} className="text-lg font-bold tracking-tight text-slate-900 md:text-xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-3xl text-pretty text-sm leading-relaxed text-slate-600">{description}</p>
      ) : null}

      <ul className={`mt-4 grid gap-2 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={`group flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 px-3 py-2.5 transition hover:border-slate-300 hover:bg-slate-50/80 ${item.stripeClass}`}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-900 group-hover:text-blue-700">
                  {item.displayLabel}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">{item.verdictLabel}</span>
              </span>
              <span
                className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${item.scorePillClass}`}
                aria-label={`Trust score ${item.trustScore}`}
              >
                {item.trustScore}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {footerHref && footerLabel ? (
        <p className="mt-4 text-sm">
          <Link
            href={footerHref}
            className="font-semibold text-blue-600 underline decoration-blue-600/35 underline-offset-2 hover:text-blue-800"
          >
            {footerLabel}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
