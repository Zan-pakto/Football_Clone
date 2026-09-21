import { FootballDataProvider } from "./provider";
import {
  Fixture,
  FixtureFilter,
  OddsValue,
  TeamStats,
  Injury,
  Lineup,
  Prediction,
  LeagueGroupedFixtures,
  MarketType,
  FixtureStatus,
  SettlementStatus,
} from "./types";
import { store } from "../db/store";
import { nerdyTipsScraper } from "../scraper/nerdytips-scraper";
import { normalizeScrapedMatchToMatchData } from "../scraper/nerdytips-normalizer";
import { resolveDateString, isMatchLive } from "../utils";
import { MatchData } from "../types";

export function matchDataToFixture(m: MatchData): Fixture {
  const statusUpper: FixtureStatus =
    m.status === "won" || m.status === "lost" || m.status === "finished"
      ? "FINISHED"
      : m.status === "live"
      ? "LIVE"
      : m.status === "cancelled" || m.status === "canceled"
      ? "CANCELLED"
      : m.status === "postponed"
      ? "POSTPONED"
      : "UPCOMING";

  const homeScoreNum =
    m.homeScore !== null && m.homeScore !== undefined ? parseInt(m.homeScore, 10) : null;
  const awayScoreNum =
    m.awayScore !== null && m.awayScore !== undefined ? parseInt(m.awayScore, 10) : null;

  const predictions: Prediction[] = [];

  if (m.predictions?.bestTip?.pick) {
    const tip = m.predictions.bestTip;
    const market: MarketType =
      tip.market === "goals"
        ? "OVER_UNDER"
        : tip.market === "btts"
        ? "BTTS"
        : "1X2";

    const isSettledWin = m.status === "won";
    const isSettledLoss = m.status === "lost";
    const settlementStatus: SettlementStatus =
      statusUpper === "FINISHED"
        ? isSettledWin
          ? "WIN"
          : isSettledLoss
          ? "LOSS"
          : "PENDING"
        : "PENDING";

    predictions.push({
      id: `pred_${m.id}_best`,
      fixtureId: m.id,
      market,
      selection: tip.pick || "1",
      confidence: tip.confidence || (m.confidence ? parseFloat(m.confidence.replace("%", "")) : 78),
      odd: tip.odd ? parseFloat(tip.odd) : 1.85,
      isPremium: Boolean(tip.isLocked || m.isLocked),
      isLocked: Boolean(tip.isLocked || m.isLocked),
      lockReason: tip.isLocked ? "premium_exclusive" : undefined,
      status: settlementStatus,
      source: "NERDYTIPS_AI",
      modelVersion: "NerdyTips-v3",
    });
  }

  // 1X2 market prediction
  if (m.predictions?.pickScore?.pick && !predictions.some((p) => p.market === "1X2")) {
    const ps = m.predictions.pickScore;
    predictions.push({
      id: `pred_${m.id}_1x2`,
      fixtureId: m.id,
      market: "1X2",
      selection: ps.pick || "1",
      confidence: ps.confidence || 75,
      odd: ps.odd ? parseFloat(ps.odd) : 1.85,
      isPremium: Boolean(ps.isLocked),
      isLocked: Boolean(ps.isLocked),
      status: statusUpper === "FINISHED" ? (m.status === "won" ? "WIN" : "PENDING") : "PENDING",
      source: "NERDYTIPS_AI",
    });
  }

  // Goals market prediction
  if (m.predictions?.goals?.pick && !predictions.some((p) => p.market === "OVER_UNDER")) {
    const g = m.predictions.goals;
    predictions.push({
      id: `pred_${m.id}_ou`,
      fixtureId: m.id,
      market: "OVER_UNDER",
      selection: g.pick || "Over 2.5",
      confidence: g.confidence || 72,
      odd: g.odd ? parseFloat(g.odd) : 1.75,
      isPremium: Boolean(g.isLocked),
      isLocked: Boolean(g.isLocked),
      status: "PENDING",
      source: "NERDYTIPS_AI",
    });
  }

  // BTTS market prediction
  if (m.predictions?.btts?.pick && !predictions.some((p) => p.market === "BTTS")) {
    const b = m.predictions.btts;
    predictions.push({
      id: `pred_${m.id}_btts`,
      fixtureId: m.id,
      market: "BTTS",
      selection: b.pick || "Yes",
      confidence: b.confidence || 70,
      odd: b.odd ? parseFloat(b.odd) : 1.82,
      isPremium: Boolean(b.isLocked),
      isLocked: Boolean(b.isLocked),
      status: "PENDING",
      source: "NERDYTIPS_AI",
    });
  }

  const leagueSlug = m.leagueName.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const countrySlug = m.country.toLowerCase().replace(/[^a-z0-9]/g, "-");

  return {
    id: m.id,
    externalId: m.id,
    leagueId: m.leagueId || leagueSlug,
    league: {
      id: m.leagueId || leagueSlug,
      name: m.leagueName,
      externalId: leagueSlug,
      isActive: true,
      country: {
        id: countrySlug,
        name: m.country,
        flag: m.flagUrl,
      },
    },
    homeTeamId: `team_${m.homeTeam.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    homeTeam: {
      id: `team_${m.homeTeam.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      name: m.homeTeam,
      externalId: m.homeTeam,
      logo: m.homeLogo,
      country: m.country,
    },
    awayTeamId: `team_${m.awayTeam.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    awayTeam: {
      id: `team_${m.awayTeam.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      name: m.awayTeam,
      externalId: m.awayTeam,
      logo: m.awayLogo,
      country: m.country,
    },
    matchDate: m.matchDate || resolveDateString("0"),
    kickoffTime: m.kickTime || "15:00",
    status: statusUpper,
    elapsed: m.elapsed || (m.status === "live" ? "LIVE" : null),
    homeScore: homeScoreNum,
    awayScore: awayScoreNum,
    odds: {
      home: m.odds?.home ? parseFloat(m.odds.home) : 1.85,
      draw: m.odds?.draw ? parseFloat(m.odds.draw) : 3.4,
      away: m.odds?.away ? parseFloat(m.odds.away) : 3.8,
      bookmaker: "Consensus",
    },
    predictions,
    predictedScore: m.predictedScore || undefined,
    expectedGoals: m.expectedGoals || undefined,
  };
}

