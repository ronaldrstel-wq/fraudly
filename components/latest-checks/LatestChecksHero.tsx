import Image from "next/image";
import { EN_MESSAGES } from "@/lib/messages.en";

const HERO_IMAGE = "/images/latest-checks-hero.png";
const HERO_ALT = "Fraudly website trust and scam detection illustration";

export function LatestChecksHero() {
  const { overline, pageTitle, intro, scoreExplainerFootnote } = EN_MESSAGES.latestChecks;

  return (
    <header className="pb-2 pt-1 sm:pb-3 md:pb-4">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 xl:gap-16">
        <div className="max-w-2xl text-center lg:text-left">
          <p className="text-sm font-medium text-blue-700">{overline}</p>
          <h1 className="mt-2.5 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[2.65rem] md:leading-[1.1]">
            {pageTitle}
          </h1>
          <p className="mt-5 max-w-prose text-pretty text-base leading-relaxed text-slate-600 lg:mx-0 lg:mt-5">
            {intro}
          </p>
          <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-slate-500 lg:mx-0">
            {scoreExplainerFootnote}
          </p>
        </div>

        <div className="relative mx-auto flex w-full max-w-[min(100%,28rem)] justify-center lg:mx-0 lg:max-w-none lg:justify-end">
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_55%_at_50%_42%,rgba(59,130,246,0.16),transparent_68%),radial-gradient(ellipse_55%_48%_at_72%_68%,rgba(139,92,246,0.12),transparent_65%)]"
            aria-hidden
          />
          <div className="latest-checks-hero-float relative w-full max-w-[520px] lg:max-w-[540px]">
            <div className="latest-checks-hero-fade-in overflow-hidden rounded-[1.35rem] shadow-[0_28px_56px_-28px_rgba(59,130,246,0.35),0_18px_40px_-24px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/70">
              <Image
                src={HERO_IMAGE}
                alt={HERO_ALT}
                width={1536}
                height={1024}
                priority
                sizes="(max-width: 640px) 88vw, (max-width: 1024px) 72vw, 520px"
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
