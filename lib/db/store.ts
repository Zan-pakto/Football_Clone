import { MatchData, ScrapeResult, LiveMatchUpdate } from "../scraper/types";
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

      // 2. Upsert each match
      for (const m of result.matches) {
        await this.upsertSingleMatch(m, targetDate);
      }

      // 3. Purge obsolete matches for this date that were removed/not in current scrape
      const currentIds = result.matches.map((m) => m.id);
      if (currentIds.length > 0) {
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
  private async upsertSingleMatch(m: MatchData, targetDate: string): Promise<void> {
    // 1. Upsert Home Team
    const homeTeamExtId = `team_${m.homeTeam.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const homeTeam = await prisma.team.upsert({
      where: { externalId: homeTeamExtId },
      update: {
        name: m.homeTeam,
        logoUrl: m.homeLogo || undefined,
        country: m.country,
      },
      create: {
        externalId: homeTeamExtId,
        name: m.homeTeam,
        logoUrl: m.homeLogo,
        country: m.country,
      },
    });

    // 2. Upsert Away Team
    const awayTeamExtId = `team_${m.awayTeam.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const awayTeam = await prisma.team.upsert({
      where: { externalId: awayTeamExtId },
      update: {
        name: m.awayTeam,
        logoUrl: m.awayLogo || undefined,
        country: m.country,
      },
      create: {
        externalId: awayTeamExtId,
        name: m.awayTeam,
        logoUrl: m.awayLogo,
        country: m.country,
      },
    });

    // 3. Upsert League
    const leagueExtId = `league_${m.leagueName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${m.country.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    const league = await prisma.league.upsert({
      where: { externalId: leagueExtId },
      update: {
        name: m.leagueName,
        country: m.country,
        logoUrl: m.flagUrl || undefined,
      },
      create: {
        externalId: leagueExtId,
        name: m.leagueName,
        country: m.country,
        logoUrl: m.flagUrl,
      },
    });

    // 4. Upsert Match
    const match = await prisma.match.upsert({
      where: { externalId: m.id },
      update: {
        leagueId: league.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
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
        leagueId: league.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
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

    // 5. Upsert Predictions & save history
    const predList = [
      { type: "pickScore", cell: m.predictions.pickScore },
      { type: "goals", cell: m.predictions.goals },
      { type: "btts", cell: m.predictions.btts },
      { type: "bestTip", cell: m.predictions.bestTip },
    ];

    for (const p of predList) {
      if (!p.cell.pick) continue;

      const existingPred = await prisma.prediction.findUnique({
        where: {
          matchId_predictionType: {
            matchId: match.id,
            predictionType: p.type,
          },
        },
      });

      if (!existingPred) {
        await prisma.prediction.create({
          data: {
            matchId: match.id,
            predictionType: p.type,
            prediction: p.cell.pick,
            odd: p.cell.odd,
            confidence: m.confidence,
          },
        });
      } else if (existingPred.prediction !== p.cell.pick || existingPred.odd !== p.cell.odd) {
        // Record history of old prediction
        await prisma.predictionHistory.create({
          data: {
            matchId: match.id,
            predictionType: p.type,
            prediction: existingPred.prediction,
            odd: existingPred.odd,
            confidence: existingPred.confidence,
          },
        });

        // Update to new prediction
        await prisma.prediction.update({
          where: { id: existingPred.id },
          data: {
            prediction: p.cell.pick,
            odd: p.cell.odd,
            confidence: m.confidence,
          },
        });
      }
    }
  }

  /**
   * Apply live updates to cache and DB
   */
  async applyLiveUpdates(updates: Record<string, LiveMatchUpdate>, d: string): Promise<void> {
    const targetDate = resolveDateString(d);

    const TERMINAL_STATUS = /^(fin|won|FT|AET|Pen|canceled|postponed|finished)$/i;
    const TERMINAL_ELAPSED = /^(FT|AET|Pen|90\+|120|120\+)/i;

    for (const [id, live] of Object.entries(updates)) {
      // If the update signals the game is over, REMOVE from liveCache so it stops showing as live
      const isTerminal =
        (live.status && TERMINAL_STATUS.test(live.status)) ||
        (live.elapsed && TERMINAL_ELAPSED.test(live.elapsed.trim()));

      if (isTerminal) {
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
        if (live.status) m.status = live.status;
        if (live.elapsed) m.elapsed = live.elapsed;
        if (live.homeScore !== null && live.homeScore !== undefined)
          m.homeScore = String(live.homeScore);
        if (live.awayScore !== null && live.awayScore !== undefined)
          m.awayScore = String(live.awayScore);
        // Only mark isLive if still actively in progress
        const isTerminal =
          (live.status && TERMINAL_STATUS.test(live.status)) ||
          (live.elapsed && TERMINAL_ELAPSED.test(live.elapsed.trim()));
        m.isLive = !isTerminal;
      }
    }

    // Update in DB asynchronously
    try {
      for (const live of Object.values(updates)) {
        await prisma.match.updateMany({
          where: { externalId: live.id },
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
          const TERMINAL_STATUS = /^(fin|won|FT|AET|Pen|canceled|postponed|finished)$/i;
          const TERMINAL_ELAPSED = /^(FT|AET|Pen|90\+|120|120\+)/i;
          const liveIsTerminal = live && (
            (live.status && TERMINAL_STATUS.test(live.status)) ||
            (live.elapsed && TERMINAL_ELAPSED.test(live.elapsed.trim()))
          );
          const computedIsLive = live && !liveIsTerminal
            ? true
            : dm.status === "live" || dm.status === "In Progress";

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
            status: live?.status || dm.status,
            homeScore: live?.homeScore !== undefined && live.homeScore !== null ? String(live.homeScore) : dm.homeScore,
            awayScore: live?.awayScore !== undefined && live.awayScore !== null ? String(live.awayScore) : dm.awayScore,
            elapsed: live?.elapsed || dm.elapsed,
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
    const TERMINAL_STATUS = /^(fin|won|FT|AET|Pen|canceled|postponed|finished)$/i;
    const TERMINAL_ELAPSED = /^(FT|AET|Pen|90\+|120|120\+)/i;

    return matches.filter((m) => {
      const live = this.liveCache.get(m.id);
      if (live) {
        // Only live if cache entry is NOT terminal
        const isTerminal =
          (live.status && TERMINAL_STATUS.test(live.status)) ||
          (live.elapsed && TERMINAL_ELAPSED.test(live.elapsed.trim()));
        return !isTerminal && (live.status === "In Progress" || live.status === "live");
      }
      // Fall back to DB status — must be explicitly "live" or "In Progress", not just any non-FT status
      return m.status === "live" || m.status === "In Progress";
    });
  }
}

export const store = new MatchStore();
