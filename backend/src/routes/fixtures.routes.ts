import { Router, Request, Response } from "express";
import { fixtureService } from "../lib/football/fixture-service";
import { authService } from "../lib/auth/auth-service";
import { accessControlService } from "../lib/subscriptions/access-service";

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

// GET /api/fixtures/live
router.get("/live", async (req: Request, res: Response) => {
  try {
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);

    const liveFixtures = await fixtureService.getLiveFixtures();
    const sanitized = accessControlService.filterFixturesList(liveFixtures, user);

    return res.json({
      success: true,
      count: sanitized.length,
      matches: sanitized,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/fixtures/track-record
router.get("/track-record", async (_req: Request, res: Response) => {
  try {
    const data = await fixtureService.getSettledTrackRecord();
    return res.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/fixtures
router.get("/", async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || (req.query.d as string) || "0";
    const tz = (req.query.tz as string) || (req.headers["x-timezone-offset"] as string) || process.env.TIMEZONE_OFFSET || "330";
    const country = (req.query.country as string) || undefined;
    const league = (req.query.league as string) || undefined;
    const status = (req.query.status as any) || undefined;
    const search = (req.query.search as string) || undefined;
    const isGrouped = req.query.grouped !== "false";

    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);

    // 1. Check if high-volume synchronized matches exist in store
    const { store } = await import("../lib/db/store");
    const storeData = await store.getMatches(date, undefined, tz);

    if (storeData && storeData.matches && storeData.matches.length > 0) {
      let filtered = storeData.matches;
      if (country) filtered = filtered.filter((m) => m.country.toLowerCase().includes(country.toLowerCase()));
      if (league) filtered = filtered.filter((m) => m.leagueName.toLowerCase().includes(league.toLowerCase()));
      if (status) filtered = filtered.filter((m) => m.status.toLowerCase() === status.toLowerCase());
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

      const fixtures = filtered.map((m) => {
        const statusUpper =
          m.status === "won" || m.status === "lost" || m.status === "finished"
            ? "FINISHED"
            : m.status === "live"
            ? "LIVE"
            : "UPCOMING";

        return {
          id: m.id,
          externalId: m.id,
          leagueId: m.leagueId || m.leagueName,
          league: {
            id: m.leagueId || m.leagueName,
            name: m.leagueName,
            externalId: m.leagueName,
            isActive: true,
            country: {
              id: m.country.toLowerCase().replace(/\s+/g, "-"),
              name: m.country,
              flag: m.flagUrl,
            },
          },
          homeTeam: {
            id: m.homeTeam,
            name: m.homeTeam,
            externalId: m.homeTeam,
          },
          awayTeam: {
            id: m.awayTeam,
            name: m.awayTeam,
            externalId: m.awayTeam,
          },
          matchDate: m.matchDate || new Date().toISOString().split("T")[0],
          kickoffTime: m.kickTime || "00:00",
          status: statusUpper as any,
          homeScore: m.homeScore !== null && m.homeScore !== undefined ? parseInt(m.homeScore, 10) : null,
          awayScore: m.awayScore !== null && m.awayScore !== undefined ? parseInt(m.awayScore, 10) : null,
          odds: {
            home: m.odds.home ? parseFloat(m.odds.home) : 1.85,
            draw: m.odds.draw ? parseFloat(m.odds.draw) : 3.4,
            away: m.odds.away ? parseFloat(m.odds.away) : 3.8,
            bookmaker: "Consensus",
          },
          rating: m.rating || m.predictions?.bestTip?.rating || (m.confidence ? parseFloat(m.confidence.replace('%', '')) / 10 : 8.0),
          confidence: m.confidence || `${Math.round((m.rating || 8.0) * 10)}%`,
          predictions: [
            {
              fixtureId: m.id,
              market: "1X2" as any,
              selection: m.predictions?.pickScore?.pick || "1",
              confidence: m.predictions?.pickScore?.confidence || 70,
              rating: m.predictions?.pickScore?.rating || 7.0,
              odd: m.predictions?.pickScore?.odd ? parseFloat(m.predictions.pickScore.odd) : 1.85,
              isPremium: false,
              status: (statusUpper === "FINISHED" ? (m.status === "won" ? "WIN" : "LOSS") : "PENDING") as any,
              source: "NERDYTIPS_AI",
            },
            {
              fixtureId: m.id,
              market: "OVER_UNDER" as any,
              selection: m.predictions?.goals?.pick || "Over 2.5",
              confidence: m.predictions?.goals?.confidence || 70,
              rating: m.predictions?.goals?.rating || 7.0,
              odd: m.predictions?.goals?.odd ? parseFloat(m.predictions.goals.odd) : 1.75,
              isPremium: false,
              status: (statusUpper === "FINISHED" ? (m.status === "won" ? "WIN" : "LOSS") : "PENDING") as any,
              source: "NERDYTIPS_AI",
            },
            {
              fixtureId: m.id,
              market: "BTTS" as any,
              selection: m.predictions?.btts?.pick || "Yes",
              confidence: m.predictions?.btts?.confidence || 68,
              rating: m.predictions?.btts?.rating || 6.8,
              odd: m.predictions?.btts?.odd ? parseFloat(m.predictions.btts.odd) : 1.80,
              isPremium: Boolean(m.isLocked),
              status: (statusUpper === "FINISHED" ? (m.status === "won" ? "WIN" : "LOSS") : "PENDING") as any,
              source: "NERDYTIPS_AI",
            },
            {
              fixtureId: m.id,
              market: (m.predictions?.bestTip?.market === "goals" ? "OVER_UNDER" : m.predictions?.bestTip?.market === "btts" ? "BTTS" : "1X2") as any,
              selection: m.predictions?.bestTip?.pick || "1",
              confidence: m.predictions?.bestTip?.confidence || (m.rating ? Math.round(m.rating * 10) : 80),
              rating: m.predictions?.bestTip?.rating || m.rating || 8.0,
              odd: m.predictions?.bestTip?.odd ? parseFloat(m.predictions.bestTip.odd) : 1.85,
              isPremium: Boolean(m.isLocked),
              isBest: true,
              status: (statusUpper === "FINISHED" ? (m.status === "won" ? "WIN" : "LOSS") : "PENDING") as any,
              source: "NERDYTIPS_AI",
            },
          ],
        };
      });

      const sanitizedFixtures = accessControlService.filterFixturesList(fixtures as any, user);

      if (isGrouped) {
        const groupMap = new Map<string, any>();
        for (const f of sanitizedFixtures) {
          const key = `${f.league?.country?.name || "World"} - ${f.league?.name || "League"}`;
          if (!groupMap.has(key)) {
            groupMap.set(key, {
              league: f.league,
              country: f.league?.country,
              fixtures: [],
            });
          }
          groupMap.get(key)!.fixtures.push(f);
        }

        const groups = Array.from(groupMap.values());
        return res.json({
          success: true,
          date,
          groups,
          totalMatches: sanitizedFixtures.length,
        });
      }

      return res.json({
        success: true,
        date,
        count: sanitizedFixtures.length,
        matches: sanitizedFixtures,
      });
    }

    // 2. Fallback to fixtureService (Bzzoiro API)
    if (isGrouped) {
      const groups = await fixtureService.getGroupedFixtures(date, { date, country, league, status, search });

      const sanitizedGroups = groups.map((g) => ({
        ...g,
        fixtures: accessControlService.filterFixturesList(g.fixtures, user),
      }));

      return res.json({
        success: true,
        date,
        groups: sanitizedGroups,
        totalMatches: sanitizedGroups.reduce((acc, g) => acc + g.fixtures.length, 0),
      });
    }

    const flatFixtures = await fixtureService.getFixtures(date, { date, country, league, status, search });
    const sanitizedFixtures = accessControlService.filterFixturesList(flatFixtures, user);

    return res.json({
      success: true,
      date,
      count: sanitizedFixtures.length,
      matches: sanitizedFixtures,
    });

  } catch (error: any) {
    console.error("GET /api/fixtures error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/fixtures/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);

    let fixture = await fixtureService.getFixtureById(id);

    // If not found in Bzzoiro, look for it in the synchronized store
    if (!fixture) {
      const { store } = await import("../lib/db/store");
      const storeMatch = await store.findMatchById(id);

      if (storeMatch) {
        fixture = {
          id: storeMatch.id,
          externalId: storeMatch.id,
          leagueId: storeMatch.leagueId || storeMatch.leagueName,
          league: {
            id: storeMatch.leagueId || storeMatch.leagueName,
            name: storeMatch.leagueName,
            externalId: storeMatch.leagueName,
            isActive: true,
            country: {
              id: storeMatch.country.toLowerCase().replace(/\s+/g, "-"),
              name: storeMatch.country,
              flag: storeMatch.flagUrl,
            },
          },
          homeTeamId: storeMatch.homeTeam,
          awayTeamId: storeMatch.awayTeam,
          homeTeam: {
            id: storeMatch.homeTeam,
            name: storeMatch.homeTeam,
            externalId: storeMatch.homeTeam,
          },
          awayTeam: {
            id: storeMatch.awayTeam,
            name: storeMatch.awayTeam,
            externalId: storeMatch.awayTeam,
          },

          matchDate: storeMatch.matchDate || new Date().toISOString().split("T")[0],
          kickoffTime: storeMatch.kickTime || "00:00",
          status: (storeMatch.status === "won" || storeMatch.status === "lost" || storeMatch.status === "finished"
            ? "FINISHED"
            : storeMatch.status === "live"
            ? "LIVE"
            : "UPCOMING") as any,
          homeScore: storeMatch.homeScore !== null && storeMatch.homeScore !== undefined ? parseInt(storeMatch.homeScore, 10) : null,
          awayScore: storeMatch.awayScore !== null && storeMatch.awayScore !== undefined ? parseInt(storeMatch.awayScore, 10) : null,
          odds: {
            home: storeMatch.odds.home ? parseFloat(storeMatch.odds.home) : 1.85,
            draw: storeMatch.odds.draw ? parseFloat(storeMatch.odds.draw) : 3.4,
            away: storeMatch.odds.away ? parseFloat(storeMatch.odds.away) : 3.8,
            bookmaker: "Consensus",
          },
          predictions: [
            {
              fixtureId: storeMatch.id,
              market: "1X2" as any,
              selection: storeMatch.predictions?.bestTip?.pick || "1",
              confidence: storeMatch.predictions?.bestTip?.confidence || 75,
              odd: storeMatch.predictions?.bestTip?.odd ? parseFloat(storeMatch.predictions.bestTip.odd) : 1.85,
              isPremium: Boolean(storeMatch.isLocked),
              status: (storeMatch.status === "won" ? "WIN" : storeMatch.status === "lost" ? "LOSS" : "PENDING") as any,
              source: "NERDYTIPS_AI",
            },
          ],
        };
      }
    }

    // Fetch match details directly from NerdyTips scraper
    let matchDetails: any = null;
    const { nerdyTipsScraper } = await import("../lib/scraper/nerdytips-scraper");
    try {
      matchDetails = await nerdyTipsScraper.getMatchDetails(id);
    } catch (e: any) {
      console.warn("Could not fetch match details for fixture " + id, e.message);
    }

    if (!fixture && matchDetails) {
      const hTeam = matchDetails.hero.homeTeam;
      const aTeam = matchDetails.hero.awayTeam;
      const leagueName = matchDetails.hero.leagueName || "League";
      const countryName = matchDetails.hero.country || "International";

      const pHome = matchDetails.hero.odds1x2?.find((o: any) => o.label === "1");
      const pDraw = matchDetails.hero.odds1x2?.find((o: any) => o.label === "X");
      const pAway = matchDetails.hero.odds1x2?.find((o: any) => o.label === "2");
      const best = matchDetails.tips.bestTip;

      fixture = {
        id,
        externalId: id,
        leagueId: leagueName.toLowerCase().replace(/\s+/g, "-"),
        league: {
          id: leagueName.toLowerCase().replace(/\s+/g, "-"),
          name: leagueName,
          externalId: leagueName,
          isActive: true,
          country: {
            id: countryName.toLowerCase().replace(/\s+/g, "-"),
            name: countryName,
            flag: matchDetails.hero.countryFlag,
          },
        },
        homeTeamId: hTeam.name.toLowerCase().replace(/\s+/g, "-"),
        awayTeamId: aTeam.name.toLowerCase().replace(/\s+/g, "-"),
        homeTeam: {
          id: hTeam.name.toLowerCase().replace(/\s+/g, "-"),
          name: hTeam.name,
          externalId: hTeam.name,
          logo: hTeam.logo,
        },
        awayTeam: {
          id: aTeam.name.toLowerCase().replace(/\s+/g, "-"),
          name: aTeam.name,
          externalId: aTeam.name,
          logo: aTeam.logo,
        },
        matchDate: matchDetails.hero.date || new Date().toISOString().split("T")[0],
        kickoffTime: matchDetails.hero.time || "20:00",
        status: (matchDetails.hero.status === "Finished"
          ? "FINISHED"
          : matchDetails.hero.status === "Live"
          ? "LIVE"
          : "UPCOMING") as any,
        homeScore: matchDetails.hero.homeScore !== null ? parseInt(matchDetails.hero.homeScore, 10) : null,
        awayScore: matchDetails.hero.awayScore !== null ? parseInt(matchDetails.hero.awayScore, 10) : null,
        odds: {
          home: pHome ? parseFloat(pHome.odd) || 1.85 : 1.85,
          draw: pDraw ? parseFloat(pDraw.odd) || 3.40 : 3.40,
          away: pAway ? parseFloat(pAway.odd) || 3.80 : 3.80,
          bookmaker: "Consensus",
        },
        predictions: [
          {
            fixtureId: id,
            market: "1X2" as any,
            selection: best?.pick || (pAway?.isTip ? "2" : pHome?.isTip ? "1" : "1"),
            confidence: best ? parseInt(best.confidence, 10) || 75 : 75,
            odd: best ? parseFloat(best.odd) || 1.85 : 1.85,
            isPremium: false,
            status: "PENDING" as any,
            source: "NERDYTIPS_AI",
          },
        ],
      };
    }

    if (!fixture) {
      return res.status(404).json({ success: false, error: "Fixture not found" });
    }

    // Enrich existing fixture with team logos/market value if available from matchDetails
    if (matchDetails) {
      if (matchDetails.hero.homeTeam.logo && !fixture.homeTeam?.logo) {
        if (fixture.homeTeam) fixture.homeTeam.logo = matchDetails.hero.homeTeam.logo;
      }
      if (matchDetails.hero.awayTeam.logo && !fixture.awayTeam?.logo) {
        if (fixture.awayTeam) fixture.awayTeam.logo = matchDetails.hero.awayTeam.logo;
      }
      if (matchDetails.hero.countryFlag) {
        if (!(fixture as any).league) (fixture as any).league = {};
        if (!(fixture as any).league.country) (fixture as any).league.country = {};
        (fixture as any).league.country.flag = matchDetails.hero.countryFlag;
      }
    }

    const sanitized = accessControlService.filterFixtureForUser(fixture, user, 0);
    if (matchDetails) {
      (sanitized as any).matchDetails = matchDetails;
      (sanitized as any).aiInsight = {
        matchId: id,
        articleTitle: `${matchDetails.hero.homeTeam.name} vs ${matchDetails.hero.awayTeam.name} Prediction`,
        sections: [],
        predictedStats: matchDetails.statistics.map((s: any) => ({ stat: s.label, home: s.home, away: s.away })),
        actualStats: matchDetails.statistics.map((s: any) => ({ stat: s.label, home: s.home, away: s.away })),
      };
    }

    return res.json({
      success: true,
      fixture: sanitized,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/fixtures/:id/insight
router.get("/:id/insight", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nerdyTipsScraper } = await import("../lib/scraper/nerdytips-scraper");
    const insight = await nerdyTipsScraper.getMatchInsight(id);
    return res.json({
      success: Boolean(insight),
      insight,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

