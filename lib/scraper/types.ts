export interface Odds {
  home: string | null;
  draw: string | null;
  away: string | null;
}

export interface PredictionCell {
  pick: string | null;
  odd: string | null;
  trust?: string | null;
}

export interface Predictions {
  pickScore: PredictionCell;
  goals: PredictionCell;
  btts: PredictionCell;
  bestTip: PredictionCell;
}

export interface MatchData {
  id: string;
  url: string | null;
  leagueId?: string;
  leagueName: string;
  country: string;
  flagUrl: string | null;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string | null;
  awayLogo: string | null;
  kickTime: string | null;
  matchDate?: string;
  status: string; // 'won' | 'lost' | 'upcoming' | 'live' | 'canceled' | 'postponed' | string
  homeScore: string | null;
  awayScore: string | null;
  odds: Odds;
  predictions: Predictions;
  confidence: string | null;
  isLive?: boolean;
  elapsed?: string | null;
  queryTags?: string | null;
}

export interface LeagueGroup {
  groupKey: string;
  bodyId: string;
  leagueName: string;
  country: string;
  flagUrl: string | null;
  matchCount: number;
}

export interface ScrapeResult {
  success: boolean;
  d: string;
  scrapedAt: string;
  leagueCount: number;
  totalMatches: number;
  groupsFound: number;
  matches: MatchData[];
  leagues: LeagueGroup[];
  error?: string;
}

export interface LiveMatchUpdate {
  id: string;
  status: string;
  elapsed?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  redCardsHome?: number | null;
  redCardsAway?: number | null;
}

export interface LiveScrapeResult {
  success: boolean;
  d: string;
  updatedCount: number;
  matches: Record<string, LiveMatchUpdate>;
  error?: string;
}
