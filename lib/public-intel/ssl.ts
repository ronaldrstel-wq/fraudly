import tls from "node:tls";
import { normalizeDomain } from "@/lib/cache";
import { withCache, type PublicIntelResult } from "@/lib/public-intel/shared";

export type SslIntel = {
  httpsEnabled: boolean;
  validCertificate: boolean;
  issuer: string | null;
  expiresAt: string | null;
};

const SOURCE = "TLS certificate probe";

function inspect(host: string): Promise<SslIntel> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host,
        port: 443,
        servername: host,
        rejectUnauthorized: false
      },
      () => {
        const cert = socket.getPeerCertificate();
        const issuer = cert?.issuer?.O || cert?.issuer?.CN || null;
        const expiry = cert?.valid_to ? new Date(cert.valid_to) : null;
        const validCertificate = Boolean(expiry && expiry.getTime() > Date.now() && socket.authorized);
        socket.end();
        resolve({
          httpsEnabled: true,
          validCertificate,
          issuer,
          expiresAt: expiry?.toISOString() ?? null
        });
      }
    );
    socket.setTimeout(5000, () => {
      socket.destroy();
      resolve({ httpsEnabled: false, validCertificate: false, issuer: null, expiresAt: null });
    });
    socket.on("error", () => {
      resolve({ httpsEnabled: false, validCertificate: false, issuer: null, expiresAt: null });
    });
  });
}

export async function collectSsl(domain: string): Promise<PublicIntelResult<SslIntel> & { fromCache: boolean }> {
  const normalized = normalizeDomain(domain);
  return withCache(`public-intel:ssl:${normalized}`, async () => {
    try {
      return { ok: true, source: SOURCE, data: await inspect(normalized) };
    } catch (error) {
      return { ok: false, source: SOURCE, data: null, warning: error instanceof Error ? error.message : "SSL probe failed" };
    }
  });
}
