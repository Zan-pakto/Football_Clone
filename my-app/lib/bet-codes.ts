export type SupportedBookmaker = "sportybet" | "bet9ja" | "1xbet" | "betway" | "msport";

export interface BetSelection {
  id?: string;
  homeTeam: string;
  awayTeam: string;
  league?: string;
  country?: string;
  matchDate?: string;
  kickoffTime?: string;
  market: string;
  pick: string;
  odds: number;
}

export interface MarketValidationResult {
  isUniversal: boolean;
  totalPicks: number;
  universalPicks: number;
  nichePicks: Array<{
    match: string;
    market: string;
    pick: string;
    reason: string;
    suggestedUniversal?: { market: string; pick: string };
  }>;
  summary: string;
}

export interface GeneratedBetCodeResult {
  success: boolean;
  bookingCode?: string | null;
  sourceBookmaker?: string;
  targetBookmaker: SupportedBookmaker;
  bookmakerLabel: string;
  brandColor: string;
  loadUrl?: string;
  directWebUrl: string;
  universalValidation: MarketValidationResult;
  provider: "convertbetcodes" | "direct_sync" | "manual";
  instructions: {
    mobileApp: string[];
    mobileWeb: string[];
    desktop: string[];
  };
  totalOdds: number;
  picksCount: number;
  expiresAt: string;
  generatedAt: string;
  error?: string;
  externalUrl?: string;
}

/**
 * Checks whether a selection belongs to universal markets (1X2, Over/Under, BTTS, Double Chance)
 * supported identically on SportyBet and Bet9ja without bookmaker mismatch.
 */
export function isUniversalMarket(marketName: string, pick: string): boolean {
  const m = (marketName || "").trim().toLowerCase();
  const p = (pick || "").trim().toLowerCase();

  // Explicit niche markets that fail on some bookmakers
  if (
    m.includes("draw no bet") ||
    m.includes("dnb") ||
    p.startsWith("dnb") ||
    m.includes("handicap") ||
    m.includes("asian") ||
    m.includes("corner") ||
    m.includes("card") ||
    m.includes("correct score") ||
    m.includes("half time") ||
    m.includes("ht/ft")
  ) {
    return false;
  }

  // 1X2
  if (m.includes("1x2") || m.includes("result")) {
    return ["1", "x", "2", "home", "draw", "away"].includes(p);
  }

  // Double Chance
  if (m.includes("double chance") || ["1x", "x2", "12"].includes(p)) {
    return true;
  }

  // Over / Under
  if (m.includes("over") || m.includes("under") || p.startsWith("over") || p.startsWith("under")) {
    return /^(over|under)\s+[0-9]\.5$/i.test(p) || /^[0-9]\.5$/i.test(p);
  }

  // Both Teams to Score
  if (m.includes("both") || m.includes("btts") || p.includes("btts") || p === "gg" || p === "ng") {
    return true;
  }

  return false;
}

/**
 * Validates selections against universal markets
 */
export function validateUniversalMarkets(selections: BetSelection[]): MarketValidationResult {
  if (!Array.isArray(selections) || selections.length === 0) {
    return {
      isUniversal: true,
      totalPicks: 0,
      universalPicks: 0,
      nichePicks: [],
      summary: "No selections provided.",
    };
  }

  const nichePicks: MarketValidationResult["nichePicks"] = [];

  for (const s of selections) {
    const isUni = isUniversalMarket(s.market, s.pick);
    if (!isUni) {
      const matchLabel = s.homeTeam && s.awayTeam ? `${s.homeTeam} vs ${s.awayTeam}` : "Match";
      let suggested: { market: string; pick: string } | undefined;

      const pLower = (s.pick || "").toLowerCase();
      if (pLower.includes("dnb 1") || pLower.includes("draw no bet 1")) {
        suggested = { market: "Double Chance", pick: "1X" };
      } else if (pLower.includes("dnb 2") || pLower.includes("draw no bet 2")) {
        suggested = { market: "Double Chance", pick: "X2" };
      }

      nichePicks.push({
        match: matchLabel,
        market: s.market,
        pick: s.pick,
        reason: `Niche market '${s.market}' might not be mapped on secondary bookmakers. Restrict to 1X2, Over/Under, or BTTS for 100% conversion.`,
        suggestedUniversal: suggested,
      });
    }
  }

  const universalCount = selections.length - nichePicks.length;
  const isUniversal = nichePicks.length === 0;

  return {
    isUniversal,
    totalPicks: selections.length,
    universalPicks: universalCount,
    nichePicks,
    summary: isUniversal
      ? "100% Universal Markets (1X2, Over/Under, BTTS). Guaranteed 1-click load on SportyBet & Bet9ja."
      : `${nichePicks.length} niche pick(s) detected. Recommend converting to universal markets to prevent load errors.`,
  };
}

/**
 * Generate 1-click booking code from selections
 */
