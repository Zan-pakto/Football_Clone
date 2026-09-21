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

function buildMatchPredictions(f: any, isMatchLocked: boolean) {
  const p1x2 = f.predictions?.find((p: any) => p.market === "1X2" || p.market === "DOUBLE_CHANCE");
  const pGoals = f.predictions?.find((p: any) => p.market === "OVER_UNDER");
  const pBtts = f.predictions?.find((p: any) => p.market === "BTTS");
  const pBest = f.predictions && f.predictions.length > 0
    ? [...f.predictions].sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0))[0]
    : null;

  const isGoalsBest = Boolean(pBest && pBest.market === "OVER_UNDER");
  const isBttsBest = Boolean(pBest && pBest.market === "BTTS");
  const is1x2Best = Boolean(pBest ? (!isGoalsBest && !isBttsBest) : true);
  const bestMarket = isGoalsBest ? "goals" : isBttsBest ? "btts" : "pickScore";
  const bestMarketLabel = isGoalsBest ? "O/U Goals" : isBttsBest ? "BTTS" : "1X2 Winner";

  return {
    predictions: {
      pickScore: {
        pick: p1x2?.isLocked ? null : (p1x2?.selection || null),
        odd: p1x2?.isLocked ? null : (p1x2?.odd ? String(p1x2.odd) : null),
        isLocked: Boolean(p1x2?.isLocked),
        market: "1X2",
        marketLabel: "1X2 Winner",
        confidence: p1x2?.confidence || null,
        rating: p1x2?.confidence ? Number((p1x2.confidence / 10).toFixed(1)) : null,
        isBest: is1x2Best,
      },
      goals: {
        pick: pGoals?.isLocked ? null : (pGoals?.selection || null),
        odd: pGoals?.isLocked ? null : (pGoals?.odd ? String(pGoals.odd) : null),
        isLocked: Boolean(pGoals?.isLocked),
        market: "OVER_UNDER",
        marketLabel: "O/U Goals",
        confidence: pGoals?.confidence || null,
        rating: pGoals?.confidence ? Number((pGoals.confidence / 10).toFixed(1)) : null,
        isBest: isGoalsBest,
      },
      btts: {
        pick: pBtts?.isLocked ? null : (pBtts?.selection || null),
        odd: pBtts?.isLocked ? null : (pBtts?.odd ? String(pBtts.odd) : null),
        isLocked: Boolean(pBtts?.isLocked),
        market: "BTTS",
        marketLabel: "Both Teams Score",
        confidence: pBtts?.confidence || null,
        rating: pBtts?.confidence ? Number((pBtts.confidence / 10).toFixed(1)) : null,
        isBest: isBttsBest,
      },
      bestTip: {
        pick: pBest?.isLocked ? null : (pBest?.selection || p1x2?.selection || null),
        odd: pBest?.isLocked ? null : (pBest?.odd ? String(pBest.odd) : p1x2?.odd ? String(p1x2.odd) : null),
        isLocked: Boolean(pBest?.isLocked),
        market: pBest?.market || "1X2",
        marketLabel: bestMarketLabel,
        confidence: pBest?.confidence || null,
        rating: pBest?.confidence ? Number((pBest.confidence / 10).toFixed(1)) : 8.5,
        isBest: true,
      },
      bestMarket,
    },
    topConfidence: pBest?.confidence || (f.predictions && f.predictions.length > 0 ? Math.max(...f.predictions.map((p: any) => p.confidence || 80)) : 84),
  };
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
      const isMatchLocked = Boolean(
        f.predictions && f.predictions.length > 0 && f.predictions.every((p) => p.isLocked)
      );

      const pBest = f.predictions && f.predictions.length > 0
        ? [...f.predictions].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]
        : null;

      const lockReason = pBest?.lockReason || (f.predictions && f.predictions[0]?.lockReason) || (isMatchLocked ? "live_kickoff_locked" : null);

      const { predictions, topConfidence } = buildMatchPredictions(f, isMatchLocked);

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
        predictions,
        confidence: topConfidence ? `${topConfidence}%` : (isMatchLocked ? null : "84%"),
        predictedScore: f.predictedScore || null,
        expectedGoals: f.expectedGoals || null,
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
    const tz = (req.query.tz as string) || (req.headers["x-timezone-offset"] as string) || process.env.TIMEZONE_OFFSET || "330";
    const country = (req.query.country as string) ?? undefined;
    const league = (req.query.league as string) ?? undefined;
    const status = (req.query.status as string) ?? undefined;
    const search = (req.query.search as string) ?? undefined;

    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);
    const isPremiumUser = Boolean(user && (user.isPremium || user.role === "ADMIN"));

    const forceSync = req.query.sync === "true" || req.query.refresh === "true";
    if (forceSync) {
      try {
        const { nerdyTipsScraper } = await import("../lib/scraper/nerdytips-scraper");
        const { normalizeScrapedMatchToMatchData } = await import("../lib/scraper/nerdytips-normalizer");
        const fresh = await nerdyTipsScraper.scrapeDay(d, null, tz);
        if (fresh.length > 0) {
          const normalized = fresh.map(normalizeScrapedMatchToMatchData);
          await store.saveMatches(normalized, d);
        }
      } catch (e: any) {
        console.warn("[MatchesRoute] Force sync notice:", e.message);
      }
    }

    // 1. Check if we have high-volume synchronized matches in store
    const storeData = await store.getMatches(d, undefined, tz);
    let convertedMatches: MatchData[] = [];

    if (storeData && storeData.matches && storeData.matches.length > 0) {
      let filtered = storeData.matches;
      if (country) {
        filtered = filtered.filter((m) => m.country.toLowerCase().includes(country.toLowerCase()));
      }
      if (league) {
        filtered = filtered.filter((m) => m.leagueName.toLowerCase().includes(league.toLowerCase()));
      }
      if (status) {
        const sLower = status.toLowerCase();
        filtered = filtered.filter((m) => m.status.toLowerCase() === sLower);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.homeTeam.toLowerCase().includes(q) ||
            m.awayTeam.toLowerCase().includes(q) ||
            m.leagueName.toLowerCase().includes(q) ||
            m.country.toLowerCase().includes(q)
        );
      }

      // Apply subscription tier lock (free users get first FREE_DAILY_TIPS_LIMIT unlocked)
      convertedMatches = filtered.map((m, idx) => {
        const isLocked = !isPremiumUser && idx >= FREE_DAILY_TIPS_LIMIT;
        return {
          ...m,
          isLocked,
          lockReason: isLocked ? "free_limit_reached" : (m.isLocked ? "premium_exclusive" : null),
          predictions: {
            ...m.predictions,
            bestTip: {
              ...m.predictions.bestTip,
              pick: isLocked ? null : m.predictions.bestTip.pick,
              odd: isLocked ? null : m.predictions.bestTip.odd,
              isLocked,
            },
          },
        };
      });
    } else {
      // 2. Fallback to fixtureService (Bzzoiro API)
      const fixtures = await fixtureService.getFixtures(d, { country, league, status: status as any, search });
      const sanitizedFixtures = accessControlService.filterFixturesList(fixtures, user);

      convertedMatches = sanitizedFixtures.map((f, idx) => {
        const isMatchLocked = Boolean(
          f.predictions && f.predictions.length > 0 && f.predictions.every((p) => p.isLocked)
        );

        const pBest = f.predictions && f.predictions.length > 0
          ? [...f.predictions].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]
          : null;

        const lockReason = pBest?.lockReason || (f.predictions && f.predictions[0]?.lockReason) || (isMatchLocked ? "free_limit_reached" : null);
        const { predictions, topConfidence } = buildMatchPredictions(f, isMatchLocked);

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
          predictions,
          confidence: topConfidence ? `${topConfidence}%` : (isMatchLocked ? null : "84%"),
          predictedScore: f.predictedScore || null,
          expectedGoals: f.expectedGoals || null,
        };
      });
    }


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

