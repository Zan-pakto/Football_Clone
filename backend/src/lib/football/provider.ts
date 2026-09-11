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

export interface FootballDataProvider {
  getFixtures(date: string, filter?: FixtureFilter): Promise<Fixture[]>;
  getGroupedFixtures(date: string, filter?: FixtureFilter): Promise<LeagueGroupedFixtures[]>;
  getFixtureById(id: string): Promise<Fixture | null>;
  getLiveFixtures(): Promise<Fixture[]>;
  getOdds(fixtureId: string): Promise<OddsValue | null>;
  getTeamStats(teamId: string): Promise<TeamStats | null>;
  getInjuries(teamId: string): Promise<Injury[]>;
  getLineups(fixtureId: string): Promise<{ home?: Lineup; away?: Lineup }>;
  getPredictions(fixtureId: string): Promise<Prediction[]>;
}
