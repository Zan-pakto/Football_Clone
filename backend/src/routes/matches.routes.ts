import { Router, Request, Response } from "express";
import { store } from "../lib/db/store";
import { fixtureService } from "../lib/football/fixture-service";
import { authService } from "../lib/auth/auth-service";
import { accessControlService, FREE_DAILY_TIPS_LIMIT } from "../lib/subscriptions/access-service";
import { MatchData, LiveMatchUpdate } from "../lib/types";

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

// GET /api/matches/live
router.get("/live", async (req: Request, res: Response) => {
  try {
    const d = (req.query.d as string) ?? "0";
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);
    const isPremiumUser = Boolean(user && (user.isPremium || user.role === "ADMIN"));

    const rawLiveFixtures = await fixtureService.getLiveFixtures();
    const sanitizedFixtures = accessControlService.filterFixturesList(rawLiveFixtures, user);

    const convertedMatches: MatchData[] = sanitizedFixtures.map((f, idx) => {
      const p1x2 = f.predictions?.find((p) => p.market === "1X2" || p.market === "DOUBLE_CHANCE");
      const pGoals = f.predictions?.find((p) => p.market === "OVER_UNDER");
      const pBtts = f.predictions?.find((p) => p.market === "BTTS");
      const pBest = f.predictions && f.predictions.length > 0
        ? [...f.predictions].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]
        : null;

      const isMatchLocked = Boolean(
        pBest?.isLocked ||
        (f.predictions && f.predictions.length > 0 && f.predictions.every((p) => p.isLocked))
      );

      const lockReason = pBest?.lockReason || (f.predictions && f.predictions[0]?.lockReason) || (isMatchLocked ? "live_kickoff_locked" : null);

      const topConfidence = f.predictions && f.predictions.length > 0 && !isMatchLocked
        ? Math.max(...f.predictions.map((p) => p.confidence || 80))
        : null;

      return {
        id: f.id,
        url: `/match/${f.id}`,
        leagueName: f.league?.name || "League",
        country: f.league?.country?.name || "World",
        flagUrl: f.league?.country?.flag || null,
        homeTeam: f.homeTeam.name,
        awayTeam: f.awayTeam.name,
        homeLogo: f.homeTeam.logo || null,
        awayLogo: f.awayTeam.logo || null,
        kickTime: f.kickoffTime ? new Date(f.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
        status: f.status === "LIVE" ? "live" : f.status === "FINISHED" ? "won" : "upcoming",
        homeScore: f.homeScore !== null && f.homeScore !== undefined ? String(f.homeScore) : null,
        awayScore: f.awayScore !== null && f.awayScore !== undefined ? String(f.awayScore) : null,
        elapsed: f.elapsed,
        isLive: true,
        isLocked: isMatchLocked,
        lockReason,
        freeTipIndex: idx,
        odds: {
          home: f.odds?.home ? String(f.odds.home) : "1.75",
          draw: f.odds?.draw ? String(f.odds.draw) : "3.50",
          away: f.odds?.away ? String(f.odds.away) : "4.20",
        },
        predictions: {
          pickScore: {
            pick: p1x2?.isLocked ? null : (p1x2?.selection || null),
            odd: p1x2?.isLocked ? null : (p1x2?.odd ? String(p1x2.odd) : null),
            isLocked: Boolean(p1x2?.isLocked),
          },
          goals: {
            pick: pGoals?.isLocked ? null : (pGoals?.selection || null),
            odd: pGoals?.isLocked ? null : (pGoals?.odd ? String(pGoals.odd) : null),
            isLocked: Boolean(pGoals?.isLocked),
          },
          btts: {
            pick: pBtts?.isLocked ? null : (pBtts?.selection || null),
            odd: pBtts?.isLocked ? null : (pBtts?.odd ? String(pBtts.odd) : null),
            isLocked: Boolean(pBtts?.isLocked),
          },
          bestTip: {
            pick: pBest?.isLocked ? null : (pBest?.selection || p1x2?.selection || null),
            odd: pBest?.isLocked ? null : (pBest?.odd ? String(pBest.odd) : p1x2?.odd ? String(p1x2.odd) : null),
            isLocked: Boolean(pBest?.isLocked),
          },
        },
        confidence: topConfidence ? `${topConfidence}%` : (isMatchLocked ? null : "84%"),
      };
    });

    // Create live updates map
    const liveUpdates: Record<string, LiveMatchUpdate> = {};
    convertedMatches.forEach((m) => {
      liveUpdates[m.id] = {
        id: m.id,
        status: m.status,
        elapsed: m.elapsed || "LIVE",
        homeScore: m.homeScore !== null ? Number(m.homeScore) : undefined,
        awayScore: m.awayScore !== null ? Number(m.awayScore) : undefined,
      };
    });

    return res.json({
      success: true,
      type: "live",
      d,
      count: convertedMatches.length,
      userTier: isPremiumUser ? "premium" : "free",
      freeTipsLimit: FREE_DAILY_TIPS_LIMIT,
      freeTipsUsed: isPremiumUser ? 0 : Math.min(convertedMatches.length, FREE_DAILY_TIPS_LIMIT),
      matches: convertedMatches,
      liveUpdates,
    });
  } catch (error: any) {
    console.error("GET /api/matches/live error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch live matches",
    });
  }
});

