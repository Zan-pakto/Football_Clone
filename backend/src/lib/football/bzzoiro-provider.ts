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
  League,
  Country,
} from "./types";
import { getCountryFlagUrl } from "../flags";

interface BzzoiroEvent {
  id: number;
  league_id: number;
  season_id?: number;
  home_team_id: number;
  home_team: string;
  away_team_id: number;
  away_team: string;
  event_date: string;
  status: string; // "notstarted" | "inprogress" | "finished" | "postponed" | "cancelled"
  period?: string;
  current_minute?: number | null;
  home_score?: number | null;
  away_score?: number | null;
  home_score_ht?: number | null;
  away_score_ht?: number | null;
  is_local_derby?: boolean;
  travel_distance_km?: number | null;
  weather?: {
    code?: number | null;
    description?: string | null;
    wind_speed?: number | null;
    temperature_c?: number | null;
  };
  head_to_head?: {
    total_matches?: number;
    home_wins?: number;
    draws?: number;
    away_wins?: number;
    home_goals?: number;
    away_goals?: number;
    avg_total_goals?: number;
    home_win_rate?: number;
    away_win_rate?: number;
    recent_matches?: Array<{
      date: string;
      home: string;
      away: string;
      score: string;
      home_score?: number;
      away_score?: number;
    }>;
  };
  has_xg?: boolean;
  highlights?: Array<{
    kind: string;
    title: string;
    url: string;
    thumbnail: string;
    published_at: string;
  }>;
}

interface BzzoiroLeague {
  id: number;
  name: string;
  country: string;
  is_active: boolean;
}

export interface BzzoiroPredictionItem {
  id: number;
  created_at: string;
  event: {
    id: number;
    event_date: string;
    status: string;
    home_team_id: number;
    home_team: string;
    away_team_id: number;
    away_team: string;
    league_id: number;
    league_name?: string;
  };
  markets: {
    match_result?: {
      prob_home?: number;
      prob_draw?: number;
      prob_away?: number;
      predicted?: "H" | "D" | "A";
    };
    expected_goals?: {
      home?: number;
      away?: number;
    };
    over_under?: {
      prob_over_15?: number;
      prob_over_25?: number;
      prob_over_35?: number;
    };
    btts?: {
      prob_yes?: number;
    };
    score?: {
      most_likely?: string;
    };
    draw_no_bet?: {
      prob_home?: number;
    };
    corners?: {
      prob_over_85?: number;
      prob_over_95?: number;
      prob_over_105?: number;
    };
  };
  recommendations?: {
    favorite?: string;
    favorite_prob?: number;
    bet_favorite?: boolean;
    over_15?: boolean;
    over_25?: boolean;
    over_35?: boolean;
    btts?: boolean;
    winner?: boolean;
  };
  model?: {
    confidence?: number;
    version?: string;
  };
}

export class BzzoiroFootballProvider implements FootballDataProvider {
  private apiKey: string;
  private baseUrl: string;
  private leaguesCache: Map<number, BzzoiroLeague> = new Map();
  private leaguesCachedAt: number = 0;
  private predictionsCache: Map<string, Map<number, BzzoiroPredictionItem>> = new Map();
  private predictionsCachedAt: Map<string, number> = new Map();

