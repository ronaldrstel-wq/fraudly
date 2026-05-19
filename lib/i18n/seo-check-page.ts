import type { Locale } from "@/lib/i18n/locales";
import { buildWebsiteCheckMetaDescription, clampMetaDescription } from "@/lib/seo-description";

const titleByLocale: Record<Locale, (domain: string) => string> = {
  en: (d) => `Is ${d} Safe? Website Trust Check`,
  nl: (d) => `Is ${d} veilig? Website-vertrouwenscheck`,
  de: (d) => `Ist ${d} sicher? Website-Vertrauensprüfung`,
  fr: (d) => `${d} est-il sûr ? Contrôle de confiance du site`,
  es: (d) => `¿Es ${d} seguro? Comprobación de confianza del sitio`,
  pt: (d) => `O site ${d} é seguro? Verificação de confiança`
};

/** Localized `<title>` segment for `/check/[domain]` (layout adds `| Fraudly`). */
export function checkPageSeoTitle(domain: string, locale: Locale): string {
  return (titleByLocale[locale] ?? titleByLocale.en)(domain);
}

function descriptionIntro(locale: Locale, host: string): string {
  switch (locale) {
    case "nl":
      return `Website-vertrouwenscheck voor ${host}: Fraudly-scamchecker met phishingdetectie, signalen van nepwinkels en context van een veilige-linkchecker.`;
    case "de":
      return `Website-Vertrauensprüfung für ${host}: Fraudly Scam-Checker mit Phishing-Erkennung, Fake-Shop-Signalen und Safe-Link-Kontext.`;
    case "fr":
      return `Contrôle de confiance pour ${host} : scam checker Fraudly, détection phishing, signaux de faux sites et contexte de vérification de liens.`;
    case "es":
      return `Comprobación de confianza para ${host}: detector de estafas Fraudly, phishing, señales de tiendas falsas y contexto de comprobación de enlaces.`;
    case "pt":
      return `Verificação de confiança para ${host}: scam checker Fraudly, deteção de phishing, sinais de lojas falsas e contexto de verificação de ligações.`;
    default:
      return `Website trust check for ${host}: Fraudly scam checker with phishing detection, fake webshop signals and safe link checker context.`;
  }
}

function scoreClause(locale: Locale, trustScore: number | null): string {
  if (trustScore !== null) {
    switch (locale) {
      case "nl":
        return ` Vertrouwensscore circa ${trustScore}/100.`;
      case "de":
        return ` Vertrauenswert etwa ${trustScore}/100.`;
      case "fr":
        return ` Score de confiance environ ${trustScore}/100.`;
      case "es":
        return ` Puntuación de confianza aproximada ${trustScore}/100.`;
      case "pt":
        return ` Pontuação de confiança cerca de ${trustScore}/100.`;
      default:
        return ` Trust-style score about ${trustScore}/100.`;
    }
  }
  switch (locale) {
    case "nl":
      return " Vertrouwensscore verborgen wanneer signalen onduidelijk zijn.";
    case "de":
      return " Vertrauenswert ausgeblendet, wenn Signale uneindeutig sind.";
    case "fr":
      return " Score masqué lorsque les signaux sont peu clairs.";
    case "es":
      return " Puntuación oculta cuando las señales son poco claras.";
    case "pt":
      return " Pontuação oculta quando os sinais são inconclusivos.";
    default:
      return " Trust score withheld when signals are inconclusive.";
  }
}

/** Localized meta description for `/check/[domain]`. Falls back to English builder for snippet merge logic. */
export function checkPageSeoDescription(
  domain: string,
  trustScore: number | null,
  summarySnippet: string | undefined,
  locale: Locale
): string {
  if (locale === "en") {
    return buildWebsiteCheckMetaDescription(domain, trustScore, summarySnippet);
  }
  const host = domain.length > 40 ? `${domain.slice(0, 37)}…` : domain;
  let desc = descriptionIntro(locale, host) + scoreClause(locale, trustScore);
  const snippet = summarySnippet?.trim();
  if (snippet && desc.length < 120) {
    const room = 160 - desc.length - 1;
    if (room > 20) {
      desc += ` ${snippet.length > room ? `${snippet.slice(0, room - 1)}…` : snippet}`;
    }
  }
  return clampMetaDescription(desc);
}
