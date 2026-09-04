import * as cheerio from "cheerio";
import { LeagueGroup, MatchData } from "./types";

/**
 * Clean text value (remove arrows, symbols, extra whitespace)
 */
export function cleanValue(val: string | undefined | null): string | null {
  if (!val) return null;
  const cleaned = val.replace(/[▴▾✓\n\r\t]/g, "").trim();
  return cleaned || null;
}

/**
 * Determine accurately if a match is live in-progress (not terminal, not upcoming)
 */
export function isMatchLive(status: string | null | undefined, elapsed: string | null | undefined): boolean {
  if (!status && !elapsed) return false;
  const s = (status || "").trim();
  const e = (elapsed || "").trim();

  // Terminal check: finished, won, lost, FT, AET, Pen, canceled, postponed, ended
  if (/\b(fin|finished|won|lost|FT|AET|Pen|cancel|canceled|postpone|postponed|ended)\b/i.test(s)) return false;
  if (/^(FT|AET|Pen|90\+|120|120\+)/i.test(e)) return false;

  // Upcoming check
  if (s.toLowerCase() === "upcoming") return false;
  if (/^\d{1,2}:\d{2}$/.test(e)) return false;

  // Live match indicators
  if (/live|in progress|half|1st|2nd|ht|\d+['′]/i.test(s)) return true;
  if (/live|in progress|half|1st|2nd|ht|\d+['′]/i.test(e)) return true;

  return s.toLowerCase() === "live" || s.toLowerCase() === "in progress";
}

/**
 * Helper: Extract accurate team names from URL slug if HTML selectors are ambiguous
 * Example: /match-details/fc-halifax-town-vs-hartlepool-prediction-1299198
 */
export function parseTeamsFromUrlSlug(url: string | null): { home: string | null; away: string | null } {
  if (!url) return { home: null, away: null };
  const match = url.match(/\/match-details\/(.+?)-vs-(.+?)-prediction-\d+/);
  if (!match) return { home: null, away: null };

  const formatName = (slug: string) => {
    return slug
      .split("-")
      .map((w) => {
        if (w.toLowerCase() === "fc") return "FC";
        if (w.toLowerCase() === "ii") return "II";
        if (w.toLowerCase() === "u21") return "U21";
        if (w.toLowerCase() === "u19") return "U19";
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(" ");
  };

  return {
    home: formatName(match[1]),
    away: formatName(match[2]),
  };
}

/**
 * Extract league groups metadata from main page HTML
 */
export function extractLeagueGroups(html: string): LeagueGroup[] {
  const $ = cheerio.load(html);
  const groups: LeagueGroup[] = [];

  $("[data-lg]").each((_, el) => {
    const $group = $(el);
    const $head = $group.find("[data-lg-head]");
    const $body = $group.find("[data-lg-body]");

    const groupKey = $body.attr("data-lg-k");
    const bodyId = $body.attr("id") || "";

    if (!groupKey) return;

    const leagueName =
      $head.find(".lgl span.text-heading").text().trim() ||
      $head.find("span.text-heading").text().trim() ||
      "Other Matches";

    const country =
      $head.find(".lgl span.text-muted").text().trim() ||
      $head.find("span.text-muted").text().trim() ||
      "World";

    const flagUrl = $head.find("img").attr("src") || null;

    const countText = $head
      .find(".grid.h-5, [class*='rounded-full']")
      .first()
      .text()
      .trim();

    groups.push({
      groupKey,
      bodyId,
      leagueName,
      country,
      flagUrl,
      matchCount: parseInt(countText || "0", 10) || 0,
    });
  });

  return groups;
}

/**
 * Parse a single match cheerio element
 */
export function parseMatchElement(
  $: cheerio.CheerioAPI,
  el: cheerio.Element,
  leagueInfo: Partial<LeagueGroup> = {}
): MatchData | null {
  try {
    const $m = $(el);

    const id = $m.attr("data-match");
    if (!id) return null;

    const kickTime = $m.attr("data-kick") || null;
    const status = $m.attr("data-status") || "upcoming";
    const url = $m.attr("href") || null;
    const queryTags = $m.attr("data-q") || null;

    // Teams parsing with URL slug fallback verification
    const slugTeams = parseTeamsFromUrlSlug(url);

    const $mw = $m.find(".nt-teams .nt-tl.is-mw");
    const $ml = $m.find(".nt-teams .nt-tl.is-ml");

    let homeTeam = $mw.find(".nt-nm-x").text().trim();
    let awayTeam = $ml.find(".nt-nm-x").text().trim();

    if (!homeTeam) {
      homeTeam = $m.find(".nt-nm-x").eq(0).text().trim() || slugTeams.home || "Home Team";
    }
    if (!awayTeam || awayTeam === homeTeam) {
      awayTeam = $m.find(".nt-nm-x").eq(1).text().trim();
      if (!awayTeam || awayTeam === homeTeam) {
        awayTeam = slugTeams.away || "Away Team";
      }
    }

    // Final verification check against slug
    if (slugTeams.home && homeTeam.toLowerCase() !== slugTeams.home.toLowerCase()) {
      homeTeam = slugTeams.home;
    }
    if (slugTeams.away && awayTeam.toLowerCase() !== slugTeams.away.toLowerCase()) {
      awayTeam = slugTeams.away;
    }

    const homeLogo =
      $mw.find("img").attr("src") ||
      $m.find("img").eq(0).attr("src") ||
      null;

    const awayLogo =
      $ml.find("img").attr("src") ||
      $m.find("img").eq(1).attr("src") ||
      null;

    // Scores
    const homeScoreRaw = $m.find("[data-score-h]").text().trim();
    const awayScoreRaw = $m.find("[data-score-a]").text().trim();
    const homeScore = homeScoreRaw !== "" ? homeScoreRaw : null;
    const awayScore = awayScoreRaw !== "" ? awayScoreRaw : null;

    // Elapsed / status label
    const elapsed = $m.find(".nt-time").text().trim() || null;
    const isLive = isMatchLive(status, elapsed);

    // 1X2 Odds
    const $oddsGroup = $m.find(".tb-cellgroup.nt-d").first();
    const $oddsItems = $oddsGroup.find(".tb-odd");

    const homeOdd = cleanValue($oddsItems.eq(0).text());
    const drawOdd = cleanValue($oddsItems.eq(1).text());
    const awayOdd = cleanValue($oddsItems.eq(2).text());

    // Predictions
    const $picksGroup = $m.find(".tb-cellgroup.tb-cg-gap.nt-d").first();
    const $pickScoreEl = $picksGroup.find(".tbm-pickscore");
    const $goalsEl = $picksGroup.find(".tbm-goals");
    const $bttsEl = $picksGroup.find(".tb-mcell").eq(2);

    const pickScore = {
      pick: cleanValue($pickScoreEl.find(".tb-mcell__pick").text()),
      odd: cleanValue($pickScoreEl.find(".tb-mcell__odd").text()),
    };

    const goals = {
      pick: cleanValue($goalsEl.find(".tb-mcell__pick").text()),
      odd: cleanValue($goalsEl.find(".tb-mcell__odd").text()),
    };

    const btts = {
      pick: cleanValue($bttsEl.find(".tb-mcell__pick").text()),
      odd: cleanValue($bttsEl.find(".tb-mcell__odd").text()),
    };

    // Best Tip & Confidence
    const $lastGroup = $m.find(".tb-cellgroup.nt-cg-last");
    const $bestTipEl = $lastGroup.find(".tbm-besttip");
    const bestTip = {
      pick: cleanValue($bestTipEl.find(".tb-mcell__pick").text()),
      odd: cleanValue($bestTipEl.find(".tb-mcell__odd").text()),
    };

    const confidence = cleanValue($lastGroup.find(".tb-trust").text());

    return {
      id,
      url,
      leagueName: leagueInfo.leagueName || "Football League",
      country: leagueInfo.country || "World",
      flagUrl: leagueInfo.flagUrl || null,
      homeTeam,
      awayTeam,
      homeLogo,
      awayLogo,
      kickTime,
      status,
      homeScore,
      awayScore,
      elapsed,
      isLive,
      odds: {
        home: homeOdd,
        draw: drawOdd,
        away: awayOdd,
      },
      predictions: {
        pickScore,
        goals,
        btts,
        bestTip,
      },
      confidence,
      queryTags,
    };
  } catch (err) {
    console.error("Error parsing single match row:", err);
    return null;
  }
}

/**
 * Parse match HTML returned inside the /all-matches/rows endpoint groups JSON
 */
export function parseMatchRowsHtml(
  groupHtmlMap: Record<string, string>,
  leagueMap: Record<string, LeagueGroup> = {}
): MatchData[] {
  const matches: MatchData[] = [];

  for (const [groupKey, html] of Object.entries(groupHtmlMap)) {
    if (!html) continue;

    const leagueInfo = leagueMap[groupKey] || {
      leagueName: "Football League",
      country: "World",
      flagUrl: null,
    };

    const $ = cheerio.load(html);

    $("a[data-match]").each((_, el) => {
      const match = parseMatchElement($, el, leagueInfo);
      if (match) matches.push(match);
    });
  }

  return matches;
}

/**
 * Extract pre-rendered match rows directly from main page HTML
 */
export function extractMainHtmlMatches(html: string): MatchData[] {
  const $ = cheerio.load(html);
  const matches: MatchData[] = [];
  const seenIds = new Set<string>();

  $("[data-lg]").each((_, lgEl) => {
    const $lg = $(lgEl);
    const $head = $lg.find("[data-lg-head]");
    const $body = $lg.find("[data-lg-body]");

    const leagueName =
      $head.find(".lgl span.text-heading").text().trim() ||
      $head.find("span.text-heading").text().trim() ||
      "Football League";

    const country =
      $head.find(".lgl span.text-muted").text().trim() ||
      $head.find("span.text-muted").text().trim() ||
      "World";

    const flagUrl = $head.find("img").attr("src") || null;

    $body.find("a[data-match]").each((_, mEl) => {
      const match = parseMatchElement($, mEl, { leagueName, country, flagUrl });
      if (match && !seenIds.has(match.id)) {
        seenIds.add(match.id);
        matches.push(match);
      }
    });
  });

  // Standalone matches check in case any exist outside [data-lg]
  $("a[data-match]").each((_, mEl) => {
    const id = $(mEl).attr("data-match");
    if (id && !seenIds.has(id)) {
      const match = parseMatchElement($, mEl, { leagueName: "Football League", country: "World", flagUrl: null });
      if (match) {
        seenIds.add(match.id);
        matches.push(match);
      }
    }
  });

  return matches;
}

