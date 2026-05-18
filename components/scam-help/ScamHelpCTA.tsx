import Link from "next/link";

type ScamHelpCTAProps = {
  title?: string;
  description?: string;
  buttonLabel?: string;
  className?: string;
};

export function ScamHelpCTA({
  title = "Check the website before you pay",
  description = "Paste a shop or payment link into Fraudly’s free checker—get trust signals before you share card details or log in.",
  buttonLabel = "Check a website before you pay",
  className = ""
}: ScamHelpCTAProps) {
  return (
    <section
      className={`rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-white to-purple-50/80 p-6 shadow-lg shadow-blue-100/50 sm:p-8 ${className}`}
      aria-labelledby="scam-help-cta-heading"
    >
      <h2 id="scam-help-cta-heading" className="text-balance text-lg font-bold leading-snug text-slate-900 md:text-xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-slate-700 md:text-base">{description}</p>
      <Link
        href="/#link-check"
        className="mt-5 inline-flex max-w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-center text-sm font-semibold leading-snug text-white shadow-lg shadow-blue-500/25 transition duration-200 hover:brightness-110 active:scale-[0.98] sm:px-6"
      >
        {buttonLabel}
      </Link>
    </section>
  );
}
