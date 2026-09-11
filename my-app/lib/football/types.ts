export type FixtureStatus = "UPCOMING" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED";

export type MarketType = "1X2" | "OVER_UNDER" | "BTTS" | "DOUBLE_CHANCE" | "DRAW_NO_BET";

export type SettlementStatus = "PENDING" | "WIN" | "LOSS" | "VOID";

export interface Country {
  id: string;
  name: string;
  code?: string | null;
  flag?: string | null;
}

export interface League {
  id: string;
  countryId?: string | null;
  name: string;
  logo?: string | null;
  country?: Country | null;
  externalId: string;
  isActive: boolean;
}

export interface Team {
  id: string;
  name: string;
  logo?: string | null;
  country?: string | null;
  externalId: string;
}

export interface OddsValue {
  home?: number | null;
  draw?: number | null;
  away?: number | null;
  over?: number | null;
  under?: number | null;
  bookmaker?: string;
}

export interface Prediction {
  id?: string;
  fixtureId: string;
  market: MarketType;
  selection: string; // "1", "X", "2", "Over 2.5", "Yes", "1X", etc.
  confidence: number; // 0 - 100
  probability?: number | null; // 0.0 - 1.0
  odd?: number | null;
  isPremium: boolean;
  isLocked?: boolean;
  status: SettlementStatus;
  source: string;
}

export interface TeamStats {
  teamId: string;
  season: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  failedToScore: number;
}

export interface TeamForm {
  teamId: string;
  form: string; // "WWDWL"
  points: number;
  position?: number | null;
}

export interface Injury {
  teamId: string;
  playerName: string;
  reason: string;
  status: "Out" | "Doubtful" | "Questionable";
}

export interface PlayerInfo {
  name: string;
  number: number;
  position: string;
}

export interface Lineup {
  fixtureId: string;
  teamType: "HOME" | "AWAY";
  formation?: string | null;
  startingXl: PlayerInfo[];
  bench?: PlayerInfo[] | null;
}

export interface PredictionSettlement {
  id?: string;
  predictionId: string;
  fixtureId: string;
  market: MarketType;
  selection: string;
  actualResult: string;
  settlementStatus: SettlementStatus;
  odds?: number | null;
  confidence?: number | null;
  homeScore: number;
  awayScore: number;
  settledAt?: string;
}

export interface Fixture {
  id: string;
  externalId: string;
  leagueId?: string | null;
  league?: League | null;
  homeTeamId: string;
  homeTeam: Team;
  awayTeamId: string;
  awayTeam: Team;
  matchDate: string; // YYYY-MM-DD in UTC
  kickoffTime: string; // ISO UTC string
  status: FixtureStatus;
  elapsed?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  venue?: string | null;
  predictions?: Prediction[];
  odds?: OddsValue;
  stats?: {
    home?: TeamStats;
    away?: TeamStats;
  };
  forms?: {
    home?: TeamForm;
    away?: TeamForm;
  };
  injuries?: Injury[];
  lineups?: {
    home?: Lineup;
    away?: Lineup;
  };
  settlement?: PredictionSettlement;
}

export interface LeagueGroupedFixtures {
  league: League;
  country: Country;
  fixtures: Fixture[];
}

export interface FixtureFilter {
  date?: string; // YYYY-MM-DD
  status?: FixtureStatus | "ALL";
  country?: string;
  league?: string;
  search?: string;
  isPremiumOnly?: boolean;
}
