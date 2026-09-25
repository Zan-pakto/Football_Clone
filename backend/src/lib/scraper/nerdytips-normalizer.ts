import { MatchData } from "../types";
import { ScrapedMatch } from "./nerdytips-scraper";
import { resolveDateString } from "../utils";
import { getCountryFlagUrl } from "../flags";
import { adjustOddStr, adjustConfidence, adjustRating } from "../ai/ai-variance";
import { toCachedLogoUrl } from "../logo-utils";

export function normalizeScrapedMatchToMatchData(m: ScrapedMatch): MatchData {
  const matchDate = resolveDateString(m.dParam);
  const homeOddStr = adjustOddStr(m.odds.home ? m.odds.home.toFixed(2) : null, `${m.id}_home`);
  const drawOddStr = adjustOddStr(m.odds.draw ? m.odds.draw.toFixed(2) : null, `${m.id}_draw`);
  const awayOddStr = adjustOddStr(m.odds.away ? m.odds.away.toFixed(2) : null, `${m.id}_away`);

  // Determine market category for the best tip
  let bestMarket = "pickScore";
  const tipLower = m.bestTip.toLowerCase();
  if (tipLower.includes("goal") || tipLower.includes("over") || tipLower.includes("under")) {
    bestMarket = "goals";
  } else if (tipLower.includes("score") && (tipLower.includes("both") || tipLower.includes("won't") || tipLower.includes("team"))) {
    bestMarket = "btts";
  }

  const rawRating = typeof m.rating === "number" && !isNaN(m.rating) ? m.rating : Number((m.confidenceValue / 10).toFixed(1));
  const ratingOutOf10 = adjustRating(rawRating, `${m.id}_rate`) || rawRating;

  const rawConf = m.confidenceValue || Math.round(rawRating * 10);
  const adjustedConf = adjustConfidence(rawConf, `${m.id}_conf`) || rawConf;

  const rawPsRating = m.pickScore?.rating ?? (ratingOutOf10 >= 8.0 ? Number((ratingOutOf10 * 0.9).toFixed(1)) : 6.8);
  const psRating = adjustRating(rawPsRating, `${m.id}_ps_rate`) || rawPsRating;

  const rawGoalsRating = m.goals?.rating ?? (ratingOutOf10 >= 8.0 ? Number((ratingOutOf10 * 0.88).toFixed(1)) : 6.4);
  const goalsRating = adjustRating(rawGoalsRating, `${m.id}_goals_rate`) || rawGoalsRating;

  const rawBttsRating = m.btts?.rating ?? (ratingOutOf10 >= 8.0 ? Number((ratingOutOf10 * 0.8).toFixed(1)) : 6.0);
  const bttsRating = adjustRating(rawBttsRating, `${m.id}_btts_rate`) || rawBttsRating;

  const cLower = (m.country || "").toLowerCase().trim();
  const normalizedCountry =
    cLower === "rica" || cLower === "costarica" || cLower === "costa-rica" || cLower === "costa rica"
      ? "Costa Rica"
      : cLower === "republic" || cLower === "czechia" || cLower === "czech republic"
      ? "Czech Republic"
      : cLower === "salvador" || cLower === "el salvador"
      ? "El Salvador"
      : cLower === "arabia" || cLower === "saudi arabia"
      ? "Saudi Arabia"
      : cLower === "states" || cLower === "united states" || cLower === "usa"
      ? "USA"
      : m.country || "International";

  return {
    id: m.id,
    url: m.href,
    leagueName: m.league,
    country: normalizedCountry,
    flagUrl: getCountryFlagUrl(normalizedCountry),
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeLogo: toCachedLogoUrl(m.homeLogo),
    awayLogo: toCachedLogoUrl(m.awayLogo),
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
        odd: adjustOddStr(m.tipOdds ? m.tipOdds.toFixed(2) : (homeOddStr || "1.85"), `${m.id}_best_odd`) || (homeOddStr || "1.85"),
        rating: ratingOutOf10,
        confidence: adjustedConf,
        trust: `${ratingOutOf10}/10`,
        isBest: true,
        market: bestMarket,
        marketLabel: bestMarket === "goals" ? "Over/Under" : bestMarket === "btts" ? "Both Teams to Score" : "1X2 / Double Chance",
        isLocked: false,
      },
      pickScore: {
        pick: m.pickScore?.pick || (homeOddStr && awayOddStr ? (parseFloat(homeOddStr) <= parseFloat(awayOddStr) ? "1" : "2") : "1"),
        odd: adjustOddStr(m.pickScore?.odd ? m.pickScore.odd.toFixed(2) : (homeOddStr || "1.85"), `${m.id}_ps_odd`) || (homeOddStr || "1.85"),
        rating: psRating,
        trust: `${psRating}/10`,
        confidence: Math.round(psRating * 10),
        isLocked: false,
      },
      goals: {
        pick: m.goals?.pick || (tipLower.includes("under") ? "Under 2.5" : "Over 2.5"),
        odd: adjustOddStr(m.goals?.odd ? m.goals.odd.toFixed(2) : "1.75", `${m.id}_goals_odd`) || "1.75",
        rating: goalsRating,
        trust: `${goalsRating}/10`,
        confidence: Math.round(goalsRating * 10),
        isLocked: false,
      },
      btts: {
        pick: m.btts?.pick || (tipLower.includes("won't score") ? "No" : "Yes"),
        odd: adjustOddStr(m.btts?.odd ? m.btts.odd.toFixed(2) : "1.82", `${m.id}_btts_odd`) || "1.82",
        rating: bttsRating,
        trust: `${bttsRating}/10`,
        confidence: Math.round(bttsRating * 10),
        isLocked: false,
      },
      bestMarket,
      isLocked: false,
    },
    confidence: `${adjustedConf}%`,
    isLive: m.status === "LIVE",
    isLocked: false,
    queryTags: `${m.homeTeam} ${m.awayTeam} ${m.league} ${m.country}`.toLowerCase(),
  };
}
