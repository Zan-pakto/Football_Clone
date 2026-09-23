import { Router, Request, Response } from "express";
import { authService } from "../lib/auth/auth-service";
import { store } from "../lib/db/store";
import { nerdyTipsScraper, HitAndWinMatch, HitAndWinSlip } from "../lib/scraper/nerdytips-scraper";

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

// GET /api/hitandwin - Fetch current 10 matches, user status, and slips
router.get("/", async (req: Request, res: Response) => {
  try {
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);
    const isPremiumUser = Boolean(user && (user.isPremium || user.role === "ADMIN"));

    const allowedSlips = isPremiumUser ? 4 : 1;
    const userTier = isPremiumUser ? "premium" : "free";

    // 1. Scrape / load 10 matches
    const matches: HitAndWinMatch[] = await nerdyTipsScraper.scrapeHitAndWinMatches();

    // 2. Fetch user's historical slips
    let slips: HitAndWinSlip[] = [];
    if (user?.id) {
      slips = await store.getUserHitAndWinSlips(user.id);
    }

    // Slips placed today
    const todayStr = new Date().toISOString().slice(0, 10);
    const slipsToday = slips.filter((s) => s.createdAt.startsWith(todayStr));

    return res.json({
      success: true,
      matches,
      userTier,
      allowedSlips,
      usedSlipsToday: slipsToday.length,
      remainingSlips: Math.max(0, allowedSlips - slipsToday.length),
      slips,
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            isPremium: isPremiumUser,
          }
        : null,
    });
  } catch (error: any) {
    console.error("GET /api/hitandwin error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch Hit&Win data",
    });
  }
});

// POST /api/hitandwin/slip - Submit a 10-match prediction slip
router.post("/slip", async (req: Request, res: Response) => {
  try {
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Please log in to submit your Hit&Win prediction slip.",
      });
    }

    const isPremiumUser = Boolean(user.isPremium || user.role === "ADMIN");
    const allowedSlips = isPremiumUser ? 4 : 1;

    // Check user's daily quota
    const existingSlips: HitAndWinSlip[] = await store.getUserHitAndWinSlips(user.id);
    const todayStr = new Date().toISOString().slice(0, 10);
    const slipsToday = existingSlips.filter((s) => s.createdAt.startsWith(todayStr));

    if (slipsToday.length >= allowedSlips) {
      return res.status(400).json({
        success: false,
        error: `Daily limit reached (${slipsToday.length}/${allowedSlips} slips used today). Upgrade to PRO for 4 slips daily!`,
      });
    }

    const { picks } = req.body || {};
    if (!picks || typeof picks !== "object") {
      return res.status(400).json({
        success: false,
        error: "Invalid predictions format. Please provide selections for all 10 matches.",
      });
    }

    // Load matches to validate
    const matches: HitAndWinMatch[] = await nerdyTipsScraper.scrapeHitAndWinMatches();
    if (Object.keys(picks).length < 10) {
      return res.status(400).json({
        success: false,
        error: `Incomplete slip: ${Object.keys(picks).length}/10 matches predicted. All 10 matches are required.`,
      });
    }

    const slipPicks = matches.map((m) => {
      const userPick = picks[m.id] as "1" | "X" | "2";
      const validPick = userPick === "1" || userPick === "X" || userPick === "2" ? userPick : "1";
      const oddVal = m.odds[validPick] || "2.00";

      return {
        matchId: m.id,
        index: m.index,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        time: m.time,
        pick: validPick,
        odd: oddVal,
        status: "PENDING" as const,
        score: null,
      };
    });

    const slipId = `slip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSlip: HitAndWinSlip = {
      id: slipId,
      userId: user.id,
      slipNumber: existingSlips.length + 1,
      createdAt: new Date().toISOString(),
      status: "PENDING",
      correctCount: 0,
      totalMatches: 10,
      picks: slipPicks,
    };

    await store.saveHitAndWinSlip(newSlip);

    return res.json({
      success: true,
      message: "Slip placed successfully! Good luck in winning your Lifetime Subscription.",
      slip: newSlip,
      usedSlipsToday: slipsToday.length + 1,
      allowedSlips,
      remainingSlips: Math.max(0, allowedSlips - (slipsToday.length + 1)),
    });
  } catch (error: any) {
    console.error("POST /api/hitandwin/slip error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to submit Hit&Win slip",
    });
  }
});

export default router;
