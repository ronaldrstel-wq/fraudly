import { NextResponse } from "next/server";
import { applyRevenueCatEntitlement } from "@/lib/entitlement/apply-revenuecat";

export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET?.trim();

type RcEventPayload = {
  event?: {
    type?: string;
    app_user_id?: string;
    product_id?: string;
    expiration_at_ms?: number | null;
    store?: string;
  };
  subscriber?: {
    subscriber_attributes?: Record<string, { value?: string }>;
  };
};

function clerkUserIdFromPayload(body: RcEventPayload): string | null {
  const attrs = body.subscriber?.subscriber_attributes;
  if (!attrs || typeof attrs !== "object") return null;
  for (const key of ["clerk_user_id", "clerkUserId", "$clerkUserId"]) {
    const v = attrs[key]?.value;
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function isActiveEntitlementEvent(type: string): boolean {
  return (
    type === "INITIAL_PURCHASE" ||
    type === "RENEWAL" ||
    type === "UNCANCELLATION" ||
    type === "PRODUCT_CHANGE" ||
    type === "NON_RENEWING_PURCHASE"
  );
}

function isInactiveEntitlementEvent(type: string): boolean {
  return type === "EXPIRATION" || type === "CANCELLATION" || type === "BILLING_ISSUE";
}

/**
 * RevenueCat server webhook — only path that may set `app_store` / `google_play` entitlement.
 * Configure REVENUECAT_WEBHOOK_SECRET and point RevenueCat to POST /api/webhooks/revenuecat
 */
export async function POST(req: Request) {
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "revenuecat_not_configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization")?.trim();
  if (auth !== `Bearer ${WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: RcEventPayload;
  try {
    body = (await req.json()) as RcEventPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const event = body.event;
  if (!event?.app_user_id || !event.type || !event.store) {
    return NextResponse.json({ received: true, skipped: "missing_fields" });
  }

  const type = event.type;
  const active = isActiveEntitlementEvent(type);
  const inactive = isInactiveEntitlementEvent(type);
  if (!active && !inactive) {
    return NextResponse.json({ received: true, skipped: type });
  }

  const expiresAt =
    typeof event.expiration_at_ms === "number" && event.expiration_at_ms > 0
      ? new Date(event.expiration_at_ms)
      : null;

  const applied = await applyRevenueCatEntitlement({
    appUserId: event.app_user_id,
    clerkUserId: clerkUserIdFromPayload(body),
    store: event.store,
    productId: event.product_id ?? null,
    expiresAt,
    isActive: active && !inactive
  });

  console.info("[revenuecat/webhook] entitlement sync", {
    eventType: type,
    store: event.store,
    appUserIdPresent: true,
    clerkUserIdPresent: Boolean(clerkUserIdFromPayload(body)),
    applied
  });

  return NextResponse.json({ received: true, applied });
}
