import { getCached, setCached } from "@/lib/cache";

export function isEnabled(flagName: string, defaultValue = true): boolean {
  const raw = process.env[flagName];
  if (raw == null) return defaultValue;
  return raw.trim().toLowerCase() === "true";
}

export async function fetchTextWithTimeout(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; FraudlyBot/1.0; +https://fraudly.app)"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; FraudlyBot/1.0; +https://fraudly.app)",
        ...(init?.headers ?? {})
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function fromCache<T>(key: string): T | null {
  return getCached<T>(key);
}

export function toCache<T>(key: string, value: T, ttlMs: number): void {
  setCached(key, value, ttlMs);
}
