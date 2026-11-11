import { prisma } from "../db/prisma";
import type { AuthUser } from "../auth/auth-service";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface TimedCreditLot {
  remaining: number;
  expiresAt: string;
}

export interface BetBuilderWalletStatus {
  isUnlimited: boolean;
  creditsBalance: number;
  permanentCredits: number;
  timedCredits: number;
  timedCreditsExpiresAt: string | null;
  timedLots: TimedCreditLot[];
  freeWeeklyRemaining: number;
  nextFreeResetAt: string | null;
  canGenerate: boolean;
  subscriptionPlan: string;
}

export interface ConsumeGenerationResult extends BetBuilderWalletStatus {
  allowed: boolean;
  consumedFrom: "subscriber" | "free_weekly" | "credit" | null;
}

interface MemoryWalletRecord {
  permanentCredits: number;
  lots: TimedCreditLot[];
  lastFreeAt: Date | null;
}

const memoryWallets = new Map<string, MemoryWalletRecord>();

function normalizeActiveLots(
  rawLots: unknown,
  legacyTimedCredits: number,
  legacyTimedExpiresAt: Date | null,
  nowMs: number
): TimedCreditLot[] {
  const parsed: TimedCreditLot[] = [];
  let source = rawLots;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      source = [];
    }
  }

  if (Array.isArray(source)) {
    for (const item of source) {
      const rem = Number((item as any)?.remaining || 0);
      const expStr = typeof (item as any)?.expiresAt === "string" ? (item as any).expiresAt : "";
      const expMs = expStr ? new Date(expStr).getTime() : 0;
      if (rem > 0 && Number.isFinite(expMs) && expMs > nowMs) {
        parsed.push({ remaining: rem, expiresAt: new Date(expMs).toISOString() });
      }
    }
  }

  // Backward-compatible migration: preserve pre-lot timed credits if lots array is empty
  if (
    parsed.length === 0 &&
    legacyTimedCredits > 0 &&
    legacyTimedExpiresAt &&
    legacyTimedExpiresAt.getTime() > nowMs
  ) {
    parsed.push({
      remaining: legacyTimedCredits,
      expiresAt: legacyTimedExpiresAt.toISOString(),
    });
  }

  // FIFO by earliest expiration so soonest-expiring credits are always spent first
  parsed.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
  return parsed;
}

export class BetBuilderCreditsService {
  private schemaReadyPromise: Promise<void> | null = null;

