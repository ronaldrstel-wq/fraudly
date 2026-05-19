import type { Locale } from "@/lib/i18n/locales";

export type RecentSearchesUiMessages = {
  pageTitle: string;
  pageIntroPrivatelyStored: string;
  loadError: string;
  emptyState: string;
  reopenResultArrow: string;
  deleteOne: string;
  clearing: string;
  clearAll: string;
  clearModalTitle: string;
  clearModalBody: string;
  clearModalConfirm: string;
  clearModalCancel: string;
  privateDeleteNote: string;
  emptyStateCta: string;
  pageServerLoadError: string;
  seoTitle: string;
  seoDescription: string;
  entityLabels: {
    domain: string;
    url: string;
    email: string;
    phone: string;
  };
};

const en: RecentSearchesUiMessages = {
  pageTitle: "Recent searches",
  pageIntroPrivatelyStored: "Shown only on your account.",
  loadError: "Could not load your history. Refresh the page or try again.",
  emptyState: "Your recent searches will appear here after you run a fraud check.",
  reopenResultArrow: "View result →",
  deleteOne: "Delete",
  clearing: "Removing…",
  clearAll: "Clear all history",
  clearModalTitle: "Clear all search history?",
  clearModalBody: "This removes every recent fraud check snapshot from your private history here.",
  clearModalConfirm: "Yes, clear history",
  clearModalCancel: "Cancel",
  privateDeleteNote: "Private—you can delete snapshots anytime.",
  emptyStateCta: "Run a check",
  pageServerLoadError:
    "We couldn't load your recent searches right now. Please refresh and try again.",
  seoTitle: "Recent Searches",
  seoDescription:
    "Your private Fraudly scam checker and website trust check history—safe link checker results visible only when you are signed in to your account.",
  entityLabels: { domain: "Domain", url: "URL", email: "Email", phone: "Phone" }
};

const nl: RecentSearchesUiMessages = {
  pageTitle: "Recente zoekopdrachten",
  pageIntroPrivatelyStored: "Alleen zichtbaar op uw account.",
  loadError: "Kon uw geschiedenis niet laden. Vernieuw de pagina of probeer opnieuw.",
  emptyState: "Uw recente zoekopdrachten verschijnen hier na een fraudcheck.",
  reopenResultArrow: "Resultaat bekijken →",
  deleteOne: "Verwijderen",
  clearing: "Bezig met verwijderen…",
  clearAll: "Alle geschiedenis wissen",
  clearModalTitle: "Alle zoekgeschiedenis wissen?",
  clearModalBody: "Dit verwijdert elke recente fraudcheck-snapshot uit uw privégeschiedenis hier.",
  clearModalConfirm: "Ja, geschiedenis wissen",
  clearModalCancel: "Annuleren",
  privateDeleteNote: "Privé—u kunt snapshots hier altijd verwijderen.",
  emptyStateCta: "Controle uitvoeren",
  pageServerLoadError:
    "We konden uw recente zoekopdrachten nu niet laden. Vernieuw de pagina en probeer opnieuw.",
  seoTitle: "Recente zoekopdrachten",
  seoDescription:
    "Uw privégeschiedenis van Fraudly fraudchecks en website-vertrouwenschecks—alleen zichtbaar wanneer u bent ingelogd.",
  entityLabels: { domain: "Domein", url: "URL", email: "E-mail", phone: "Telefoon" }
};

const de: RecentSearchesUiMessages = {
  pageTitle: "Letzte Suchen",
  pageIntroPrivatelyStored: "Nur in Ihrem Konto sichtbar.",
  loadError: "Verlauf konnte nicht geladen werden. Seite aktualisieren oder erneut versuchen.",
  emptyState: "Ihre letzten Suchen erscheinen hier nach einer Betrugsprüfung.",
  reopenResultArrow: "Ergebnis ansehen →",
  deleteOne: "Löschen",
  clearing: "Wird entfernt…",
  clearAll: "Gesamten Verlauf löschen",
  clearModalTitle: "Gesamten Suchverlauf löschen?",
  clearModalBody: "Dies entfernt jeden recenten Betrugsprüfungs-Snapshot aus Ihrem privaten Verlauf hier.",
  clearModalConfirm: "Ja, Verlauf löschen",
  clearModalCancel: "Abbrechen",
  privateDeleteNote: "Privat—Sie können Snapshots hier jederzeit löschen.",
  emptyStateCta: "Prüfung starten",
  pageServerLoadError:
    "Ihre letzten Suchen konnten gerade nicht geladen werden. Bitte aktualisieren Sie die Seite und versuchen Sie es erneut.",
  seoTitle: "Letzte Suchen",
  seoDescription:
    "Ihr privater Fraudly-Verlauf für Betrugsprüfungen und Website-Vertrauenschecks—nur sichtbar, wenn Sie angemeldet sind.",
  entityLabels: { domain: "Domain", url: "URL", email: "E-Mail", phone: "Telefon" }
};

