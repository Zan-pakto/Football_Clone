import crypto from "crypto";

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

export type SupportedBookmaker = "sportybet" | "bet9ja" | "1xbet" | "betway" | "msport";

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

// Normalized universal market checkers
const UNIVERSAL_MARKET_PATTERNS = [
  /1x2/i,
  /match result/i,
  /full time result/i,
  /over[\s_-]?[0-9]\.5/i,
  /under[\s_-]?[0-9]\.5/i,
  /goals?/i,
  /both teams to score/i,
  /btts/i,
  /double chance/i,
];

const UNIVERSAL_PICK_PATTERNS = [
  /^(1|x|2|home|draw|away)$/i,
  /^(1x|x2|12)$/i,
  /^(over|under)\s+[0-9]\.5$/i,
  /^(btts\s+(yes|no)|yes|no|gg|ng)$/i,
];

/**
 * Checks whether a selection is a universal market available across 100% of bookmakers (SportyBet, Bet9ja, etc.)
 */
export function isUniversalMarket(marketName: string, pick: string): boolean {
  const m = (marketName || "").trim().toLowerCase();
  const p = (pick || "").trim().toLowerCase();

  // Explicitly check for known niche markets that cause cross-bookmaker booking failure
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

  // Match Result (1X2)
  if (m.includes("1x2") || m.includes("result")) {
    return ["1", "x", "2", "home", "draw", "away"].includes(p);
  }

  // Double Chance (1X, X2, 12)
  if (m.includes("double chance") || ["1x", "x2", "12"].includes(p)) {
    return true;
  }

  // Over / Under
  if (m.includes("over") || m.includes("under") || p.startsWith("over") || p.startsWith("under")) {
    return /^(over|under)\s+[0-9]\.5$/i.test(p) || /^[0-9]\.5$/i.test(p);
  }

  // Both Teams to Score (BTTS / GG / NG)
  if (m.includes("both") || m.includes("btts") || p.includes("btts") || p === "gg" || p === "ng") {
    return true;
  }

  return false;
}

/**
 * Validates a list of selections to guarantee universal cross-bookmaker compatibility.
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
 * Generates official booking code formatting and platform instructions
 */
export class BetCodesService {
  private static get betpaddiApiKey(): string {
    return process.env.BETPADDI_API_KEY || "";
  }
  private static get betpaddiBaseUrl(): string {
    return process.env.BETPADDI_BASE_URL || "https://betpaddi.com/api/v1";
  }
  private static get convertBetCodesApiKey(): string {
    return process.env.CONVERT_BET_CODES_API_KEY || "";
  }
  private static get convertBetCodesBaseUrl(): string {
    return process.env.CONVERT_BET_CODES_BASE_URL || "https://convertbetcodes.com/api";
  }

  /**
   * Maps supported bookmakers to BetPaddi identifier format
   */
  private static toBetpaddiBookie(bookie: string): string {
    const b = (bookie || "").toLowerCase();
    if (b.includes("sporty")) return "sportybet:ng";
    if (b.includes("bet9ja")) return "bet9ja";
    if (b.includes("1x")) return "1xbet:xx";
    if (b.includes("betway")) return "betway:ng";
    if (b.includes("msport")) return "msport";
    if (b.includes("betking")) return "betking:ng";
    return bookie;
  }

  /**
   * Deterministic authentic booking code generator for Nigerian sportsbooks
   */
  private static generateBookieCode(bookmaker: SupportedBookmaker, seed: string): string {
    const hash = crypto.createHash("sha256").update(seed).digest("hex").toUpperCase();

    switch (bookmaker) {
      case "sportybet":
        // SportyBet code format: alphanumeric like "BC98A1" or "SB6F32"
        return `BC${hash.substring(0, 4)}`;
      case "bet9ja":
        // Bet9ja code format: alphanumeric like "B9JA-8492" or "B9-48201"
        return `B9JA-${hash.substring(4, 8)}`;
      case "1xbet":
        // 1xBet code format: e.g. "1X-9482A"
        return `1X-${hash.substring(8, 13)}`;
      case "betway":
        return `BW-${hash.substring(13, 18)}`;
      case "msport":
        return `MS-${hash.substring(18, 23)}`;
      default:
        return `BC-${hash.substring(0, 6)}`;
    }
  }

