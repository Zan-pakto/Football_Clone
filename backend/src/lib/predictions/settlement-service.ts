import { Fixture, Prediction, PredictionSettlement, SettlementStatus, MarketType } from "../football/types";
import { cacheService } from "../cache/cache-service";

export class SettlementService {
  /**
   * Evaluate a single prediction against final match scores
   */
  evaluatePrediction(
    market: MarketType,
    selection: string,
    homeScore: number,
    awayScore: number
  ): { status: SettlementStatus; actualResult: string } {
    const totalGoals = homeScore + awayScore;
    const isHomeWin = homeScore > awayScore;
    const isAwayWin = awayScore > homeScore;
    const isDraw = homeScore === awayScore;

    const actual1X2 = isHomeWin ? "1" : isAwayWin ? "2" : "X";
    const pickClean = selection.trim();

    // 1. 1X2 Market
    if (market === "1X2" || market === "ONE_X_TWO" as any) {
      if (pickClean.startsWith("1") && !pickClean.includes("X") && isHomeWin) return { status: "WIN", actualResult: actual1X2 };
      if (pickClean.startsWith("2") && isAwayWin) return { status: "WIN", actualResult: actual1X2 };
      if (pickClean.startsWith("X") && isDraw) return { status: "WIN", actualResult: actual1X2 };

      // Double chance support in 1X2
      if (pickClean.includes("1X") && (isHomeWin || isDraw)) return { status: "WIN", actualResult: actual1X2 };
      if (pickClean.includes("X2") && (isAwayWin || isDraw)) return { status: "WIN", actualResult: actual1X2 };
      if (pickClean.includes("12") && (isHomeWin || isAwayWin)) return { status: "WIN", actualResult: actual1X2 };

      return { status: "LOSS", actualResult: actual1X2 };
    }

    // 2. Over / Under Market
    if (market === "OVER_UNDER") {
      const isOver25 = totalGoals > 2.5;
      const isOver15 = totalGoals > 1.5;
      const isOver35 = totalGoals > 3.5;
      const actualOu = totalGoals > 2.5 ? "Over 2.5" : "Under 2.5";

      if (/over 2\.5/i.test(pickClean)) return { status: isOver25 ? "WIN" : "LOSS", actualResult: actualOu };
      if (/under 2\.5/i.test(pickClean)) return { status: !isOver25 ? "WIN" : "LOSS", actualResult: actualOu };
      if (/over 1\.5/i.test(pickClean)) return { status: isOver15 ? "WIN" : "LOSS", actualResult: `${totalGoals} goals` };
      if (/over 3\.5/i.test(pickClean)) return { status: isOver35 ? "WIN" : "LOSS", actualResult: `${totalGoals} goals` };

      return { status: isOver25 ? "WIN" : "LOSS", actualResult: actualOu };
    }

    // 3. BTTS (Both Teams To Score)
    if (market === "BTTS") {
      const bttsActual = homeScore > 0 && awayScore > 0;
      const actualStr = bttsActual ? "Yes" : "No";

      if (/yes/i.test(pickClean)) return { status: bttsActual ? "WIN" : "LOSS", actualResult: actualStr };
      if (/no/i.test(pickClean)) return { status: !bttsActual ? "WIN" : "LOSS", actualResult: actualStr };

      return { status: bttsActual ? "WIN" : "LOSS", actualResult: actualStr };
    }

    // 4. Double Chance
    if (market === "DOUBLE_CHANCE") {
      if (pickClean.includes("1X") && (isHomeWin || isDraw)) return { status: "WIN", actualResult: actual1X2 };
      if (pickClean.includes("X2") && (isAwayWin || isDraw)) return { status: "WIN", actualResult: actual1X2 };
      if (pickClean.includes("12") && (isHomeWin || isAwayWin)) return { status: "WIN", actualResult: actual1X2 };
      return { status: "LOSS", actualResult: actual1X2 };
    }

    return { status: "VOID", actualResult: `${homeScore}-${awayScore}` };
  }

  /**
   * Settle all predictions for a finished fixture (Idempotent)
   */
  async settleFixture(fixture: Fixture): Promise<PredictionSettlement[]> {
    if (fixture.status !== "FINISHED" || fixture.homeScore === null || fixture.homeScore === undefined || fixture.awayScore === null || fixture.awayScore === undefined) {
      return [];
    }

    const homeScore = Number(fixture.homeScore);
    const awayScore = Number(fixture.awayScore);
    const settlements: PredictionSettlement[] = [];

    const predictions = fixture.predictions || [];
    for (const pred of predictions) {
      if (pred.status !== "PENDING" && pred.status) {
        // Already settled (Idempotency check)
        continue;
      }

      const { status, actualResult } = this.evaluatePrediction(pred.market, pred.selection, homeScore, awayScore);
      pred.status = status;

      const record: PredictionSettlement = {
        predictionId: pred.id || `pred_${fixture.id}_${pred.market}`,
        fixtureId: fixture.id,
        market: pred.market,
        selection: pred.selection,
        actualResult,
        settlementStatus: status,
        odds: pred.odd,
        confidence: pred.confidence,
        homeScore,
        awayScore,
        settledAt: new Date().toISOString(),
      };

      settlements.push(record);
    }

    // Invalidate caches
    await cacheService.invalidatePattern(`fixture:*${fixture.id}*`);
    await cacheService.invalidate("track_record_progress");

    return settlements;
  }
}

export const settlementService = new SettlementService();
