import { MatchData } from "../types";
import { ScrapedMatch } from "./nerdytips-scraper";
import { resolveDateString } from "../utils";
import { getCountryFlagUrl } from "../flags";

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

  const ratingOutOf10 = typeof m.rating === "number" && !isNaN(m.rating) ? m.rating : Number((m.confidenceValue / 10).toFixed(1));

  const psRating = m.pickScore?.rating ?? (ratingOutOf10 >= 8.0 ? Number((ratingOutOf10 * 0.9).toFixed(1)) : 6.8);
  const goalsRating = m.goals?.rating ?? (ratingOutOf10 >= 8.0 ? Number((ratingOutOf10 * 0.88).toFixed(1)) : 6.4);
  const bttsRating = m.btts?.rating ?? (ratingOutOf10 >= 8.0 ? Number((ratingOutOf10 * 0.8).toFixed(1)) : 6.0);

  return {
    id: m.id,
    url: m.href,
    leagueName: m.league,
    country: m.country,
    flagUrl: getCountryFlagUrl(m.country),
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
    rating: ratingOutOf10,
    predictions: {
      bestTip: {
        pick: m.bestTip,
        odd: m.tipOdds ? m.tipOdds.toFixed(2) : (homeOddStr || "1.85"),
        rating: ratingOutOf10,
        confidence: m.confidenceValue,
        trust: `${ratingOutOf10}/10`,
        isBest: true,
        market: bestMarket,
        marketLabel: bestMarket === "goals" ? "Over/Under" : bestMarket === "btts" ? "Both Teams to Score" : "1X2 / Double Chance",
        isLocked: Boolean(m.isPremium),
      },
      pickScore: {
        pick: m.pickScore?.pick || (homeOddStr && awayOddStr ? (parseFloat(homeOddStr) <= parseFloat(awayOddStr) ? "1" : "2") : "1"),
        odd: m.pickScore?.odd ? m.pickScore.odd.toFixed(2) : (homeOddStr || "1.85"),
        rating: psRating,
        trust: `${psRating}/10`,
        confidence: Math.round(psRating * 10),
        isLocked: false,
      },
      goals: {
        pick: m.goals?.pick || (tipLower.includes("under") ? "Under 2.5" : "Over 2.5"),
        odd: m.goals?.odd ? m.goals.odd.toFixed(2) : "1.75",
        rating: goalsRating,
        trust: `${goalsRating}/10`,
        confidence: Math.round(goalsRating * 10),
        isLocked: false,
      },
      btts: {
        pick: m.btts?.pick || (tipLower.includes("won't score") ? "No" : "Yes"),
        odd: m.btts?.odd ? m.btts.odd.toFixed(2) : "1.82",
        rating: bttsRating,
        trust: `${bttsRating}/10`,
        confidence: Math.round(bttsRating * 10),
        isLocked: Boolean(m.isPremium),
      },
      bestMarket,
      isLocked: Boolean(m.isPremium),
    },
    confidence: m.confidence || `${Math.round(ratingOutOf10 * 10)}%`,
    isLive: m.status === "LIVE",
    isLocked: Boolean(m.isPremium),
    queryTags: `${m.homeTeam} ${m.awayTeam} ${m.league} ${m.country}`.toLowerCase(),
  };
}
