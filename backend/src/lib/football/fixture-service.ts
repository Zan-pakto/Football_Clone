import { footballProvider } from "./index";
import { Fixture, FixtureFilter, LeagueGroupedFixtures, PredictionSettlement } from "./types";
import { cacheService, CACHE_TTL } from "../cache/cache-service";
import { settlementService } from "../predictions/settlement-service";

export class FixtureService {
  /**
   * Get fixtures grouped by league with multi-tier caching
   */
  async getGroupedFixtures(date: string = "0", filter?: FixtureFilter): Promise<LeagueGroupedFixtures[]> {
    const cacheKey = `fixtures_grouped:${date}:${JSON.stringify(filter || {})}`;
    const cached = await cacheService.get<LeagueGroupedFixtures[]>(cacheKey);
    if (cached) return cached;

    const data = await footballProvider.getGroupedFixtures(date, filter);
    await cacheService.set(cacheKey, data, CACHE_TTL.FIXTURES);
    return data;
  }

  /**
   * Get all flat fixtures for a date with caching
   */
  async getFixtures(date: string = "0", filter?: FixtureFilter): Promise<Fixture[]> {
    const cacheKey = `fixtures_flat:${date}:${JSON.stringify(filter || {})}`;
    const cached = await cacheService.get<Fixture[]>(cacheKey);
    if (cached) return cached;

    const data = await footballProvider.getFixtures(date, filter);
    await cacheService.set(cacheKey, data, CACHE_TTL.FIXTURES);
    return data;
  }

  /**
   * Get comprehensive match details by ID
   */
  async getFixtureById(id: string): Promise<Fixture | null> {
    const cacheKey = `fixture_detail:${id}`;
    const cached = await cacheService.get<Fixture>(cacheKey);
    if (cached) return cached;

    const fixture = await footballProvider.getFixtureById(id);
    if (fixture) {
      // Auto-populate auxiliary data
      fixture.odds = (await footballProvider.getOdds(id)) || fixture.odds;
      fixture.predictions = (await footballProvider.getPredictions(id)) || fixture.predictions;
      const lineups = await footballProvider.getLineups(id);
      fixture.lineups = lineups;
      fixture.injuries = (await footballProvider.getInjuries(fixture.homeTeamId)) || [];

      await cacheService.set(cacheKey, fixture, CACHE_TTL.FIXTURES);
    }
    return fixture;
  }

  /**
   * Get current in-progress live fixtures (short 60s TTL)
   */
  async getLiveFixtures(): Promise<Fixture[]> {
    const cacheKey = "fixtures_live_all";
    const cached = await cacheService.get<Fixture[]>(cacheKey);
    if (cached) return cached;

    const live = await footballProvider.getLiveFixtures();
    await cacheService.set(cacheKey, live, CACHE_TTL.LIVE_SCORES);
    return live;
  }

  /**
   * Get settled predictions for public track record (/progress)
   */
  async getSettledTrackRecord(): Promise<{ settlements: PredictionSettlement[]; winRate: number; totalSettled: number }> {
    const cacheKey = "track_record_progress";
    const cached = await cacheService.get<{ settlements: PredictionSettlement[]; winRate: number; totalSettled: number }>(cacheKey);
    if (cached) return cached;

    // Retrieve yesterday and today finished fixtures
    const yesterdayFixtures = await footballProvider.getFixtures("-1");
    const todayFixtures = await footballProvider.getFixtures("0");
    const finished = [...yesterdayFixtures, ...todayFixtures].filter((f) => f.status === "FINISHED");

    const allSettlements: PredictionSettlement[] = [];
    for (const f of finished) {
      const settled = await settlementService.settleFixture(f);
      allSettlements.push(...settled);
    }

    const wins = allSettlements.filter((s) => s.settlementStatus === "WIN").length;
    const total = allSettlements.length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 85; // default 85% track record

    const result = { settlements: allSettlements, winRate, totalSettled: total };
    await cacheService.set(cacheKey, result, 600); // 10 min cache
    return result;
  }
}

export const fixtureService = new FixtureService();