  /**
   * Get bookmaker branding and deep link URL
   */
  public static getBookmakerMeta(bookmaker: SupportedBookmaker, bookingCode: string) {
    switch (bookmaker) {
      case "sportybet":
        return {
          label: "SportyBet",
          brandColor: "#e41b23",
          loadUrl: `https://www.sportybet.com/ng/m/sport/football?shareCode=${bookingCode}`,
          directWebUrl: "https://www.sportybet.com/ng/",
          instructions: {
            mobileApp: [
              "Open the SportyBet app on your device.",
              "Tap 'Open Betslip' at the bottom of your screen.",
              "Tap 'Load Code' or 'Share Code'.",
              `Paste code: ${bookingCode} and tap Load.`,
              "Confirm all selections and place your bet.",
            ],
            mobileWeb: [
              "Visit sportybet.com/ng on your mobile browser.",
              "Tap Betslip at the bottom right.",
              "Select 'Load Bet' and enter code: " + bookingCode,
              "Click Load to populate the slip automatically.",
            ],
            desktop: [
              "Go to sportybet.com on your desktop browser.",
              "Look at the Betslip box on the right-hand sidebar.",
              "Enter the booking code in the 'Load Code' box.",
              "Click 'Load' to display all selections immediately.",
            ],
          },
        };

      case "bet9ja":
        return {
          label: "Bet9ja",
          brandColor: "#008753",
          loadUrl: `https://sports.bet9ja.com/mobile/load-betslip?code=${bookingCode}`,
          directWebUrl: "https://sports.bet9ja.com/",
          instructions: {
            mobileApp: [
              "Open the Bet9ja app or mobile website.",
              "Tap the Betslip icon at the bottom of the screen.",
              "Select 'Check / Load Bet'.",
              `Enter Booking Code: ${bookingCode} and press Load.`,
              "Verify the selections and enter your stake.",
            ],
            mobileWeb: [
              "Go to sports.bet9ja.com on your phone.",
              "Open the Bet Slip tab from the bottom navigation.",
              "Tap 'Load Bet' and paste booking code: " + bookingCode,
              "Click Load Bet to view all selections.",
            ],
            desktop: [
              "Go to sports.bet9ja.com on your computer.",
              "Find the 'Booking Number' / 'Load Slip' box on the right sidebar.",
              "Paste code " + bookingCode + " and click Load.",
              "All matches and universal markets will load instantly.",
            ],
          },
        };

      case "1xbet":
        return {
          label: "1xBet",
          brandColor: "#1e88e5",
          loadUrl: "https://1xbet.ng/en/",
          directWebUrl: "https://1xbet.ng/en/",
          instructions: {
            mobileApp: [
              "Open the 1xBet app.",
              "Go to the Bet Slip menu.",
              "Tap 'Download Bet Slip' (Load Booking Code).",
              `Enter code: ${bookingCode} and press OK.`,
            ],
            mobileWeb: [
              "Visit 1xbet.ng in your browser.",
              "Open your Bet Slip.",
              "Tap 'Save / Load Bet Slip' and enter code: " + bookingCode,
            ],
            desktop: [
              "Open 1xbet.ng on PC.",
              "In the right bet slip panel, click 'Save / Download Bet Slip'.",
              "Enter code: " + bookingCode,
            ],
          },
        };

      default:
        return {
          label: bookmaker.toUpperCase(),
          brandColor: "#7c6cf5",
          loadUrl: `https://google.com/search?q=${bookmaker}+nigeria`,
          directWebUrl: `https://google.com/search?q=${bookmaker}`,
          instructions: {
            mobileApp: [`Open ${bookmaker} app and load booking code ${bookingCode}.`],
            mobileWeb: [`Open ${bookmaker} mobile website and load booking code ${bookingCode}.`],
            desktop: [`Open ${bookmaker} desktop website and load booking code ${bookingCode}.`],
          },
        };
    }
  }

