import { auditTrustDisplayAlignment } from "@/lib/scoring/scoringIntegrity";
import type { ConsumerVerdictLabel } from "@/lib/trust/types";

export type ComponentTrustProps = {
  component: string;
  domain: string;
  trustScore?: number | null;
  riskScore?: number | null;
  consumerVerdictLabel?: string | null;
  statusLabel?: string | null;
  legacyVerdict?: string | null;
};

/**
 * Development-only: warns when a component receives fields that disagree with canonical trust.
 */
export function logComponentTrustIntegrity(props: ComponentTrustProps): void {
  if (process.env.NODE_ENV !== "production") {
    const risk = props.riskScore;
    if (risk == null || !Number.isFinite(risk)) return;

    const report = auditTrustDisplayAlignment({
      domain: props.domain,
      source: props.component,
      riskScore: risk,
      storedStatusLabel: props.statusLabel
    });

    if (props.trustScore != null && Math.abs(props.trustScore - report.trustFromRisk) > 1) {
      console.warn("[componentIntegrity] trustScore mismatch", {
        component: props.component,
        domain: props.domain,
        trustScore: props.trustScore,
        expected: report.trustFromRisk
      });
    }

    if (
      props.consumerVerdictLabel &&
      props.consumerVerdictLabel !== report.consumerVerdict &&
      props.consumerVerdictLabel !== (report.consumerVerdict as ConsumerVerdictLabel)
    ) {
      console.warn("[componentIntegrity] consumerVerdictLabel mismatch", {
        component: props.component,
        domain: props.domain,
        received: props.consumerVerdictLabel,
        expected: report.consumerVerdict
      });
    }

    if (props.legacyVerdict && report.legacyVerdict && props.legacyVerdict !== report.legacyVerdict) {
      console.warn("[componentIntegrity] legacy verdict mismatch", {
        component: props.component,
        domain: props.domain,
        legacyVerdict: props.legacyVerdict,
        expected: report.legacyVerdict
      });
    }
  }
}
