import type { ReactNode } from "react";
import { EN_MESSAGES } from "@/lib/messages.en";

type AuthAccountShellProps = {
  children: ReactNode;
};

/**
 * Website auth framing: identity + sync — not App Store / Play purchase continuation.
 */
export function AuthAccountShell({ children }: AuthAccountShellProps) {
  const copy = EN_MESSAGES.auth.account;

  return (
    <div className="mx-auto w-full max-w-md">
      <header className="mb-8 text-center">
        <p className="text-sm font-medium text-blue-700">{copy.eyebrow}</p>
        <h1 className="mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{copy.title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-pretty text-sm leading-relaxed text-slate-600">{copy.subtitle}</p>
        <ul className="mx-auto mt-4 flex max-w-sm flex-col gap-1.5 text-left text-xs text-slate-500">
          {copy.bullets.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-blue-500" aria-hidden>
                •
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </header>
      {children}
      <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">{copy.footnote}</p>
    </div>
  );
}