  constructor() {
    this.apiKey = process.env.BZZOIRO_API_KEY || "5dd396510cdf013ca78b775dbb0f2c2fdfc5953b";
    this.baseUrl = (process.env.BZZOIRO_BASE_URL || "https://sports.bzzoiro.com/api/v2").replace(/\/+$/, "");
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Token ${this.apiKey}`,
      Accept: "application/json",
    };
  }

  /**
   * Resolve date parameter ("0", "1", "-1", "today", "tomorrow", "yesterday", or "YYYY-MM-DD")
   */
  private resolveDate(dateParam: string): string {
    if (!dateParam || dateParam === "0" || dateParam === "today") {
      return new Date().toISOString().split("T")[0];
    }
    if (dateParam === "1" || dateParam === "tomorrow") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    }
    if (dateParam === "-1" || dateParam === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split("T")[0];
    }
    const num = parseInt(dateParam, 10);
    if (!isNaN(num) && String(num) === dateParam) {
      const target = new Date();
      target.setDate(target.getDate() + num);
      return target.toISOString().split("T")[0];
    }
    return dateParam;
  }

  /**
   * Fetch and cache all available leagues from Bzzoiro
   */
  private async getLeaguesMap(): Promise<Map<number, BzzoiroLeague>> {
    const now = Date.now();
    if (this.leaguesCache.size > 0 && now - this.leaguesCachedAt < 3600000) {
      return this.leaguesCache;
    }

    try {
      const res = await fetch(`${this.baseUrl}/leagues/?limit=200`, {
        headers: this.headers,
      });
      if (res.ok) {
        const data = await res.json() as any;
        if (data && Array.isArray(data.results)) {
          this.leaguesCache.clear();
          for (const lg of data.results) {
            this.leaguesCache.set(lg.id, {
              id: lg.id,
              name: lg.name,
              country: lg.country || "International",
              is_active: Boolean(lg.is_active),
            });
          }
          this.leaguesCachedAt = now;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch Bzzoiro leagues:", err);
    }
    return this.leaguesCache;
  }

  /**
   * On-demand lookup for any league not in the initial cache
   */
  public async getLeagueInfo(leagueId: number): Promise<BzzoiroLeague | undefined> {
    if (this.leaguesCache.has(leagueId)) {
      return this.leaguesCache.get(leagueId);
    }
    try {
      const res = await fetch(`${this.baseUrl}/leagues/${leagueId}/`, {
        headers: this.headers,
      });
      if (res.ok) {
        const lg = (await res.json()) as any;
        if (lg && lg.name) {
          const info: BzzoiroLeague = {
            id: lg.id,
            name: lg.name,
            country: lg.country || "International",
            is_active: Boolean(lg.is_active),
          };
          this.leaguesCache.set(leagueId, info);
          return info;
        }
      }
    } catch {
      // fallback silently
    }
    return undefined;
  }

  /**
   * Fetch and cache AI model predictions from Bzzoiro for a date
   */
  public async getPredictionsMap(dateStr: string): Promise<Map<number, BzzoiroPredictionItem>> {
    const now = Date.now();
    const cachedAt = this.predictionsCachedAt.get(dateStr) || 0;
    if (this.predictionsCache.has(dateStr) && now - cachedAt < 600000) {
      return this.predictionsCache.get(dateStr)!;
    }

    const map = new Map<number, BzzoiroPredictionItem>();
    try {
      const url = `${this.baseUrl}/predictions/?date_from=${dateStr}&date_to=${dateStr}&limit=200`;
      const res = await fetch(url, { headers: this.headers });
      if (res.ok) {
        const data = await res.json() as any;
        if (data && Array.isArray(data.results)) {
          for (const item of data.results) {
            if (item.event?.id) {
              map.set(item.event.id, item);
            }
          }
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch Bzzoiro predictions for ${dateStr}:`, err);
    }

    this.predictionsCache.set(dateStr, map);
    this.predictionsCachedAt.set(dateStr, now);
    return map;
  }

  private getCountryFlag(countryName: string): string {
    const lower = countryName.toLowerCase().trim();
    if (lower === "rica" || lower.includes("costa rica") || lower.includes("costa-rica")) return "/flags/costa-rica.png";
    if (lower.includes("england") || lower.includes("premier")) return "/flags/england.png";
    if (lower.includes("spain") || lower.includes("laliga")) return "/flags/spain.png";
    if (lower.includes("italy") || lower.includes("serie a")) return "/flags/italy.png";
    if (lower.includes("germany") || lower.includes("bundesliga")) return "/flags/germany.png";
    if (lower.includes("france") || lower.includes("ligue 1")) return "/flags/france.png";
    if (lower.includes("brazil") || lower.includes("brasil") || lower.includes("serie b")) return "/flags/brazil.png";
    if (lower.includes("argentina")) return "/flags/argentina.png";
    if (lower.includes("nigeria") || lower.includes("npfl")) return "/flags/nigeria.png";
    if (lower.includes("netherlands") || lower.includes("holland") || lower.includes("eredivisie")) return "/flags/netherlands.png";
    if (lower.includes("portugal") || lower.includes("primeira")) return "/flags/portugal.png";
    if (lower.includes("belgium") || lower.includes("pro league")) return "/flags/belgium.png";
    if (lower.includes("denmark") || lower.includes("superliga")) return "/flags/denmark.png";
    if (lower.includes("finland") || lower.includes("veikkausliiga") || lower.includes("kakkonen")) return "/flags/finland.png";
    if (lower.includes("greece") || lower.includes("super league")) return "/flags/greece.png";
    if (lower.includes("bulgaria")) return "/flags/bulgaria.png";
    if (lower.includes("china")) return "/flags/china.png";
    if (lower.includes("japan") || lower.includes("j1")) return "/flags/japan.png";
    if (lower.includes("australia") || lower.includes("a-league")) return "/flags/australia.png";
    if (lower.includes("colombia")) return "/flags/colombia.png";
    if (lower.includes("mexico") || lower.includes("liga mx")) return "/flags/mexico.png";
    if (lower.includes("morocco") || lower.includes("botola")) return "/flags/morocco.png";
    if (lower.includes("turkey") || lower.includes("super lig")) return "/flags/turkey.png";
    if (lower.includes("scotland")) return "/flags/scotland.png";
    if (lower.includes("europe") || lower.includes("uefa") || lower.includes("champions")) return "/flags/europe.png";
    if (lower.includes("africa") || lower.includes("caf")) return "/flags/nigeria.png";
    return getCountryFlagUrl(countryName);
  }

  /**
   * Map Bzzoiro AI model predictions directly to application Prediction model
   */
  private mapBzzoiroPredictionToAppPredictions(
    eventId: number,
    pred: BzzoiroPredictionItem | undefined,
    event?: BzzoiroEvent
  ): {
    predictions: Prediction[];
    predictedScore?: string;
    expectedGoals?: { home?: number | null; away?: number | null };
  } {
    const fixtureId = String(eventId);

    if (pred && pred.markets) {
      const mr = pred.markets.match_result;
      const ou = pred.markets.over_under;
      const btts = pred.markets.btts;
      const xg = pred.markets.expected_goals;
      const score = pred.markets.score?.most_likely;
      const corners = pred.markets.corners;
      const modelVer = pred.model?.version || "dc-blend-v1";

      // 1X2 Market
      let pick1x2 = "1";
      let prob1x2 = (mr?.prob_home || 45) / 100;
      let conf1x2 = Math.round(mr?.prob_home || 45);

      if (mr?.predicted === "H") {
        pick1x2 = "1";
        conf1x2 = Math.round(mr?.prob_home || 50);
        prob1x2 = conf1x2 / 100;
      } else if (mr?.predicted === "D") {
        pick1x2 = "X";
        conf1x2 = Math.round(mr?.prob_draw || 33);
        prob1x2 = conf1x2 / 100;
      } else if (mr?.predicted === "A") {
        pick1x2 = "2";
        conf1x2 = Math.round(mr?.prob_away || 45);
        prob1x2 = conf1x2 / 100;
      }

      const odd1x2 = Number((1 / Math.max(0.2, prob1x2)).toFixed(2));

      // Over / Under 2.5 Market
      const probOver25 = ou?.prob_over_25 ?? 50;
      const isOver = probOver25 >= 50;
      const pickOU = isOver ? "Over 2.5" : "Under 2.5";
      const confOU = Math.round(isOver ? probOver25 : 100 - probOver25);
      const probOU = confOU / 100;
      const oddOU = Number((1 / Math.max(0.2, probOU)).toFixed(2));

      // BTTS Market
      const probBtts = btts?.prob_yes ?? 50;
      const isBtts = probBtts >= 50;
      const pickBtts = isBtts ? "Yes" : "No";
      const confBtts = Math.round(isBtts ? probBtts : 100 - probBtts);
      const probBttsNorm = confBtts / 100;
      const oddBtts = Number((1 / Math.max(0.2, probBttsNorm)).toFixed(2));

      const preds: Prediction[] = [
        {
          fixtureId,
          market: "1X2",
          selection: pick1x2,
          confidence: conf1x2,
          probability: prob1x2,
          odd: odd1x2,
          isPremium: false,
          status: "PENDING",
          source: "BZZOIRO_AI_PREDICTION",
          predictedScore: score,
          expectedGoals: xg ? { home: xg.home, away: xg.away } : undefined,
          corners: corners
            ? {
                over85: corners.prob_over_85,
                over95: corners.prob_over_95,
                over105: corners.prob_over_105,
              }
            : undefined,
          modelVersion: modelVer,
        },
        {
          fixtureId,
          market: "OVER_UNDER",
          selection: pickOU,
          confidence: confOU,
          probability: probOU,
          odd: oddOU,
          isPremium: false,
          status: "PENDING",
          source: "BZZOIRO_AI_PREDICTION",
          predictedScore: score,
          expectedGoals: xg ? { home: xg.home, away: xg.away } : undefined,
          modelVersion: modelVer,
        },
        {
          fixtureId,
          market: "BTTS",
          selection: pickBtts,
          confidence: confBtts,
          probability: probBttsNorm,
          odd: oddBtts,
          isPremium: true,
          status: "PENDING",
          source: "BZZOIRO_AI_PREDICTION",
          predictedScore: score,
          expectedGoals: xg ? { home: xg.home, away: xg.away } : undefined,
          modelVersion: modelVer,
        },
      ];

      return {
        predictions: preds,
        predictedScore: score,
        expectedGoals: xg ? { home: xg.home, away: xg.away } : undefined,
      };
    }

    // If event has no precomputed ML prediction in the current batch, calculate from real H2H stats
    if (event) {
      const h2h = event.head_to_head;
      let homeWinRate = h2h?.home_win_rate ?? 0.48;
      let awayWinRate = h2h?.away_win_rate ?? 0.28;
      let avgGoals = h2h?.avg_total_goals ?? 2.4;

      if (h2h && h2h.total_matches && h2h.total_matches > 0) {
        homeWinRate = (h2h.home_wins || 0) / h2h.total_matches;
        awayWinRate = (h2h.away_wins || 0) / h2h.total_matches;
        avgGoals = (h2h.home_goals || 0 + (h2h.away_goals || 0)) / h2h.total_matches;
      }

      let pick1x2 = "1";
      let confidence1x2 = 82;
      let odd1x2 = 1.85;

      if (homeWinRate >= 0.5) {
        pick1x2 = "1";
        confidence1x2 = Math.min(92, Math.round(homeWinRate * 100 + 32));
        odd1x2 = Number((1 / Math.max(0.4, homeWinRate)).toFixed(2));
      } else if (awayWinRate >= 0.45) {
        pick1x2 = "2";
        confidence1x2 = Math.min(88, Math.round(awayWinRate * 100 + 35));
        odd1x2 = Number((1 / Math.max(0.35, awayWinRate)).toFixed(2));
      } else {
        pick1x2 = "1X";
        confidence1x2 = 86;
        odd1x2 = 1.42;
      }

      const isOver = avgGoals >= 2.2;
      const pickOverUnder = isOver ? "Over 2.5" : "Under 2.5";
      const confidenceGoals = Math.min(89, Math.round(74 + Math.abs(avgGoals - 2.5) * 10));
      const oddGoals = isOver ? 1.78 : 1.95;

      const pickBtts = avgGoals >= 2.1 ? "Yes" : "No";
      const confidenceBtts = Math.min(86, Math.round(76 + avgGoals * 4));
      const oddBtts = pickBtts === "Yes" ? 1.82 : 1.9;

      const preds: Prediction[] = [
        {
          fixtureId,
          market: "1X2",
          selection: pick1x2,
          confidence: confidence1x2,
          probability: Number((confidence1x2 / 100).toFixed(2)),
          odd: odd1x2,
          isPremium: false,
          status: "PENDING",
          source: "BZZOIRO_H2H_MODEL",
        },
        {
          fixtureId,
          market: "OVER_UNDER",
          selection: pickOverUnder,
          confidence: confidenceGoals,
          probability: Number((confidenceGoals / 100).toFixed(2)),
          odd: oddGoals,
          isPremium: false,
          status: "PENDING",
          source: "BZZOIRO_H2H_MODEL",
        },
        {
          fixtureId,
          market: "BTTS",
          selection: pickBtts,
          confidence: confidenceBtts,
          probability: Number((confidenceBtts / 100).toFixed(2)),
          odd: oddBtts,
          isPremium: true,
          status: "PENDING",
          source: "BZZOIRO_H2H_MODEL",
        },
      ];

      return { predictions: preds };
    }

    return { predictions: [] };
  }

  /**
   * Convert a Bzzoiro Event to application Fixture
   */
  private mapEventToFixture(
    event: BzzoiroEvent,
    leaguesMap: Map<number, BzzoiroLeague>,
    predictionsMap?: Map<number, BzzoiroPredictionItem>
  ): Fixture {
    const leagueInfo = leaguesMap.get(event.league_id);
    const leagueName = leagueInfo?.name || `League ${event.league_id}`;
    const countryName = leagueInfo?.country || "International";
    const flagUrl = this.getCountryFlag(countryName);

    const dateStr = event.event_date.split("T")[0];

    // Status mapping
    let status: Fixture["status"] = "UPCOMING";
    if (event.status === "inprogress" || event.status === "live") {
      status = "LIVE";
    } else if (event.status === "finished") {
      status = "FINISHED";
    } else if (event.status === "postponed") {
      status = "POSTPONED";
    } else if (event.status === "cancelled") {
      status = "CANCELLED";
    }

    const predItem = predictionsMap ? predictionsMap.get(event.id) : undefined;
    const { predictions, predictedScore, expectedGoals } =
      this.mapBzzoiroPredictionToAppPredictions(event.id, predItem, event);

    return {
      id: String(event.id),
      externalId: String(event.id),
      leagueId: String(event.league_id),
      league: {
        id: String(event.league_id),
        name: leagueName,
        externalId: String(event.league_id),
        isActive: true,
        country: {
          id: countryName.toLowerCase().replace(/\s+/g, "-"),
          name: countryName,
          flag: flagUrl,
        },
      },
      homeTeamId: String(event.home_team_id),
      homeTeam: {
        id: String(event.home_team_id),
        name: event.home_team,
        externalId: String(event.home_team_id),
      },
      awayTeamId: String(event.away_team_id),
      awayTeam: {
        id: String(event.away_team_id),
        name: event.away_team,
        externalId: String(event.away_team_id),
      },
      matchDate: dateStr,
      kickoffTime: event.event_date,
      status,
      elapsed: event.current_minute ? `${event.current_minute}'` : event.period || null,
      homeScore:
        event.home_score !== null && event.home_score !== undefined
          ? Number(event.home_score)
          : null,
      awayScore:
        event.away_score !== null && event.away_score !== undefined
          ? Number(event.away_score)
          : null,
      homeScoreHT:
        event.home_score_ht !== null && event.home_score_ht !== undefined
          ? Number(event.home_score_ht)
          : null,
      awayScoreHT:
        event.away_score_ht !== null && event.away_score_ht !== undefined
          ? Number(event.away_score_ht)
          : null,
      venue: event.is_local_derby ? "Local Derby Arena" : undefined,
      predictions,
      predictedScore,
      expectedGoals,
      odds: {
        home: predictions[0]?.odd || 1.85,
        draw: 3.4,
        away: 4.1,
        over: predictions[1]?.odd || 1.8,
        under: 2.0,
        bookmaker: "Bzzoiro Consensus",
      },
      highlights: event.highlights,
      headToHead: event.head_to_head,
    };
  }

  async getFixtures(date: string = "0", filter?: FixtureFilter): Promise<Fixture[]> {
    const targetDate = this.resolveDate(date);

    try {
      const [leaguesMap, predictionsMap] = await Promise.all([
        this.getLeaguesMap(),
        this.getPredictionsMap(targetDate),
      ]);
      const allEvents: BzzoiroEvent[] = [];

      const queryParams = new URLSearchParams({
        date_from: targetDate,
        date_to: targetDate,
        limit: "100",
      });

      if (filter?.status && filter.status !== "ALL") {
        queryParams.set("status", filter.status.toLowerCase());
      }
      if (filter?.league) {
        queryParams.set("league_id", filter.league);
      }
      if (filter?.search) {
        queryParams.set("team_name", filter.search);
      }

      let nextUrl: string | null = `${this.baseUrl}/events/?${queryParams.toString()}`;
      let pageCount = 0;

      while (nextUrl && pageCount < 3) {
        const response: Response = await fetch(nextUrl, {
          headers: this.headers,
        });

        if (response.ok) {
          const payload: any = await response.json();
          if (payload && Array.isArray(payload.results)) {
            allEvents.push(...payload.results);
            nextUrl = payload.next || null;
            pageCount++;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      if (allEvents.length > 0) {
        return allEvents.map((e: BzzoiroEvent) =>
          this.mapEventToFixture(e, leaguesMap, predictionsMap)
        );
      }
    } catch (err) {
      console.warn("Bzzoiro getFixtures failed:", err);
    }

    return [];
  }

  async getGroupedFixtures(
    date: string = "0",
    filter?: FixtureFilter
  ): Promise<LeagueGroupedFixtures[]> {
    const fixtures = await this.getFixtures(date, filter);
    if (!fixtures || fixtures.length === 0) {
      return [];
    }

    const map = new Map<string, { league: League; country: Country; fixtures: Fixture[] }>();

    for (const f of fixtures) {
      const leagueName = f.league?.name || "Global League";
      const countryName = f.league?.country?.name || "International";
      const key = `${countryName} - ${leagueName}`;

      if (!map.has(key)) {
        map.set(key, {
          league: f.league || {
            id: key,
            name: leagueName,
            externalId: key,
            isActive: true,
          },
          country: f.league?.country || {
            id: countryName.toLowerCase().replace(/\s+/g, "-"),
            name: countryName,
          },
          fixtures: [],
        });
      }

      map.get(key)!.fixtures.push(f);
    }

    return Array.from(map.values());
  }

  async getIncidents(fixtureId: string): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/events/${fixtureId}/incidents/`, {
        headers: this.headers,
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data && Array.isArray(data.incidents)) {
          return data.incidents;
        }
      }
    } catch (err) {
      console.warn(`Bzzoiro getIncidents(${fixtureId}) error:`, err);
    }
    return [];
  }

  async getFixtureById(id: string): Promise<Fixture | null> {
    try {
      const leaguesMap = await this.getLeaguesMap();
      const res = await fetch(`${this.baseUrl}/events/${id}/`, {
        headers: this.headers,
      });

      if (res.ok) {
        const event = (await res.json()) as any;
        if (event && event.id) {
          const dateStr = event.event_date
            ? event.event_date.split("T")[0]
            : new Date().toISOString().split("T")[0];

          const [predictionsMap, odds, lineups, statsData, incidentsData] = await Promise.all([
            this.getPredictionsMap(dateStr),
            this.getOdds(id),
            this.getLineups(id),
            this.getStats(id),
            this.getIncidents(id),
          ]);

          const fixture = this.mapEventToFixture(event, leaguesMap, predictionsMap);

          if (odds) {
            fixture.odds = odds;
          }
          if (lineups && (lineups.home || lineups.away)) {
            fixture.lineups = lineups;
            fixture.lineupStatus = lineups.lineupStatus;
          }
          if (statsData) {
            fixture.shotmap = statsData.shotmap;
            fixture.momentum = statsData.momentum;
            fixture.stats = statsData.stats;
          }
          if (incidentsData && incidentsData.length > 0) {
            fixture.incidents = incidentsData;
          }

          return fixture;
        }
      }
    } catch (err) {
      console.warn(`Bzzoiro getFixtureById(${id}) error:`, err);
    }

    return null;
  }

  async getLiveFixtures(): Promise<Fixture[]> {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const [leaguesMap, predictionsMap] = await Promise.all([
        this.getLeaguesMap(),
        this.getPredictionsMap(todayStr),
      ]);
      const res = await fetch(`${this.baseUrl}/events/live/`, {
        headers: this.headers,
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        if (data && Array.isArray(data.events) && data.events.length > 0) {
          return data.events.map((e: BzzoiroEvent) =>
            this.mapEventToFixture(e, leaguesMap, predictionsMap)
          );
        }
      }
    } catch (err) {
      console.warn("Bzzoiro getLiveFixtures error:", err);
    }

    return [];
  }

  async getOdds(fixtureId: string): Promise<OddsValue | null> {
    try {
      const res = await fetch(`${this.baseUrl}/events/${fixtureId}/odds/`, {
        headers: this.headers,
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data && data.odds) {
          return {
            home: data.odds.home_win || null,
            draw: data.odds.draw || null,
            away: data.odds.away_win || null,
            over: data.odds.over_25_goals || null,
            under: data.odds.under_25_goals || null,
            bookmaker: "Bzzoiro Consensus",
          };
        }
      }
    } catch (err) {
      console.warn(`Bzzoiro getOdds(${fixtureId}) error:`, err);
    }

    // Fallback query parameter
    try {
      const res = await fetch(`${this.baseUrl}/odds/?event_id=${fixtureId}`, {
        headers: this.headers,
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          let home: number | undefined;
          let draw: number | undefined;
          let away: number | undefined;
          let over: number | undefined;
          let under: number | undefined;

          for (const odd of data.results) {
            if (odd.market === "1x2") {
              if (odd.outcome === "HOME") home = odd.decimal_odds;
              if (odd.outcome === "DRAW") draw = odd.decimal_odds;
              if (odd.outcome === "AWAY") away = odd.decimal_odds;
            }
            if (odd.market === "total_goals") {
              if (odd.outcome === "OVER") over = odd.decimal_odds;
              if (odd.outcome === "UNDER") under = odd.decimal_odds;
            }
          }

          if (home || draw || away) {
            return {
              home: home || null,
              draw: draw || null,
              away: away || null,
              over: over || null,
              under: under || null,
              bookmaker: data.results[0]?.bookmaker_name || "Bzzoiro Consensus",
            };
          }
        }
      }
    } catch (err) {
      console.warn(`Bzzoiro getOdds fallback error:`, err);
    }

    return null;
  }

  async getStats(fixtureId: string): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/events/${fixtureId}/stats/`, {
        headers: this.headers,
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn(`Bzzoiro getStats(${fixtureId}) error:`, err);
    }
    return null;
  }

  async getLineups(
    fixtureId: string
  ): Promise<{ home?: Lineup; away?: Lineup; lineupStatus?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/events/${fixtureId}/lineups/`, {
        headers: this.headers,
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data && data.lineups) {
          const homePlayers = (data.lineups.home?.players || []).map((p: any) => ({
            name: p.short_name || p.name || "Player",
            number: p.jersey_number || 0,
            position: p.position || "M",
          }));
          const awayPlayers = (data.lineups.away?.players || []).map((p: any) => ({
            name: p.short_name || p.name || "Player",
            number: p.jersey_number || 0,
            position: p.position || "M",
          }));

          return {
            lineupStatus: data.lineup_status || "confirmed",
            home: {
              fixtureId,
              teamType: "HOME",
              formation: data.lineups.home?.formation || "4-3-3",
              startingXl: homePlayers,
            },
            away: {
              fixtureId,
              teamType: "AWAY",
              formation: data.lineups.away?.formation || "4-3-3",
              startingXl: awayPlayers,
            },
          };
        }
      }
    } catch (err) {
      console.warn(`Bzzoiro getLineups(${fixtureId}) error:`, err);
    }
    return {};
  }

  async getTeamStats(teamId: string): Promise<TeamStats | null> {
    return null;
  }

  async getInjuries(teamId: string): Promise<Injury[]> {
    return [];
  }

  async getPredictions(fixtureId: string): Promise<Prediction[]> {
    const fixture = await this.getFixtureById(fixtureId);
    if (fixture && fixture.predictions && fixture.predictions.length > 0) {
      return fixture.predictions;
    }
    return [];
  }
}

export const bzzoiroFootballProvider = new BzzoiroFootballProvider();
