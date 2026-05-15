import type { ReactNode } from "react";
import { EN_MESSAGES } from "@/lib/messages.en";
import {
  IconCalendar,
  IconLock,
  IconPhishing,
  IconReports,
  IconReputation,
  IconSpark
} from "@/components/home/HomeSectionIcons";

const CARD_ICONS: ReactNode[] = [
  <IconReputation key="reputation" className="h-5 w-5" />,
  <IconLock key="ssl" className="h-5 w-5" />,
  <IconCalendar key="domain" className="h-5 w-5" />,
  <IconPhishing key="phishing" className="h-5 w-5" />,
  <IconReports key="reports" className="h-5 w-5" />,
  <IconSpark key="ai" className="h-5 w-5" />
];

export function HomeWhatWeCheckSection() {
  const { whatWeCheckTitle, whatWeCheckIntro, whatWeCheckCards } = EN_MESSAGES.home;

  return (
    <section id="what-fraudly-analyzes" aria-labelledby="what-we-check-heading" className="scroll-mt-16">
      <div className="text-center">
        <h2 id="what-we-check-heading" className="text-balance text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
          {whatWeCheckTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 md:text-base">{whatWeCheckIntro}</p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {whatWeCheckCards.map((card, i) => (
          <article
            key={card.title}
            className="fraudly-motion flex h-full flex-col rounded-2xl border border-slate-200/75 bg-white/95 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:border-slate-300/80 hover:shadow-[0_12px_36px_rgba(15,23,42,0.06)] sm:p-6"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-violet-50/70 text-violet-700 ring-1 ring-slate-200/60">
              {CARD_ICONS[i]}
            </div>
            <h3 className="mt-4 text-left text-[15px] font-semibold leading-snug text-slate-900 sm:text-base">{card.title}</h3>
            <p className="mt-2 flex-1 text-left text-sm leading-relaxed text-slate-600">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