const fr: RecentSearchesUiMessages = {
  pageTitle: "Recherches récentes",
  pageIntroPrivatelyStored: "Visible uniquement sur votre compte.",
  loadError: "Impossible de charger l’historique. Actualisez la page ou réessayez.",
  emptyState: "Vos recherches récentes apparaîtront ici après une vérification anti-fraude.",
  reopenResultArrow: "Voir le résultat →",
  deleteOne: "Supprimer",
  clearing: "Suppression…",
  clearAll: "Effacer tout l’historique",
  clearModalTitle: "Effacer tout l’historique de recherche ?",
  clearModalBody: "Cela supprime chaque instantané de vérification anti-fraude de votre historique privé ici.",
  clearModalConfirm: "Oui, effacer l’historique",
  clearModalCancel: "Annuler",
  privateDeleteNote: "Privé—vous pouvez supprimer les instantanés ici à tout moment.",
  emptyStateCta: "Lancer une vérification",
  pageServerLoadError:
    "Impossible de charger vos recherches récentes pour le moment. Actualisez la page et réessayez.",
  seoTitle: "Recherches récentes",
  seoDescription:
    "Votre historique privé de vérifications anti-fraude et de confiance Fraudly—visible uniquement lorsque vous êtes connecté.",
  entityLabels: { domain: "Domaine", url: "URL", email: "E-mail", phone: "Téléphone" }
};

const es: RecentSearchesUiMessages = {
  pageTitle: "Búsquedas recientes",
  pageIntroPrivatelyStored: "Visible solo en su cuenta.",
  loadError: "No se pudo cargar el historial. Actualice la página o inténtelo de nuevo.",
  emptyState: "Sus búsquedas recientes aparecerán aquí después de una comprobación antifraude.",
  reopenResultArrow: "Ver resultado →",
  deleteOne: "Eliminar",
  clearing: "Eliminando…",
  clearAll: "Borrar todo el historial",
  clearModalTitle: "¿Borrar todo el historial de búsqueda?",
  clearModalBody: "Esto elimina cada instantánea de comprobación antifraude de su historial privado aquí.",
  clearModalConfirm: "Sí, borrar historial",
  clearModalCancel: "Cancelar",
  privateDeleteNote: "Privado—puede eliminar instantáneas aquí en cualquier momento.",
  emptyStateCta: "Ejecutar comprobación",
  pageServerLoadError:
    "No pudimos cargar sus búsquedas recientes ahora. Actualice la página e inténtelo de nuevo.",
  seoTitle: "Búsquedas recientes",
  seoDescription:
    "Su historial privado de comprobaciones antifraude y de confianza de Fraudly—visible solo cuando ha iniciado sesión.",
  entityLabels: { domain: "Dominio", url: "URL", email: "Correo", phone: "Teléfono" }
};

const pt: RecentSearchesUiMessages = {
  pageTitle: "Pesquisas recentes",
  pageIntroPrivatelyStored: "Visível apenas na sua conta.",
  loadError: "Não foi possível carregar o histórico. Atualize a página ou tente novamente.",
  emptyState: "As suas pesquisas recentes aparecerão aqui após uma verificação antifraude.",
  reopenResultArrow: "Ver resultado →",
  deleteOne: "Eliminar",
  clearing: "A remover…",
  clearAll: "Limpar todo o histórico",
  clearModalTitle: "Limpar todo o histórico de pesquisa?",
  clearModalBody: "Isto remove cada instantâneo de verificação antifraude do seu histórico privado aqui.",
  clearModalConfirm: "Sim, limpar histórico",
  clearModalCancel: "Cancelar",
  privateDeleteNote: "Privado—pode eliminar instantâneos aqui a qualquer momento.",
  emptyStateCta: "Executar verificação",
  pageServerLoadError:
    "Não foi possível carregar as suas pesquisas recentes agora. Atualize a página e tente novamente.",
  seoTitle: "Pesquisas recentes",
  seoDescription:
    "O seu histórico privado de verificações antifraude e de confiança Fraudly—visível apenas quando tem sessão iniciada.",
  entityLabels: { domain: "Domínio", url: "URL", email: "E-mail", phone: "Telefone" }
};

const byLocale: Record<Locale, RecentSearchesUiMessages> = { en, nl, de, fr, es, pt };

export function getRecentSearchesUi(locale: Locale): RecentSearchesUiMessages {
  return byLocale[locale] ?? en;
}
