import tls from "node:tls";
import { normalizeDomain } from "@/lib/cache";
import { checksConfig } from "@/lib/checks/config";
import type { SslCheck } from "@/lib/checks/types";
import { fromCache, toCache } from "@/lib/checks/utils";
import type { ProviderEvidenceResult, ProviderRun } from "@/lib/checks/providers/types";
import { wrapEvidence } from "@/lib/checks/providers/shared";

const SOURCE = "TLS certificate check";

function inspectTls(host: string, timeoutMs: number): Promise<SslCheck> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host,
        port: 443,
        servername: host,
        rejectUnauthorized: false
      },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          const issuer = cert?.issuer?.O || cert?.issuer?.CN || undefined;
          const validTo = cert?.valid_to ? new Date(cert.valid_to) : null;
          const now = new Date();
          const validCertificate = Boolean(validTo && validTo.getTime() > now.getTime() && socket.authorized);
          const authErr =
            typeof socket.authorizationError === "string"
              ? socket.authorizationError
              : socket.authorizationError instanceof Error
                ? socket.authorizationError.message
                : "";
          resolve({
            httpsEnabled: true,
            validCertificate,
            certificateIssuer: issuer,
            certificateExpiry: validTo?.toISOString(),
            selfSigned: !socket.authorized && /self.?signed/i.test(authErr),
            source: SOURCE,
            warnings: socket.authorized ? [] : [authErr || "Certificate not authorized"]
          });
        } catch (error) {
          resolve({
            httpsEnabled: true,
            validCertificate: false,
            source: SOURCE,
            warnings: [error instanceof Error ? error.message : "TLS parse error"]
          });
        } finally {
          socket.end();
        }
      }
    );

    socket.setTimeout(timeoutMs, () => {
      socket.destroy();
      resolve({
        httpsEnabled: false,
        validCertificate: false,
        source: SOURCE,
        warnings: ["TLS timeout"]
      });
    });
    socket.on("error", (error) => {
      resolve({
        httpsEnabled: false,
        validCertificate: false,
        source: SOURCE,
        warnings: [error.message]
      });
    });
  });
}

export async function runTlsProvider(domain: string): Promise<ProviderRun<SslCheck>> {
  const timeoutMs = checksConfig.fetchTimeoutMs;
  const ttl = checksConfig.cacheTtlMs.ssl;
  const normalizedDomain = normalizeDomain(domain);

  if (!checksConfig.ssl) {
    return {
      evidence: [
        wrapEvidence(SOURCE, "ssl", "info", false, "TLS check disabled", "In-browser TLS validation was turned off.", "high")
      ],
      result: {
        httpsEnabled: false,
        validCertificate: false,
        source: SOURCE,
        warnings: ["SSL check disabled by configuration."]
      }
    };
  }

  const cacheKey = `checks:ssl:v2:${normalizedDomain}`;
  const cached = fromCache<{ check: SslCheck; evidence: ProviderEvidenceResult[] }>(cacheKey);
  if (cached) return { evidence: cached.evidence, result: cached.check };

  const ssl = await inspectTls(normalizedDomain, timeoutMs);

  const evidence: ProviderEvidenceResult[] = [];

  if (!ssl.httpsEnabled) {
    evidence.push(
      wrapEvidence(
        SOURCE,
        "ssl",
        "danger",
        true,
        "HTTPS/TLS connection not established",
        "A TLS handshake to port 443 did not complete successfully in this probe.",
        "high",
        { warnings: ssl.warnings }
      )
    );
  } else if (ssl.validCertificate) {
    evidence.push(
      wrapEvidence(
        SOURCE,
        "ssl",
        "info",
        false,
        "HTTPS is available",
        `HTTPS is available. This protects the connection, but does not verify that the site is legitimate. Issuer: ${ssl.certificateIssuer ?? "unknown"}. Expiry: ${ssl.certificateExpiry ?? "unknown"}.`,
        "high",
        { issuer: ssl.certificateIssuer, expiry: ssl.certificateExpiry, selfSigned: ssl.selfSigned }
      )
    );
  } else {
    const selfSignedNote = ssl.selfSigned ? " The chain looks self-signed or untrusted by system roots." : "";
    evidence.push(
      wrapEvidence(
        SOURCE,
        "ssl",
        "warning",
        true,
        "TLS certificate validation issue",
        `HTTPS is reachable but the certificate did not validate as trusted or may be expired.${selfSignedNote} Issuer: ${ssl.certificateIssuer ?? "unknown"}. Expiry: ${ssl.certificateExpiry ?? "unknown"}.`,
        "medium",
        { issuer: ssl.certificateIssuer, expiry: ssl.certificateExpiry, selfSigned: ssl.selfSigned }
      )
    );
  }

  toCache(cacheKey, { check: ssl, evidence }, ttl);
  return { evidence, result: ssl };
}
