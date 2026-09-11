import { Fixture, Prediction } from "../football/types";
import { AuthUser } from "../auth/auth-service";

export const FREE_DAILY_TIPS_LIMIT = 7;

export class AccessControlService {
  /**
   * Apply server-side paywall and daily quota masking to fixture predictions
   */
  filterFixtureForUser(
    fixture: Fixture,
    user: AuthUser | null,
    tipIndexInDailyList: number = 0
  ): Fixture {
    const isPremiumUser = Boolean(user && (user.isPremium || user.role === "ADMIN"));
    const isUnderFreeDailyQuota = tipIndexInDailyList < FREE_DAILY_TIPS_LIMIT;

    const sanitizedPredictions: Prediction[] = (fixture.predictions || []).map((pred) => {
      // 1. Kickoff Lock: If live in-progress and user is not premium, lock prediction
      const isFinished = fixture.status === "FINISHED";

      // Finished matches reveal prediction for transparency
      if (isFinished) {
        return {
          ...pred,
          isLocked: false,
        };
      }

      // If premium tip and user is not premium
      if (pred.isPremium && !isPremiumUser) {
        return {
          ...pred,
          isLocked: true,
          selection: "Premium Prediction", // Safe display label
          probability: null,
          odd: null,
        };
      }

      // If free user exceeded 7 tips/day
      if (!isPremiumUser && !isUnderFreeDailyQuota) {
        return {
          ...pred,
          isLocked: true,
          selection: "Daily Free Limit Reached (7/7)",
          probability: null,
          odd: null,
        };
      }

      // Unlocked
      return {
        ...pred,
        isLocked: false,
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
      const filtered = this.filterFixtureForUser(f, user, globalTipIndex);
      if (f.predictions && f.predictions.length > 0) {
        globalTipIndex += 1;
      }
      return filtered;
    });
  }
}

export const accessControlService = new AccessControlService();
