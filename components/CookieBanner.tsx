"use client";

interface CookieBannerProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onManagePreferences: () => void;
}

export function CookieBanner({ onAcceptAll, onRejectAll, onManagePreferences }: CookieBannerProps) {
  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-md sm:p-5"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Cookies on fraudly.app</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:hidden">
            We use necessary cookies plus optional analytics/marketing cookies. Use Manage Preferences to choose.
          </p>
          <p className="mt-1 hidden leading-relaxed text-slate-600 sm:block">
            We use necessary cookies to run the site. With your permission, we also use optional analytics and marketing
            cookies. You can change your mind anytime via Cookie Settings in the footer.
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={onManagePreferences}
            className="order-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 sm:order-1"
          >
            Manage Preferences
          </button>
          <button
            type="button"
            onClick={onRejectAll}
            className="order-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Reject All
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="order-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:brightness-110 sm:order-3"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
