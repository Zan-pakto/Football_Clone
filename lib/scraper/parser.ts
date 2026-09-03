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
      try {
        const $m = $(el);

        const id = $m.attr("data-match");
        if (!id) return;

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
          // If slug parsed home team name is different, prioritize slug accuracy
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
        const isLive = status === "live" || elapsed?.toLowerCase().includes("live") || (elapsed !== "FT" && status === "In Progress");

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

        matches.push({
          id,
          url,
          leagueName: leagueInfo.leagueName,
          country: leagueInfo.country,
          flagUrl: leagueInfo.flagUrl,
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
        });
      } catch (err) {
        console.error("Error parsing single match row:", err);
      }
    });
  }

  return matches;
}
