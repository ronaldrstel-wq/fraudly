import Link from "next/link";

export function ScamHelpInternalLinks() {
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm"
      aria-label="Related Fraudly pages"
    >
      <Link href="/" className="font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600">
        Home
      </Link>
      <Link
        href="/latest-checks"
        className="font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600"
      >
        Latest checks
      </Link>
      <Link
        href="/scam-alerts"
        className="font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600"
      >
        Scam alerts
      </Link>
      <Link
        href="/about"
        className="font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600"
      >
        About
      </Link>
      <Link
        href="/scam-help"
        className="font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 hover:decoration-blue-600"
      >
        Scam help
      </Link>
    </nav>
  );
}
