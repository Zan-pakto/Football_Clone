import { nerdyTipsAuth } from "./nerdytips-auth";
import { cacheService, CACHE_TTL } from "../cache/cache-service";

export interface ScrapedMatch {
  id: string;
  href: string;
  kickoff: string;
  status: "UPCOMING" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED" | "WON" | "LOST";
  country: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  odds: {
    home: number | null;
    draw: number | null;
    away: number | null;
  };
  bestTip: string;
  tipOdds: number;
  confidence: string; // e.g. "82%"
  confidenceValue: number; // e.g. 82
  score?: string;
  homeScore?: number;
  awayScore?: number;
  isPremium?: boolean;
  dParam: string;
}

export class NerdyTipsScraper {
  private baseUrl = "https://nerdytips.com";
  private userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  private parseMatchBlock(blockHtml: string, dParam: string): ScrapedMatch[] {
    const matches: ScrapedMatch[] = [];
    const rowRegex =
      /<a\s+href="(\/match-details\/[^"]+)"\s+data-match="(\d+)"\s+data-kick="([^"]*)"\s+data-status="([^"]*)"\s+data-q="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;

    let match: RegExpExecArray | null;
    while ((match = rowRegex.exec(blockHtml)) !== null) {
      const [_, href, id, kick, rawStatus, q, innerHtml] = match;
      const srOnly =
        innerHtml.match(/<span class="sr-only">([\s\S]*?)<\/span>/)?.[1]?.trim() || "";

      let homeTeam = "";
      let awayTeam = "";
      let league = "";
      let country = "International";
      const odds = { home: null as number | null, draw: null as number | null, away: null as number | null };
      let bestTip = "";
      let tipOdds: number | null = null;
      let confidence = 75;
      let score: string | undefined = undefined;
      let homeScore: number | undefined = undefined;
      let awayScore: number | undefined = undefined;

      // Extract Teams & League
      const teamsMatch = srOnly.match(/^(.*?)\s+vs\s+(.*?),\s*(.*?),\s*kick-off/i);
      if (teamsMatch) {
        homeTeam = teamsMatch[1].trim();
        awayTeam = teamsMatch[2].trim();
        league = teamsMatch[3].trim();
      } else {
        const slugMatch = href.match(/\/match-details\/(.*?)-vs-(.*?)-prediction/);
        if (slugMatch) {
          homeTeam = slugMatch[1].replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
          awayTeam = slugMatch[2].replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        }
      }

      // Extract Odds
      const oddsMatch = srOnly.match(/Odds:\s*([\d\.]+)\s*home,\s*([\d\.]+)\s*draw,\s*([\d\.]+)\s*away/i);
      if (oddsMatch) {
        odds.home = parseFloat(oddsMatch[1]);
        odds.draw = parseFloat(oddsMatch[2]);
        odds.away = parseFloat(oddsMatch[3]);
      }

      // Extract Best tip & confidence
      const tipMatch = srOnly.match(/Best tip:\s*(.*?),\s*odds\s*([\d\.]+),\s*confidence\s*([\d\.]+)\/10/i);
      if (tipMatch) {
        bestTip = tipMatch[1].trim();
        tipOdds = parseFloat(tipMatch[2]);
        confidence = Math.round(parseFloat(tipMatch[3]) * 10);
      }

      // Extract Final score
      const scoreMatch = srOnly.match(/Final score\s*([\d\–\-]+)/i);
      if (scoreMatch) {
        score = scoreMatch[1].replace("–", "-");
        const parts = score.split("-");
        if (parts.length === 2) {
          homeScore = parseInt(parts[0], 10);
          awayScore = parseInt(parts[1], 10);
        }
      }

      // Extract Country from q
      if (q) {
        const parts = q.split(/\s+/);
        if (parts.length > 0) {
          country = parts[parts.length - 1].replace(/\b\w/g, (l) => l.toUpperCase());
        }
      }

      // Status resolution
      let status: ScrapedMatch["status"] = "UPCOMING";
      const sLower = rawStatus.toLowerCase();
      if (sLower === "won") status = "WON";
      else if (sLower === "lost") status = "LOST";
      else if (sLower === "live" || sLower === "inprogress") status = "LIVE";
      else if (sLower === "finished" || sLower === "fin") status = "FINISHED";
      else if (sLower === "postponed") status = "POSTPONED";
      else if (sLower === "cancelled") status = "CANCELLED";

      // Premium flag: High confidence (>78%) or special indicators
      const isPremium = confidence >= 80 || innerHtml.includes("is-premium") || innerHtml.includes("vip");

      matches.push({
        id,
        href: `${this.baseUrl}${href}`,
        kickoff: kick || "00:00",
        status,
        country: country || "International",
        league: league || "Other League",
        homeTeam: homeTeam || "Home Team",
        awayTeam: awayTeam || "Away Team",
        odds,
        bestTip: bestTip || "Double Chance 1X",
        tipOdds: tipOdds || odds.home || 1.85,
        confidence: `${confidence}%`,
        confidenceValue: confidence,
        score,
        homeScore,
        awayScore,
        isPremium,
        dParam,
      });
    }
    return matches;
  }

  /**
   * Scrape a single day with authenticated session support and lazy placeholder rows
   */
  async scrapeDay(dParam: string, cookieHeader?: string | null): Promise<ScrapedMatch[]> {
    const url = `${this.baseUrl}/all-matches?d=${dParam}`;
    const headers: Record<string, string> = {
      "User-Agent": this.userAgent,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-Ch-Ua": '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    };
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.warn(`[NerdyTipsScraper] Failed to fetch ${url} (HTTP ${res.status})`);
        return [];
      }

      const html = await res.text();
      const initialMatches = this.parseMatchBlock(html, dParam);

      // Extract placeholder keys for lazy-loaded leagues
      const keys = [...html.matchAll(/data-lg-k="([a-zA-Z0-9]+)"/g)].map((m) => m[1]);
      console.log(`[NerdyTipsScraper] d=${dParam}: Found ${initialMatches.length} initial matches, ${keys.length} league keys to expand.`);

      const extraHtmlChunks: string[] = [];
      const BATCH_SIZE = 25;

      const rowHeaders: Record<string, string> = {
        "User-Agent": this.userAgent,
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: `${this.baseUrl}/all-matches?d=${dParam}`,
        Origin: this.baseUrl,
        "Sec-Ch-Ua": '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
      };
      if (cookieHeader) rowHeaders["Cookie"] = cookieHeader;

      const batches: string[][] = [];
      for (let i = 0; i < keys.length; i += BATCH_SIZE) {
        batches.push(keys.slice(i, i + BATCH_SIZE));
      }

      // Concurrently fetch all batch rows with automatic retry on rate limit
      const rowResults = await Promise.allSettled(
        batches.map(async (batch, idx) => {
          const rowsUrl = `${this.baseUrl}/all-matches/rows?g=${batch.join(",")}&d=${dParam}`;
          let attempts = 0;
          while (attempts < 2) {
            attempts++;
            try {
              const rowsRes = await fetch(rowsUrl, { headers: rowHeaders });
              if (rowsRes.ok) {
                const data = (await rowsRes.json()) as any;
                if (data && data.groups) {
                  return Object.values(data.groups).map(String);
                }
                return [];
              } else {
                console.warn(`[NerdyTipsScraper] Batch ${idx + 1}/${batches.length} HTTP ${rowsRes.status} on attempt ${attempts}`);
                if (attempts < 2) await new Promise((r) => setTimeout(r, 600));
              }
            } catch (e: any) {
              console.warn(`[NerdyTipsScraper] Batch ${idx + 1} network error on attempt ${attempts}:`, e.message);
              if (attempts < 2) await new Promise((r) => setTimeout(r, 600));
            }
          }
          return [];
        })
      );

      for (const r of rowResults) {
        if (r.status === "fulfilled" && Array.isArray(r.value)) {
          extraHtmlChunks.push(...r.value);
        }
      }

      const extraMatches = this.parseMatchBlock(extraHtmlChunks.join("\n"), dParam);

      // Deduplicate by match id
      const uniqueMap = new Map<string, ScrapedMatch>();
      for (const m of [...initialMatches, ...extraMatches]) {
        uniqueMap.set(m.id, m);
      }

      const allMatches = Array.from(uniqueMap.values());
      console.log(`[NerdyTipsScraper] d=${dParam}: Total matches captured: ${allMatches.length} (${initialMatches.length} initial + ${extraMatches.length} expanded).`);

      // Sort: Upcoming first, then Live, then Finished
      allMatches.sort((a, b) => {
        if (a.kickoff !== b.kickoff) return a.kickoff.localeCompare(b.kickoff);
        return a.country.localeCompare(b.country);
      });

      return allMatches;
    } catch (err: any) {
      console.error(`[NerdyTipsScraper] Error scraping d=${dParam}:`, err.message);
      return [];
    }
  }

  /**
   * Run a complete multi-day scrape session with automatic login & logout
   */
  async runAuthenticatedCycle(
    days: string[] = ["-1", "0", "1"]
  ): Promise<Record<string, ScrapedMatch[]>> {
    console.log("[NerdyTipsScraper] Starting 12-hour sync cycle...");

    let authResult = { isAuthenticated: false, cookieHeader: null as string | null };
    try {
      // Step 1: Login if credentials are provided
      authResult = await nerdyTipsAuth.login();
    } catch (err: any) {
      console.warn("[NerdyTipsScraper] Auth attempt encountered error:", err.message);
    }

    const results: Record<string, ScrapedMatch[]> = {};

    try {
      // Step 2: Fetch all requested days with the session cookie
      for (const d of days) {
        console.log(`[NerdyTipsScraper] Scraping day d=${d}...`);
        const matches = await this.scrapeDay(d, authResult.cookieHeader);
        results[d] = matches;
        console.log(`[NerdyTipsScraper] Day d=${d}: Captured ${matches.length} matches.`);

        // 1-second delay between days to be polite
        await new Promise((r) => setTimeout(r, 1000));
      }
    } finally {
      // Step 3: ALWAYS automatically logout to terminate the session
      if (authResult.isAuthenticated && authResult.cookieHeader) {
        await nerdyTipsAuth.logout(authResult.cookieHeader);
      }
    }

    console.log("[NerdyTipsScraper] Sync cycle completed successfully.");
    return results;
  }

  /**
   * Fetch and parse the full AI preview, tactical analysis, and predicted metrics for a match
   */
  async getMatchInsight(matchId: string): Promise<MatchInsight | null> {
    const cacheKey = `nerdytips_insight:${matchId}`;
    const cached = await cacheService.get<MatchInsight>(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/match-details/${matchId}`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!res.ok) return null;
      const html = await res.text();

      // 1. Extract Preview Article (Title, Headings & Paragraphs)
      const proseMatch = html.match(/<div[^>]*class="[^"]*md-prose[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
      let articleTitle = "";
      const sections: Array<{ heading: string; paragraphs: string[] }> = [];

      if (proseMatch) {
        const proseHtml = proseMatch[1];
        const h2 = proseHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        articleTitle = h2 ? h2[1].replace(/<[^>]+>/g, "").trim() : "";

        const parts = [...proseHtml.matchAll(/<(?:p|h3)[^>]*>([\s\S]*?)<\/(?:p|h3)>/gi)];
        let currentSection = { heading: "Match Overview", paragraphs: [] as string[] };

        for (const p of parts) {
          const isHeading = p[0].startsWith("<h3");
          const text = p[1].replace(/<[^>]+>/g, "").trim();
          if (isHeading) {
            if (currentSection.paragraphs.length > 0) {
              sections.push(currentSection);
            }
            currentSection = { heading: text, paragraphs: [] };
          } else if (text) {
            currentSection.paragraphs.push(text);
          }
        }
        if (currentSection.paragraphs.length > 0) {
          sections.push(currentSection);
        }
      }

      // 2. Extract Predicted Stats
      const predStatsMatch = html.match(/<div[^>]*data-ps-panel="pred"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
      const predictedStats: Array<{ stat: string; home: string; away: string }> = [];
      if (predStatsMatch) {
        const rowRegex =
          /<div class="md-ps__row"><span class="md-ps__lbl"><span>([^<]+)<\/span><\/span><span class="md-ps__v md-ps__v--h(?:\s+is-lead)?"><span class="sr-only">[^<]*<\/span>([^<]+)<\/span><span class="md-ps__v md-ps__v--a(?:\s+is-lead)?"><span class="sr-only">[^<]*<\/span>([^<]+)<\/span>/g;
        let rMatch;
        while ((rMatch = rowRegex.exec(predStatsMatch[1])) !== null) {
          predictedStats.push({
            stat: rMatch[1].trim(),
            home: rMatch[2].trim(),
            away: rMatch[3].trim(),
          });
        }
      }

      // 3. Extract Actual Stats (if match is finished)
      const realStatsMatch = html.match(/<div[^>]*data-ps-panel="real"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
      const actualStats: Array<{ stat: string; home: string; away: string }> = [];
      if (realStatsMatch) {
        const rowRegex =
          /<div class="md-ps__row"><span class="md-ps__lbl"><span>([^<]+)<\/span><\/span><span class="md-ps__v md-ps__v--h(?:\s+is-lead)?"><span class="sr-only">[^<]*<\/span>([^<]+)<\/span><span class="md-ps__v md-ps__v--a(?:\s+is-lead)?"><span class="sr-only">[^<]*<\/span>([^<]+)<\/span>/g;
        let rMatch;
        while ((rMatch = rowRegex.exec(realStatsMatch[1])) !== null) {
          actualStats.push({
            stat: rMatch[1].trim(),
            home: rMatch[2].trim(),
            away: rMatch[3].trim(),
          });
        }
      }

      const insight: MatchInsight = {
        matchId,
        articleTitle,
        sections,
        predictedStats,
        actualStats,
      };

      await cacheService.set(cacheKey, insight, CACHE_TTL.FIXTURES);
      return insight;
    } catch (err: any) {
      console.warn(`[NerdyTipsScraper] Failed to fetch insight for ${matchId}:`, err.message);
      return null;
    }
  }
}

export interface MatchInsight {
  matchId: string;
  articleTitle: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  predictedStats: Array<{ stat: string; home: string; away: string }>;
  actualStats: Array<{ stat: string; home: string; away: string }>;
}

export const nerdyTipsScraper = new NerdyTipsScraper();
