import { nerdyTipsAuth } from "./nerdytips-auth";
import { cacheService, CACHE_TTL } from "../cache/cache-service";
import { adjustOddStr, adjustConfidence } from "../ai/ai-variance";

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
  rating: number; // e.g. 8.0, 5.6
  pickScore?: {
    pick: string | null;
    odd: number | null;
    rating: number | null;
  };
  goals?: {
    pick: string | null;
    odd: number | null;
    rating: number | null;
  };
  btts?: {
    pick: string | null;
    odd: number | null;
    rating: number | null;
  };
  score?: string;
  homeScore?: number;
  awayScore?: number;
  homeLogo?: string | null;
  awayLogo?: string | null;
  isPremium?: boolean;
  dParam: string;
}

export interface BetOfTheDayStats {
  bankers: {
    count: number;
    upcoming: number;
    successRate: string;
  };
  slip: {
    count: number;
    upcoming: number;
    totalOdds: number;
  };
}

export interface BetOfTheDayResult {
  date: string;
  dParam: string;
  stats: BetOfTheDayStats;
  bankers: ScrapedMatch[];
  slip: ScrapedMatch[];
}

export class NerdyTipsScraper {
  private baseUrl = "https://nerdytips.com";
  private userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  private parseMatchBlock(blockHtml: string, dParam: string): ScrapedMatch[] {
    const matches: ScrapedMatch[] = [];
    // Order-independent attribute matching for NerdyTips match anchor rows (supports absolute/relative URLs & any quotes)
    const rowRegex =
      /<a\b([^>]*\bhref=["'](?:https?:\/\/[^"']*)?(\/match-details\/[^"']+)["'][^>]*)>([\s\S]*?)<\/a>/gi;

    let match: RegExpExecArray | null;
    while ((match = rowRegex.exec(blockHtml)) !== null) {
      const fullAttrs = match[1];
      const href = match[2];
      const innerHtml = match[3];

      const id = fullAttrs.match(/data-match=["']?(\d+)["']?/i)?.[1] || href.match(/-(\d+)(?:[?#]|$)/)?.[1] || "";
      const kick = fullAttrs.match(/data-kick=["']([^"']*)["']/i)?.[1] || "";
      const rawStatus = fullAttrs.match(/data-status=["']([^"']*)["']/i)?.[1] || "";
      const q = fullAttrs.match(/data-q=["']([^"']*)["']/i)?.[1] || "";

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

      // Extract True Trust / Rating from NerdyTips (exact match from HTML data-rating or tb-trust)
      const tbTrustMatch =
        innerHtml.match(/data-rating>([\d\.]+)<\/span>/i)?.[1] ||
        innerHtml.match(/data-rating=["']([\d\.]+)["']/i)?.[1] ||
        innerHtml.match(/<div class="num tb-trust"[^>]*>([\d\.]+)<\/div>/i)?.[1] ||
        innerHtml.match(/data-tt=["'][^"']*trust of ([\d\.]+)\/10/i)?.[1] ||
        innerHtml.match(/confidence\s*([\d\.]+)\/10/i)?.[1] ||
        srOnly.match(/confidence\s*([\d\.]+)\/10/i)?.[1];

      let rating = tbTrustMatch ? parseFloat(tbTrustMatch) : 7.5;
      confidence = Math.round(rating * 10);

      // Extract individual markets from NerdyTips cells
      // 1. PickScore (1X2)
      const psTt = innerHtml.match(/tbm-pickscore[\s\S]*?data-tt=["']The trust for ([^'"]+) is ([\d\.]+)\/10 and the odd is ([\d\.]+)["']/i);
      const psPick = psTt ? psTt[1] : innerHtml.match(/tbm-pickscore[\s\S]*?<span class="disp tb-mcell__pick">([\s\S]*?)<\/span>/i)?.[1]?.trim()?.replace(/&bull;/g, "") || null;
      const psOdd = psTt ? parseFloat(psTt[3]) : parseFloat(innerHtml.match(/tbm-pickscore[\s\S]*?<span class="num tb-mcell__odd">[\s\S]*?([\d\.]+)<\/span>/i)?.[1] || "0");
      const psRating = psTt ? parseFloat(psTt[2]) : null;

      // 2. Goals (O/U)
      const gTt = innerHtml.match(/tbm-goals[\s\S]*?data-tt=["']The trust for ([^'"]+) is ([\d\.]+)\/10 and the odd is ([\d\.]+)["']/i);
      const gPick = gTt ? gTt[1] : innerHtml.match(/tbm-goals[\s\S]*?<span class="disp tb-mcell__pick">([\s\S]*?)<\/span>/i)?.[1]?.trim()?.replace(/&bull;/g, "") || null;
      const gOdd = gTt ? parseFloat(gTt[3]) : parseFloat(innerHtml.match(/tbm-goals[\s\S]*?<span class="num tb-mcell__odd">[\s\S]*?([\d\.]+)<\/span>/i)?.[1] || "0");
      const gRating = gTt ? parseFloat(gTt[2]) : null;

      // 3. BTTS
      const bTt = innerHtml.match(/tbm-btts[\s\S]*?data-tt=["']The trust for ([^'"]+) is ([\d\.]+)\/10 and the odd is ([\d\.]+)["']/i);
      const bPick = bTt ? bTt[1] : innerHtml.match(/tbm-btts[\s\S]*?<span class="disp tb-mcell__pick">([\s\S]*?)<\/span>/i)?.[1]?.trim()?.replace(/&bull;/g, "") || null;
      const bOdd = bTt ? parseFloat(bTt[3]) : parseFloat(innerHtml.match(/tbm-btts[\s\S]*?<span class="num tb-mcell__odd">[\s\S]*?([\d\.]+)<\/span>/i)?.[1] || "0");
      const bRating = bTt ? parseFloat(bTt[2]) : null;

      // 4. Best Tip
      const btTt = innerHtml.match(/tbm-besttip[\s\S]*?data-tt=["']The best tip is ([^'"]+) with a trust of ([\d\.]+)\/10 and the odd is ([\d\.]+)["']/i);
      if (btTt) {
        bestTip = btTt[1];
        tipOdds = parseFloat(btTt[3]);
        rating = parseFloat(btTt[2]);
        confidence = Math.round(rating * 10);
      } else {
        const tipMatch = srOnly.match(/Best tip:\s*(.*?),\s*odds\s*([\d\.]+),\s*confidence\s*([\d\.]+)\/10/i);
        if (tipMatch) {
          bestTip = tipMatch[1].trim();
          tipOdds = parseFloat(tipMatch[2]);
          rating = parseFloat(tipMatch[3]);
          confidence = Math.round(rating * 10);
        }
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

      // Extract Country from q (handles multi-word countries like "Costa Rica", "Czech Republic", "Saudi Arabia")
      if (q) {
        country = this.extractCountryFromQ(q);
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
      const isPremium = confidence >= 80 || innerHtml.includes("is-premium") || innerHtml.includes("vip") || innerHtml.includes("data-locked");

      // Extract team logos
      const logos = Array.from(innerHtml.matchAll(/<img[^>]*src="([^"]*logos\/[^"]+)"[^>]*>/g)).map((m) => m[1]);
      const homeLogo = logos[0] || null;
      const awayLogo = logos[1] || null;

      matches.push({
        id,
        href: `${this.baseUrl}${href}`,
        kickoff: kick || "00:00",
        status,
        country: country || "International",
        league: league || "Other League",
        homeTeam: homeTeam || "Home Team",
        awayTeam: awayTeam || "Away Team",
        homeLogo,
        awayLogo,
        odds,
        bestTip: bestTip || "Double Chance 1X",
        tipOdds: tipOdds || odds.home || 1.85,
        confidence: `${confidence}%`,
        confidenceValue: confidence,
        rating,
        pickScore: {
          pick: psPick,
          odd: psOdd && psOdd > 0 ? psOdd : null,
          rating: psRating,
        },
        goals: {
          pick: gPick,
          odd: gOdd && gOdd > 0 ? gOdd : null,
          rating: gRating,
        },
        btts: {
          pick: bPick,
          odd: bOdd && bOdd > 0 ? bOdd : null,
          rating: bRating,
        },
        score,
        homeScore,
        awayScore,
        isPremium,
        dParam,
      });
    }
    return matches;
  }

  private extractCountryFromQ(q: string): string {
    if (!q) return "International";
    const cleanQ = q.trim().toLowerCase();

    // Pattern 1: Repeated country phrase at the end (NerdyTips repeats country name 2x or 3x at the end of data-q)
    // e.g. "... costa-rica costa rica costa rica", "... czech-republic czech republic czech republic", "... england england england"
    const repeat3 = cleanQ.match(/\b([a-z\s\-]+?)\s+\1\s+\1$/i);
    if (repeat3 && repeat3[1].trim().length >= 3) {
      return this.formatCountryName(repeat3[1].trim());
    }

    const repeat2 = cleanQ.match(/\b([a-z\s\-]+?)\s+\1$/i);
    if (repeat2 && repeat2[1].trim().length >= 3) {
      return this.formatCountryName(repeat2[1].trim());
    }

    // Pattern 2: Hyphenated country slug inside q (e.g. "costa-rica", "czech-republic", "saudi-arabia", "south-africa", "new-zealand")
    const slugMatch = cleanQ.match(/\b([a-z]{3,}(?:-[a-z]{3,})+)\b/);
    if (slugMatch) {
      return this.formatCountryName(slugMatch[1]);
    }

    // Fallback: check last token
    const parts = cleanQ.split(/\s+/);
    const last = parts[parts.length - 1];
    return this.formatCountryName(last);
  }

  private formatCountryName(name: string): string {
    const clean = name.replace(/-/g, " ").trim();
    if (clean === "rica" || clean === "costa rica") return "Costa Rica";
    if (clean === "czech republic" || clean === "czechia" || clean === "republic") return "Czech Republic";
    if (clean === "el salvador" || clean === "salvador") return "El Salvador";
    if (clean === "saudi arabia" || clean === "arabia") return "Saudi Arabia";
    if (clean === "south africa") return "South Africa";
    if (clean === "south korea" || clean === "korea") return "South Korea";
    if (clean === "north macedonia" || clean === "macedonia") return "North Macedonia";
    if (clean === "united states" || clean === "usa" || clean === "states") return "USA";
    if (clean === "puerto rico" || clean === "rico") return "Puerto Rico";
    if (clean === "new zealand" || clean === "zealand") return "New Zealand";
    if (clean === "hong kong" || clean === "kong") return "Hong Kong";
    if (clean === "dr congo" || clean === "congo dr") return "DR Congo";
    return clean.replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Scrape a single day with authenticated session support and lazy placeholder rows
   */
  async scrapeDay(
    dParam: string,
    cookieHeader?: string | null,
    tz?: string | number | null
  ): Promise<ScrapedMatch[]> {
    const url = `${this.baseUrl}/all-matches?d=${dParam}`;
    const activeTz = tz !== undefined && tz !== null && String(tz).trim() !== "" ? String(tz) : (process.env.TIMEZONE_OFFSET || "330");
    const tzCookie = `tz_offset_v2=${activeTz}; timezone_manual=1;`;

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
      Cookie: cookieHeader ? `${cookieHeader}; ${tzCookie}` : tzCookie,
    };

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
      console.log(`[NerdyTipsScraper] d=${dParam} (tz=${activeTz}): Found ${initialMatches.length} initial matches, ${keys.length} league keys to expand.`);

      const extraHtmlChunks: string[] = [];
      const BATCH_SIZE = 30;

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
        Cookie: cookieHeader ? `${cookieHeader}; ${tzCookie}` : tzCookie,
      };

      const batches: string[][] = [];
      for (let i = 0; i < keys.length; i += BATCH_SIZE) {
        batches.push(keys.slice(i, i + BATCH_SIZE));
      }

      // Fetch batches with controlled concurrency (4 parallel requests at a time) to prevent cloud network timeouts
      const CHUNK_CONCURRENCY = 4;
      for (let i = 0; i < batches.length; i += CHUNK_CONCURRENCY) {
        const slice = batches.slice(i, i + CHUNK_CONCURRENCY);
        const chunkResults = await Promise.allSettled(
          slice.map(async (batch, idx) => {
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
                  console.warn(`[NerdyTipsScraper] Batch ${i + idx + 1}/${batches.length} HTTP ${rowsRes.status} on attempt ${attempts}`);
                  if (attempts < 2) await new Promise((r) => setTimeout(r, 600));
                }
              } catch (e: any) {
                console.warn(`[NerdyTipsScraper] Batch ${i + idx + 1} network error on attempt ${attempts}:`, e.message);
                if (attempts < 2) await new Promise((r) => setTimeout(r, 600));
              }
            }
            return [];
          })
        );

        for (const r of chunkResults) {
          if (r.status === "fulfilled" && Array.isArray(r.value)) {
            extraHtmlChunks.push(...r.value);
          }
        }
      }

      const extraMatches = this.parseMatchBlock(extraHtmlChunks.join("\n"), dParam);

      // Deduplicate by match id
      const uniqueMap = new Map<string, ScrapedMatch>();
      for (const m of [...initialMatches, ...extraMatches]) {
        uniqueMap.set(m.id, m);
      }

      const allMatches = Array.from(uniqueMap.values());
      console.log(`[NerdyTipsScraper] d=${dParam} (tz=${activeTz}): Total matches captured: ${allMatches.length} (${initialMatches.length} initial + ${extraMatches.length} expanded).`);

      // Zero-matches warning alert
      if (allMatches.length === 0 && keys.length > 0) {
        console.warn(`⚠️ [NerdyTipsScraper WARNING] Found ${keys.length} league keys but parsed 0 matches for d=${dParam}. Checking cached snapshot...`);
      }

      // If matches captured, persist a 24-hour backup snapshot
      const backupKey = `nerdytips_day_backup:${dParam}:${activeTz}`;
      if (allMatches.length > 0) {
        await cacheService.set(backupKey, allMatches, 86400).catch(() => {});
      } else {
        // Fallback to last successful cached scrape for this day if available
        const cachedFallback = await cacheService.get<ScrapedMatch[]>(backupKey).catch(() => null);
        if (cachedFallback && cachedFallback.length > 0) {
          console.log(`[NerdyTipsScraper] Using cached fallback snapshot of ${cachedFallback.length} matches for d=${dParam}`);
          return cachedFallback;
        }
      }

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
   * Scrape Bet of the Day & Slip of the Day from NerdyTips (12-hour sync cycle)
   */
  async scrapeBetOfTheDay(
    dParam: string = "0",
    tz?: string | number | null,
    cookieHeader?: string | null,
    forceRefresh: boolean = false
  ): Promise<BetOfTheDayResult> {
    const activeTz = tz !== undefined && tz !== null && String(tz).trim() !== "" ? String(tz) : (process.env.TIMEZONE_OFFSET || "330");
    const cacheKey = `botd:${dParam}:${activeTz}`;

    // Check cache (12-hour duration unless forced)
    if (!forceRefresh) {
      const cached = await cacheService.get<BetOfTheDayResult>(cacheKey).catch(() => null);
      if (cached) {
        return cached;
      }
    }

    const url = dParam === "0" || dParam === "" ? `${this.baseUrl}/bet-of-the-day` : `${this.baseUrl}/bet-of-the-day?d=${dParam}`;
    const tzCookie = `tz_offset_v2=${activeTz}; timezone_manual=1;`;

    const headers: Record<string, string> = {
      "User-Agent": this.userAgent,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      Cookie: cookieHeader ? `${cookieHeader}; ${tzCookie}` : tzCookie,
    };

    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.warn(`[NerdyTipsScraper] Failed to fetch Bet of the Day from ${url} (HTTP ${res.status})`);
        return this.generateFallbackBetOfTheDay(dParam);
      }

      const html = await res.text();

      // Extract bankers section
      const bankersPanelMatch = html.match(/data-botd-panel="bankers"[\s\S]*?<\/section>/i);
      const bankersHtml = bankersPanelMatch ? bankersPanelMatch[0] : "";
      const bankersMatches = this.parseMatchBlock(bankersHtml, dParam);

      // Extract slip section
      const slipPanelMatch = html.match(/data-botd-panel="slip"[\s\S]*?<\/section>/i);
      const slipHtml = slipPanelMatch ? slipPanelMatch[0] : "";
      const slipMatches = this.parseMatchBlock(slipHtml, dParam);

      // Extract Tab Stats attributes: data-v1, data-v2, data-v3
      const bankersTabMatch = html.match(/data-botd-tab="bankers"[^>]*data-v1="([^"]*)"[^>]*data-v2="([^"]*)"[^>]*data-v3="([^"]*)"/i);
      const slipTabMatch = html.match(/data-botd-tab="slip"[^>]*data-v1="([^"]*)"[^>]*data-v2="([^"]*)"[^>]*data-v3="([^"]*)"/i);

      let bankersCount = bankersMatches.length;
      let bankersUpcoming = bankersMatches.filter((m) => m.status === "UPCOMING").length;
      let bankersSuccess = "0%";

      if (bankersTabMatch) {
        bankersCount = parseInt(bankersTabMatch[1], 10) || bankersCount;
        bankersUpcoming = parseInt(bankersTabMatch[2], 10) || bankersUpcoming;
        bankersSuccess = bankersTabMatch[3] || bankersSuccess;
      }

      let slipCount = slipMatches.length;
      let slipUpcoming = slipMatches.filter((m) => m.status === "UPCOMING").length;
      let slipTotalOdds = 1.0;

      if (slipTabMatch) {
        slipCount = parseInt(slipTabMatch[1], 10) || slipCount;
        slipUpcoming = parseInt(slipTabMatch[2], 10) || slipUpcoming;
        slipTotalOdds = parseFloat(slipTabMatch[3]) || 1.0;
      } else if (slipMatches.length > 0) {
        slipTotalOdds = parseFloat(slipMatches.reduce((acc, m) => acc * (m.tipOdds || 1.4), 1).toFixed(2));
      }

      const result: BetOfTheDayResult = {
        date: dParam,
        dParam,
        stats: {
          bankers: {
            count: bankersCount,
            upcoming: bankersUpcoming,
            successRate: bankersSuccess,
          },
          slip: {
            count: slipCount,
            upcoming: slipUpcoming,
            totalOdds: slipTotalOdds,
          },
        },
        bankers: bankersMatches,
        slip: slipMatches,
      };

      // Set cache TTL to exactly 12 hours (43,200 seconds)
      const BOTD_12_HOURS_TTL = 12 * 60 * 60;
      await cacheService.set(cacheKey, result, BOTD_12_HOURS_TTL).catch(() => {});

      return result;
    } catch (err: any) {
      console.error(`[NerdyTipsScraper] Error scraping Bet of the Day for d=${dParam}:`, err.message);
      return this.generateFallbackBetOfTheDay(dParam);
    }
  }

  /**
   * Fallback if NerdyTips bet-of-the-day endpoint is unreachable
   */
  private generateFallbackBetOfTheDay(dParam: string): BetOfTheDayResult {
    return {
      date: dParam,
      dParam,
      stats: {
        bankers: { count: 0, upcoming: 0, successRate: "0%" },
        slip: { count: 0, upcoming: 0, totalOdds: 1.0 },
      },
      bankers: [],
      slip: [],
    };
  }

  /**
   * Scrape Live Updates for in-play matches
   */
  async scrapeBetOfTheDayLive(ids: string[]): Promise<Record<string, any>> {
    if (!ids || ids.length === 0) return {};
    const url = `${this.baseUrl}/bet-of-the-day/live?ids=${ids.map(encodeURIComponent).join("%2C")}`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json, text/plain, */*",
        },
      });
      if (!res.ok) return {};
      const data = (await res.json()) as any;
      if (data && data.ok && data.matches) {
        return data.matches;
      }
      return {};
    } catch (err: any) {
      console.warn("[NerdyTipsScraper] Error fetching live updates:", err.message);
      return {};
    }
  }

  /**
   * Run a complete multi-day scrape session with automatic login & logout
   */
  async runAuthenticatedCycle(
    days: string[] = ["-1", "0", "1"],
    tz?: string | number | null
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
      // Step 2: Fetch all requested days with the session cookie and timezone
      for (const d of days) {
        console.log(`[NerdyTipsScraper] Scraping day d=${d}...`);
        const matches = await this.scrapeDay(d, authResult.cookieHeader, tz);
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
   * Fetch and parse the full match details (hero, tips, statistics, form, h2h, recent matches, standings)
   */
  async getMatchDetails(matchId: string): Promise<FullMatchDetails | null> {
    const cacheKey = `nerdytips_details:${matchId}`;
    const cached = await cacheService.get<FullMatchDetails>(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/match-details/${matchId}`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });

      if (!res.ok) return null;
      const html = await res.text();
      const details = this.parseFullMatchHtml(html, matchId);

      if (details) {
        await cacheService.set(cacheKey, details, CACHE_TTL.FIXTURES);
      }
      return details;
    } catch (err: any) {
      console.warn(`[NerdyTipsScraper] Failed to fetch details for ${matchId}:`, err.message);
      return null;
    }
  }

  /**
   * Robust parser for modern NerdyTips match details page
   */
  parseFullMatchHtml(html: string, matchId: string): FullMatchDetails {
    const clean = (str?: string | null) => {
      if (!str) return "";
      return str
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    const details: FullMatchDetails = {
      matchId,
      hero: {
        countryFlag: null,
        country: "International",
        leagueName: "League",
        homeTeam: { name: "Home Team", logo: null, marketValue: "" },
        awayTeam: { name: "Away Team", logo: null, marketValue: "" },
        date: "",
        time: "",
        homeScore: null,
        awayScore: null,
        status: "Upcoming",
        odds1x2: [],
        keyMoments: [],
      },
      tips: {
        warning: null,
        cards: [],
      },
      statistics: [],
      form: [],
      h2h: {
        tally: {
          homeWins: "0",
          draws: "0",
          awayWins: "0",
          homeRatio: "33%",
          drawRatio: "33%",
          awayRatio: "33%",
        },
        matches: [],
      },
      recentMatches: {
        home: { name: "", crest: null, form: [], matches: [] },
        away: { name: "", crest: null, form: [], matches: [] },
      },
      standings: {
        leagueName: "",
        leagueLogo: null,
        rows: [],
      },
    };

    // 1. Breadcrumbs & League
    const leagueImg = html.match(/class="md-hero"[\s\S]*?<img src="([^"]+)"[^>]*alt="([^"]*)"/i);
    const leagueNameMatch = html.match(/class="lgl[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    if (leagueImg) {
      details.hero.countryFlag = leagueImg[1];
      details.hero.country = leagueImg[2] || "International";
    }
    if (leagueNameMatch) {
      details.hero.leagueName = clean(leagueNameMatch[1]);
    }

    // 2. Teams & Market Values
    const heroGridMatch = html.match(/class="grid grid-cols-\[1fr_auto_1fr\][^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div class="md-1x2row/i);
    if (heroGridMatch) {
      const gridHtml = heroGridMatch[1];
      const teamLinks = [...gridHtml.matchAll(/<a href="\/team\/[^"]*"([\s\S]*?)<\/a>/gi)];
      if (teamLinks.length >= 2) {
        const hHtml = teamLinks[0][1];
        const aHtml = teamLinks[1][1];

        const hLogo = hHtml.match(/<img src="([^"]+)"/i);
        const hName = hHtml.match(/class="md-tname[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const hVal = hHtml.match(/class="text-\[11px\][^"]*"[^>]*>([\s\S]*?)<\/span>/i);

        const aLogo = aHtml.match(/<img src="([^"]+)"/i);
        const aName = aHtml.match(/class="md-tname[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const aVal = aHtml.match(/class="text-\[11px\][^"]*"[^>]*>([\s\S]*?)<\/span>/i);

        details.hero.homeTeam = {
          name: hName ? clean(hName[1]) : "Home Team",
          logo: hLogo ? hLogo[1] : null,
          marketValue: hVal ? clean(hVal[1]) : "",
        };
        details.hero.awayTeam = {
          name: aName ? clean(aName[1]) : "Away Team",
          logo: aLogo ? aLogo[1] : null,
          marketValue: aVal ? clean(aVal[1]) : "",
        };
      }
    }

    // 3. Date, Time, Scores, Status
    const dateMatch = html.match(/class="md-date"[^>]*><span[^>]*>([^<]+)<\/span><strong[^>]*>([^<]+)<\/strong>/i);
    const scoreHMatch = html.match(/data-score-h[^>]*>([^<]+)<\/span>/i);
    const scoreAMatch = html.match(/data-score-a[^>]*>([^<]+)<\/span>/i);
    const statusMatch = html.match(/data-md-status[^>]*>([\s\S]*?)<\/span>/i);

    if (dateMatch) {
      details.hero.date = clean(dateMatch[1]);
      details.hero.time = clean(dateMatch[2]);
    }
    if (scoreHMatch) details.hero.homeScore = clean(scoreHMatch[1]);
    if (scoreAMatch) details.hero.awayScore = clean(scoreAMatch[1]);
    if (statusMatch) details.hero.status = clean(statusMatch[1]);

    // 4. 1X2 Odds Row
    const odds1x2Matches = [...html.matchAll(/<span class="md-1x2([^"]*)"><span class="md-1x2__l">([^<]+)<\/span><span class="md-1x2__o">([\s\S]*?)<\/span><\/span>/gi)];
    details.hero.odds1x2 = odds1x2Matches.map((m) => {
      const rawO = clean(m[3]);
      const num = rawO.match(/(\d+\.\d+|\d+)/);
      const label = clean(m[2]);
      const parsedOdd = num ? num[1] : rawO;
      const seedKey = label === "1" ? `${matchId}_home` : label === "X" ? `${matchId}_draw` : label === "2" ? `${matchId}_away` : `${matchId}_hero_1x2_${label}`;
      return {
        label,
        isTip: m[1].includes("md-1x2--tip"),
        odd: adjustOddStr(parsedOdd, seedKey) || parsedOdd,
      };
    });

    // 5. Key Moments
    const momentsMatches = [...html.matchAll(/<li class="md-ev__(stage|row)([^"]*)"[^>]*>([\s\S]*?)<\/li>/gi)];
    details.hero.keyMoments = momentsMatches.map((m) => {
      const isStage = m[1] === "stage";
      const minMatch = m[3].match(/class="md-ev__min"[^>]*>([\s\S]*?)<\/span>/i);
      const scoreMatch = m[3].match(/class="md-ev__sc"[^>]*>([\s\S]*?)<\/i>/i);
      const nameMatch = m[3].match(/class="md-ev__name"[^>]*>([\s\S]*?)<\/span>/i);
      const isGoal = m[2].includes("is-goal");
      const isRed = m[2].includes("is-red");
      const isAway = m[2].includes("is-a");
      return {
        isStage,
        minute: minMatch ? clean(minMatch[1]) : null,
        score: scoreMatch ? clean(scoreMatch[1]) : null,
        player: nameMatch ? clean(nameMatch[1]) : null,
        type: isStage ? "stage" : isGoal ? "goal" : isRed ? "red" : "event",
        side: isAway ? "away" : "home",
        rawText: clean(m[3]),
      };
    });

    // 6. Section #tips
    const warnMatch = html.match(/class="md-warn"[\s\S]*?class="md-pcard__tip[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    details.tips.warning = warnMatch ? clean(warnMatch[1]) : null;

    const bestPick = html.match(/class="md-best[\s\S]*?class="md-best__tip">([^<]+)<\/span>/i);
    const bestOdd = html.match(/class="md-best__odd"[^>]*>[\s\S]*?(\d+\.\d+|\d+)<\/span>/i);
    const bestExpl = html.match(/class="md-best__expl-in">([^<]+)<\/span>/i);
    const bestConf = html.match(/class="md-best[\s\S]*?class="md-conf__val">([\s\S]*?)<\/span>/i);

    if (bestPick) {
      const rawOdd = bestOdd ? bestOdd[1] : "";
      const rawConfStr = bestConf ? clean(bestConf[1]) : "";
      const rawConfVal = parseInt(rawConfStr.replace("%", "").trim(), 10);
      const adjustedConf = !isNaN(rawConfVal)
        ? `${adjustConfidence(rawConfVal, `${matchId}_conf`)}%`
        : rawConfStr;

      details.tips.bestTip = {
        pick: clean(bestPick[1]),
        odd: adjustOddStr(rawOdd, `${matchId}_best_odd`) || rawOdd,
        explanation: bestExpl ? clean(bestExpl[1]) : "",
        confidence: adjustedConf,
      };
    }

    const pcardMatches = [...html.matchAll(/<div class="md-pcard">([\s\S]*?)<\/div><\/div>/gi)];
    details.tips.cards = [];
    for (const pc of pcardMatches) {
      const lbl = pc[1].match(/class="md-pcard__label">([^<]+)<\/span>/i);
      const tip = pc[1].match(/class="md-pcard__tip">([^<]+)<\/span>/i);
      const odd = pc[1].match(/class="md-pcard__odd"[^>]*>[\s\S]*?(\d+\.\d+|\d+)<\/span>/i);
      const conf = pc[1].match(/class="md-conf__val">([\s\S]*?)<\/span>/i);
      const score = pc[1].match(/class="md-score"[\s\S]*?<b class="md-score__n">(\d+)<\/b>[\s\S]*?<b class="md-score__n">(\d+)<\/b>/i);

      const title = lbl ? clean(lbl[1]) : "";
      const rawOdd = odd ? odd[1] : null;
      const rawConfStr = conf ? clean(conf[1]) : null;
      let adjustedConf = rawConfStr;
      if (rawConfStr) {
        const cVal = parseInt(rawConfStr.replace("%", "").trim(), 10);
        if (!isNaN(cVal)) {
          adjustedConf = `${adjustConfidence(cVal, `${matchId}_card_${title}_conf`)}%`;
        }
      }

      details.tips.cards.push({
        title,
        pick: tip ? clean(tip[1]) : null,
        odd: rawOdd ? (adjustOddStr(rawOdd, `${matchId}_card_${title}_odd`) || rawOdd) : null,
        confidence: adjustedConf,
        score: score ? { home: score[1], away: score[2] } : null,
      });
    }

    // 7. Section #statistics
    const statsSec = html.match(/<section id="statistics"[\s\S]*?<\/section>/i);
    if (statsSec) {
      const rows = [...statsSec[0].matchAll(/<div class="md-ps__row"><span class="md-ps__lbl"><span>([^<]+)<\/span><\/span><span class="md-ps__v md-ps__v--h([^"]*)">[\s\S]*?<\/span>([^<]+)<\/span><span class="md-ps__v md-ps__v--a([^"]*)">[\s\S]*?<\/span>([^<]+)<\/span>/gi)];
      details.statistics = rows.map((r) => ({
        label: clean(r[1]),
        home: clean(r[3]),
        away: clean(r[5]),
        homeLead: r[2].includes("is-lead"),
        awayLead: r[4].includes("is-lead"),
      }));
    }

    // 8. Section #form
    const formSec = html.match(/<section id="form"[\s\S]*?<\/section>/i);
    if (formSec) {
      const rows = [...formSec[0].matchAll(/<div class="md-ps__row"><span class="md-ps__lbl"><span>([^<]+)<\/span><\/span><span class="md-ps__v md-ps__v--h([^"]*)">[\s\S]*?<\/span>([^<]+)<\/span><span class="md-ps__v md-ps__v--a([^"]*)">[\s\S]*?<\/span>([^<]+)<\/span>/gi)];
      details.form = rows.map((r) => ({
        label: clean(r[1]),
        home: clean(r[3]),
        away: clean(r[5]),
        homeLead: r[2].includes("is-lead"),
        awayLead: r[4].includes("is-lead"),
      }));
    }

    // 9. Section #h2h
    const h2hSec = html.match(/<section id="h2h"[\s\S]*?<\/section>/i);
    if (h2hSec) {
      const hN = h2hSec[0].match(/class="md-h2h__n md-h2h__n--h">(\d+)<\/span>/i);
      const dN = h2hSec[0].match(/class="md-h2h__n md-h2h__n--d">(\d+)<\/span>/i);
      const aN = h2hSec[0].match(/class="md-h2h__n md-h2h__n--a">(\d+)<\/span>/i);
      const barH = h2hSec[0].match(/class="md-h2h__seg md-h2h__seg--h"\s+style="width:([^"]+)"/i);
      const barD = h2hSec[0].match(/class="md-h2h__seg md-h2h__seg--d"\s+style="width:([^"]+)"/i);
      const barA = h2hSec[0].match(/class="md-h2h__seg md-h2h__seg--a"\s+style="width:([^"]+)"/i);

      details.h2h.tally = {
        homeWins: hN ? hN[1] : "0",
        draws: dN ? dN[1] : "0",
        awayWins: aN ? aN[1] : "0",
        homeRatio: barH ? barH[1] : "33%",
        drawRatio: barD ? barD[1] : "33%",
        awayRatio: barA ? barA[1] : "33%",
      };

      const matches = [...h2hSec[0].matchAll(/<div class="md-rm[^"]*"><span class="md-rm__date"[^>]*>([^<]+)<\/span><div class="md-rm__teams">([\s\S]*?)<\/div><\/div>/gi)];
      details.h2h.matches = matches.map((m) => {
        const date = clean(m[1]);
        const t = [...m[2].matchAll(/<div class="md-rm__team([^"]*)">[\s\S]*?<img src="([^"]+)"[\s\S]*?<span class="md-rm__name">([^<]+)<\/span><span class="md-rm__score">(\d+)<\/span>/gi)];
        return {
          date,
          team1: t[0] ? { name: clean(t[0][3]), logo: t[0][2], score: t[0][4], isWin: t[0][1].includes("is-win") } : null,
          team2: t[1] ? { name: clean(t[1][3]), logo: t[1][2], score: t[1][4], isWin: t[1][1].includes("is-win") } : null,
        };
      });
    }

    // 10. Section #recent-matches
    const rmSec = html.match(/<section id="recent-matches"[\s\S]*?<\/section>/i);
    if (rmSec) {
      const cols = [...rmSec[0].matchAll(/<div class="md-formcol"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="md-formcol"|<\/div>\s*<\/section>)/gi)];
      const parseCol = (colHtml: string) => {
        const crest = colHtml.match(/class="md-formcol__crest"[^>]*src="([^"]+)"/i);
        const name = colHtml.match(/class="md-formcol__name">([^<]+)<\/span>/i);
        const formDots = [...colHtml.matchAll(/<span class="tm-form\s+tm-form--[wld]">([WLD])<\/span>/gi)].map((m) => m[1]);
        const rowMatches = [...colHtml.matchAll(/<a href="([^"]*)" class="md-formrow[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)];
        const matches = rowMatches.map((rm) => {
          const formBadge = rm[2].match(/class="tm-form\s+tm-form--[wld]"[^>]*>([WLD])<\/span>/i);
          const date = rm[2].match(/class="md-fmeta__date"[^>]*>([^<]+)<\/span>/i);
          const teams = [...rm[2].matchAll(/<span class="md-fteam[^"]*">[\s\S]*?<img src="([^"]+)"[\s\S]*?<span class="md-fteam__n">([^<]+)<\/span><\/span>/gi)];
          const scores = [...rm[2].matchAll(/<span class="md-fscore__n[^"]*">(\d+)<\/span>/gi)];
          const odds = [...rm[2].matchAll(/<span class="md-fodds__o">([\s\S]*?)<\/span>/gi)];
          return {
            url: rm[1],
            badge: formBadge ? formBadge[1] : "",
            date: date ? clean(date[1]) : "",
            homeTeam: teams[0] ? { name: clean(teams[0][2]), logo: teams[0][1] } : null,
            awayTeam: teams[1] ? { name: clean(teams[1][2]), logo: teams[1][1] } : null,
            homeScore: scores[0] ? scores[0][1] : "",
            awayScore: scores[1] ? scores[1][1] : "",
            odd1: odds[0] ? clean(odds[0][1]) : "",
            odd2: odds[1] ? clean(odds[1][1]) : "",
          };
        });
        return {
          name: name ? clean(name[1]) : "",
          crest: crest ? crest[1] : null,
          form: formDots,
          matches,
        };
      };

      if (cols[0]) details.recentMatches.home = parseCol(cols[0][1]);
      if (cols[1]) details.recentMatches.away = parseCol(cols[1][1]);
    }

    // 11. Section #standings
    const stSec = html.match(/<section id="standings"[\s\S]*?<\/section>/i);
    if (stSec) {
      const stTitle = stSec[0].match(/<span class="truncate text-sm font-bold text-heading">([^<]+)<\/span>/i);
      const stLogo = stSec[0].match(/<img src="([^"]+)"[^>]*class="[^"]*rounded-\[3px\]/i);
      details.standings.leagueName = stTitle ? clean(stTitle[1]) : "";
      details.standings.leagueLogo = stLogo ? stLogo[1] : null;

      const rows = [...stSec[0].matchAll(/<tr class="md-st__row([^"]*)">([\s\S]*?)<\/tr>/gi)];
      details.standings.rows = rows.map((r) => {
        const isCurrent = r[1].includes("is-current");
        const rank = r[2].match(/class="md-st__rank">[\s\S]*?(\d+)<\/td>/i);
        const zone = r[2].match(/class="md-st__zone\s+([^"]+)"/i);
        const teamLogo = r[2].match(/class="md-st__logo"[^>]*src="([^"]+)"/i);
        const teamName = r[2].match(/class="md-st__name">([^<]+)<\/span>/i);
        const nums = [...r[2].matchAll(/<td class="md-st__n[^"]*">([^<]+)<\/td>/gi)];
        return {
          isCurrent,
          rank: rank ? rank[1] : "",
          zoneClass: zone ? zone[1] : "",
          teamName: teamName ? clean(teamName[1]) : "",
          teamLogo: teamLogo ? teamLogo[1] : null,
          played: nums[0] ? clean(nums[0][1]) : "",
          goals: nums[1] ? clean(nums[1][1]) : "",
          points: nums[2] ? clean(nums[2][1]) : "",
        };
      });
    }

    return details;
  }

  /**
   * Fetch legacy match insight, backed by getMatchDetails
   */
  async getMatchInsight(matchId: string): Promise<MatchInsight | null> {
    const details = await this.getMatchDetails(matchId);
    if (!details) return null;

    return {
      matchId,
      articleTitle: `${details.hero.homeTeam.name} vs ${details.hero.awayTeam.name} Prediction`,
      sections: [],
      predictedStats: details.statistics.map((s) => ({ stat: s.label, home: s.home, away: s.away })),
      actualStats: details.statistics.map((s) => ({ stat: s.label, home: s.home, away: s.away })),
    };
  }

  /**
   * Scrape https://nerdytips.com/progress page, parse KPIs, charts, breakdown table, and sync download assets
   */
  async scrapeProgressPage(): Promise<AiProgressScrapedData | null> {
    const url = `${this.baseUrl}/progress`;
    try {
      console.log(`[NerdyTipsScraper] Scraping progress performance data from ${url}...`);
      const res = await fetch(url, {
        headers: {
          "User-Agent": this.userAgent,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (!res.ok) {
        console.warn(`[NerdyTipsScraper] Failed to fetch progress page, status: ${res.status}`);
        return null;
      }

      const html = await res.text();

      // 1. Extract KPIs
      const kpiBlocks = html.split(/<div class="pg-kpi">/).slice(1);
      let overallRate = "66.6%";
      let overallCorrect = 185747;
      let overallTotal = 278849;
      let bankersRate = "72.5%";
      let bankersCorrect = 1111;
      let bankersTotal = 1533;
      let matchesPredicted = 278849;
      let daysTracked = 1877;

      for (const block of kpiBlocks) {
        const val = block.match(/<div class="pg-kpi__val"[^>]*>([^<]+)<\/div>/i)?.[1]?.trim() || "";
        const lab = block.match(/<div class="pg-kpi__lab">([^<]+)<\/div>/i)?.[1]?.trim() || "";
        const sub = block.match(/<div class="pg-kpi__sub">([^<]+)<\/div>/i)?.[1]?.trim() || "";

        if (lab.toLowerCase().includes("overall")) {
          overallRate = val || "66.6%";
          const nums = sub.match(/([\d,]+)\s+of\s+([\d,]+)/i);
          if (nums) {
            overallCorrect = parseInt(nums[1].replace(/,/g, ""), 10);
            overallTotal = parseInt(nums[2].replace(/,/g, ""), 10);
          }
        } else if (lab.toLowerCase().includes("bankers")) {
          bankersRate = val || "72.5%";
          const nums = sub.match(/([\d,]+)\s+of\s+([\d,]+)/i);
          if (nums) {
            bankersCorrect = parseInt(nums[1].replace(/,/g, ""), 10);
            bankersTotal = parseInt(nums[2].replace(/,/g, ""), 10);
          }
        } else if (lab.toLowerCase().includes("matches predicted")) {
          matchesPredicted = parseInt(val.replace(/,/g, ""), 10) || 278849;
        } else if (lab.toLowerCase().includes("tracked daily")) {
          const nums = sub.match(/([\d,]+)\s+days/i);
          if (nums) {
            daysTracked = parseInt(nums[1].replace(/,/g, ""), 10);
          }
        }
      }

      const dateMatch = html.match(/<time datetime="([^"]+)">/i) || html.match(/Record last updated ([A-Za-z]+ \d+, \d{4})/i);
      const recordDate = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);

      // 2. Extract Monthly Breakdown Rows
      const monthlyBreakdown: Array<{ month: string; bkRate: string; bkCount: string; ovRate: string; ovCount: string }> = [];
      const trRegex = /<tr>[\s\S]*?<th scope="row">([^<]+)<\/th>[\s\S]*?<span class="pg-mt__v"[^>]*>([^<]+)<\/span>[\s\S]*?<span class="pg-mt__n">([^<]+)<\/span>[\s\S]*?<span class="pg-mt__v"[^>]*>([^<]+)<\/span>[\s\S]*?<span class="pg-mt__n">([^<]+)<\/span>[\s\S]*?<\/tr>/gi;
      let trMatch;
      while ((trMatch = trRegex.exec(html)) !== null) {
        monthlyBreakdown.push({
          month: trMatch[1].trim(),
          bkRate: trMatch[2].trim(),
          bkCount: trMatch[3].trim(),
          ovRate: trMatch[4].trim(),
          ovCount: trMatch[5].trim(),
        });
      }

      // 3. Extract Recent Form data-tip
      const recentForm: Array<{ date: string; rate: string; count: number }> = [];
      const tipRegex = /data-tip="([^"]+)"/gi;
      let tipMatch;
      while ((tipMatch = tipRegex.exec(html)) !== null) {
        const text = tipMatch[1];
        const parts = text.match(/^([A-Za-z]+\s+\d+)\s+·\s+([\d.]+%)\s+\(([\d,]+)\)$/);
        if (parts) {
          recentForm.push({
            date: parts[1],
            rate: parts[2],
            count: parseInt(parts[3].replace(/,/g, ""), 10),
          });
        }
      }

      return {
        recordDate,
        overallRate,
        overallCorrect,
        overallTotal,
        bankersRate,
        bankersCorrect,
        bankersTotal,
        matchesPredicted,
        daysTracked,
        monthlyBreakdown: monthlyBreakdown.length > 0 ? monthlyBreakdown : [
          { month: "September 2026", bkRate: "76.7%", bkCount: "159 banker picks", ovRate: "67.2%", ovCount: "7,471 predictions" },
          { month: "August 2026", bkRate: "69.8%", bkCount: "139 banker picks", ovRate: "67%", ovCount: "9,186 predictions" },
          { month: "July 2026", bkRate: "72.2%", bkCount: "115 banker picks", ovRate: "65.5%", ovCount: "4,405 predictions" },
          { month: "June 2026", bkRate: "68%", bkCount: "100 banker picks", ovRate: "68.4%", ovCount: "3,139 predictions" },
          { month: "May 2026", bkRate: "65.8%", bkCount: "196 banker picks", ovRate: "66.6%", ovCount: "9,039 predictions" },
          { month: "April 2026", bkRate: "77.5%", bkCount: "200 banker picks", ovRate: "67.4%", ovCount: "10,568 predictions" },
          { month: "March 2026", bkRate: "74.6%", bkCount: "201 banker picks", ovRate: "67.1%", ovCount: "9,699 predictions" },
          { month: "February 2026", bkRate: "74.4%", bkCount: "211 banker picks", ovRate: "67%", ovCount: "8,089 predictions" },
          { month: "January 2026", bkRate: "70.8%", bkCount: "212 banker picks", ovRate: "66.8%", ovCount: "6,004 predictions" },
          { month: "December 2025", bkRate: "78.8%", bkCount: "132 banker picks", ovRate: "67%", ovCount: "3,888 predictions" },
          { month: "November 2025", bkRate: "72.9%", bkCount: "181 banker picks", ovRate: "66.9%", ovCount: "5,970 predictions" },
          { month: "October 2025", bkRate: "67.5%", bkCount: "200 banker picks", ovRate: "66.9%", ovCount: "6,152 predictions" },
        ],
        recentForm,
        scrapedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error("[NerdyTipsScraper] Progress page scraping error:", err.message);
      return null;
    }
  }

  async scrapeHitAndWinMatches(): Promise<HitAndWinMatch[]> {
    const cacheKey = "hitandwin_matches";
    const cached = await cacheService.get<HitAndWinMatch[]>(cacheKey);
    if (cached && cached.length === 10) {
      return cached;
    }

    try {
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      };

      const res = await fetch(`${this.baseUrl}/hitandwin`, { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const html = await res.text();
      const matchRegex = /<div class="hw-match(?:[^"]*)">([\s\S]*?)<\/div>\s*(?=<div class="hw-match"|<\/div>\s*<\/div>\s*<aside)/gi;
      const rawMatches: string[] = [];
      let m;
      while ((m = matchRegex.exec(html)) !== null) {
        rawMatches.push(m[1]);
      }

      const parsed: HitAndWinMatch[] = [];
      rawMatches.forEach((block, idx) => {
        const noMatch = block.match(/class="hw-match__no">(\d+)</);
        const timeMatch = block.match(/class="hw-match__time">([^<]+)(?:<span class="hw-match__day">([^<]+)<\/span>)?/);

        const teamMatches = Array.from(block.matchAll(/<a class="hw-team"[^>]*>(?:<img[^>]*src="([^"]*)"[^>]*>)?<span>([^<]+)<\/span><\/a>/g));
        const homeTeam = teamMatches[0] ? { name: teamMatches[0][2].trim(), logo: teamMatches[0][1] || null } : { name: "Home Team", logo: null };
        const awayTeam = teamMatches[1] ? { name: teamMatches[1][2].trim(), logo: teamMatches[1][1] || null } : { name: "Away Team", logo: null };

        const idMatch = block.match(/name="pick\[(\d+)\]"/);
        const matchId = idMatch ? idMatch[1] : `hw_${idx + 1}`;

        const pick1Match = block.match(/value="1"[\s\S]*?class="hw-pick__o[^"]*">([\d\.]+)</);
        const pickXMatch = block.match(/value="X"[\s\S]*?class="hw-pick__o[^"]*">([\d\.]+)</);
        const pick2Match = block.match(/value="2"[\s\S]*?class="hw-pick__o[^"]*">([\d\.]+)</);

        parsed.push({
          index: noMatch ? parseInt(noMatch[1], 10) : idx + 1,
          id: matchId,
          time: timeMatch ? timeMatch[1].trim() : "--:--",
          dayLabel: timeMatch && timeMatch[2] ? timeMatch[2].trim() : undefined,
          homeTeam,
          awayTeam,
          odds: {
            "1": pick1Match ? pick1Match[1] : "2.10",
            "X": pickXMatch ? pickXMatch[1] : "3.10",
            "2": pick2Match ? pick2Match[1] : "3.20",
          },
          status: "UPCOMING",
        });
      });

      if (parsed.length >= 10) {
        const tenMatches = parsed.slice(0, 10);
        await cacheService.set(cacheKey, tenMatches, 6 * 3600); // 6 hours
        return tenMatches;
      }
    } catch (err: any) {
      console.warn("[NerdyTipsScraper] HitAndWin scrape error:", err.message);
    }

    return this.getFallbackHitAndWinMatches();
  }

  private getFallbackHitAndWinMatches(): HitAndWinMatch[] {
    return [
      { index: 1, id: "1638365", time: "23:15", homeTeam: { name: "Madureira", logo: "https://cdn.nerdytips.com/public/img/logos/7780.webp?width=48" }, awayTeam: { name: "Sampaio C", logo: "https://cdn.nerdytips.com/public/img/logos/13115.webp?width=48" }, odds: { "1": "2.62", "X": "2.90", "2": "2.95" } },
      { index: 2, id: "1638366", time: "23:30", homeTeam: { name: "Gimnasia LP 2", logo: "https://cdn.nerdytips.com/public/img/logos/18686.webp?width=48" }, awayTeam: { name: "Estudiant", logo: "https://cdn.nerdytips.com/public/img/logos/18685.webp?width=48" }, odds: { "1": "2.62", "X": "3.00", "2": "2.55" } },
      { index: 3, id: "1638367", time: "23:30", homeTeam: { name: "Saguntino", logo: null }, awayTeam: { name: "Navalcarnero", logo: null }, odds: { "1": "3.60", "X": "3.05", "2": "2.12" } },
      { index: 4, id: "1638368", time: "23:30", homeTeam: { name: "Aldosivi 2", logo: null }, awayTeam: { name: "Quilmes 2", logo: null }, odds: { "1": "2.90", "X": "3.05", "2": "2.40" } },
      { index: 5, id: "1528862", time: "00:15", dayLabel: "Sep 25", homeTeam: { name: "Netherlands", logo: "https://cdn.nerdytips.com/public/img/logos/1118.webp?width=48" }, awayTeam: { name: "Germany", logo: "https://cdn.nerdytips.com/public/img/logos/25.webp?width=48" }, odds: { "1": "2.42", "X": "3.75", "2": "2.72" } },
      { index: 6, id: "1528863", time: "00:15", dayLabel: "Sep 25", homeTeam: { name: "Serbia", logo: null }, awayTeam: { name: "Greece", logo: null }, odds: { "1": "2.65", "X": "3.30", "2": "2.72" } },
      { index: 7, id: "1528864", time: "00:15", dayLabel: "Sep 25", homeTeam: { name: "Kosovo", logo: null }, awayTeam: { name: "Ireland", logo: null }, odds: { "1": "2.45", "X": "3.15", "2": "3.10" } },
      { index: 8, id: "1528865", time: "00:15", dayLabel: "Sep 25", homeTeam: { name: "Norway", logo: null }, awayTeam: { name: "Denmark", logo: null }, odds: { "1": "1.78", "X": "4.10", "2": "4.35" } },
      { index: 9, id: "1528866", time: "00:15", dayLabel: "Sep 26", homeTeam: { name: "Italy", logo: null }, awayTeam: { name: "Belgium", logo: null }, odds: { "1": "2.18", "X": "3.55", "2": "3.40" } },
      { index: 10, id: "1528884", time: "00:15", dayLabel: "Sep 26", homeTeam: { name: "Hungary", logo: "https://cdn.nerdytips.com/public/img/logos/769.webp?width=48" }, awayTeam: { name: "Ukraine", logo: "https://cdn.nerdytips.com/public/img/logos/772.webp?width=48" }, odds: { "1": "2.32", "X": "3.30", "2": "3.25" } },
    ];
  }
}

export interface HitAndWinMatch {
  index: number;
  id: string;
  time: string;
  dayLabel?: string;
  homeTeam: {
    name: string;
    logo?: string | null;
  };
  awayTeam: {
    name: string;
    logo?: string | null;
  };
  odds: {
    "1": string;
    "X": string;
    "2": string;
  };
  status?: string;
  finalScore?: string | null;
  outcome?: "1" | "X" | "2" | null;
}

export interface HitAndWinSlip {
  id: string;
  userId: string;
  slipNumber: number;
  createdAt: string;
  status: "PENDING" | "WON" | "LOST";
  correctCount: number;
  totalMatches: number;
  picks: Array<{
    matchId: string;
    index: number;
    homeTeam: string;
    awayTeam: string;
    time: string;
    pick: "1" | "X" | "2";
    odd: string;
    status: "PENDING" | "WON" | "LOST";
    score?: string | null;
  }>;
}

export interface AiProgressScrapedData {
  recordDate: string;
  overallRate: string;
  overallCorrect: number;
  overallTotal: number;
  bankersRate: string;
  bankersCorrect: number;
  bankersTotal: number;
  matchesPredicted: number;
  daysTracked: number;
  monthlyBreakdown: Array<{
    month: string;
    bkRate: string;
    bkCount: string;
    ovRate: string;
    ovCount: string;
  }>;
  recentForm: Array<{
    date: string;
    rate: string;
    count: number;
  }>;
  scrapedAt: string;
}

export interface FullMatchDetails {
  matchId: string;
  hero: {
    countryFlag: string | null;
    country: string;
    leagueName: string;
    homeTeam: { name: string; logo: string | null; marketValue?: string };
    awayTeam: { name: string; logo: string | null; marketValue?: string };
    date: string;
    time: string;
    homeScore: string | null;
    awayScore: string | null;
    status: string;
    odds1x2: Array<{ label: string; isTip: boolean; odd: string }>;
    keyMoments: Array<{
      isStage: boolean;
      minute: string | null;
      score: string | null;
      player: string | null;
      type: "stage" | "goal" | "red" | "event";
      side: "home" | "away";
      rawText: string;
    }>;
  };
  tips: {
    warning: string | null;
    bestTip?: {
      pick: string;
      odd: string;
      explanation: string;
      confidence: string;
    };
    cards: Array<{
      title: string;
      pick: string | null;
      odd: string | null;
      confidence: string | null;
      score: { home: string; away: string } | null;
    }>;
  };
  statistics: Array<{
    label: string;
    home: string;
    away: string;
    homeLead: boolean;
    awayLead: boolean;
  }>;
  form: Array<{
    label: string;
    home: string;
    away: string;
    homeLead: boolean;
    awayLead: boolean;
  }>;
  h2h: {
    tally: {
      homeWins: string;
      draws: string;
      awayWins: string;
      homeRatio: string;
      drawRatio: string;
      awayRatio: string;
    };
    matches: Array<{
      date: string;
      team1: { name: string; logo: string; score: string; isWin: boolean } | null;
      team2: { name: string; logo: string; score: string; isWin: boolean } | null;
    }>;
  };
  recentMatches: {
    home: {
      name: string;
      crest: string | null;
      form: string[];
      matches: Array<{
        url: string;
        badge: string;
        date: string;
        homeTeam: { name: string; logo: string } | null;
        awayTeam: { name: string; logo: string } | null;
        homeScore: string;
        awayScore: string;
        odd1: string;
        odd2: string;
      }>;
    };
    away: {
      name: string;
      crest: string | null;
      form: string[];
      matches: Array<{
        url: string;
        badge: string;
        date: string;
        homeTeam: { name: string; logo: string } | null;
        awayTeam: { name: string; logo: string } | null;
        homeScore: string;
        awayScore: string;
        odd1: string;
        odd2: string;
      }>;
    };
  };
  standings: {
    leagueName: string;
    leagueLogo: string | null;
    rows: Array<{
      isCurrent: boolean;
      rank: string;
      zoneClass: string;
      teamName: string;
      teamLogo: string | null;
      played: string;
      goals: string;
      points: string;
    }>;
  };
}

export interface MatchInsight {
  matchId: string;
  articleTitle: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  predictedStats: Array<{ stat: string; home: string; away: string }>;
  actualStats: Array<{ stat: string; home: string; away: string }>;
}

export const nerdyTipsScraper = new NerdyTipsScraper();
