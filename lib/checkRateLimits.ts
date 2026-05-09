import { Prisma } from "@prisma/client";

type DbTx = Prisma.TransactionClient;
import { EN_MESSAGES } from "@/lib/messages.en";
import { db } from "@/lib/db";

const TEN_MIN_MS = 10 * 60 * 1000;

export type ScanKind = "basic" | "deep";

export type RateLimitReason =
  | "ip_burst"
  | "abuse_key_burst"
  | "user_burst"
  | "user_daily_free"
  | "user_daily_paid"
  | "deep_daily";

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = raw !== undefined ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Limits from env (with safe defaults). */
export function getScanRateEnvLimits() {
  const userBurst = parsePositiveInt(process.env.USER_BURST_LIMIT_10_MIN, 10);
  const abuseOverride = process.env.ABUSE_KEY_BURST_LIMIT_10_MIN;
  return {
    ipBurst10m: parsePositiveInt(process.env.IP_BURST_LIMIT_10_MIN, 20),
    abuseKeyBurst10m: parsePositiveInt(abuseOverride, userBurst),
    userIdBurst10m: userBurst,
    freeUserDaily: parsePositiveInt(process.env.FREE_USER_DAILY_CHECK_LIMIT, 5),
    paidUserDaily: parsePositiveInt(process.env.PAID_USER_DAILY_CHECK_LIMIT, 100),
    freeDeepDaily: parsePositiveInt(process.env.FREE_DEEP_SCAN_DAILY_LIMIT, 3)
  };
}

export type LimitCountSnapshot = {
  ipBurst: number;
  abuseBurst: number;
  userIdBurst: number;
  allowedUserDaily: number;
  allowedDeepDaily: number;
};

export type LimitEvaluationContext = {
  authenticated: boolean;
  userId: string | null;
  paid: boolean;
  scanIsDeep: boolean;
};

/** Pure rule engine — used by tests and the DB transaction. */
export function pickRateLimitViolation(
  counts: LimitCountSnapshot,
  limits: ReturnType<typeof getScanRateEnvLimits>,
  ctx: LimitEvaluationContext
): RateLimitReason | null {
  if (counts.ipBurst >= limits.ipBurst10m) return "ip_burst";
  if (counts.abuseBurst >= limits.abuseKeyBurst10m) return "abuse_key_burst";
  if (ctx.userId && counts.userIdBurst >= limits.userIdBurst10m) return "user_burst";

  if (ctx.authenticated && ctx.userId) {
    const dailyCap = ctx.paid ? limits.paidUserDaily : limits.freeUserDaily;
    if (counts.allowedUserDaily >= dailyCap) {
      return ctx.paid ? "user_daily_paid" : "user_daily_free";
    }

    if (ctx.scanIsDeep && !ctx.paid && counts.allowedDeepDaily >= limits.freeDeepDaily) {
      return "deep_daily";
    }
  }

  return null;
}

export function messageForRateLimitReason(reason: RateLimitReason): string {
  switch (reason) {
    case "ip_burst":
      return EN_MESSAGES.rateLimit.tooManyFromNetwork;
    case "abuse_key_burst":
    case "user_burst":
      return EN_MESSAGES.rateLimit.tooManyChecksShortWindow;
    case "user_daily_free":
      return EN_MESSAGES.rateLimit.freeDailyExceeded;
    case "user_daily_paid":
      return EN_MESSAGES.rateLimit.paidDailyExceeded;
    case "deep_daily":
      return EN_MESSAGES.rateLimit.deepDailyExceededFree;
    default:
      return EN_MESSAGES.rateLimit.generic;
  }
}

