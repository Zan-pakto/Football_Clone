import { MatchData, ScrapeResult, LiveMatchUpdate } from "../scraper/types";
import { isMatchLive } from "../scraper/parser";
import { prisma } from "./prisma";

export function resolveDateString(d: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return d;
  }
  const offset = parseInt(d, 10);
  if (!isNaN(offset)) {
    const now = new Date();
    now.setDate(now.getDate() + offset);
    return now.toISOString().split("T")[0];
  }
  return d;
}

// In-memory cache for fast UI delivery & real-time updates fallback
class MatchStore {
  private cache: Map<string, MatchData[]> = new Map();
  private liveCache: Map<string, LiveMatchUpdate> = new Map();
  private lastScrapedAt: string | null = null;

  /**
   * Save scraped matches to PostgreSQL (with fallback to in-memory store if DB is down)
   */
  async saveScrapedMatches(result: ScrapeResult): Promise<void> {
    if (!result.success || !result.matches) return;

    const d = result.d;
    const targetDate = resolveDateString(d);

    this.cache.set(targetDate, result.matches);
    this.cache.set(d, result.matches);
    this.lastScrapedAt = result.scrapedAt;

    try {
      // 1. Log scrape operation
      await prisma.scrapeLog.create({
        data: {
          sourceUrl: `https://nerdytips.com/all-matches?d=${d}`,
          status: "SUCCESS",
          recordsFound: result.matches.length,
          scrapedAt: new Date(result.scrapedAt),
        },
      });

      // In-memory caching for teams & leagues during this save run
      const teamCache = new Map<string, string>();
      const leagueCache = new Map<string, string>();

      // 2. Upsert matches in concurrent batches of 20 to complete DB writes in ~2s
      const BATCH_SIZE = 20;
      for (let i = 0; i < result.matches.length; i += BATCH_SIZE) {
        const batch = result.matches.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((m) => this.upsertSingleMatch(m, targetDate, teamCache, leagueCache))
        );
      }

      // 3. Purge obsolete matches for this date only if current scrape returned a healthy set (>= 20)
      const currentIds = result.matches.map((m) => m.id);
      if (currentIds.length >= 20) {
        await prisma.match.deleteMany({
          where: {
            OR: [{ matchDate: targetDate }, { matchDate: d }],
            externalId: { notIn: currentIds },
          },
        });
      }
    } catch (err) {
      console.error("PostgreSQL upsert error (falling back to memory cache):", err);
    }
  }

  /**
   * Upsert a single match into PostgreSQL according to database rules
   */
  private async upsertSingleMatch(
    m: MatchData,
    targetDate: string,
    teamCache: Map<string, string>,
    leagueCache: Map<string, string>
  ): Promise<void> {
    // 1. Upsert Home Team
    const homeTeamExtId = `team_${m.homeTeam.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    let homeTeamId = teamCache.get(homeTeamExtId);
    if (!homeTeamId) {
      const team = await prisma.team.upsert({
        where: { externalId: homeTeamExtId },
        update: { name: m.homeTeam, logoUrl: m.homeLogo || undefined, country: m.country },
        create: { externalId: homeTeamExtId, name: m.homeTeam, logoUrl: m.homeLogo, country: m.country },
      });
      homeTeamId = team.id;
      teamCache.set(homeTeamExtId, homeTeamId);
    }

    // 2. Upsert Away Team
    const awayTeamExtId = `team_${m.awayTeam.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    let awayTeamId = teamCache.get(awayTeamExtId);
    if (!awayTeamId) {
      const team = await prisma.team.upsert({
        where: { externalId: awayTeamExtId },
        update: { name: m.awayTeam, logoUrl: m.awayLogo || undefined, country: m.country },
        create: { externalId: awayTeamExtId, name: m.awayTeam, logoUrl: m.awayLogo, country: m.country },
      });
      awayTeamId = team.id;
      teamCache.set(awayTeamExtId, awayTeamId);
    }

    // 3. Upsert League
    const leagueExtId = `league_${m.leagueName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${m.country.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    let leagueId = leagueCache.get(leagueExtId);
    if (!leagueId) {
      const league = await prisma.league.upsert({
        where: { externalId: leagueExtId },
        update: { name: m.leagueName, country: m.country, logoUrl: m.flagUrl || undefined },
        create: { externalId: leagueExtId, name: m.leagueName, country: m.country, logoUrl: m.flagUrl },
      });
      leagueId = league.id;
      leagueCache.set(leagueExtId, leagueId);
    }

    // 4. Upsert Match
    const match = await prisma.match.upsert({
      where: { externalId: m.id },
      update: {
        leagueId,
        homeTeamId,
        awayTeamId,
        matchDate: targetDate,
        kickTime: m.kickTime,
        status: m.status,
        elapsed: m.elapsed,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        sourceUrl: m.url,
        confidence: m.confidence,
        homeOdd: m.odds.home,
        drawOdd: m.odds.draw,
        awayOdd: m.odds.away,
      },
      create: {
        externalId: m.id,
        leagueId,
        homeTeamId,
        awayTeamId,
        matchDate: targetDate,
        kickTime: m.kickTime,
        status: m.status,
        elapsed: m.elapsed,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        sourceUrl: m.url,
        confidence: m.confidence,
        homeOdd: m.odds.home,
        drawOdd: m.odds.draw,
        awayOdd: m.odds.away,
      },
    });

    // 5. Direct Prediction Upsert
    const predList = [
      { type: "pickScore", cell: m.predictions.pickScore },
      { type: "goals", cell: m.predictions.goals },
      { type: "btts", cell: m.predictions.btts },
      { type: "bestTip", cell: m.predictions.bestTip },
    ];

    for (const p of predList) {
      if (!p.cell.pick) continue;
      await prisma.prediction.upsert({
        where: {
          matchId_predictionType: {
            matchId: match.id,
            predictionType: p.type,
          },
        },
        update: {
          prediction: p.cell.pick,
          odd: p.cell.odd,
          confidence: m.confidence,
        },
        create: {
          matchId: match.id,
          predictionType: p.type,
          prediction: p.cell.pick,
          odd: p.cell.odd,
          confidence: m.confidence,
        },
      });
    }
  }

  /**
   * Apply live updates to cache and DB
   */
  async applyLiveUpdates(updates: Record<string, LiveMatchUpdate>, d: string): Promise<void> {
    const targetDate = resolveDateString(d);

    for (const [id, live] of Object.entries(updates)) {
      const activeLive = isMatchLive(live.status, live.elapsed);
      if (!activeLive) {
        this.liveCache.delete(id);
      } else {
        this.liveCache.set(id, live);
      }
    }

    // Apply to in-memory matches
    const cachedMatches = this.cache.get(targetDate) || this.cache.get(d) || [];
    for (const m of cachedMatches) {
      const live = updates[m.id];
      if (live) {
        if (live.status && m.status !== "won") m.status = live.status;
        if (live.elapsed) m.elapsed = live.elapsed;
        if (live.homeScore !== null && live.homeScore !== undefined)
          m.homeScore = String(live.homeScore);
        if (live.awayScore !== null && live.awayScore !== undefined)
          m.awayScore = String(live.awayScore);
        m.isLive = isMatchLive(m.status, m.elapsed);
      }
    }

    // Update in DB asynchronously
    try {
      for (const live of Object.values(updates)) {
        await prisma.match.updateMany({
          where: {
            externalId: live.id,
            status: { not: "won" },
          },
          data: {
            status: live.status,
            elapsed: live.elapsed,
            homeScore: live.homeScore !== null && live.homeScore !== undefined ? String(live.homeScore) : undefined,
            awayScore: live.awayScore !== null && live.awayScore !== undefined ? String(live.awayScore) : undefined,
          },
        });
      }
    } catch (err) {
      // Ignore DB errors on live background updates
    }
  }

  /**
   * Query matches from Database with memory cache fallback
   */
  async getMatches(
    d: string = "0",
    filters?: { country?: string; league?: string; status?: string; search?: string }
  ): Promise<{ matches: MatchData[]; total: number; lastScrapedAt: string | null }> {
    let matches: MatchData[] = [];
    const targetDate = resolveDateString(d);

    try {
      const dbMatches = await prisma.match.findMany({
        where: {
          OR: [{ matchDate: targetDate }, { matchDate: d }],
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: true,
          predictions: true,
        },
        orderBy: { kickTime: "asc" },
      });

      if (dbMatches.length > 0) {
        matches = dbMatches.map((dm) => {
          const predMap = Object.fromEntries(
            dm.predictions.map((p) => [
              p.predictionType,
              { pick: p.prediction, odd: p.odd, trust: p.confidence },
            ])
          );

          const live = this.liveCache.get(dm.externalId);
          let activeStatus = live?.status || dm.status;
          if (dm.status === "won" && (activeStatus === "Match Finished" || activeStatus === "fin" || activeStatus === "FT")) {
            activeStatus = "won";
          }
          const activeElapsed = live?.elapsed || dm.elapsed;
          const computedIsLive = isMatchLive(activeStatus, activeElapsed);

          return {
            id: dm.externalId,
            url: dm.sourceUrl,
            leagueName: dm.league?.name || "League",
            country: dm.league?.country || "World",
            flagUrl: dm.league?.logoUrl || null,
            homeTeam: dm.homeTeam.name,
            awayTeam: dm.awayTeam.name,
            homeLogo: dm.homeTeam.logoUrl || null,
            awayLogo: dm.awayTeam.logoUrl || null,
            kickTime: dm.kickTime,
            status: activeStatus,
            homeScore: live?.homeScore !== undefined && live.homeScore !== null ? String(live.homeScore) : dm.homeScore,
            awayScore: live?.awayScore !== undefined && live.awayScore !== null ? String(live.awayScore) : dm.awayScore,
            elapsed: activeElapsed,
            isLive: computedIsLive,
            odds: {
              home: dm.homeOdd,
              draw: dm.drawOdd,
              away: dm.awayOdd,
            },
            predictions: {
              pickScore: predMap["pickScore"] || { pick: null, odd: null },
              goals: predMap["goals"] || { pick: null, odd: null },
              btts: predMap["btts"] || { pick: null, odd: null },
              bestTip: predMap["bestTip"] || { pick: null, odd: null },
            },
            confidence: dm.confidence,
          };
        });
      }
    } catch (err) {
      console.error("DB query failed, using in-memory cache:", err);
    }

    // Fallback to cache if DB returned no matches
    if (matches.length === 0) {
      matches = this.cache.get(targetDate) || this.cache.get(d) || [];
    }

    // Apply Filters
    if (filters) {
      if (filters.country) {
        const countryLower = filters.country.toLowerCase();
        matches = matches.filter((m) => m.country.toLowerCase() === countryLower);
      }
      if (filters.league) {
        const leagueLower = filters.league.toLowerCase();
        matches = matches.filter((m) => m.leagueName.toLowerCase().includes(leagueLower));
      }
      if (filters.status) {
        const statusLower = filters.status.toLowerCase();
        matches = matches.filter((m) => m.status.toLowerCase() === statusLower);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        matches = matches.filter(
          (m) =>
            m.homeTeam.toLowerCase().includes(q) ||
            m.awayTeam.toLowerCase().includes(q) ||
            m.leagueName.toLowerCase().includes(q) ||
            m.country.toLowerCase().includes(q)
        );
      }
    }

    return {
      matches,
      total: matches.length,
      lastScrapedAt: this.lastScrapedAt,
    };
  }

  /**
   * Get active live matches for day d
   */
  async getLiveMatches(d: string = "0"): Promise<MatchData[]> {
    const { matches } = await this.getMatches(d);
    return matches.filter((m) => m.isLive || isMatchLive(m.status, m.elapsed));
  }
}

export const store = new MatchStore();
