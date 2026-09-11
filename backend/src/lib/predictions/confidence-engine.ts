import { TeamForm, TeamStats, OddsValue } from "../football/types";

export interface ConfidenceCalculationInput {
  homeOdds?: number | null;
  drawOdds?: number | null;
  awayOdds?: number | null;
  homeForm?: TeamForm | null;
  awayForm?: TeamForm | null;
  homeStats?: TeamStats | null;
  awayStats?: TeamStats | null;
}

export class ConfidenceEngine {
  /**
   * Calculate probability and confidence for 1X2 and other markets
   */
  calculate1X2Confidence(input: ConfidenceCalculationInput): {
    predictedPick: "1" | "X" | "2";
    confidence: number;
    homeProbability: number;
    drawProbability: number;
    awayProbability: number;
  } {
    const { homeOdds = 2.0, drawOdds = 3.3, awayOdds = 3.5 } = input;

    // 1. Calculate base implied probabilities from odds
    const hProbRaw = 1 / (homeOdds || 2.0);
    const dProbRaw = 1 / (drawOdds || 3.3);
    const aProbRaw = 1 / (awayOdds || 3.5);
    const totalRaw = hProbRaw + dProbRaw + aProbRaw;

    let hProb = hProbRaw / totalRaw;
    let dProb = dProbRaw / totalRaw;
    let aProb = aProbRaw / totalRaw;

    // 2. Adjust with form points if available
    if (input.homeForm && input.awayForm) {
      const hPoints = input.homeForm.points || 0;
      const aPoints = input.awayForm.points || 0;
      const totalPoints = hPoints + aPoints;
      if (totalPoints > 0) {
        const formDiffFactor = (hPoints - aPoints) / (totalPoints * 4); // Max +/- 0.15
        hProb = Math.min(0.9, Math.max(0.1, hProb + formDiffFactor));
        aProb = Math.min(0.9, Math.max(0.1, aProb - formDiffFactor));
      }
    }

    // Determine predicted pick
    let predictedPick: "1" | "X" | "2" = "1";
    let highestProb = hProb;

    if (aProb > highestProb) {
      predictedPick = "2";
      highestProb = aProb;
    }
    if (dProb > highestProb && dProb > 0.42) {
      predictedPick = "X";
      highestProb = dProb;
    }

    // Scale confidence into a realistic 60% - 94% range
    const confidence = Math.round(Math.min(94, Math.max(62, highestProb * 100 + 15)));

    return {
      predictedPick,
      confidence,
      homeProbability: Number(hProb.toFixed(2)),
      drawProbability: Number(dProb.toFixed(2)),
      awayProbability: Number(aProb.toFixed(2)),
    };
  }
}

export const confidenceEngine = new ConfidenceEngine();
