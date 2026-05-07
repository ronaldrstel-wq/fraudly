import type { NormalizedScamSignal } from "@/lib/scam-alerts/types";

const BRANDS = [
  "paypal",
  "microsoft",
  "google",
  "apple",
  "amazon",
  "stripe",
  "openai",
  "github",
  "dhl"
];

function inferType(raw: string): string {
  const t = raw.toLowerCase();
  if (/airdrop|wallet|seed|recovery/.test(t)) return "crypto wallet scam";
  if (/refund|claim/.test(t)) return "fake refund";
  if (/login|verify|account|secure/.test(t)) return "fake login verification";
  if (/payment|invoice|fee/.test(t)) return "fake payment issue";
  if (/delivery|parcel|dhl/.test(t)) return "fake delivery fee";
  if (/malware/.test(t)) return "malware";
  if (/phish|imperson/.test(t)) return "phishing";
  return "unknown suspicious";
}

function inferBrand(text: string): string | undefined {
  const l = text.toLowerCase();
  return BRANDS.find((brand) => l.includes(brand));
}

export function classifySignals(signals: NormalizedScamSignal[]): NormalizedScamSignal[] {
  return signals.map((signal) => {
    const basis = `${signal.url ?? ""} ${signal.domain ?? ""} ${JSON.stringify(signal.evidence ?? {})}`;
    const scamType = signal.scamType ?? inferType(basis);
    const affectedBrand = signal.affectedBrand ?? inferBrand(basis);
    return { ...signal, scamType, affectedBrand };
  });
}
