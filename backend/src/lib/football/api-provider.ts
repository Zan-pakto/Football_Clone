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
} from "./types";
import { mockFootballProvider } from "./mock-provider";

export class ApiFootballProvider implements FootballDataProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl: string = "https://v3.football.api-sports.io") {
    this.apiKey = apiKey || process.env.API_FOOTBALL_KEY || "";
    this.baseUrl = baseUrl;
  }

  async getFixtures(date: string, filter?: FixtureFilter): Promise<Fixture[]> {
    if (!this.apiKey) {
      console.warn("[ApiFootballProvider] API Key not configured. Falling back to MockFootballProvider.");
      return mockFootballProvider.getFixtures(date, filter);
    }
    return mockFootballProvider.getFixtures(date, filter);
  }

  async getGroupedFixtures(date: string, filter?: FixtureFilter): Promise<LeagueGroupedFixtures[]> {
    return mockFootballProvider.getGroupedFixtures(date, filter);
  }

  async getFixtureById(id: string): Promise<Fixture | null> {
    return mockFootballProvider.getFixtureById(id);
  }

  async getLiveFixtures(): Promise<Fixture[]> {
    return mockFootballProvider.getLiveFixtures();
  }

  async getOdds(fixtureId: string): Promise<OddsValue | null> {
    return mockFootballProvider.getOdds(fixtureId);
  }

  async getTeamStats(teamId: string): Promise<TeamStats | null> {
    return mockFootballProvider.getTeamStats(teamId);
  }

  async getInjuries(teamId: string): Promise<Injury[]> {
    return mockFootballProvider.getInjuries(teamId);
  }

  async getLineups(fixtureId: string): Promise<{ home?: Lineup; away?: Lineup }> {
    return mockFootballProvider.getLineups(fixtureId);
  }

  async getPredictions(fixtureId: string): Promise<Prediction[]> {
    return mockFootballProvider.getPredictions(fixtureId);
  }
}

export const apiFootballProvider = new ApiFootballProvider();
