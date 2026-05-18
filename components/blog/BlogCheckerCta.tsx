import Link from "next/link";

type BlogCheckerCtaProps = {
  title?: string;
  body?: string;
  primaryHref?: string;
  primaryLabel?: string;
};

export function BlogCheckerCta({
  title = "Verify before you trust",
  body = "Paste any shop or link into Fraudly Intelligence tooling for a quick trust and scam-risk snapshot — free, no signup required.",
  primaryHref = "/#link-check",
  primaryLabel = "Run free website check"
}: BlogCheckerCtaProps) {
  return (
    <aside
      className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50 to-violet-50/55 p-6 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_8px_22px_rgba(15,23,42,0.05)] ring-1 ring-blue-100/80"
      aria-label="Use Fraudly checker"
    >
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{body}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={primaryHref} className="btn-primary px-6">
          {primaryLabel}
        </Link>
        <Link href="/website-scam-checker" className="btn-secondary px-5">
          Website scam checker
        </Link>
      </div>
    </aside>
  );
}
