import Link from "next/link";

export default function RecentSearchesError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[recent-searches error boundary]", { message: error.message, digest: error.digest });

  return (
    <div className="mx-auto my-10 w-full max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
      <h2 className="text-lg font-semibold">We couldn't load Recent Searches.</h2>
      <p className="mt-2 text-sm">
        Please try again. If this keeps happening, go back to the homepage and retry in a minute.
      </p>
      {error.digest ? <p className="mt-2 text-xs text-rose-700/80">Reference: {error.digest}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
