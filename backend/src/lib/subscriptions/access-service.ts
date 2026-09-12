import { Fixture, Prediction } from "../football/types";
import { AuthUser } from "../auth/auth-service";

export const FREE_DAILY_TIPS_LIMIT = 7;

export class AccessControlService {
  /**
   * Apply server-side paywall, kickoff lock, and daily quota masking to fixture predictions
   */
  filterFixtureForUser(
    fixture: Fixture,
    user: AuthUser | null,
    tipIndexInDailyList: number = 0
  ): Fixture {
    const isPremiumUser = Boolean(user && (user.isPremium || user.role === "ADMIN"));
    const isUnderFreeDailyQuota = tipIndexInDailyList < FREE_DAILY_TIPS_LIMIT;

    const isFinished = fixture.status === "FINISHED" || fixture.elapsed === "FT";
    const isLive = !isFinished && (fixture.status === "LIVE" || Boolean(fixture.elapsed && /^\d+['′]/.test(fixture.elapsed)));

    const sanitizedPredictions: Prediction[] = (fixture.predictions || []).map((pred) => {
      // 1. Finished matches reveal prediction for 100% transparency & track record
      if (isFinished) {
        return {
          ...pred,
          isLocked: false,
          lockReason: undefined,
        };
      }

      // 2. VIP / Premium users have full unlocked access to all tips
      if (isPremiumUser) {
        return {
          ...pred,
          isLocked: false,
          lockReason: undefined,
        };
      }

      // 3. Live Match Kickoff Lock: In-play match predictions are locked for free users
      // Scores and elapsed match minute update live, but AI pick is protected
      if (isLive) {
        return {
          ...pred,
          isLocked: true,
          lockReason: "live_kickoff_locked",
          selection: "Kickoff Locked (VIP Only)",
          confidence: 0,
          probability: null,
          odd: null,
        };
      }

      // 4. Premium-exclusive tier predictions
      if (pred.isPremium) {
        return {
          ...pred,
          isLocked: true,
          lockReason: "premium_exclusive",
          selection: "VIP Exclusive Tip",
          confidence: 0,
          probability: null,
          odd: null,
        };
      }

      // 5. Daily free quota limit (first 7 tips/day are free)
      if (!isUnderFreeDailyQuota) {
        return {
          ...pred,
          isLocked: true,
          lockReason: "free_limit_reached",
          selection: "Daily Free Limit (7/7)",
          confidence: 0,
          probability: null,
          odd: null,
        };
      }

      // 6. Free tier within quota (tips 1 through 7)
      return {
        ...pred,
        isLocked: false,
        lockReason: undefined,
      };
    });

    return {
      ...fixture,
      predictions: sanitizedPredictions,
    };
  }

  /**
   * Apply paywall to a list of fixtures
   */
  filterFixturesList(fixtures: Fixture[], user: AuthUser | null): Fixture[] {
    let globalTipIndex = 0;
    return fixtures.map((f) => {
      const hasPredictions = f.predictions && f.predictions.length > 0;
      const filtered = this.filterFixtureForUser(f, user, globalTipIndex);
      if (hasPredictions) {
        globalTipIndex += 1;
      }
      return filtered;
    });
  }
}

export const accessControlService = new AccessControlService();

