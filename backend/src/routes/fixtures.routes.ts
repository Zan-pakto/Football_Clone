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
    const country = (req.query.country as string) || undefined;
    const league = (req.query.league as string) || undefined;
    const status = (req.query.status as any) || undefined;
    const search = (req.query.search as string) || undefined;
    const isGrouped = req.query.grouped !== "false";

    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);

    // 1. Check if high-volume synchronized matches exist in store
    const { store } = await import("../lib/db/store");
    const storeData = await store.getMatches(date);

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
          predictions: [
            {
              fixtureId: m.id,
              market: "1X2" as any,
              selection: m.predictions?.bestTip?.pick || "1",
              confidence: m.predictions?.bestTip?.confidence || 75,
              odd: m.predictions?.bestTip?.odd ? parseFloat(m.predictions.bestTip.odd) : 1.85,
              isPremium: Boolean(m.isLocked),
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

    // Fallback: If not in store, fetch directly from NerdyTips match insight
    let insight: any = null;
    const { nerdyTipsScraper } = await import("../lib/scraper/nerdytips-scraper");
    try {
      insight = await nerdyTipsScraper.getMatchInsight(id);
    } catch (e: any) {
      console.warn("Could not fetch AI insight for fixture " + id, e.message);
    }

    if (!fixture && insight) {
      // Parse team names from articleTitle e.g. "Marseille vs Paris S Prediction and Ligue 1 Best Bets"
      let homeName = "Home Team";
      let awayName = "Away Team";
      let leagueName = "League";
      const titleMatch = insight.articleTitle.match(/^(.*?)\s+vs\s+(.*?)\s+Prediction(?:\s+and\s+(.*?)(?:\s+Best\s+Bets)?)?/i);
      if (titleMatch) {
        homeName = titleMatch[1].trim();
        awayName = titleMatch[2].trim();
        leagueName = titleMatch[3] ? titleMatch[3].trim() : "League";
      }

      fixture = {
        id,
        externalId: id,
        leagueId: leagueName,
        league: {
          id: leagueName,
          name: leagueName,
          externalId: leagueName,
          isActive: true,
          country: {
            id: "world",
            name: "International",
            flag: null,
          },
        },
        homeTeamId: homeName,
        awayTeamId: awayName,
        homeTeam: {
          id: homeName,
          name: homeName,
          externalId: homeName,
        },
        awayTeam: {
          id: awayName,
          name: awayName,
          externalId: awayName,
        },
        matchDate: new Date().toISOString().split("T")[0],
        kickoffTime: "20:00",
        status: (insight.actualStats && insight.actualStats.length > 0 ? "FINISHED" : "UPCOMING") as any,
        homeScore: null,
        awayScore: null,
        odds: {
          home: 1.85,
          draw: 3.40,
          away: 3.80,
          bookmaker: "Consensus",
        },
        predictions: [
          {
            fixtureId: id,
            market: "1X2" as any,
            selection: "1",
            confidence: 76,
            odd: 1.85,
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

    const sanitized = accessControlService.filterFixtureForUser(fixture, user, 0);
    if (insight) {
      (sanitized as any).aiInsight = insight;
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

