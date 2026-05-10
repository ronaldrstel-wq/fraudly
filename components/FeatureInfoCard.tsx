import type { ReactNode } from "react";

interface FeatureInfoCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function FeatureInfoCard({ icon, title, description }: FeatureInfoCardProps) {
  return (
    <article className="fraudly-card border-slate-100 p-5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
    </article>
  );
}
