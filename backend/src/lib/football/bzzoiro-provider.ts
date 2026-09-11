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
import { mockFootballProvider } from "./mock-provider";

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
}

interface BzzoiroLeague {
  id: number;
  name: string;
  country: string;
  is_active: boolean;
}

export class BzzoiroFootballProvider implements FootballDataProvider {
  private apiKey: string;
  private baseUrl: string;
  private leaguesCache: Map<number, BzzoiroLeague> = new Map();
  private leaguesCachedAt: number = 0;

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
      const res = await fetch(`${this.baseUrl}/leagues/`, {
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

  private getCountryFlag(countryName: string): string {
    const lower = countryName.toLowerCase().trim();
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
    return "/flags/world.png";
  }

  /**
   * Calculate provisional/dummy AI model predictions for real fixtures
   * (Provisional data until custom model weights are deployed)
   */
  private generatePredictions(event: BzzoiroEvent): Prediction[] {
    const fixtureId = String(event.id);
    const h2h = event.head_to_head;

    let homeWinRate = h2h?.home_win_rate ?? 0.48;
    let awayWinRate = h2h?.away_win_rate ?? 0.28;
    let avgGoals = h2h?.avg_total_goals ?? 2.4;

    if (h2h && h2h.total_matches && h2h.total_matches > 0) {
      homeWinRate = (h2h.home_wins || 0) / h2h.total_matches;
      awayWinRate = (h2h.away_wins || 0) / h2h.total_matches;
      avgGoals = (h2h.home_goals || 0 + (h2h.away_goals || 0)) / h2h.total_matches;
    }

    // 1X2 Selection
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

    // Over / Under 2.5 Goals
    const isOver = avgGoals >= 2.2;
    const pickOverUnder = isOver ? "Over 2.5" : "Under 2.5";
    const confidenceGoals = Math.min(89, Math.round(74 + Math.abs(avgGoals - 2.5) * 10));
    const oddGoals = isOver ? 1.78 : 1.95;

    // Both Teams to Score (BTTS)
    const pickBtts = avgGoals >= 2.1 ? "Yes" : "No";
    const confidenceBtts = Math.min(86, Math.round(76 + avgGoals * 4));
    const oddBtts = pickBtts === "Yes" ? 1.82 : 1.90;

    return [
      {
        fixtureId,
        market: "1X2",
        selection: pick1x2,
        confidence: confidence1x2,
        probability: Number((confidence1x2 / 100).toFixed(2)),
        odd: odd1x2,
        isPremium: false,
        status: "PENDING",
        source: "AI_MODEL_PROVISIONAL",
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
        source: "AI_MODEL_PROVISIONAL",
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
        source: "AI_MODEL_PROVISIONAL",
      },
    ];
  }

  /**
   * Convert a Bzzoiro Event to application Fixture
   */
  private mapEventToFixture(event: BzzoiroEvent, leaguesMap: Map<number, BzzoiroLeague>): Fixture {
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

    const predictions = this.generatePredictions(event);

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
      homeScore: event.home_score !== null && event.home_score !== undefined ? Number(event.home_score) : null,
      awayScore: event.away_score !== null && event.away_score !== undefined ? Number(event.away_score) : null,
      venue: event.is_local_derby ? "Local Derby Arena" : undefined,
      predictions,
      odds: {
        home: predictions[0]?.odd || 1.85,
        draw: 3.4,
        away: 4.1,
        over: predictions[1]?.odd || 1.8,
        under: 2.0,
        bookmaker: "Consensus",
      },
    };
  }

  async getFixtures(date: string = "0", filter?: FixtureFilter): Promise<Fixture[]> {
    const targetDate = this.resolveDate(date);

    try {
      const leaguesMap = await this.getLeaguesMap();
      const allEvents: BzzoiroEvent[] = [];

      const queryParams = new URLSearchParams({
        date_from: targetDate,
        date_to: targetDate,
        limit: "100",
      });

      if (filter?.status) {
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
        const fixtures = allEvents.map((e: BzzoiroEvent) => this.mapEventToFixture(e, leaguesMap));
        return fixtures;
      }
    } catch (err) {
      console.warn("Bzzoiro getFixtures failed, falling back to mock provider:", err);
    }

    // Fallback to mock provider if date has no fixtures or error
    return mockFootballProvider.getFixtures(date, filter);
  }

  async getGroupedFixtures(date: string = "0", filter?: FixtureFilter): Promise<LeagueGroupedFixtures[]> {
    const fixtures = await this.getFixtures(date, filter);
    if (!fixtures || fixtures.length === 0) {
      return mockFootballProvider.getGroupedFixtures(date, filter);
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

  async getFixtureById(id: string): Promise<Fixture | null> {
    try {
      const leaguesMap = await this.getLeaguesMap();
      const res = await fetch(`${this.baseUrl}/events/${id}/`, {
        headers: this.headers,
      });

      if (res.ok) {
        const event = await res.json() as any;
        if (event && event.id) {
          return this.mapEventToFixture(event, leaguesMap);
        }
      }
    } catch (err) {
      console.warn(`Bzzoiro getFixtureById(${id}) error:`, err);
    }

    return mockFootballProvider.getFixtureById(id);
  }

  async getLiveFixtures(): Promise<Fixture[]> {
    try {
      const leaguesMap = await this.getLeaguesMap();
      const res = await fetch(`${this.baseUrl}/events/live/`, {
        headers: this.headers,
      });

      if (res.ok) {
        const data = await res.json() as any;
        if (data && Array.isArray(data.events) && data.events.length > 0) {
          return data.events.map((e: BzzoiroEvent) => this.mapEventToFixture(e, leaguesMap));
        }
      }
    } catch (err) {
      console.warn("Bzzoiro getLiveFixtures error:", err);
    }

    // If 0 live matches on Bzzoiro at this moment, check mock provider for active demonstration
    return mockFootballProvider.getLiveFixtures();
  }

  async getOdds(fixtureId: string): Promise<OddsValue | null> {
    try {
      const res = await fetch(`${this.baseUrl}/odds/?event_id=${fixtureId}`, {
        headers: this.headers,
      });
      if (res.ok) {
        const data = await res.json() as any;
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          let home: number | undefined;
          let draw: number | undefined;
          let away: number | undefined;

          for (const odd of data.results) {
            if (odd.market === "1x2") {
              if (odd.outcome === "HOME") home = odd.decimal_odds;
              if (odd.outcome === "DRAW") draw = odd.decimal_odds;
              if (odd.outcome === "AWAY") away = odd.decimal_odds;
            }
          }

          if (home || draw || away) {
            return {
              home: home || 1.85,
              draw: draw || 3.4,
              away: away || 4.1,
              bookmaker: data.results[0]?.bookmaker_name || "Consensus",
            };
          }
        }
      }
    } catch (err) {
      console.warn(`Bzzoiro getOdds(${fixtureId}) error:`, err);
    }
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
    const fixture = await this.getFixtureById(fixtureId);
    if (fixture && fixture.predictions && fixture.predictions.length > 0) {
      return fixture.predictions;
    }
    return mockFootballProvider.getPredictions(fixtureId);
  }
}

export const bzzoiroFootballProvider = new BzzoiroFootballProvider();