function utcDayStart(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

function serializationConflict(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2034";
}

async function snapshotCounts(tx: DbTx, params: {
  ipHash: string;
  abuseKey: string;
  userId: string | null;
  burstSince: Date;
  dayStart: Date;
}): Promise<LimitCountSnapshot> {
  const { ipHash, abuseKey, userId, burstSince, dayStart } = params;

  const whereBurstBase = { createdAt: { gte: burstSince } };

  const [ipBurst, abuseBurst, userIdBurst, allowedUserDaily, allowedDeepDaily] = await Promise.all([
    tx.scanRateLimitEvent.count({ where: { ipHash, ...whereBurstBase } }),
    tx.scanRateLimitEvent.count({ where: { abuseKey, ...whereBurstBase } }),
    userId
      ? tx.scanRateLimitEvent.count({ where: { userId, ...whereBurstBase } })
      : Promise.resolve(0),
    userId
      ? tx.scanRateLimitEvent.count({
          where: { userId, blocked: false, createdAt: { gte: dayStart } }
        })
      : Promise.resolve(0),
    userId
      ? tx.scanRateLimitEvent.count({
          where: {
            userId,
            blocked: false,
            scanType: "deep",
            createdAt: { gte: dayStart }
          }
        })
      : Promise.resolve(0)
  ]);

  return { ipBurst, abuseBurst, userIdBurst, allowedUserDaily, allowedDeepDaily };
}

export type ReserveQuotaParams = {
  userId: string | null;
  domain: string;
  scanType: ScanKind;
  ipHash: string;
  userAgentHash: string;
  abuseKey: string;
  /** True when Clerk user resolved and allowed to consume registered quotas. */
  authenticated: boolean;
  paid: boolean;
};

export type ReserveQuotaResult = { ok: true } | { ok: false; reason: RateLimitReason; message: string };

async function reserveOnce(params: ReserveQuotaParams): Promise<ReserveQuotaResult> {
  const limits = getScanRateEnvLimits();
  const now = new Date();
  const burstSince = new Date(now.getTime() - TEN_MIN_MS);
  const dayStart = utcDayStart(now);
  const ctx: LimitEvaluationContext = {
    authenticated: params.authenticated,
    userId: params.userId,
    paid: params.paid,
    scanIsDeep: params.scanType === "deep"
  };

  return db.$transaction(
    async (tx) => {
      const counts = await snapshotCounts(tx, {
        ipHash: params.ipHash,
        abuseKey: params.abuseKey,
        userId: params.userId,
        burstSince,
        dayStart
      });

      const violation = pickRateLimitViolation(counts, limits, ctx);
      if (violation) {
        await tx.scanRateLimitEvent.create({
          data: {
            userId: params.userId,
            ipHash: params.ipHash,
            userAgentHash: params.userAgentHash,
            abuseKey: params.abuseKey,
            domain: params.domain,
            scanType: params.scanType,
            blocked: true,
            reason: violation
          }
        });
        return { ok: false as const, reason: violation, message: messageForRateLimitReason(violation) };
      }

      await tx.scanRateLimitEvent.create({
        data: {
          userId: params.userId,
          ipHash: params.ipHash,
          userAgentHash: params.userAgentHash,
          abuseKey: params.abuseKey,
          domain: params.domain,
          scanType: params.scanType,
          blocked: false,
          reason: null
        }
      });

      return { ok: true as const };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000
    }
  );
}

/**
 * Validates layered limits and records an allowed or blocked ScanRateLimitEvent.
 * Caller must invoke only when the scan is genuinely eligible (e.g. anonymous first-check already passed gates).
 */
export async function reserveScanQuotaOrReject(params: ReserveQuotaParams): Promise<ReserveQuotaResult> {
  let last: unknown;
  for (let i = 0; i < 3; i++) {
    try {
      return await reserveOnce(params);
    } catch (err) {
      last = err;
      if (serializationConflict(err)) continue;
      throw err;
    }
  }
  console.error("[checkRateLimits] exhausted Serializable retries", last);
  return {
    ok: false,
    reason: "ip_burst",
    message: EN_MESSAGES.rateLimit.generic
  };
}