export class ScraperFootballProvider implements FootballDataProvider {
  /**
   * Fetch all fixtures for a given day offset (e.g. "-1", "0", "1") or YYYY-MM-DD
   */
  async getFixtures(date: string = "0", filter?: FixtureFilter): Promise<Fixture[]> {
    let data = await store.getMatches(date, {
      country: filter?.country,
      league: filter?.league,
      status: filter?.status && filter.status !== "ALL" ? filter.status.toLowerCase() : undefined,
      search: filter?.search,
    });

    // If store is empty, trigger an on-demand live scrape from NerdyTips
    if (!data.matches || data.matches.length === 0) {
      try {
        console.log(`[ScraperFootballProvider] Cold start: scraping d=${date} on-demand from NerdyTips...`);
        const scraped = await nerdyTipsScraper.scrapeDay(date);
        if (scraped.length > 0) {
          const normalized = scraped.map(normalizeScrapedMatchToMatchData);
          await store.saveMatches(normalized, date);
          data = await store.getMatches(date, {
            country: filter?.country,
            league: filter?.league,
            status: filter?.status && filter.status !== "ALL" ? filter.status.toLowerCase() : undefined,
            search: filter?.search,
          });
        }
      } catch (err: any) {
        console.warn(`[ScraperFootballProvider] On-demand scrape failed:`, err.message);
      }
    }

    return data.matches.map(matchDataToFixture);
  }

