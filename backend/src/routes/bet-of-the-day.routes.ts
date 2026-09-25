import { Router, Request, Response } from "express";
import { nerdyTipsScraper, ScrapedMatch } from "../lib/scraper/nerdytips-scraper";
import { authService } from "../lib/auth/auth-service";
import { adjustOdd, adjustRating, adjustConfidence } from "../lib/ai/ai-variance";
import { toCachedLogoUrl } from "../lib/logo-utils";

const router = Router();

function getAuthToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (bearerToken && bearerToken !== "null" && bearerToken !== "undefined" && bearerToken.length > 10) {
    return bearerToken;
  }
  const cookieToken = req.cookies?.auth_token;
  if (cookieToken && cookieToken !== "null" && cookieToken !== "undefined") {
    return cookieToken;
  }
  const queryToken = req.query?.token as string | undefined;
  if (queryToken && queryToken !== "null" && queryToken !== "undefined" && queryToken.length > 10) {
    return queryToken;
  }
  return undefined;
}

// Map day string / alias to NerdyTips dParam
function normalizeDayParam(input: string): string {
  if (!input) return "0";
  const s = input.toLowerCase().trim();
  if (s === "yesterday" || s === "-1") return "-1";
  if (s === "today" || s === "0") return "0";
  if (s === "tomorrow" || s === "1") return "1";
  if (s === "2-days-ago" || s === "-2") return "-2";
  if (s === "3-days-ago" || s === "-3") return "-3";
  if (s === "day-after-tomorrow" || s === "2") return "2";
  if (s === "in-3-days" || s === "3") return "3";
  return input;
}

/**
 * GET /api/bet-of-the-day
 * Query params:
 *   d: "0" | "-1" | "1" | "yesterday" | "tomorrow" etc.
 *   tz: timezone offset in minutes (e.g. 330)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const rawD = (req.query.d as string) || (req.query.day as string) || "0";
    const dParam = normalizeDayParam(rawD);
    const tz = req.query.tz !== undefined ? String(req.query.tz) : undefined;

    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);
    const isPremiumUser = Boolean(user && (user.isPremium || user.role === "ADMIN"));

    const botd = await nerdyTipsScraper.scrapeBetOfTheDay(dParam, tz);

    const applyMatchVariance = (m: ScrapedMatch): ScrapedMatch => {
      const homeOdd = adjustOdd(m.odds.home, `${m.id}_home`);
      const drawOdd = adjustOdd(m.odds.draw, `${m.id}_draw`);
      const awayOdd = adjustOdd(m.odds.away, `${m.id}_away`);
      const rating = adjustRating(m.rating, `${m.id}_rate`) ?? m.rating;
      const confVal = adjustConfidence(m.confidenceValue, `${m.id}_conf`) ?? m.confidenceValue;
      const tipOdds = adjustOdd(m.tipOdds, `${m.id}_best_odd`) ?? m.tipOdds;

      return {
        ...m,
        homeLogo: toCachedLogoUrl(m.homeLogo),
        awayLogo: toCachedLogoUrl(m.awayLogo),
        odds: {
          home: homeOdd,
          draw: drawOdd,
          away: awayOdd,
        },
        rating,
        confidenceValue: confVal,
        confidence: `${confVal}%`,
        tipOdds,
        pickScore: m.pickScore
          ? {
              ...m.pickScore,
              odd: adjustOdd(m.pickScore.odd, `${m.id}_ps_odd`),
              rating: adjustRating(m.pickScore.rating, `${m.id}_ps_rate`),
            }
          : undefined,
        goals: m.goals
          ? {
              ...m.goals,
              odd: adjustOdd(m.goals.odd, `${m.id}_goals_odd`),
              rating: adjustRating(m.goals.rating, `${m.id}_goals_rate`),
            }
          : undefined,
        btts: m.btts
          ? {
              ...m.btts,
              odd: adjustOdd(m.btts.odd, `${m.id}_btts_odd`),
              rating: adjustRating(m.btts.rating, `${m.id}_btts_rate`),
            }
          : undefined,
      };
    };

    const rawBankers = botd.bankers.map(applyMatchVariance);
    const rawSlip = botd.slip.map(applyMatchVariance);

    // Apply premium lock to picks: Pro users see everything, free users see first 2 free
    const bankers = rawBankers.map((m: ScrapedMatch, idx: number) => {
      const isLocked = !isPremiumUser && idx >= 2;
      return {
        ...m,
        isLocked,
        // If locked, mask sensitive predictions for free users
        predictions: isLocked
          ? {
              pickScore: { pick: "•••", odd: null, rating: null },
              goals: { pick: "•••", odd: null, rating: null },
              btts: { pick: "•••", odd: null, rating: null },
              bestTip: { pick: "•••", odd: null, rating: null },
            }
          : {
              pickScore: m.pickScore,
              goals: m.goals,
              btts: m.btts,
              bestTip: { pick: m.bestTip, odd: m.tipOdds, rating: m.rating },
            },
      };
    });

    const slip = rawSlip.map((m: ScrapedMatch, idx: number) => {
      const isLocked = !isPremiumUser && idx >= 2;
      return {
        ...m,
        isLocked,
        predictions: isLocked
          ? {
              pickScore: { pick: "•••", odd: null, rating: null },
              goals: { pick: "•••", odd: null, rating: null },
              btts: { pick: "•••", odd: null, rating: null },
              bestTip: { pick: "•••", odd: null, rating: null },
            }
          : {
              pickScore: m.pickScore,
              goals: m.goals,
              btts: m.btts,
              bestTip: { pick: m.bestTip, odd: m.tipOdds, rating: m.rating },
            },
      };
    });

    // Recompute slip total odds using varied match tip odds
    const adjustedSlipTotalOdds = rawSlip.length > 0
      ? parseFloat(rawSlip.reduce((acc, m) => acc * (m.tipOdds || 1.4), 1).toFixed(2))
      : botd.stats.slip.totalOdds;

    const stats = {
      ...botd.stats,
      slip: {
        ...botd.stats.slip,
        totalOdds: adjustedSlipTotalOdds,
      },
    };

    return res.json({
      success: true,
      date: dParam,
      userTier: isPremiumUser ? "premium" : "free",
      stats,
      bankers,
      slip,
    });
  } catch (err: any) {
    console.error("[BetOfTheDayRoutes] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to load Bet of the Day data",
      message: err.message,
    });
  }
});

/**
 * GET /api/bet-of-the-day/live?ids=1308706,1311701...
 * Real-time scores and status updates for active in-play matches
 */
router.get("/live", async (req: Request, res: Response) => {
  try {
    const idsParam = (req.query.ids as string) || "";
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return res.json({ success: true, ok: true, matches: {} });
    }

    const liveMatches = await nerdyTipsScraper.scrapeBetOfTheDayLive(ids);
    return res.json({
      success: true,
      ok: true,
      matches: liveMatches,
    });
  } catch (err: any) {
    console.error("[BetOfTheDayRoutes] Live updates error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch live match updates",
      message: err.message,
    });
  }
});

export default router;
