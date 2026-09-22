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
      return {
        label: clean(m[2]),
        isTip: m[1].includes("md-1x2--tip"),
        odd: num ? num[1] : rawO,
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
      details.tips.bestTip = {
        pick: clean(bestPick[1]),
        odd: bestOdd ? bestOdd[1] : "",
        explanation: bestExpl ? clean(bestExpl[1]) : "",
        confidence: bestConf ? clean(bestConf[1]) : "",
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

      details.tips.cards.push({
        title: lbl ? clean(lbl[1]) : "",
        pick: tip ? clean(tip[1]) : null,
        odd: odd ? odd[1] : null,
        confidence: conf ? clean(conf[1]) : null,
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
