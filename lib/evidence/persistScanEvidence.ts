import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { TrustEvidenceBundle } from "@/lib/evidence/types";
import type { WebsiteAnalysisClientEvidence } from "@/lib/evidence/types";

function trunc(s: string | null | undefined, max: number): string | null {
  if (!s) return null;
  const t = s.trim();
  if (!t) return null;
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

/** Best-effort persistence; never throws to callers. */
export async function persistScanEvidenceRows(options: {
  url: string | null;
  evidence: WebsiteAnalysisClientEvidence;
  bundle: TrustEvidenceBundle;
}): Promise<void> {
  try {
    const url = options.url?.slice(0, 2048) ?? null;
    const ev = options.evidence;
    const b = options.bundle;

    const rows: Prisma.ScanEvidenceCreateManyInput[] = [];

    if (b.screenshotAd && ev.imageAnalysis?.imageHash) {
      rows.push({
        url,
        evidenceType: "screenshot",
        imageHash: ev.imageAnalysis.imageHash,
        sourcePlatform: trunc(ev.sourcePlatform, 64),
        adText: trunc(ev.adText, 1200),
        detectedText: null,
        extractedSignals: (ev.imageAnalysis.extractedSignals as Prisma.InputJsonValue) ?? ({} as Prisma.InputJsonValue),
        riskDelta: b.screenshotAd.riskDelta,
        summary: trunc(b.screenshotAd.summary, 2000)
      });
    }

    rows.push({
      url,
      evidenceType: "webshop_signals",
      imageHash: null,
      sourcePlatform: trunc(ev.sourcePlatform, 64),
      adText: trunc(ev.adText, 1200),
      detectedText: null,
      extractedSignals: {
        signals: b.webshop?.signals.map((s) => ({ id: s.id, severity: s.severity })) ?? []
      } as Prisma.InputJsonValue,
      riskDelta: b.webshop?.riskDelta ?? 0,
      summary: trunc(b.webshop?.summary, 2000)
    });

    if (b.socialAd) {
      rows.push({
        url,
        evidenceType: "social_ad",
        imageHash: ev.imageAnalysis?.imageHash ?? null,
        sourcePlatform: trunc(ev.sourcePlatform, 64),
        adText: trunc(ev.adText, 1200),
        detectedText: null,
        extractedSignals: {
          signals: b.socialAd.signals.map((s) => ({ id: s.id, severity: s.severity }))
        } as Prisma.InputJsonValue,
        riskDelta: b.socialAd.riskDelta,
        summary: trunc(b.socialAd.summary, 2000)
      });
    }

    await db.scanEvidence.createMany({ data: rows });
  } catch (err) {
    console.error("[persistScanEvidenceRows]", err);
  }
}