// POST /api/matches/live
router.post("/live", async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const d = body.d || "0";
    const updates: Record<string, LiveMatchUpdate> = body.updates || {};

    if (Object.keys(updates).length > 0) {
      await store.applyLiveUpdates(updates, d);
    }

    return res.json({
      success: true,
      d,
      updatedCount: Object.keys(updates).length,
      message: `Applied ${Object.keys(updates).length} live match updates`,
    });
  } catch (error: any) {
    console.error("POST /api/matches/live error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to apply live updates",
    });
  }
});

// GET /api/matches
router.get("/", async (req: Request, res: Response) => {
  try {
    const d = (req.query.d as string) ?? "0";
    const country = (req.query.country as string) ?? undefined;
    const league = (req.query.league as string) ?? undefined;
    const status = (req.query.status as string) ?? undefined;
    const search = (req.query.search as string) ?? undefined;

    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);
    const isPremiumUser = Boolean(user && (user.isPremium || user.role === "ADMIN"));

    const fixtures = await fixtureService.getFixtures(d, { country, league, status: status as any, search });
    const sanitizedFixtures = accessControlService.filterFixturesList(fixtures, user);

    const convertedMatches: MatchData[] = sanitizedFixtures.map((f, idx) => {
      const p1x2 = f.predictions?.find((p) => p.market === "1X2" || p.market === "DOUBLE_CHANCE");
      const pGoals = f.predictions?.find((p) => p.market === "OVER_UNDER");
      const pBtts = f.predictions?.find((p) => p.market === "BTTS");
      const pBest = f.predictions && f.predictions.length > 0
        ? [...f.predictions].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]
        : null;

      const isMatchLocked = Boolean(
        pBest?.isLocked ||
        (f.predictions && f.predictions.length > 0 && f.predictions.every((p) => p.isLocked))
      );

      const lockReason = pBest?.lockReason || (f.predictions && f.predictions[0]?.lockReason) || (isMatchLocked ? "free_limit_reached" : null);

      const topConfidence = f.predictions && f.predictions.length > 0 && !isMatchLocked
        ? Math.max(...f.predictions.map((p) => p.confidence || 80))
        : null;

      return {
        id: f.id,
        url: `/match/${f.id}`,
        leagueName: f.league?.name || "League",
        country: f.league?.country?.name || "World",
        flagUrl: f.league?.country?.flag || null,
        homeTeam: f.homeTeam.name,
        awayTeam: f.awayTeam.name,
        homeLogo: f.homeTeam.logo || null,
        awayLogo: f.awayTeam.logo || null,
        kickTime: f.kickoffTime ? new Date(f.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
        status: f.status === "LIVE" ? "live" : f.status === "FINISHED" ? "won" : "upcoming",
        homeScore: f.homeScore !== null && f.homeScore !== undefined ? String(f.homeScore) : null,
        awayScore: f.awayScore !== null && f.awayScore !== undefined ? String(f.awayScore) : null,
        elapsed: f.elapsed,
        isLive: f.status === "LIVE",
        isLocked: isMatchLocked,
        lockReason,
        freeTipIndex: idx,
        odds: {
          home: f.odds?.home ? String(f.odds.home) : "1.75",
          draw: f.odds?.draw ? String(f.odds.draw) : "3.50",
          away: f.odds?.away ? String(f.odds.away) : "4.20",
        },
        predictions: {
          pickScore: {
            pick: p1x2?.isLocked ? null : (p1x2?.selection || null),
            odd: p1x2?.isLocked ? null : (p1x2?.odd ? String(p1x2.odd) : null),
            isLocked: Boolean(p1x2?.isLocked),
          },
          goals: {
            pick: pGoals?.isLocked ? null : (pGoals?.selection || null),
            odd: pGoals?.isLocked ? null : (pGoals?.odd ? String(pGoals.odd) : null),
            isLocked: Boolean(pGoals?.isLocked),
          },
          btts: {
            pick: pBtts?.isLocked ? null : (pBtts?.selection || null),
            odd: pBtts?.isLocked ? null : (pBtts?.odd ? String(pBtts.odd) : null),
            isLocked: Boolean(pBtts?.isLocked),
          },
          bestTip: {
            pick: pBest?.isLocked ? null : (pBest?.selection || p1x2?.selection || null),
            odd: pBest?.isLocked ? null : (pBest?.odd ? String(pBest.odd) : p1x2?.odd ? String(p1x2.odd) : null),
            isLocked: Boolean(pBest?.isLocked),
          },
        },
        confidence: topConfidence ? `${topConfidence}%` : (isMatchLocked ? null : "84%"),
      };
    });

    return res.json({
      success: true,
      type: "all",
      d,
      count: convertedMatches.length,
      userTier: isPremiumUser ? "premium" : "free",
      freeTipsLimit: FREE_DAILY_TIPS_LIMIT,
      freeTipsUsed: isPremiumUser ? 0 : Math.min(convertedMatches.length, FREE_DAILY_TIPS_LIMIT),
      lastSyncedAt: new Date().toISOString(),
      matches: convertedMatches,
    });
  } catch (error: any) {
    console.error("GET /api/matches error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch matches",
    });
  }
});

// POST /api/matches
router.post("/", async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const d = body.d || "0";
    const matches: MatchData[] = Array.isArray(body.matches) ? body.matches : [];

    if (matches.length > 0) {
      await store.saveMatches(matches, d);
    }

    return res.json({
      success: true,
      d,
      count: matches.length,
      message: `Successfully ingested ${matches.length} matches`,
    });
  } catch (error: any) {
    console.error("POST /api/matches error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to ingest matches",
    });
  }
});

export default router;

