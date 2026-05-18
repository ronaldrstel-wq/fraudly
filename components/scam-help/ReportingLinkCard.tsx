import type { ReportingLink } from "@/lib/scam-help/countries";

export function ReportingLinkCard({ link }: { link: ReportingLink }) {
  const isBank = link.type === "bank";
  const isExternal = Boolean(link.url) && !isBank;

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60 sm:p-6">
      <h3 className="text-base font-semibold text-slate-900">{link.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{link.description}</p>
      {isExternal ? (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-fit items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:brightness-110"
        >
          Report here
          <span className="sr-only"> (opens in new tab)</span>
        </a>
      ) : isBank ? (
        <p className="mt-4 inline-flex w-fit rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
          Open your bank&apos;s official app or website
        </p>
      ) : null}
    </article>
  );
}
