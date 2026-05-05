import tls from "node:tls";
import { normalizeDomain } from "@/lib/cache";
import type { SslCheck } from "@/lib/checks/types";
import { fromCache, isEnabled, toCache } from "@/lib/checks/utils";

const SOURCE = "TLS certificate check";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 4500;

function inspectTls(host: string): Promise<SslCheck> {
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

    socket.setTimeout(TIMEOUT_MS, () => {
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

export async function runSslCheck(domain: string): Promise<SslCheck> {
  if (!isEnabled("ENABLE_SSL_CHECK", true)) {
    return {
      httpsEnabled: false,
      validCertificate: false,
      source: SOURCE,
      warnings: ["SSL check disabled by configuration."]
    };
  }

  const normalizedDomain = normalizeDomain(domain);
  const cacheKey = `checks:ssl:${normalizedDomain}`;
  const cached = fromCache<SslCheck>(cacheKey);
  if (cached) return cached;

  const result = await inspectTls(normalizedDomain);
  toCache(cacheKey, result, CACHE_TTL_MS);
  return result;
}
