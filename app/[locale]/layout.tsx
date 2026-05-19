import { notFound } from "next/navigation";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocalizedLocale } from "@/lib/i18n/locales";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return [
    { locale: "nl" },
    { locale: "de" },
    { locale: "fr" },
    { locale: "es" },
    { locale: "pt" }
  ];
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale: raw } = await params;
  if (!isLocalizedLocale(raw)) notFound();

  const dict = getDictionary(raw);

  return (
    <LocaleProvider locale={raw} dict={dict}>
      {children}
    </LocaleProvider>
  );
}
