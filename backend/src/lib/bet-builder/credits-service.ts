import { prisma } from "../db/prisma";
import type { AuthUser } from "../auth/auth-service";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface BetBuilderWalletStatus {
  isUnlimited: boolean;
  creditsBalance: number;
  permanentCredits: number;
  timedCredits: number;
  timedCreditsExpiresAt: string | null;
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
  timedCredits: number;
  timedExpiresAt: Date | null;
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
            ADD COLUMN IF NOT EXISTS "bet_builder_last_free_at" TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS "bet_builder_timed_credits" INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "bet_builder_timed_credits_expires_at" TIMESTAMPTZ;
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
    timedCreditsRaw: number,
    timedExpiresAt: Date | null,
    lastFreeAt: Date | null
  ): BetBuilderWalletStatus {
    const isUnlimited = this.hasUnlimitedAccess(user);
    const nowMs = Date.now();
    const hasValidTimed =
      timedCreditsRaw > 0 &&
      Boolean(timedExpiresAt) &&
      timedExpiresAt!.getTime() > nowMs;
    const permanentCredits = Math.max(0, permanentCreditsRaw);
    const timedCredits = hasValidTimed ? Math.max(0, timedCreditsRaw) : 0;
    const creditsBalance = permanentCredits + timedCredits;
    const timedCreditsExpiresAt =
      hasValidTimed && timedExpiresAt ? timedExpiresAt.toISOString() : null;

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
        timedCredits: 0,
        timedExpiresAt: null,
        lastFreeAt: null,
      };
      memoryWallets.set(userId, rec);
    }
    return rec;
  }

  async getWalletStatus(user: AuthUser): Promise<BetBuilderWalletStatus> {
    if (this.hasUnlimitedAccess(user)) {
      return this.formatWalletState(user, 0, 0, null, null);
    }

    await this.ensureSchema();

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          betBuilderCredits: true,
          betBuilderTimedCredits: true,
          betBuilderTimedCreditsExpiresAt: true,
          betBuilderLastFreeAt: true,
        },
      });
      if (dbUser) {
        return this.formatWalletState(
          user,
          dbUser.betBuilderCredits,
          dbUser.betBuilderTimedCredits,
          dbUser.betBuilderTimedCreditsExpiresAt,
          dbUser.betBuilderLastFreeAt
        );
      }
    } catch (err: any) {
      console.warn("[BetBuilderCredits] DB status lookup fallback:", err.message);
    }

    const mem = this.getOrCreateMemoryWallet(user.id);
    return this.formatWalletState(
      user,
      mem.permanentCredits,
      mem.timedCredits,
      mem.timedExpiresAt,
      mem.lastFreeAt
    );
  }

  async consumeGeneration(user: AuthUser): Promise<ConsumeGenerationResult> {
    if (this.hasUnlimitedAccess(user)) {
      return {
        ...this.formatWalletState(user, 0, 0, null, null),
        allowed: true,
        consumedFrom: "subscriber",
      };
    }

    await this.ensureSchema();

    type WalletRow = {
      permanent_credits: number;
      timed_credits: number;
      timed_expires_at: Date | null;
      last_free_at: Date | null;
    };

    try {
      // 1. Prefer claiming the weekly free slip first
      const freeClaimRows = await prisma.$queryRaw<WalletRow[]>`
        UPDATE "users"
        SET "bet_builder_last_free_at" = NOW()
        WHERE "id" = ${user.id}
          AND (
            "bet_builder_last_free_at" IS NULL
            OR "bet_builder_last_free_at" <= NOW() - INTERVAL '7 days'
          )
        RETURNING
          "bet_builder_credits" AS permanent_credits,
          "bet_builder_timed_credits" AS timed_credits,
          "bet_builder_timed_credits_expires_at" AS timed_expires_at,
          "bet_builder_last_free_at" AS last_free_at
      `;

      if (freeClaimRows.length > 0) {
        const r = freeClaimRows[0];
        return {
          ...this.formatWalletState(
            user,
            Number(r.permanent_credits) || 0,
            Number(r.timed_credits) || 0,
            r.timed_expires_at,
            r.last_free_at
          ),
          allowed: true,
          consumedFrom: "free_weekly",
        };
      }

      // 2. Spend expiring 14-day credits before non-expiring credits so users don't lose timed balances
      const timedClaimRows = await prisma.$queryRaw<WalletRow[]>`
        UPDATE "users"
        SET "bet_builder_timed_credits" = "bet_builder_timed_credits" - 1
        WHERE "id" = ${user.id}
          AND "bet_builder_timed_credits" > 0
          AND "bet_builder_timed_credits_expires_at" IS NOT NULL
          AND "bet_builder_timed_credits_expires_at" > NOW()
        RETURNING
          "bet_builder_credits" AS permanent_credits,
          "bet_builder_timed_credits" AS timed_credits,
          "bet_builder_timed_credits_expires_at" AS timed_expires_at,
          "bet_builder_last_free_at" AS last_free_at
      `;

      if (timedClaimRows.length > 0) {
        const r = timedClaimRows[0];
        return {
          ...this.formatWalletState(
            user,
            Number(r.permanent_credits) || 0,
            Number(r.timed_credits) || 0,
            r.timed_expires_at,
            r.last_free_at
          ),
          allowed: true,
          consumedFrom: "credit",
        };
      }

      // 3. Otherwise spend non-expiring credits
      const creditClaimRows = await prisma.$queryRaw<WalletRow[]>`
        UPDATE "users"
        SET "bet_builder_credits" = "bet_builder_credits" - 1
        WHERE "id" = ${user.id}
          AND "bet_builder_credits" > 0
        RETURNING
          "bet_builder_credits" AS permanent_credits,
          "bet_builder_timed_credits" AS timed_credits,
          "bet_builder_timed_credits_expires_at" AS timed_expires_at,
          "bet_builder_last_free_at" AS last_free_at
      `;

      if (creditClaimRows.length > 0) {
        const r = creditClaimRows[0];
        return {
          ...this.formatWalletState(
            user,
            Number(r.permanent_credits) || 0,
            Number(r.timed_credits) || 0,
            r.timed_expires_at,
            r.last_free_at
          ),
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
          ...this.formatWalletState(
            user,
            mem.permanentCredits,
            mem.timedCredits,
            mem.timedExpiresAt,
            mem.lastFreeAt
          ),
          allowed: true,
          consumedFrom: "free_weekly",
        };
      }

      const hasValidTimed =
        mem.timedCredits > 0 &&
        Boolean(mem.timedExpiresAt) &&
        mem.timedExpiresAt!.getTime() > now.getTime();

      if (hasValidTimed) {
        mem.timedCredits -= 1;
        return {
          ...this.formatWalletState(
            user,
            mem.permanentCredits,
            mem.timedCredits,
            mem.timedExpiresAt,
            mem.lastFreeAt
          ),
          allowed: true,
          consumedFrom: "credit",
        };
      }

      if (mem.permanentCredits > 0) {
        mem.permanentCredits -= 1;
        return {
          ...this.formatWalletState(
            user,
            mem.permanentCredits,
            mem.timedCredits,
            mem.timedExpiresAt,
            mem.lastFreeAt
          ),
          allowed: true,
          consumedFrom: "credit",
        };
      }

      return {
        ...this.formatWalletState(
          user,
          mem.permanentCredits,
          mem.timedCredits,
          mem.timedExpiresAt,
          mem.lastFreeAt
        ),
        allowed: false,
        consumedFrom: null,
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

    try {
      if (expirationDays && expirationDays > 0) {
        const rows = await client.$queryRaw<
          Array<{ permanent_credits: number; timed_credits: number }>
        >`
          UPDATE "users"
          SET
            "bet_builder_timed_credits" = CASE
              WHEN "bet_builder_timed_credits_expires_at" IS NOT NULL
                AND "bet_builder_timed_credits_expires_at" > NOW()
                AND "bet_builder_timed_credits" > 0
              THEN "bet_builder_timed_credits" + ${creditsToAdd}
              ELSE ${creditsToAdd}
            END,
            "bet_builder_timed_credits_expires_at" = NOW() + (${expirationDays} * INTERVAL '1 day')
          WHERE "id" = ${userId}
          RETURNING
            "bet_builder_credits" AS permanent_credits,
            "bet_builder_timed_credits" AS timed_credits
        `;
        if (rows.length > 0) {
          return (
            (Number(rows[0].permanent_credits) || 0) +
            (Number(rows[0].timed_credits) || 0)
          );
        }
      } else {
        const updated = await client.user.update({
          where: { id: userId },
          data: {
            betBuilderCredits: { increment: creditsToAdd },
          },
          select: {
            betBuilderCredits: true,
            betBuilderTimedCredits: true,
            betBuilderTimedCreditsExpiresAt: true,
          },
        });
        const activeTimed =
          updated.betBuilderTimedCredits > 0 &&
          updated.betBuilderTimedCreditsExpiresAt &&
          updated.betBuilderTimedCreditsExpiresAt.getTime() > Date.now()
            ? updated.betBuilderTimedCredits
            : 0;
        return updated.betBuilderCredits + activeTimed;
      }
    } catch (err: any) {
      console.warn("[BetBuilderCredits] DB grantCredits fallback:", err.message);
    }

    const mem = this.getOrCreateMemoryWallet(userId);
    const nowMs = Date.now();
    if (expirationDays && expirationDays > 0) {
      const hasValid =
        mem.timedCredits > 0 &&
        Boolean(mem.timedExpiresAt) &&
        mem.timedExpiresAt!.getTime() > nowMs;
      mem.timedCredits = hasValid ? mem.timedCredits + creditsToAdd : creditsToAdd;
      mem.timedExpiresAt = new Date(nowMs + expirationDays * DAY_MS);
    } else {
      mem.permanentCredits += creditsToAdd;
    }
    const activeTimed =
      mem.timedCredits > 0 && mem.timedExpiresAt && mem.timedExpiresAt.getTime() > nowMs
        ? mem.timedCredits
        : 0;
    return mem.permanentCredits + activeTimed;
  }
}

export const betBuilderCreditsService = new BetBuilderCreditsService();
