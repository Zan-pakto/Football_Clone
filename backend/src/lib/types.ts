export interface Odds {
  home: string | null;
  draw: string | null;
  away: string | null;
}

export interface PredictionCell {
  pick: string | null;
  odd: string | null;
  trust?: string | null;
  isLocked?: boolean;
  market?: string | null;
  marketLabel?: string | null;
  confidence?: number | null;
  rating?: number | null;
  isBest?: boolean;
}

export interface Predictions {
  pickScore: PredictionCell;
  goals: PredictionCell;
  btts: PredictionCell;
  bestTip: PredictionCell & {
    market?: string | null;
    marketLabel?: string | null;
    rating?: number | null;
  };
  bestMarket?: "pickScore" | "goals" | "btts" | string | null;
  isLocked?: boolean;
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
  isLocked?: boolean;
  lockReason?: "free_limit_reached" | "live_kickoff_locked" | "premium_exclusive" | string | null;
  freeTipIndex?: number;
  predictedScore?: string | null;
  expectedGoals?: { home?: number | null; away?: number | null } | null;
}

export interface LeagueGroup {
  groupKey: string;
  bodyId: string;
  leagueName: string;
  country: string;
  flagUrl: string | null;
  matchCount: number;
}

export interface DataSyncResult {
  success: boolean;
  d: string;
  syncedAt: string;
  totalMatches: number;
  matches: MatchData[];
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

export interface LiveSyncResult {
  success: boolean;
  d: string;
  updatedCount: number;
  matches: Record<string, LiveMatchUpdate>;
  error?: string;
}

export type RolloverType = "AI" | "MANUAL";
export type RolloverStatus = "ACTIVE" | "COMPLETED" | "LOST" | "CANCELLED";
export type RolloverStepStatus = "PENDING" | "ACTIVE" | "WON" | "LOST" | "VOID";

export interface RolloverStep {
  id: string;
  rolloverId: string;
  stepNumber: number;
  match: string;
  prediction: string;
  odds: number;
  status: RolloverStepStatus;
  matchDate?: string | null;
  kickoffTime?: string | null;
  stakeAmount?: number | null;
  returnAmount?: number | null;
  resultNote?: string | null;
  fixtureId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Rollover {
  id: string;
  name: string;
  type: RolloverType;
  startingAmount: number;
  currentAmount: number;
  targetSteps: number;
  status: RolloverStatus;
  isPublished: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  steps: RolloverStep[];
  currentStepIndex?: number;
  potentialReturn?: number;
}
