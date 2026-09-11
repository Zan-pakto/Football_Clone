import { MatchData, LiveMatchUpdate } from "../types";
import { isMatchLive, resolveDateString } from "../utils";
import { prisma } from "./prisma";

export { resolveDateString };

// In-memory cache for fast UI delivery & real-time updates fallback
class MatchStore {
  private cache: Map<string, MatchData[]> = new Map();
  private liveCache: Map<string, LiveMatchUpdate> = new Map();
  private lastSyncedAt: string | null = null;

  get lastScrapedAt(): string | null {
    return this.lastSyncedAt;
  }

  /**
   * Save matches to PostgreSQL (with fallback to in-memory store if DB is down)
   */
  async saveMatches(matches: MatchData[], d: string = "0"): Promise<void> {
    if (!matches || !Array.isArray(matches)) return;

    const targetDate = resolveDateString(d);

    this.cache.set(targetDate, matches);
    this.cache.set(d, matches);
    this.lastSyncedAt = new Date().toISOString();

    try {
      const teamCache = new Map<string, string>();
      const leagueCache = new Map<string, string>();

      const BATCH_SIZE = 20;
      for (let i = 0; i < matches.length; i += BATCH_SIZE) {
        const batch = matches.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((m) => this.upsertSingleMatch(m, targetDate, teamCache, leagueCache))
        );
      }

      const currentIds = matches.map((m) => m.id);
      if (currentIds.length >= 20) {
        await prisma.fixture.deleteMany({
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

  async saveScrapedMatches(result: { success?: boolean; matches?: MatchData[]; d?: string; scrapedAt?: string }): Promise<void> {
    if (result && result.matches) {
      if (result.scrapedAt) this.lastSyncedAt = result.scrapedAt;
      await this.saveMatches(result.matches, result.d || "0");
    }
  }

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
        update: { name: m.homeTeam, logo: m.homeLogo || undefined, country: m.country },
        create: { externalId: homeTeamExtId, name: m.homeTeam, logo: m.homeLogo, country: m.country },
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
        update: { name: m.awayTeam, logo: m.awayLogo || undefined, country: m.country },
        create: { externalId: awayTeamExtId, name: m.awayTeam, logo: m.awayLogo, country: m.country },
      });
      awayTeamId = team.id;
      teamCache.set(awayTeamExtId, awayTeamId);
    }

    // 3. Upsert League
    const leagueExtId = `league_${m.leagueName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    let leagueId = leagueCache.get(leagueExtId);
    if (!leagueId) {
      const league = await prisma.league.upsert({
        where: { externalId: leagueExtId },
        update: { name: m.leagueName, logo: m.flagUrl || undefined },
        create: { externalId: leagueExtId, name: m.leagueName, logo: m.flagUrl },
      });
      leagueId = league.id;
      leagueCache.set(leagueExtId, leagueId);
    }

    // 4. Upsert Fixture
    const statusEnum = m.status === "won" ? "FINISHED" : m.status === "live" ? "LIVE" : "UPCOMING";
    const hScore = m.homeScore !== null && m.homeScore !== undefined ? parseInt(m.homeScore, 10) || 0 : null;
    const aScore = m.awayScore !== null && m.awayScore !== undefined ? parseInt(m.awayScore, 10) || 0 : null;

    const fixture = await prisma.fixture.upsert({
      where: { externalId: m.id },
      update: {
        leagueId,
        homeTeamId,
        awayTeamId,
        matchDate: targetDate,
        kickoffTime: new Date(),
        status: statusEnum as any,
        elapsed: m.elapsed,
        homeScore: hScore,
        awayScore: aScore,
      },
      create: {
        externalId: m.id,
        leagueId,
        homeTeamId,
        awayTeamId,
        matchDate: targetDate,
        kickoffTime: new Date(),
        status: statusEnum as any,
        elapsed: m.elapsed,
        homeScore: hScore,
        awayScore: aScore,
      },
    });

    // 5. Predictions
    if (m.predictions?.bestTip?.pick) {
      const confNum = m.confidence ? parseFloat(m.confidence.replace("%", "")) || 80 : 80;
      const oddNum = m.predictions.bestTip.odd ? parseFloat(m.predictions.bestTip.odd) || 1.65 : 1.65;
      await prisma.prediction.upsert({
        where: {
          fixtureId_market: {
            fixtureId: fixture.id,
            market: "ONE_X_TWO" as any,
          },
        },
        update: {
          selection: m.predictions.bestTip.pick,
          confidence: confNum,
          odd: oddNum,
        },
        create: {
          fixtureId: fixture.id,
          market: "ONE_X_TWO" as any,
          selection: m.predictions.bestTip.pick,
          confidence: confNum,
          odd: oddNum,
        },
      });
    }
  }

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
  }

  async getMatches(
    d: string = "0",
    filters?: { country?: string; league?: string; status?: string; search?: string }
  ): Promise<{ matches: MatchData[]; total: number; lastScrapedAt: string | null; lastSyncedAt: string | null }> {
    let matches: MatchData[] = [];
    const targetDate = resolveDateString(d);

    try {
      const dbFixtures = await prisma.fixture.findMany({
        where: {
          OR: [{ matchDate: targetDate }, { matchDate: d }],
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: { include: { country: true } },
          predictions: true,
          odds: true,
        },
        orderBy: { kickoffTime: "asc" },
      });

      if (dbFixtures.length > 0) {
        matches = dbFixtures.map((df: any) => {
          const live = this.liveCache.get(df.externalId);
          let activeStatus = live?.status || df.status;
          const activeElapsed = live?.elapsed || df.elapsed;
          const computedIsLive = isMatchLive(activeStatus, activeElapsed);

          return {
            id: df.externalId,
            url: `/match/${df.id}`,
            leagueName: df.league?.name || "League",
            country: df.league?.country?.name || "World",
            flagUrl: df.league?.logo || null,
            homeTeam: df.homeTeam.name,
            awayTeam: df.awayTeam.name,
            homeLogo: df.homeTeam.logo || null,
            awayLogo: df.awayTeam.logo || null,
            kickTime: df.kickoffTime ? new Date(df.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
            status: activeStatus.toLowerCase(),
            homeScore: live?.homeScore !== undefined && live.homeScore !== null ? String(live.homeScore) : df.homeScore !== null ? String(df.homeScore) : null,
            awayScore: live?.awayScore !== undefined && live.awayScore !== null ? String(live.awayScore) : df.awayScore !== null ? String(df.awayScore) : null,
            elapsed: activeElapsed,
            isLive: computedIsLive,
            odds: {
              home: "1.75",
              draw: "3.50",
              away: "4.20",
            },
            predictions: {
              pickScore: { pick: df.predictions?.[0]?.selection || null, odd: "1.75" },
              goals: { pick: null, odd: null },
              btts: { pick: null, odd: null },
              bestTip: { pick: df.predictions?.[0]?.selection || null, odd: "1.75" },
            },
            confidence: df.predictions?.[0]?.confidence ? `${df.predictions[0].confidence}%` : "84%",
          };
        });
      }
    } catch (err) {
      console.error("DB query failed, using in-memory cache:", err);
    }

    if (matches.length === 0) {
      matches = this.cache.get(targetDate) || this.cache.get(d) || [];
    }

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
            m.leagueName.toLowerCase().includes(q)
        );
      }
    }

    return {
      matches,
      total: matches.length,
      lastScrapedAt: this.lastSyncedAt,
      lastSyncedAt: this.lastSyncedAt,
    };
  }

  async getLiveMatches(d: string = "0"): Promise<MatchData[]> {
    const { matches } = await this.getMatches(d);
    return matches.filter((m) => m.isLive || isMatchLive(m.status, m.elapsed));
  }
}

export const store = new MatchStore();
