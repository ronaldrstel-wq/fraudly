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
      className="rounded-2xl border border-blue-100/90 bg-gradient-to-br from-blue-50/90 to-violet-50/50 p-6 shadow-subtle"
      aria-label="Use Fraudly checker"
    >
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
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