export async function generateBetCode(
  targetBookmaker: SupportedBookmaker,
  selections: BetSelection[]
): Promise<GeneratedBetCodeResult> {
  try {
    const res = await fetch("/api/bet-codes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetBookmaker, selections }),
    });

    if (res.ok) {
      const data = await res.json();
      return data as GeneratedBetCodeResult;
    }
  } catch (err) {
    console.warn("API booking code generation failed, using local format:", err);
  }

  // Client-side fallback if backend route is unreachable (never return fake booking codes)
  const totalOdds = selections.reduce((acc, s) => acc * (s.odds || 1), 1);
  const validation = validateUniversalMarkets(selections);

  const meta = {
    sportybet: {
      label: "SportyBet",
      color: "#e41b23",
      loadUrl: "https://www.sportybet.com/ng/",
      directWeb: "https://www.sportybet.com/ng/",
      steps: [
        "Open SportyBet app or website.",
        "Add selections to betslip.",
        "Confirm your stake and place bet.",
      ],
    },
    bet9ja: {
      label: "Bet9ja",
      color: "#008753",
      loadUrl: "https://sports.bet9ja.com/",
      directWeb: "https://sports.bet9ja.com/",
      steps: [
        "Open Bet9ja app or visit sports.bet9ja.com.",
        "Add selections to betslip.",
        "Confirm your stake and place bet.",
      ],
    },
    "1xbet": {
      label: "1xBet",
      color: "#1e88e5",
      loadUrl: "https://1xbet.ng/en/",
      directWeb: "https://1xbet.ng/en/",
      steps: ["Open 1xBet app or site.", "Open Betslip.", "Confirm and place bet."],
    },
    betway: {
      label: "Betway",
      color: "#000000",
      loadUrl: "https://www.betway.com.ng/",
      directWeb: "https://www.betway.com.ng/",
      steps: ["Open Betway Nigeria.", "Add selections to betslip.", "Confirm and place bet."],
    },
    msport: {
      label: "MSport",
      color: "#fbb03b",
      loadUrl: "https://www.msport.com/ng/",
      directWeb: "https://www.msport.com/ng/",
      steps: ["Open MSport app.", "Add selections to betslip.", "Confirm and place bet."],
    },
  }[targetBookmaker] || {
    label: targetBookmaker.toUpperCase(),
    color: "#7c6cf5",
    loadUrl: "https://google.com",
    directWeb: "https://google.com",
    steps: [`Place bet on ${targetBookmaker}`],
  };

  return {
    success: true,
    bookingCode: null,
    targetBookmaker,
    bookmakerLabel: meta.label,
    brandColor: meta.color,
    loadUrl: meta.loadUrl,
    directWebUrl: meta.directWeb,
    universalValidation: validation,
    provider: "manual",
    instructions: {
      mobileApp: meta.steps,
      mobileWeb: meta.steps,
      desktop: meta.steps,
    },
    totalOdds: parseFloat(totalOdds.toFixed(2)),
    picksCount: selections.length,
    expiresAt: new Date(Date.now() + 4 * 3600000).toISOString(),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Convert an existing booking code (e.g. SportyBet -> Bet9ja)
 */
export async function convertBetCode(
  fromBookmaker: SupportedBookmaker,
  toBookmaker: SupportedBookmaker,
  bookingCode: string,
  selections: BetSelection[] = []
): Promise<GeneratedBetCodeResult> {
  const meta = {
    sportybet: { label: "SportyBet", color: "#e41b23", directWeb: "https://www.sportybet.com/ng/" },
    bet9ja: { label: "Bet9ja", color: "#008753", directWeb: "https://sports.bet9ja.com/" },
    "1xbet": { label: "1xBet", color: "#1e88e5", directWeb: "https://1xbet.ng/en/" },
    betway: { label: "Betway", color: "#000000", directWeb: "https://www.betway.com.ng/" },
    msport: { label: "MSport", color: "#fbb03b", directWeb: "https://www.msport.com/ng/" },
  }[toBookmaker] || { label: toBookmaker.toUpperCase(), color: "#7c6cf5", directWeb: "https://www.google.com" };

  const validation = validateUniversalMarkets(selections);

  try {
    const res = await fetch("/api/bet-codes/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromBookmaker, toBookmaker, bookingCode, selections }),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data) {
      return data as GeneratedBetCodeResult;
    }

    return {
      success: false,
      bookingCode: null,
      sourceBookmaker: fromBookmaker,
      targetBookmaker: toBookmaker,
      bookmakerLabel: meta.label,
      brandColor: meta.color,
      directWebUrl: meta.directWeb,
      universalValidation: validation,
      provider: "manual",
      instructions: { mobileApp: [], mobileWeb: [], desktop: [] },
      totalOdds: 1.0,
      picksCount: selections.length,
      expiresAt: new Date(Date.now() + 4 * 3600000).toISOString(),
      generatedAt: new Date().toISOString(),
      error: data?.error || "Code conversion failed. The booking code might be invalid or expired.",
      externalUrl: data?.externalUrl,
    };
  } catch (err: any) {
    console.warn("API booking code conversion network failure:", err);
    return {
      success: false,
      bookingCode: null,
      sourceBookmaker: fromBookmaker,
      targetBookmaker: toBookmaker,
      bookmakerLabel: meta.label,
      brandColor: meta.color,
      directWebUrl: meta.directWeb,
      universalValidation: validation,
      provider: "manual",
      instructions: { mobileApp: [], mobileWeb: [], desktop: [] },
      totalOdds: 1.0,
      picksCount: selections.length,
      expiresAt: new Date(Date.now() + 4 * 3600000).toISOString(),
      generatedAt: new Date().toISOString(),
      error: "Unable to reach booking conversion server. Please check your connection and try again.",
      externalUrl: undefined,
    };
  }
}

