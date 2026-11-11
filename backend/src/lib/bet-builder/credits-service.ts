import { prisma } from "../db/prisma";
import type { AuthUser } from "../auth/auth-service";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface BetBuilderWalletStatus {
  isUnlimited: boolean;
  creditsBalance: number;
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
  credits: number;
  lastFreeAt: Date | null;
}

const memoryWallets = new Map<string, MemoryWalletRecord>();

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
            ADD COLUMN IF NOT EXISTS "bet_builder_last_free_at" TIMESTAMPTZ;
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
    creditsBalance: number,
    lastFreeAt: Date | null
  ): BetBuilderWalletStatus {
    const isUnlimited = this.hasUnlimitedAccess(user);
    const nowMs = Date.now();
    const hasUsedFreeWithinWeek =
      Boolean(lastFreeAt) && nowMs - lastFreeAt!.getTime() < WEEK_MS;
    const freeWeeklyRemaining = hasUsedFreeWithinWeek ? 0 : 1;
    const nextFreeResetAt =
      hasUsedFreeWithinWeek && lastFreeAt
        ? new Date(lastFreeAt.getTime() + WEEK_MS).toISOString()
        : null;

    return {
      isUnlimited,
      creditsBalance: Math.max(0, creditsBalance),
      freeWeeklyRemaining,
      nextFreeResetAt,
      canGenerate: isUnlimited || freeWeeklyRemaining > 0 || creditsBalance > 0,
      subscriptionPlan: user.subscriptionPlan || "FREE",
    };
  }

  private getOrCreateMemoryWallet(userId: string): MemoryWalletRecord {
    let rec = memoryWallets.get(userId);
    if (!rec) {
      rec = { credits: 0, lastFreeAt: null };
      memoryWallets.set(userId, rec);
    }
    return rec;
  }

  async getWalletStatus(user: AuthUser): Promise<BetBuilderWalletStatus> {
    if (this.hasUnlimitedAccess(user)) {
      return this.formatWalletState(user, 0, null);
    }

    await this.ensureSchema();

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          betBuilderCredits: true,
          betBuilderLastFreeAt: true,
        },
      });
      if (dbUser) {
        return this.formatWalletState(
          user,
          dbUser.betBuilderCredits,
          dbUser.betBuilderLastFreeAt
        );
      }
    } catch (err: any) {
      console.warn("[BetBuilderCredits] DB status lookup fallback:", err.message);
    }

    const mem = this.getOrCreateMemoryWallet(user.id);
    return this.formatWalletState(user, mem.credits, mem.lastFreeAt);
  }

  async consumeGeneration(user: AuthUser): Promise<ConsumeGenerationResult> {
    if (this.hasUnlimitedAccess(user)) {
      return {
        ...this.formatWalletState(user, 0, null),
        allowed: true,
        consumedFrom: "subscriber",
      };
    }

    await this.ensureSchema();

    try {
      // 1. Prefer claiming the weekly free slip first so paid credits are never wasted when a free slip is ready
      const freeClaimRows = await prisma.$queryRaw<
        Array<{ credits: number; last_free_at: Date | null }>
      >`
        UPDATE "users"
        SET "bet_builder_last_free_at" = NOW()
        WHERE "id" = ${user.id}
          AND (
            "bet_builder_last_free_at" IS NULL
            OR "bet_builder_last_free_at" <= NOW() - INTERVAL '7 days'
          )
        RETURNING "bet_builder_credits" AS credits, "bet_builder_last_free_at" AS last_free_at
      `;

      if (freeClaimRows.length > 0) {
        const row = freeClaimRows[0];
        return {
          ...this.formatWalletState(user, Number(row.credits) || 0, row.last_free_at),
          allowed: true,
          consumedFrom: "free_weekly",
        };
      }

      // 2. Otherwise atomically spend 1 purchased credit
      const creditClaimRows = await prisma.$queryRaw<
        Array<{ credits: number; last_free_at: Date | null }>
      >`
        UPDATE "users"
        SET "bet_builder_credits" = "bet_builder_credits" - 1
        WHERE "id" = ${user.id}
          AND "bet_builder_credits" > 0
        RETURNING "bet_builder_credits" AS credits, "bet_builder_last_free_at" AS last_free_at
      `;

      if (creditClaimRows.length > 0) {
        const row = creditClaimRows[0];
        return {
          ...this.formatWalletState(user, Number(row.credits) || 0, row.last_free_at),
          allowed: true,
          consumedFrom: "credit",
        };
      }

      const status = await this.getWalletStatus(user);
      return {
        ...status,
        allowed: false,
        consumedFrom: null,
      };
    } catch (err: any) {
      console.warn("[BetBuilderCredits] DB consume fallback:", err.message);
      const mem = this.getOrCreateMemoryWallet(user.id);
      const now = new Date();
      const canUseFree =
        !mem.lastFreeAt || now.getTime() - mem.lastFreeAt.getTime() >= WEEK_MS;

      if (canUseFree) {
        mem.lastFreeAt = now;
        return {
          ...this.formatWalletState(user, mem.credits, mem.lastFreeAt),
          allowed: true,
          consumedFrom: "free_weekly",
        };
      }

      if (mem.credits > 0) {
        mem.credits -= 1;
        return {
          ...this.formatWalletState(user, mem.credits, mem.lastFreeAt),
          allowed: true,
          consumedFrom: "credit",
        };
      }

      return {
        ...this.formatWalletState(user, mem.credits, mem.lastFreeAt),
        allowed: false,
        consumedFrom: null,
      };
    }
  }

  async grantCredits(userId: string, creditsToAdd: number, tx?: any): Promise<number> {
    if (creditsToAdd <= 0) return 0;
    const client = tx || prisma;

    if (!tx) {
      await this.ensureSchema();
    }

    try {
      const updated = await client.user.update({
        where: { id: userId },
        data: {
          betBuilderCredits: { increment: creditsToAdd },
        },
        select: { betBuilderCredits: true },
      });
      return updated.betBuilderCredits;
    } catch (err: any) {
      console.warn("[BetBuilderCredits] DB grantCredits fallback:", err.message);
      const mem = this.getOrCreateMemoryWallet(userId);
      mem.credits += creditsToAdd;
      return mem.credits;
    }
  }
}

export const betBuilderCreditsService = new BetBuilderCreditsService();
