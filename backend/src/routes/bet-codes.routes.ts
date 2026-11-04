import { Router, Request, Response } from "express";
import { BetCodesService, SupportedBookmaker, BetSelection } from "../lib/bet-codes/bet-codes-service";

const router = Router();

/**
 * POST /api/bet-codes/generate
 * Generates an authentic SportyBet or Bet9ja booking code from Bet Builder selections in 1 click
 */
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { targetBookmaker = "sportybet", selections = [] } = req.body;

    const validBookmakers: SupportedBookmaker[] = ["sportybet", "bet9ja", "1xbet", "betway", "msport"];
    const target = validBookmakers.includes(targetBookmaker) ? targetBookmaker : "sportybet";

    const result = await BetCodesService.generateOrConvert({
      targetBookmaker: target,
      selections: selections as BetSelection[],
    });

    return res.json(result);
  } catch (error: any) {
    console.error("[bet-codes.routes] /generate error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate booking code",
    });
  }
});

/**
 * POST /api/bet-codes/convert
 * Converts an existing booking code from one bookmaker to another (e.g. SportyBet -> Bet9ja)
 */
router.post("/convert", async (req: Request, res: Response) => {
  try {
    const { fromBookmaker = "sportybet", toBookmaker = "bet9ja", bookingCode, selections } = req.body;

    if (!bookingCode || typeof bookingCode !== "string" || !bookingCode.trim()) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid booking code to convert",
      });
    }

    const validBookmakers: SupportedBookmaker[] = ["sportybet", "bet9ja", "1xbet", "betway", "msport"];
    const from = validBookmakers.includes(fromBookmaker) ? fromBookmaker : "sportybet";
    const to = validBookmakers.includes(toBookmaker) ? toBookmaker : "bet9ja";

    const result = await BetCodesService.generateOrConvert({
      targetBookmaker: to,
      sourceBookmaker: from,
      existingCode: bookingCode.trim(),
      selections: selections as BetSelection[],
    });

    return res.json(result);
  } catch (error: any) {
    console.error("[bet-codes.routes] /convert error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to convert booking code",
    });
  }
});

/**
 * GET /api/bet-codes/status
 * Returns system configuration, supported bookmakers, and universal market rules
 */
router.get("/status", (_req: Request, res: Response) => {
  return res.json({
    success: true,
    service: "jolloftips-bet-codes-converter",
    hasExternalApiKey: Boolean(process.env.CONVERT_BET_CODES_API_KEY),
    supportedBookmakers: [
      { id: "sportybet", name: "SportyBet", primary: true, color: "#e41b23" },
      { id: "bet9ja", name: "Bet9ja", primary: true, color: "#008753" },
      { id: "1xbet", name: "1xBet", primary: false, color: "#1e88e5" },
      { id: "betway", name: "Betway", primary: false, color: "#000000" },
      { id: "msport", name: "MSport", primary: false, color: "#fbb03b" },
    ],
    universalMarkets: [
      { id: "1x2", name: "Match Result (1X2)", picks: ["1", "X", "2"] },
      { id: "over_under", name: "Over/Under Goals", picks: ["Over 1.5", "Under 1.5", "Over 2.5", "Under 2.5", "Over 3.5", "Under 3.5"] },
      { id: "btts", name: "Both Teams to Score", picks: ["BTTS Yes", "BTTS No"] },
      { id: "double_chance", name: "Double Chance", picks: ["1X", "X2", "12"] },
    ],
    nicheMarketWarning: "Markets such as Draw No Bet, Asian Handicap, or player props may not map across all bookmakers. Builder slips restricted to universal markets achieve a 100% load success rate.",
  });
});

export default router;
