import { MatchData, LiveMatchUpdate } from "../types";
import { isMatchLive, resolveDateString } from "../utils";
import { prisma } from "./prisma";

export { resolveDateString };

// In-memory cache for fast UI delivery & real-time updates fallback
class MatchStore {
  private cache: Map<string, MatchData[]> = new Map();
  private liveCache: Map<string, LiveMatchUpdate> = new Map();
  private lastSyncedAt: string | null = null;
  private progressCache: any = null;
  private hitAndWinSlips: Map<string, any[]> = new Map();

  async getUserHitAndWinSlips(userId: string): Promise<any[]> {
    return this.hitAndWinSlips.get(userId) || [];
  }

  async saveHitAndWinSlip(slip: any): Promise<void> {
    const list = this.hitAndWinSlips.get(slip.userId) || [];
    list.unshift(slip);
    this.hitAndWinSlips.set(slip.userId, list);
  }

  get lastScrapedAt(): string | null {
    return this.lastSyncedAt;
  }

  /**
   * Save matches to in-memory cache immediately and persist to PostgreSQL safely
   */
  async saveMatches(matches: MatchData[], d: string = "0"): Promise<void> {
    if (!matches || !Array.isArray(matches) || matches.length === 0) return;

    const targetDate = resolveDateString(d);

    // 1. Immediately update fast in-memory cache so client receives matches in <1ms
    this.cache.set(targetDate, matches);
    this.cache.set(d, matches);
    this.lastSyncedAt = new Date().toISOString();

    // 2. Persist to PostgreSQL asynchronously in background without delaying HTTP responses
    this.persistToDatabase(matches, targetDate).catch((err) => {
      console.warn("[MatchStore] Background DB sync notice:", err.message);
    });
  }

  private async persistToDatabase(matches: MatchData[], targetDate: string): Promise<void> {
    try {
      const teamCache = new Map<string, string>();
      const leagueCache = new Map<string, string>();

      const BATCH_SIZE = 15;
      for (let i = 0; i < matches.length; i += BATCH_SIZE) {
        const batch = matches.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map((m) => this.upsertSingleMatch(m, targetDate, teamCache, leagueCache))
        );
      }
    } catch (err: any) {
      console.warn("[MatchStore] Database persistence notice:", err.message);
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

    if (m.predictions?.goals?.pick) {
      const gOdd = m.predictions.goals.odd ? parseFloat(m.predictions.goals.odd) || 1.75 : 1.75;
      const gConf = m.predictions.goals.confidence || 70;
      await prisma.prediction.upsert({
        where: {
          fixtureId_market: {
            fixtureId: fixture.id,
            market: "OVER_UNDER" as any,
          },
        },
        update: {
          selection: m.predictions.goals.pick,
          confidence: gConf,
          odd: gOdd,
        },
        create: {
          fixtureId: fixture.id,
          market: "OVER_UNDER" as any,
          selection: m.predictions.goals.pick,
          confidence: gConf,
          odd: gOdd,
        },
      });
    }

    if (m.predictions?.btts?.pick) {
      const bOdd = m.predictions.btts.odd ? parseFloat(m.predictions.btts.odd) || 1.82 : 1.82;
      const bConf = m.predictions.btts.confidence || 65;
      await prisma.prediction.upsert({
        where: {
          fixtureId_market: {
            fixtureId: fixture.id,
            market: "BTTS" as any,
          },
        },
        update: {
          selection: m.predictions.btts.pick,
          confidence: bConf,
          odd: bOdd,
        },
        create: {
          fixtureId: fixture.id,
          market: "BTTS" as any,
          selection: m.predictions.btts.pick,
          confidence: bConf,
          odd: bOdd,
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
    filters?: { country?: string; league?: string; status?: string; search?: string },
    tz?: string | number | null
  ): Promise<{ matches: MatchData[]; total: number; lastScrapedAt: string | null; lastSyncedAt: string | null }> {
    let matches: MatchData[] = [];
    const targetDate = resolveDateString(d);

    // 1. Check in-memory store cache first (instant response, zero DB overhead)
    const cached = this.cache.get(targetDate) || this.cache.get(d);
    if (cached && cached.length > 0) {
      matches = cached;
    } else {
      // 2. Query database only when cache is empty
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
              predictions: (() => {
                const p1x2 = df.predictions?.find((p: any) => p.market === "ONE_X_TWO" || p.market === "1X2");
                const pGoals = df.predictions?.find((p: any) => p.market === "OVER_UNDER");
                const pBtts = df.predictions?.find((p: any) => p.market === "BTTS");
                return {
                  pickScore: { pick: p1x2?.selection || null, odd: p1x2?.odd ? String(p1x2.odd) : "1.75", isLocked: false },
                  goals: { pick: pGoals?.selection || null, odd: pGoals?.odd ? String(pGoals.odd) : "1.75", isLocked: false },
                  btts: { pick: pBtts?.selection || null, odd: pBtts?.odd ? String(pBtts.odd) : "1.82", isLocked: false },
                  bestTip: { pick: p1x2?.selection || null, odd: p1x2?.odd ? String(p1x2.odd) : "1.75", isLocked: false },
                  isLocked: false,
                };
              })(),
              confidence: df.predictions?.[0]?.confidence ? `${df.predictions[0].confidence}%` : "84%",
            };
          });

          // Populate cache so subsequent calls never touch the DB
          this.cache.set(targetDate, matches);
          this.cache.set(d, matches);
        }
      } catch (err) {
        console.error("DB query failed, using in-memory cache:", err);
      }
    }

