"use client";

import Link from "next/link";

type Flow = "sign-in" | "sign-up";

/**
 * Shown when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing so auth routes never render empty.
 * Development: high-visibility error. Production: safe, user-facing message.
 */
export function ClerkPublishableKeyMissing({ flow }: { flow: Flow }) {
  const isDev = process.env.NODE_ENV === "development";
  const heading = flow === "sign-in" ? "Sign-in unavailable" : "Create account unavailable";

  if (isDev) {
    return (
      <div className="w-full max-w-lg rounded-2xl border-2 border-red-500 bg-red-50 px-6 py-5 text-red-950 shadow-lg">
        <p className="text-sm font-black uppercase tracking-wide">Configuration error</p>
        <h1 className="mt-2 text-xl font-bold">{heading}</h1>
        <p className="mt-3 text-sm leading-relaxed">
          <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> is
          missing or empty. Add it to <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs">.env.local</code> and restart
          the dev server. Without it, <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs">ClerkProvider</code> cannot
          load and embedded Clerk components will not render.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/" className="font-semibold text-red-900 underline underline-offset-2">
            Back to home
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <h1 className="text-xl font-bold text-slate-900">{heading}</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Authentication is temporarily unavailable. Please try again later or email{" "}
        <a href="mailto:support@fraudly.app" className="font-semibold text-blue-700 underline underline-offset-2">
          support@fraudly.app
        </a>{" "}
        if this continues.
      </p>
      <p className="mt-6">
        <Link href="/" className="text-sm font-semibold text-blue-700 underline underline-offset-2">
          Return to Fraudly home
        </Link>
      </p>
    </div>
  );
}
