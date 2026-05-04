import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

type PurchaseType = "single_check" | "five_checks" | "twenty_checks" | "premium_monthly";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function isPurchaseType(value: string): value is PurchaseType {
  return (
    value === "single_check" ||
    value === "five_checks" ||
    value === "twenty_checks" ||
    value === "premium_monthly"
  );
}

function creditAmountForPurchase(purchaseType: Exclude<PurchaseType, "premium_monthly">): number {
  if (purchaseType === "single_check") return 1;
  if (purchaseType === "five_checks") return 5;
  return 20;
}

function subscriptionIdFromSession(session: Stripe.Checkout.Session): string | undefined {
  const sub = session.subscription;
  if (!sub) return undefined;
  if (typeof sub === "string") return sub;
  return sub.id;
}

async function runOnce(eventId: string, handler: (tx: Prisma.TransactionClient) => Promise<void>) {
  try {
    await db.$transaction(async (tx) => {
      await tx.stripeEvent.create({ data: { id: eventId } });
      await handler(tx);
    });
    return "processed" as const;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return "duplicate" as const;
    }
    throw error;
  }
}

/** One fulfillment per Checkout Session (covers completed + async_payment_succeeded without double credits). */
function checkoutFulfillmentId(sessionId: string): string {
  return `checkout_fulfill:${sessionId}`;
}

function shouldFulfillCheckoutSession(session: Stripe.Checkout.Session): boolean {
  if (session.mode === "payment") {
    return session.payment_status === "paid";
  }
  if (session.mode === "subscription") {
    return session.status === "complete";
  }
  return false;
}

async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  if (!shouldFulfillCheckoutSession(session)) {
    console.info("[stripe/webhook] skip checkout fulfillment", session.id, {
      mode: session.mode,
      status: session.status,
      payment_status: session.payment_status
    });
    return;
  }

  const userId = session.metadata?.userId;
  const purchaseTypeRaw = session.metadata?.purchaseType;

  if (!userId || !purchaseTypeRaw || !isPurchaseType(purchaseTypeRaw)) {
    console.warn("[stripe/webhook] Missing or invalid checkout metadata", session.id);
    return;
  }

  let sessionForWrite = session;
  if (purchaseTypeRaw === "premium_monthly" && !subscriptionIdFromSession(session) && stripe) {
    sessionForWrite = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["subscription"]
    });
  }

  const subscriptionId = subscriptionIdFromSession(sessionForWrite);

  const idempotencyKey = checkoutFulfillmentId(session.id);

  if (purchaseTypeRaw === "premium_monthly") {
    const customerStr = sessionForWrite.customer ? String(sessionForWrite.customer) : undefined;
    const result = await runOnce(idempotencyKey, async (tx) => {
      await tx.user.upsert({
        where: { id: userId },
        update: {
          plan: "premium",
          subscriptionStatus: "active",
          ...(customerStr ? { stripeCustomerId: customerStr } : {}),
          ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {})
        },
        create: {
          id: userId,
          authProvider: "legacy",
          authProviderId: null,
          plan: "premium",
          subscriptionStatus: "active",
          ...(customerStr ? { stripeCustomerId: customerStr } : {}),
          ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {})
        }
      });
    });
    console.info("[stripe/webhook] premium checkout", session.id, result);
    return;
  }

  const creditsToAdd = creditAmountForPurchase(purchaseTypeRaw);
  const customerStrOneTime = sessionForWrite.customer ? String(sessionForWrite.customer) : undefined;
  const result = await runOnce(idempotencyKey, async (tx) => {
    await tx.user.upsert({
      where: { id: userId },
      update: {
        credits: { increment: creditsToAdd },
        paidChecksCount: { increment: creditsToAdd },
        ...(customerStrOneTime ? { stripeCustomerId: customerStrOneTime } : {})
      },
      create: {
        id: userId,
        authProvider: "legacy",
        authProviderId: null,
        credits: creditsToAdd,
        paidChecksCount: creditsToAdd,
        ...(customerStrOneTime ? { stripeCustomerId: customerStrOneTime } : {})
      }
    });
  });
  console.info("[stripe/webhook] credits checkout", session.id, creditsToAdd, result);
}

export async function POST(req: Request) {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe/webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("[stripe/webhook] Signature verification failed", error);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await fulfillCheckoutSession(session);
        return NextResponse.json({ received: true });
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) {
          console.warn("[stripe/webhook] invoice.payment_failed missing customer");
          return NextResponse.json({ received: true });
        }

        const result = await runOnce(event.id, async (tx) => {
          const updated = await tx.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscriptionStatus: "past_due" }
          });
          if (updated.count === 0) {
            console.warn("[stripe/webhook] payment_failed customer not linked to user", customerId);
          }
        });
        return NextResponse.json({ received: true, duplicate: result === "duplicate" });
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
        if (!customerId) {
          console.warn("[stripe/webhook] customer.subscription.deleted missing customer");
          return NextResponse.json({ received: true });
        }

        const result = await runOnce(event.id, async (tx) => {
          const updated = await tx.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              plan: "free",
              subscriptionStatus: "canceled",
              stripeSubscriptionId: null,
              monthlyChecksUsed: 0
            }
          });
          if (updated.count === 0) {
            console.warn("[stripe/webhook] subscription_deleted customer not linked to user", customerId);
          }
        });
        return NextResponse.json({ received: true, duplicate: result === "duplicate" });
      }

      default:
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error("[stripe/webhook] Event handling failed", event.type, error);
    return NextResponse.json({ error: "webhook_handler_failed" }, { status: 500 });
  }
}