    // 3. Cold-start auto-scrape: if both cache and DB are empty, scrape on-demand with user timezone
    if (matches.length === 0) {
      try {
        const { nerdyTipsScraper } = await import("../scraper/nerdytips-scraper");
        const { normalizeScrapedMatchToMatchData } = await import("../scraper/nerdytips-normalizer");
        console.log(`[MatchStore] Cold start: auto-scraping live data for d=${d} (tz=${tz || 'default'}) from NerdyTips...`);
        const scraped = await nerdyTipsScraper.scrapeDay(d, null, tz);
        if (scraped && scraped.length > 0) {
          const normalized = scraped.map(normalizeScrapedMatchToMatchData);
          await this.saveMatches(normalized, d);
          matches = normalized;
        } else {
          // If scraper returns 0, fall back to API-Football / configured provider
          try {
            const { fixtureService } = await import("../football/fixture-service");
            const fixtures = await fixtureService.getFixtures(d, {});
            if (fixtures && fixtures.length > 0) {
              console.log(`[MatchStore] Scraper returned 0; loaded ${fixtures.length} fallback fixtures from provider for d=${d}`);
              const fallbackMatches: MatchData[] = fixtures.map((f: any, idx: number) => {
                const isMatchLocked = Boolean(
                  f.predictions && f.predictions.length > 0 && f.predictions.every((p: any) => p.isLocked)
                );
                const pBest = f.predictions && f.predictions.length > 0
                  ? [...f.predictions].sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0))[0]
                  : null;

                const topConf = pBest?.confidence || 82;
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
                  lockReason: null,
                  freeTipIndex: idx,
                  odds: {
                    home: f.odds?.home ? String(f.odds.home) : "1.75",
                    draw: f.odds?.draw ? String(f.odds.draw) : "3.50",
                    away: f.odds?.away ? String(f.odds.away) : "4.20",
                  },
                  predictions: {
                    pickScore: { pick: pBest?.selection || null, odd: pBest?.odd ? String(pBest.odd) : "1.75" },
                    goals: { pick: null, odd: null },
                    btts: { pick: null, odd: null },
                    bestTip: { pick: pBest?.selection || null, odd: pBest?.odd ? String(pBest.odd) : "1.75" },
                  },
                  confidence: `${topConf}%`,
                  predictedScore: f.predictedScore || null,
                  expectedGoals: f.expectedGoals || null,
                };
              });
              matches = fallbackMatches;
            }
          } catch (fallbackErr: any) {
            console.warn(`[MatchStore] Fallback provider query notice:`, fallbackErr.message);
          }
        }
      } catch (err: any) {
        console.warn(`[MatchStore] On-demand auto-scrape notice for d=${d}:`, err.message);
      }
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

  async findMatchById(id: string): Promise<MatchData | null> {
    // 1. Search all in-memory date caches
    for (const list of this.cache.values()) {
      const found = list.find((m) => m.id === id || m.url?.includes(id));
      if (found) return found;
    }

    // 2. Query Prisma database
    try {
      const df = await prisma.fixture.findFirst({
        where: {
          OR: [{ externalId: id }, { id }],
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: { include: { country: true } },
          predictions: true,
          odds: true,
        },
      });

      if (df) {
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
          kickTime: df.kickoffTime
            ? new Date(df.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : null,
          status: activeStatus.toLowerCase(),
          homeScore:
            live?.homeScore !== undefined && live.homeScore !== null
              ? String(live.homeScore)
              : df.homeScore !== null
              ? String(df.homeScore)
              : null,
          awayScore:
            live?.awayScore !== undefined && live.awayScore !== null
              ? String(live.awayScore)
              : df.awayScore !== null
              ? String(df.awayScore)
              : null,
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
            bestTip: {
              pick: df.predictions?.[0]?.selection || "1",
              odd: String(df.predictions?.[0]?.odd || "1.75"),
              confidence: df.predictions?.[0]?.confidence || 75,
            },
          },
          confidence: df.predictions?.[0]?.confidence ? `${df.predictions[0].confidence}%` : "84%",
          isLocked: false,
        };
      }
    } catch (err) {
      console.warn("[MatchStore] findMatchById error:", err);
    }

    return null;
  }

  async getLiveMatches(d: string = "0"): Promise<MatchData[]> {
    const { matches } = await this.getMatches(d);
    return matches.filter((m) => m.isLive || isMatchLive(m.status, m.elapsed));
  }

  /**
   * Persist AI Progress Stats to PostgreSQL and in-memory cache
   */
  async saveProgressStats(data: any): Promise<void> {
    try {
      this.progressCache = data;
      await prisma.aiProgressStats.upsert({
        where: { recordDate: data.recordDate },
        update: {
          overallRate: data.overallRate,
          overallCorrect: data.overallCorrect,
          overallTotal: data.overallTotal,
          bankersRate: data.bankersRate,
          bankersCorrect: data.bankersCorrect,
          bankersTotal: data.bankersTotal,
          matchesPredicted: data.matchesPredicted,
          daysTracked: data.daysTracked,
          monthlyBreakdown: data.monthlyBreakdown,
          recentForm: data.recentForm,
          lastScrapedAt: new Date(data.scrapedAt || Date.now()),
        },
        create: {
          recordDate: data.recordDate,
          overallRate: data.overallRate,
          overallCorrect: data.overallCorrect,
          overallTotal: data.overallTotal,
          bankersRate: data.bankersRate,
          bankersCorrect: data.bankersCorrect,
          bankersTotal: data.bankersTotal,
          matchesPredicted: data.matchesPredicted,
          daysTracked: data.daysTracked,
          monthlyBreakdown: data.monthlyBreakdown,
          recentForm: data.recentForm,
          lastScrapedAt: new Date(data.scrapedAt || Date.now()),
        },
      });
      console.log(`[MatchStore] Successfully saved AI Progress Stats to database for date ${data.recordDate}`);
    } catch (err: any) {
      console.warn("[MatchStore] Failed to persist progress stats to DB:", err.message);
    }
  }

  /**
   * Get latest AI Progress Stats from DB or cache
   */
  async getProgressStats(): Promise<any | null> {
    if (this.progressCache) return this.progressCache;
    try {
      const record = await prisma.aiProgressStats.findFirst({
        orderBy: { recordDate: "desc" },
      });
      if (record) {
        this.progressCache = {
          recordDate: record.recordDate,
          overallRate: record.overallRate,
          overallCorrect: record.overallCorrect,
          overallTotal: record.overallTotal,
          bankersRate: record.bankersRate,
          bankersCorrect: record.bankersCorrect,
          bankersTotal: record.bankersTotal,
          matchesPredicted: record.matchesPredicted,
          daysTracked: record.daysTracked,
          monthlyBreakdown: record.monthlyBreakdown,
          recentForm: record.recentForm,
          scrapedAt: record.lastScrapedAt.toISOString(),
        };
        return this.progressCache;
      }
    } catch (err: any) {
      console.warn("[MatchStore] Failed to fetch progress stats from DB:", err.message);
    }
    return null;
  }
}

export const store = new MatchStore();
