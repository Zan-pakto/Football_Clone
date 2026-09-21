import { MatchData } from "../types";
import { ScrapedMatch } from "./nerdytips-scraper";
import { resolveDateString } from "../utils";

export function normalizeScrapedMatchToMatchData(m: ScrapedMatch): MatchData {
  const matchDate = resolveDateString(m.dParam);
  const homeOddStr = m.odds.home ? m.odds.home.toFixed(2) : null;
  const drawOddStr = m.odds.draw ? m.odds.draw.toFixed(2) : null;
  const awayOddStr = m.odds.away ? m.odds.away.toFixed(2) : null;

  // Determine market category for the best tip
  let bestMarket = "pickScore";
  const tipLower = m.bestTip.toLowerCase();
  if (tipLower.includes("goal") || tipLower.includes("over") || tipLower.includes("under")) {
    bestMarket = "goals";
  } else if (tipLower.includes("score") && (tipLower.includes("both") || tipLower.includes("won't") || tipLower.includes("team"))) {
    bestMarket = "btts";
  }

  const ratingOutOf10 = Number((m.confidenceValue / 10).toFixed(1));

  return {
    id: m.id,
    url: m.href,
    leagueName: m.league,
    country: m.country,
    flagUrl: `/flags/${m.country.toLowerCase().replace(/\s+/g, "-")}.png`,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeLogo: null,
    awayLogo: null,
    kickTime: m.kickoff,
    matchDate,
    status: m.status.toLowerCase(),
    homeScore: m.homeScore !== undefined ? String(m.homeScore) : null,
    awayScore: m.awayScore !== undefined ? String(m.awayScore) : null,
    odds: {
      home: homeOddStr,
      draw: drawOddStr,
      away: awayOddStr,
    },
    predictions: {
      bestTip: {
        pick: m.bestTip,
        odd: m.tipOdds ? m.tipOdds.toFixed(2) : (homeOddStr || "1.85"),
        rating: ratingOutOf10,
        confidence: m.confidenceValue,
        isBest: true,
        market: bestMarket,
        marketLabel: bestMarket === "goals" ? "Over/Under" : bestMarket === "btts" ? "Both Teams to Score" : "1X2 / Double Chance",
        isLocked: Boolean(m.isPremium),
      },
      pickScore: {
        pick: homeOddStr && awayOddStr ? (parseFloat(homeOddStr) <= parseFloat(awayOddStr) ? "1" : "2") : "1",
        odd: homeOddStr || "1.85",
        trust: `${ratingOutOf10}/10`,
        isLocked: false,
      },
      goals: {
        pick: tipLower.includes("under") ? "Under 2.5" : "Over 2.5",
        odd: "1.75",
        trust: "7.0/10",
        isLocked: false,
      },
      btts: {
        pick: tipLower.includes("won't score") ? "No" : "Yes",
        odd: "1.82",
        trust: "6.8/10",
        isLocked: Boolean(m.isPremium),
      },
      bestMarket,
      isLocked: Boolean(m.isPremium),
    },
    confidence: m.confidence,
    isLive: m.status === "LIVE",
    isLocked: Boolean(m.isPremium),
    queryTags: `${m.homeTeam} ${m.awayTeam} ${m.league} ${m.country}`.toLowerCase(),
  };
}
