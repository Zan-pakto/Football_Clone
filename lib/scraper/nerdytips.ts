import { extractLeagueGroups, parseMatchRowsHtml, extractMainHtmlMatches } from "./parser";
import { LiveScrapeResult, ScrapeResult, MatchData } from "./types";

const BASE_URL = "https://nerdytips.com";
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

export class NerdyTipsScraper {
  /**
   * Fetch all matches for a given day `d` (0 = today, 1 = tomorrow, -1 = yesterday, etc.)
   */
  static async fetchAllMatches(
    d: string = "0",
    extraParams: Record<string, string> = {}
  ): Promise<ScrapeResult> {
    try {
      const queryParams = new URLSearchParams({ d, ...extraParams });
      const mainPageUrl = `${BASE_URL}/all-matches?${queryParams.toString()}`;

      const pageRes = await fetch(mainPageUrl, {
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        cache: "no-store",
      });

      if (!pageRes.ok) {
        throw new Error(`Main page request failed with status ${pageRes.status}`);
      }

      const mainHtml = await pageRes.text();
      const leagues = extractLeagueGroups(mainHtml);

      // Parse matches pre-rendered directly inside mainHtml (e.g. featured, live, or first league groups)
      const mainHtmlMatches = extractMainHtmlMatches(mainHtml);

      let rowsMatches: MatchData[] = [];

      if (leagues.length > 0) {
        const groupKeys = leagues.map((l) => l.groupKey);
        const leagueMap = Object.fromEntries(leagues.map((l) => [l.groupKey, l]));

        // Request match rows using group keys
        const rowsParams = new URLSearchParams({
          g: groupKeys.join(","),
          d,
          ...extraParams,
        });

        const rowsUrl = `${BASE_URL}/all-matches/rows?${rowsParams.toString()}`;

        const rowsRes = await fetch(rowsUrl, {
          headers: {
            "User-Agent": DEFAULT_USER_AGENT,
            Accept: "application/json, text/plain, */*",
            "X-Requested-With": "XMLHttpRequest",
          },
          cache: "no-store",
        });

        if (rowsRes.ok) {
          const rowsJson = await rowsRes.json();
          if (rowsJson.ok && rowsJson.groups) {
            rowsMatches = parseMatchRowsHtml(rowsJson.groups, leagueMap);
          }
        }
      }

      // Combine matches from mainHtml and rowsJson, eliminating duplicates by ID
      const matchMap = new Map<string, MatchData>();
      for (const m of mainHtmlMatches) {
        matchMap.set(m.id, m);
      }
      for (const m of rowsMatches) {
        // Rows data has structured groupKeys with mapped leagueInfo, so prefer it when available
        // but preserve league name/country if mainHtml had a specific league and rows returned generic
        const existing = matchMap.get(m.id);
        if (existing) {
          if (existing.leagueName !== "Football League" && existing.leagueName !== "Other Matches") {
            m.leagueName = existing.leagueName;
          }
          if (existing.country !== "World") {
            m.country = existing.country;
          }
          if (existing.flagUrl) {
            m.flagUrl = existing.flagUrl;
          }
        }
        matchMap.set(m.id, m);
      }

      const matches = Array.from(matchMap.values());

      return {
        success: true,
        d,
        scrapedAt: new Date().toISOString(),
        leagueCount: leagues.length,
        totalMatches: matches.length,
        groupsFound: leagues.length,
        matches,
        leagues,
      };
    } catch (err: any) {
      console.error("NerdyTipsScraper fetchAllMatches error:", err);
      return {
        success: false,
        d,
        scrapedAt: new Date().toISOString(),
        leagueCount: 0,
        totalMatches: 0,
        groupsFound: 0,
        matches: [],
        leagues: [],
        error: err.message || "Scraping failed",
      };
    }
  }

  /**
   * Fetch live match updates for day `d`
   */
  static async fetchLiveMatches(d: string = "0"): Promise<LiveScrapeResult> {
    try {
      const liveUrl = `${BASE_URL}/all-matches/live?d=${encodeURIComponent(d)}`;

      const res = await fetch(liveUrl, {
        headers: {
          "User-Agent": DEFAULT_USER_AGENT,
          Accept: "application/json, text/plain, */*",
          "X-Requested-With": "XMLHttpRequest",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Live endpoint failed with status ${res.status}`);
      }

      const text = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(text);
      } catch {
        console.warn("fetchLiveMatches endpoint returned non-JSON response");
        return {
          success: true,
          d,
          updatedCount: 0,
          matches: {},
        };
      }

      if (!json.ok || !json.matches) {
        return {
          success: true,
          d,
          updatedCount: 0,
          matches: {},
        };
      }

      const liveUpdates: Record<string, any> = {};
      for (const [id, raw] of Object.entries<any>(json.matches)) {
        liveUpdates[id] = {
          id,
          status: raw.status || "In Progress",
          elapsed: raw.elapsed || null,
          homeScore: typeof raw.gh === "number" ? raw.gh : null,
          awayScore: typeof raw.ga === "number" ? raw.ga : null,
          redCardsHome: typeof raw.rh === "number" ? raw.rh : null,
          redCardsAway: typeof raw.ra === "number" ? raw.ra : null,
        };
      }

      return {
        success: true,
        d,
        updatedCount: Object.keys(liveUpdates).length,
        matches: liveUpdates,
      };
    } catch (err: any) {
      console.error("NerdyTipsScraper fetchLiveMatches error:", err);
      return {
        success: false,
        d,
        updatedCount: 0,
        matches: {},
        error: err.message || "Failed to fetch live matches",
      };
    }
  }
}