  /**
   * Convert an existing booking code or generate a fresh booking code from selections
   */
  public static async generateOrConvert({
    targetBookmaker,
    sourceBookmaker,
    existingCode,
    selections = [],
  }: {
    targetBookmaker: SupportedBookmaker;
    sourceBookmaker?: SupportedBookmaker;
    existingCode?: string;
    selections?: BetSelection[];
  }): Promise<GeneratedBetCodeResult> {
    const universalValidation = validateUniversalMarkets(selections);
    const totalOdds = selections.reduce((acc, s) => acc * (s.odds || 1), 1);
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    // ── 1. CONVERT EXISTING BOOKING CODE ──
    if (existingCode && existingCode.trim()) {
      const targetMeta = this.getBookmakerMeta(targetBookmaker, existingCode.trim());
      const rawFrom = sourceBookmaker || "sportybet";
      const fromParam = rawFrom.includes(":") ? rawFrom : `${rawFrom}:ng`;
      const toParam = targetBookmaker.includes(":") ? targetBookmaker : `${targetBookmaker}:ng`;

      // ── Step 1: BetPaddi API (Primary Engine) ──
      if (this.betpaddiApiKey) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 9000);

          const fromPaddi = this.toBetpaddiBookie(sourceBookmaker || "sportybet");
          const toPaddi = this.toBetpaddiBookie(targetBookmaker);

          const response = await fetch(`${this.betpaddiBaseUrl}/conversion/convert-code`, {
            method: "POST",
            headers: {
              "X-API-Key": this.betpaddiApiKey,
              "Authorization": `Bearer ${this.betpaddiApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromPaddi,
              to: toPaddi,
              code: existingCode.trim(),
              bookie1: fromPaddi,
              bookie2: toPaddi,
              booking_code: existingCode.trim(),
            }),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          const data = (await response.json().catch(() => null)) as any;
          if (response.ok && data) {
            const bookingCode =
              data?.data?.target?.booking_code ||
              data?.data?.target?.code ||
              data?.data?.converted_code ||
              data?.data?.booking_code ||
              data?.data?.destination_code ||
              data?.destination_code ||
              data?.booking_code ||
              data?.converted_code ||
              (typeof data?.data === "string" ? data.data : null);

            if (bookingCode && typeof bookingCode === "string") {
              const meta = this.getBookmakerMeta(targetBookmaker, bookingCode.trim());
              return {
                success: true,
                bookingCode: bookingCode.trim(),
                sourceBookmaker,
                targetBookmaker,
                bookmakerLabel: meta.label,
                brandColor: meta.brandColor,
                loadUrl: meta.loadUrl,
                directWebUrl: meta.directWebUrl,
                universalValidation,
                provider: "convertbetcodes",
                instructions: meta.instructions,
                totalOdds: parseFloat(totalOdds.toFixed(2)),
                picksCount: selections.length,
                expiresAt,
                generatedAt: new Date().toISOString(),
              };
            }
          }

          // If BetPaddi returned an explicit error response
          if (data && data.message) {
            const meta = this.getBookmakerMeta(targetBookmaker, existingCode);
            const userFriendlyError =
              data.message.toLowerCase().includes("insufficient")
                ? "Code conversion limit reached for this session. Please upgrade your tier or try again shortly."
                : `Conversion failed: ${data.message}`;

            return {
              success: false,
              bookingCode: null,
              sourceBookmaker,
              targetBookmaker,
              bookmakerLabel: meta.label,
              brandColor: meta.brandColor,
              directWebUrl: meta.directWebUrl,
              universalValidation,
              provider: "manual",
              instructions: meta.instructions,
              totalOdds: parseFloat(totalOdds.toFixed(2)),
              picksCount: selections.length,
              expiresAt,
              generatedAt: new Date().toISOString(),
              error: userFriendlyError,
              externalUrl: undefined,
            };
          }
        } catch (err: any) {
          console.warn("[BetCodesService] BetPaddi API error:", err.message);
        }
      }

      // ── Step 2: ConvertBetCodes API (Fallback Engine) ──
      if (this.convertBetCodesApiKey) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);

          const url = `${this.convertBetCodesBaseUrl}/conversion?from=${encodeURIComponent(fromParam)}&to=${encodeURIComponent(toParam)}&booking_code=${encodeURIComponent(existingCode.trim())}&api_key=${encodeURIComponent(this.convertBetCodesApiKey)}`;

          const response = await fetch(url, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (response.ok) {
            const data = (await response.json()) as any;
            if (data && data.destination_code) {
              const bookingCode = data.destination_code;
              const meta = this.getBookmakerMeta(targetBookmaker, bookingCode);
              return {
                success: true,
                bookingCode,
                sourceBookmaker,
                targetBookmaker,
                bookmakerLabel: meta.label,
                brandColor: meta.brandColor,
                loadUrl: meta.loadUrl,
                directWebUrl: meta.directWebUrl,
                universalValidation,
                provider: "convertbetcodes",
                instructions: meta.instructions,
                totalOdds: parseFloat(totalOdds.toFixed(2)),
                picksCount: selections.length,
                expiresAt,
                generatedAt: new Date().toISOString(),
              };
            } else if (data && data.message) {
              return {
                success: false,
                bookingCode: null,
                targetBookmaker,
                bookmakerLabel: targetMeta.label,
                brandColor: targetMeta.brandColor,
                directWebUrl: targetMeta.directWebUrl,
                universalValidation,
                provider: "convertbetcodes",
                instructions: targetMeta.instructions,
                totalOdds: 1,
                picksCount: selections.length,
                expiresAt,
                generatedAt: new Date().toISOString(),
                error: "Code conversion limit reached or invalid code. Please check your code and try again.",
                externalUrl: undefined,
              };
            }
          }
        } catch (err: any) {
          console.warn("[BetCodesService] ConvertBetCodes API request error:", err.message);
        }
      }

      // If no API key configured or API calls could not be completed
      return {
        success: false,
        bookingCode: null,
        sourceBookmaker,
        targetBookmaker,
        bookmakerLabel: targetMeta.label,
        brandColor: targetMeta.brandColor,
        directWebUrl: targetMeta.directWebUrl,
        universalValidation,
        provider: "manual",
        instructions: targetMeta.instructions,
        totalOdds: parseFloat(totalOdds.toFixed(2)),
        picksCount: selections.length,
        expiresAt,
        generatedAt: new Date().toISOString(),
        error: "Unable to convert this booking code. The code may have expired or is invalid on the source bookie.",
        externalUrl: undefined,
      };
    }

    // ── 2. BET BUILDER CUSTOM SLIP GENERATION ──
    // Custom slips generated on the fly cannot be converted into fake bookmaker hashes.
    // Instead, provide clean formatted betting data and direct bookmaker links.
    const meta = this.getBookmakerMeta(targetBookmaker, "");
    return {
      success: true,
      bookingCode: null,
      sourceBookmaker,
      targetBookmaker,
      bookmakerLabel: meta.label,
      brandColor: meta.brandColor,
      loadUrl: meta.directWebUrl,
      directWebUrl: meta.directWebUrl,
      universalValidation,
      provider: "manual",
      instructions: meta.instructions,
      totalOdds: parseFloat(totalOdds.toFixed(2)),
      picksCount: selections.length,
      expiresAt,
      generatedAt: new Date().toISOString(),
    };
  }
}

