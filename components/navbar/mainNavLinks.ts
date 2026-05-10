import { EN_MESSAGES } from "@/lib/messages.en";

/** Shared primary nav links (marketing + tools). */
export const MAIN_NAV_LINKS = [
  { label: EN_MESSAGES.latestChecks.navLabel, href: "/latest-checks" },
  { label: "Scam alerts", href: "/scam-alerts" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Features", href: "/features" },
  { label: "Learn", href: "/learn" },
  { label: "About", href: "/about" }
] as const;