  /**
   * Ensures Bet Builder wallet columns exist on the `users` table cleanly on first boot/access,
   * preventing schema drift errors if a host deploys without running `prisma db push` first.
   */
  async ensureSchema(): Promise<void> {
    if (!this.schemaReadyPromise) {
      this.schemaReadyPromise = (async () => {
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "bet_builder_credits" INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "bet_builder_last_free_at" TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS "bet_builder_timed_credits" INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "bet_builder_timed_credits_expires_at" TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS "bet_builder_credit_lots" JSONB NOT NULL DEFAULT '[]'::jsonb;
          `);
        } catch (err: any) {
          this.schemaReadyPromise = null;
          console.warn("[BetBuilderCredits] Schema ensure notice:", err.message);
        }
      })();
    }
    return this.schemaReadyPromise;
  }

  /**
   * Only Admins and active paid Premium / VIP Pro subscribers get unlimited Bet Builder generations.
   * Free accounts (including 7-day signup trials) follow the 1-free-slip-per-week + credit wallet rules.
   */
  hasUnlimitedAccess(user?: AuthUser | null): boolean {
    if (!user) return false;
    if (user.role === "ADMIN") return true;

    const plan = (user.subscriptionPlan || "").toUpperCase();
    const status = (user.subscriptionStatus || "").toUpperCase();
    const isPaidTier =
      plan.startsWith("PREMIUM") ||
      plan.startsWith("VIP") ||
      plan === "PRO";
    const isStatusActive = status === "ACTIVE" || status === "TRIALING";

    return isPaidTier && isStatusActive;
  }

  private formatWalletState(
    user: AuthUser,
    permanentCreditsRaw: number,
    activeLots: TimedCreditLot[],
    lastFreeAt: Date | null
  ): BetBuilderWalletStatus {
    const isUnlimited = this.hasUnlimitedAccess(user);
    const nowMs = Date.now();
    const validLots = normalizeActiveLots(activeLots, 0, null, nowMs);
    const permanentCredits = Math.max(0, permanentCreditsRaw);
    const timedCredits = validLots.reduce((sum, lot) => sum + lot.remaining, 0);
    const creditsBalance = permanentCredits + timedCredits;
    const timedCreditsExpiresAt = validLots.length > 0 ? validLots[0].expiresAt : null;

    const hasUsedFreeWithinWeek =
      Boolean(lastFreeAt) && nowMs - lastFreeAt!.getTime() < WEEK_MS;
    const freeWeeklyRemaining = hasUsedFreeWithinWeek ? 0 : 1;
    const nextFreeResetAt =
      hasUsedFreeWithinWeek && lastFreeAt
        ? new Date(lastFreeAt.getTime() + WEEK_MS).toISOString()
        : null;

    return {
      isUnlimited,
      creditsBalance,
      permanentCredits,
      timedCredits,
      timedCreditsExpiresAt,
      timedLots: validLots,
      freeWeeklyRemaining,
      nextFreeResetAt,
      canGenerate: isUnlimited || freeWeeklyRemaining > 0 || creditsBalance > 0,
      subscriptionPlan: user.subscriptionPlan || "FREE",
    };
  }

  private getOrCreateMemoryWallet(userId: string): MemoryWalletRecord {
    let rec = memoryWallets.get(userId);
    if (!rec) {
      rec = {
        permanentCredits: 0,
        lots: [],
        lastFreeAt: null,
      };
      memoryWallets.set(userId, rec);
    }
    return rec;
  }

  private applyConsumeInMemory(mem: MemoryWalletRecord, nowMs: number): "free_weekly" | "credit" | null {
    const canUseFree =
      !mem.lastFreeAt || nowMs - mem.lastFreeAt.getTime() >= WEEK_MS;
    if (canUseFree) {
      mem.lastFreeAt = new Date(nowMs);
      return "free_weekly";
    }

    mem.lots = normalizeActiveLots(mem.lots, 0, null, nowMs);
    if (mem.lots.length > 0) {
      mem.lots[0].remaining -= 1;
      if (mem.lots[0].remaining <= 0) {
        mem.lots.shift();
      }
      return "credit";
    }

    if (mem.permanentCredits > 0) {
      mem.permanentCredits -= 1;
      return "credit";
    }

    return null;
  }

  async getWalletStatus(user: AuthUser): Promise<BetBuilderWalletStatus> {
    if (this.hasUnlimitedAccess(user)) {
      return this.formatWalletState(user, 0, [], null);
    }

    await this.ensureSchema();

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          betBuilderCredits: true,
          betBuilderTimedCredits: true,
          betBuilderTimedCreditsExpiresAt: true,
          betBuilderCreditLots: true,
          betBuilderLastFreeAt: true,
        },
      });
      if (dbUser) {
        const activeLots = normalizeActiveLots(
          dbUser.betBuilderCreditLots,
          dbUser.betBuilderTimedCredits,
          dbUser.betBuilderTimedCreditsExpiresAt,
          Date.now()
        );
        return this.formatWalletState(
          user,
          dbUser.betBuilderCredits,
          activeLots,
          dbUser.betBuilderLastFreeAt
        );
      }
    } catch (err: any) {
      console.warn("[BetBuilderCredits] DB status lookup fallback:", err.message);
    }

    const mem = this.getOrCreateMemoryWallet(user.id);
    return this.formatWalletState(user, mem.permanentCredits, mem.lots, mem.lastFreeAt);
  }

  async consumeGeneration(user: AuthUser): Promise<ConsumeGenerationResult> {
    if (this.hasUnlimitedAccess(user)) {
      return {
        ...this.formatWalletState(user, 0, [], null),
        allowed: true,
        consumedFrom: "subscriber",
      };
    }

    await this.ensureSchema();

    type LockedUserRow = {
      permanent_credits: number;
      timed_credits: number;
      timed_expires_at: Date | null;
      credit_lots: unknown;
      last_free_at: Date | null;
    };

    try {
      const txResult = await prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<LockedUserRow[]>`
          SELECT
            "bet_builder_credits" AS permanent_credits,
            "bet_builder_timed_credits" AS timed_credits,
            "bet_builder_timed_credits_expires_at" AS timed_expires_at,
            "bet_builder_credit_lots" AS credit_lots,
            "bet_builder_last_free_at" AS last_free_at
          FROM "users"
          WHERE "id" = ${user.id}
          FOR UPDATE
        `;

        if (rows.length === 0) {
          return {
            status: this.formatWalletState(user, 0, [], null),
            allowed: false,
            consumedFrom: null as ConsumeGenerationResult["consumedFrom"],
          };
        }

        const r = rows[0];
        const now = new Date();
        const nowMs = now.getTime();
        let permanent = Number(r.permanent_credits) || 0;
        let lots = normalizeActiveLots(r.credit_lots, Number(r.timed_credits) || 0, r.timed_expires_at, nowMs);
        let lastFreeAt = r.last_free_at;

        let consumedFrom: "free_weekly" | "credit" | null = null;

        if (!lastFreeAt || nowMs - lastFreeAt.getTime() >= WEEK_MS) {
          lastFreeAt = now;
          consumedFrom = "free_weekly";
        } else if (lots.length > 0) {
          lots[0] = { ...lots[0], remaining: lots[0].remaining - 1 };
          if (lots[0].remaining <= 0) {
            lots.shift();
          }
          consumedFrom = "credit";
        } else if (permanent > 0) {
          permanent -= 1;
          consumedFrom = "credit";
        }

        const timedSum = lots.reduce((sum, l) => sum + l.remaining, 0);
        const maxExpDate = lots.length > 0 ? new Date(lots[lots.length - 1].expiresAt) : null;

        await tx.$executeRaw`
          UPDATE "users"
          SET
            "bet_builder_credits" = ${permanent},
            "bet_builder_timed_credits" = ${timedSum},
            "bet_builder_timed_credits_expires_at" = ${maxExpDate},
            "bet_builder_credit_lots" = ${JSON.stringify(lots)}::jsonb,
            "bet_builder_last_free_at" = ${lastFreeAt}
          WHERE "id" = ${user.id}
        `;

        return {
          status: this.formatWalletState(user, permanent, lots, lastFreeAt),
          allowed: consumedFrom !== null,
          consumedFrom,
        };
      });

      return {
        ...txResult.status,
        allowed: txResult.allowed,
        consumedFrom: txResult.consumedFrom,
      };
    } catch (err: any) {
      console.warn("[BetBuilderCredits] DB consume fallback:", err.message);
      const mem = this.getOrCreateMemoryWallet(user.id);
      const consumedFrom = this.applyConsumeInMemory(mem, Date.now());
      return {
        ...this.formatWalletState(user, mem.permanentCredits, mem.lots, mem.lastFreeAt),
        allowed: consumedFrom !== null,
        consumedFrom,
      };
    }
  }

  async grantCredits(
    userId: string,
    creditsToAdd: number,
    tx?: any,
    expirationDays?: number
  ): Promise<number> {
    if (creditsToAdd <= 0) return 0;
    const client = tx || prisma;

    if (!tx) {
      await this.ensureSchema();
    }

    type GrantRow = {
      permanent_credits: number;
      timed_credits: number;
      timed_expires_at: Date | null;
      credit_lots: unknown;
    };

    try {
      const rows = await client.$queryRaw<GrantRow[]>`
        SELECT
          "bet_builder_credits" AS permanent_credits,
          "bet_builder_timed_credits" AS timed_credits,
          "bet_builder_timed_credits_expires_at" AS timed_expires_at,
          "bet_builder_credit_lots" AS credit_lots
        FROM "users"
        WHERE "id" = ${userId}
        FOR UPDATE
      `;

      if (rows.length > 0) {
        const r = rows[0];
        const nowMs = Date.now();
        let permanent = Number(r.permanent_credits) || 0;
        const lots = normalizeActiveLots(
          r.credit_lots,
          Number(r.timed_credits) || 0,
          r.timed_expires_at,
          nowMs
        );

        if (expirationDays && expirationDays > 0) {
          lots.push({
            remaining: creditsToAdd,
            expiresAt: new Date(nowMs + expirationDays * DAY_MS).toISOString(),
          });
          lots.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
        } else {
          permanent += creditsToAdd;
        }

        const timedSum = lots.reduce((sum, l) => sum + l.remaining, 0);
        const maxExpDate = lots.length > 0 ? new Date(lots[lots.length - 1].expiresAt) : null;

        await client.$executeRaw`
          UPDATE "users"
          SET
            "bet_builder_credits" = ${permanent},
            "bet_builder_timed_credits" = ${timedSum},
            "bet_builder_timed_credits_expires_at" = ${maxExpDate},
            "bet_builder_credit_lots" = ${JSON.stringify(lots)}::jsonb
          WHERE "id" = ${userId}
        `;

        return permanent + timedSum;
      }
    } catch (err: any) {
      console.warn("[BetBuilderCredits] DB grantCredits fallback:", err.message);
    }

    const mem = this.getOrCreateMemoryWallet(userId);
    const nowMs = Date.now();
    mem.lots = normalizeActiveLots(mem.lots, 0, null, nowMs);
    if (expirationDays && expirationDays > 0) {
      mem.lots.push({
        remaining: creditsToAdd,
        expiresAt: new Date(nowMs + expirationDays * DAY_MS).toISOString(),
      });
      mem.lots.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
    } else {
      mem.permanentCredits += creditsToAdd;
    }
    return mem.permanentCredits + mem.lots.reduce((sum, l) => sum + l.remaining, 0);
  }
}

export const betBuilderCreditsService = new BetBuilderCreditsService();
