/** Visible placeholder while Clerk SignIn/SignUp mounts (avoids blank layout). */
export function ClerkAuthCardSkeleton({ title }: { title: string }) {
  return (
    <div
      className="w-full max-w-[400px] rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{title}</p>
      <div className="mt-4 space-y-3">
        <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
        <div className="h-11 w-full animate-pulse rounded-xl bg-gradient-to-r from-slate-100 to-slate-50" />
      </div>
      <p className="mt-4 text-center text-xs text-slate-500">Loading secure sign-in…</p>
    </div>
  );
}