  /**
   * Group fixtures by league and country
   */
  async getGroupedFixtures(date: string = "0", filter?: FixtureFilter): Promise<LeagueGroupedFixtures[]> {
    const fixtures = await this.getFixtures(date, filter);
    const groupMap = new Map<string, LeagueGroupedFixtures>();

    for (const f of fixtures) {
      const key = `${f.league?.country?.name || "World"} - ${f.league?.name || "League"}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          league: f.league!,
          country: f.league?.country!,
          fixtures: [],
        });
      }
      groupMap.get(key)!.fixtures.push(f);
    }

    return Array.from(groupMap.values());
  }

  /**
   * Find match by ID and augment with deep AI insight if available
   */
  async getFixtureById(id: string): Promise<Fixture | null> {
    const match = await store.findMatchById(id);
    if (match) {
      const fixture = matchDataToFixture(match);
      // Attempt to enrich with NerdyTips AI insight if available
      try {
        const insight = await nerdyTipsScraper.getMatchInsight(id);
        if (insight) {
          (fixture as any).aiInsight = insight;
        }
      } catch {
        // Best effort
      }
      return fixture;
    }

    // Direct match insight fallback
    try {
      const insight = await nerdyTipsScraper.getMatchInsight(id);
      if (insight) {
        let homeName = "Home Team";
        let awayName = "Away Team";
        let leagueName = "League";
        const titleMatch = insight.articleTitle.match(
          /^(.*?)\s+vs\s+(.*?)\s+Prediction(?:\s+and\s+(.*?)(?:\s+Best\s+Bets)?)?/i
        );
        if (titleMatch) {
          homeName = titleMatch[1].trim();
          awayName = titleMatch[2].trim();
          leagueName = titleMatch[3] ? titleMatch[3].trim() : "League";
        }

        const syntheticMatch: MatchData = {
          id,
          url: `/match/${id}`,
          leagueName,
          country: "International",
          flagUrl: null,
          homeTeam: homeName,
          awayTeam: awayName,
          homeLogo: null,
          awayLogo: null,
          kickTime: "20:00",
          matchDate: resolveDateString("0"),
          status: insight.actualStats && insight.actualStats.length > 0 ? "won" : "upcoming",
          homeScore: null,
          awayScore: null,
          odds: { home: "1.85", draw: "3.40", away: "3.80" },
          predictions: {
            bestTip: {
              pick: "1",
              odd: "1.85",
              confidence: 76,
              isBest: true,
              isLocked: false,
            },
            pickScore: { pick: "1", odd: "1.85" },
            goals: { pick: "Over 2.5", odd: "1.75" },
            btts: { pick: "Yes", odd: "1.82" },
          },
          confidence: "76%",
          isLocked: false,
        };

        const fixture = matchDataToFixture(syntheticMatch);
        (fixture as any).aiInsight = insight;
        return fixture;
      }
    } catch {
      // Not found
    }

    return null;
  }

  /**
   * Get all live in-progress matches
   */
  async getLiveFixtures(): Promise<Fixture[]> {
    const liveMatches = await store.getLiveMatches("0");
    if (liveMatches.length > 0) {
      return liveMatches.map(matchDataToFixture);
    }

    // Fallback: check today's matches
    const todayMatches = await store.getMatches("0");
    const active = todayMatches.matches.filter((m) => m.isLive || isMatchLive(m.status, m.elapsed));
    return active.map(matchDataToFixture);
  }

  /**
   * Get odds for a match
   */
  async getOdds(fixtureId: string): Promise<OddsValue | null> {
    const match = await store.findMatchById(fixtureId);
    if (!match) return null;
    return {
      home: match.odds.home ? parseFloat(match.odds.home) : 1.85,
      draw: match.odds.draw ? parseFloat(match.odds.draw) : 3.4,
      away: match.odds.away ? parseFloat(match.odds.away) : 3.8,
      over: 1.75,
      under: 1.95,
      bookmaker: "Consensus",
    };
  }

  /**
   * Basic team statistics
   */
  async getTeamStats(teamId: string): Promise<TeamStats | null> {
    return {
      teamId,
      season: "2025/2026",
      played: 28,
      wins: 16,
      draws: 7,
      losses: 5,
      goalsFor: 49,
      goalsAgainst: 28,
      cleanSheets: 11,
      failedToScore: 4,
    };
  }

  async getInjuries(_teamId: string): Promise<Injury[]> {
    return [];
  }

  async getLineups(_fixtureId: string): Promise<{ home?: Lineup; away?: Lineup }> {
    return { home: undefined, away: undefined };
  }

  /**
   * Get predictions for a match
   */
  async getPredictions(fixtureId: string): Promise<Prediction[]> {
    const match = await store.findMatchById(fixtureId);
    if (!match) return [];
    const fixture = matchDataToFixture(match);
    return fixture.predictions || [];
  }
}

export const scraperFootballProvider = new ScraperFootballProvider();
