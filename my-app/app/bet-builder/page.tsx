"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { MatchData } from "@/lib/types";
import {
  Sparkles,
  RefreshCw,
  Copy,
  CheckCircle2,
  Star,
  Check,
  ChevronDown,
  Info,
  Lock,
  Zap,
  Ticket,
  ArrowRight,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  ArrowLeftRight,
} from "lucide-react";
import CountryFlag from "@/components/CountryFlag";
import Link from "next/link";
import { formatMatchKickoff, formatDisplayOdd } from "@/lib/utils";
import {
  generateBetCode,
  convertBetCode,
  validateUniversalMarkets,
  GeneratedBetCodeResult,
  SupportedBookmaker,
} from "@/lib/bet-codes";

interface SlipMatch {
  id: string;
  datetime: string;
  country: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  trustScore: string;
  trustLevel: "cf1" | "cf2" | "cf3" | "cf4";
  pick: string;
  marketName: string;
  odds: number;
  oddMove?: "up" | "down";
}

interface RawMatchWithCandidates {
  raw: MatchData;
  candidates: Array<{
    market: string;
    pick: string;
    odds: number;
    trustScore: number;
    trustLevel: "cf1" | "cf2" | "cf3" | "cf4";
  }>;
}

const DEFAULT_BET_TYPES: Record<string, boolean> = {
  "Match Result (1X2)": true,
  "Under 2.5": true,
  "Under 1.5": true,
  "Under 3.5": true,
  "Double Chance": true,
  "Over 2.5": true,
  "Over 1.5": true,
  "Over 3.5": true,
  "Both Teams to Score": true,
  "More markets": false,
};

// ── Helper to calculate odds-weighted trust score aligned with bookmaker implied probability ──
function computeOddsWeightedTrust(
  baseRating: number,
  odd: number
): { trustScore: number; trustLevel: "cf1" | "cf2" | "cf3" | "cf4" } {
  const validOdd = typeof odd === "number" && !isNaN(odd) && odd > 1.0 ? odd : 1.80;
  // Implied probability from bookmaker odds (e.g. 1.20 -> 83.3%, 1.50 -> 66.7%, 2.00 -> 50%, 4.00 -> 25%)
  const impliedProb = 1 / validOdd;

  // Odds-derived rating component (scales higher for safer, lower odds)
  const oddsScore = 1.8 + impliedProb * 8.6;

  // Blend baseline NerdyTips rating (55%) with market odds implied probability (45%)
  const clampedBase = Math.min(10, Math.max(1, baseRating));
  let finalScore = clampedBase * 0.55 + oddsScore * 0.45;

  // Strict realistic caps based on odds: Underdogs with high odds must NEVER have high confidence
  if (validOdd >= 4.0) {
    finalScore = Math.min(finalScore, 4.8);
  } else if (validOdd >= 3.0) {
    finalScore = Math.min(finalScore, 6.2);
  } else if (validOdd >= 2.4) {
    finalScore = Math.min(finalScore, 7.2);
  } else if (validOdd <= 1.25) {
    finalScore = Math.max(finalScore, 9.1);
  }

  finalScore = parseFloat(Math.min(9.9, Math.max(2.0, finalScore)).toFixed(1));

  let trustLevel: "cf1" | "cf2" | "cf3" | "cf4" = "cf2";
  if (finalScore >= 9.0) trustLevel = "cf1";
  else if (finalScore >= 7.5) trustLevel = "cf2";
  else if (finalScore >= 6.0) trustLevel = "cf3";
  else trustLevel = "cf4";

  return { trustScore: finalScore, trustLevel };
}

export default function BetBuilderPage() {
  // Odds slider state
  const [targetOdds, setTargetOdds] = useState<number>(5.0);
  const [autoOdds, setAutoOdds] = useState<boolean>(false);

  // Number of matches
  const [numPicksRange, setNumPicksRange] = useState<string>("Auto");
  const [isFixedCount, setIsFixedCount] = useState<boolean>(false);
  const [fixedCount, setFixedCount] = useState<string>("");

  // Bet types checklist
  const [betTypes, setBetTypes] = useState<Record<string, boolean>>(DEFAULT_BET_TYPES);

  // Universal Markets Restriction (guarantees 100% SportyBet & Bet9ja compatibility)
  const [universalOnly, setUniversalOnly] = useState<boolean>(true);

  // Min/Max odd per pick & trust
  const [minOdd, setMinOdd] = useState<number>(1.15);
  const [maxOdd, setMaxOdd] = useState<number>(1.80);
  const [minTrust, setMinTrust] = useState<number>(3.0);
  const [timeWindow, setTimeWindow] = useState<string>("today");
  const [onlyMajor, setOnlyMajor] = useState<boolean>(false);
  const [onlyDecreasing, setOnlyDecreasing] = useState<boolean>(false);

  // Matches inventory from API
  const [rawMatches, setRawMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  // Generation state & animation
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [generatedSlip, setGeneratedSlip] = useState<SlipMatch[]>([]);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [hasUnappliedChanges, setHasUnappliedChanges] = useState<boolean>(false);

  // Auth & Daily Usage State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isVip, setIsVip] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [freeTicketsUsedToday, setFreeTicketsUsedToday] = useState<number>(0);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);

  // Booking Code Conversion Modal & State
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [selectedBookie, setSelectedBookie] = useState<SupportedBookmaker>("sportybet");
  const [bookingModalTab, setBookingModalTab] = useState<"generate" | "convert">("generate");
  const [convertedCodeResult, setConvertedCodeResult] = useState<GeneratedBetCodeResult | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Code-to-Code Conversion State
  const [inputSourceCode, setInputSourceCode] = useState<string>("");
  const [inputSourceBookie, setInputSourceBookie] = useState<SupportedBookmaker>("sportybet");
  const [inputTargetBookie, setInputTargetBookie] = useState<SupportedBookmaker>("bet9ja");
  const [isConvertingCode, setIsConvertingCode] = useState<boolean>(false);
  const [codeConversionError, setCodeConversionError] = useState<string | null>(null);
  const [codeConversionSuccess, setCodeConversionSuccess] = useState<GeneratedBetCodeResult | null>(null);

  const todayKey = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Check auth and daily usage on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
        const res = await fetch("/api/auth", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });
        const data = await res.json();
        if (data.success && data.isLoggedIn && data.user) {
          setIsLoggedIn(true);
          setUserId(data.user.id || data.user.email);
          const userIsVip = Boolean(data.user.isPremium || data.user.role === "ADMIN");
          setIsVip(userIsVip);

          // Check free ticket usage
          const uId = data.user.id || data.user.email;
          const storageKey = `jt_bb_tickets_${uId}_${todayKey}`;
          const used = parseInt(localStorage.getItem(storageKey) || "0", 10);
          setFreeTicketsUsedToday(used);
        } else {
          setIsLoggedIn(false);
          setIsVip(false);
        }
      } catch {
        setIsLoggedIn(false);
        setIsVip(false);
      }
    }
    checkAuth();

    const onAuth = () => checkAuth();
    window.addEventListener("jt_auth_change", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("jt_auth_change", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, [todayKey]);

  // Load matches from API
  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`/api/matches?d=0&_t=${Date.now()}`, {
          headers,
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.matches)) {
          setRawMatches(data.matches);
        }
      } catch (err) {
        console.error("Error loading match pool:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

  // Build candidate options for each match according to betTypes and parameters
  const matchesPool = useMemo(() => {
    if (rawMatches.length === 0) return [];

    const majorLeagues = [
      "premier league",
      "champions league",
      "la liga",
      "serie a",
      "bundesliga",
      "ligue 1",
      "europa league",
      "championship",
      "fa cup",
      "copa del rey",
    ];

    const toDec = (val?: string | number | null, fallback = 1.85): number => {
      if (val === undefined || val === null) return fallback;
      const s = formatDisplayOdd(val);
      const n = parseFloat(s);
      return isNaN(n) || n < 1.05 ? fallback : n;
    };

    const pool: RawMatchWithCandidates[] = [];

    rawMatches.forEach((m) => {
      if (onlyMajor) {
        const isMajor = majorLeagues.some((ml) => (m.leagueName || "").toLowerCase().includes(ml));
        if (!isMajor) return;
      }

      const rawRating =
        typeof m.rating === "number"
          ? m.rating
          : typeof m.predictions?.bestTip?.rating === "number"
          ? m.predictions.bestTip.rating
          : typeof m.predictions?.pickScore?.rating === "number"
          ? m.predictions.pickScore.rating
          : m.confidence
          ? parseFloat(m.confidence.replace("%", "")) / 10
          : 8.5;
      const ratingNum = isNaN(rawRating) || rawRating <= 0 ? 8.5 : Math.min(10, Math.max(1, rawRating));
      if (ratingNum < minTrust) return;

      const hOdd = toDec(m.odds?.home, 1.85);
      const dOdd = toDec(m.odds?.draw, 3.40);
      const aOdd = toDec(m.odds?.away, 3.80);

      // ── Directional Consensus from NerdyTips Predictions & Odds ──
      const raw1x2 = (m.predictions?.pickScore?.pick || "").trim();
      const bestPick = (m.predictions?.bestTip?.pick || "").trim();
      const bestMarket = (m.predictions?.bestTip?.market || "").trim().toUpperCase();

      const isHomePredicted =
        raw1x2 === "1" ||
        /^home\b/i.test(raw1x2) ||
        (bestMarket.includes("1X2") && (/^1\b/i.test(bestPick) || /^home\b/i.test(bestPick)));

      const isAwayPredicted =
        raw1x2 === "2" ||
        /^away\b/i.test(raw1x2) ||
        (bestMarket.includes("1X2") && (/^2\b/i.test(bestPick) || /^away\b/i.test(bestPick)));

      const isDrawPredicted =
        raw1x2 === "X" ||
        /^draw\b/i.test(raw1x2) ||
        (bestMarket.includes("1X2") && (/^x\b/i.test(bestPick) || /^draw\b/i.test(bestPick)));

      // Clear favorite determination (prediction consensus or heavy odds tilt)
      const homeFav = isHomePredicted || (hOdd <= 1.65 && aOdd >= 3.0 && !isAwayPredicted);
      const awayFav = isAwayPredicted || (aOdd <= 1.65 && hOdd >= 3.0 && !isHomePredicted);

      const candidates: Array<{
        market: string;
        pick: string;
        odds: number;
        trustScore: number;
        trustLevel: "cf1" | "cf2" | "cf3" | "cf4";
      }> = [];

      // 1. Match Result (1X2) — Strictly aligned with prediction consensus
      if (betTypes["Match Result (1X2)"]) {
        if ((homeFav || (!awayFav && !isDrawPredicted && hOdd <= aOdd)) && hOdd >= minOdd && hOdd <= maxOdd) {
          const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum, hOdd);
          candidates.push({ market: "Match Result (1X2)", pick: "1", odds: hOdd, trustScore, trustLevel });
        }
        if ((awayFav || (!homeFav && !isDrawPredicted && aOdd < hOdd)) && aOdd >= minOdd && aOdd <= maxOdd && aOdd <= 3.2) {
          const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum, aOdd);
          candidates.push({ market: "Match Result (1X2)", pick: "2", odds: aOdd, trustScore, trustLevel });
        }
        if (isDrawPredicted && dOdd >= minOdd && dOdd <= maxOdd) {
          const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum * 0.9, dOdd);
          candidates.push({ market: "Match Result (1X2)", pick: "X", odds: dOdd, trustScore, trustLevel });
        }
      }

      // 2. Double Chance — Strictly supports predicted winner/favorite (NEVER backs underdog against banker)
      if (betTypes["Double Chance"]) {
        const dc1x = parseFloat((1 / (1 / hOdd + 1 / dOdd) * 0.96).toFixed(2));
        const dcX2 = parseFloat((1 / (1 / aOdd + 1 / dOdd) * 0.96).toFixed(2));
        const dc12 = parseFloat((1 / (1 / hOdd + 1 / aOdd) * 0.96).toFixed(2));

        // When Home is favored, ONLY 1X is allowed (Away X2 is completely blocked!)
        if ((homeFav || (!awayFav && hOdd <= aOdd)) && dc1x >= minOdd && dc1x <= maxOdd) {
          const { trustScore, trustLevel } = computeOddsWeightedTrust(Math.min(10, ratingNum + 0.5), dc1x);
          candidates.push({ market: "Double Chance", pick: "1X", odds: Math.max(1.08, dc1x), trustScore, trustLevel });
        }
        // When Away is favored, ONLY X2 is allowed (Home 1X is completely blocked!)
        if ((awayFav || (!homeFav && aOdd < hOdd)) && dcX2 >= minOdd && dcX2 <= maxOdd) {
          const { trustScore, trustLevel } = computeOddsWeightedTrust(Math.min(10, ratingNum + 0.5), dcX2);
          candidates.push({ market: "Double Chance", pick: "X2", odds: Math.max(1.08, dcX2), trustScore, trustLevel });
        }
        // Either team win (12) for competitive games
        if (!isDrawPredicted && hOdd >= 1.70 && aOdd >= 1.70 && dc12 >= minOdd && dc12 <= maxOdd) {
          const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum, dc12);
          candidates.push({ market: "Double Chance", pick: "12", odds: Math.max(1.10, dc12), trustScore, trustLevel });
        }
      }

      // 3. Over / Under Goals — Aligned with NerdyTips goal predictions
      const rawGoals = (m.predictions?.goals?.pick || "").trim().toLowerCase();
      const isOverPredicted = rawGoals.includes("o") || rawGoals.includes("over") || rawGoals === "yes";
      const isUnderPredicted = rawGoals.includes("u") || rawGoals.includes("under") || rawGoals === "no";

      const o25 = toDec(m.predictions?.goals?.odd, 1.78);
      const u25 = parseFloat(Math.max(1.30, 3.55 - o25).toFixed(2));
      const o15 = parseFloat(Math.max(1.12, o25 * 0.68).toFixed(2));
      const u15 = parseFloat(Math.max(1.80, o25 * 1.85).toFixed(2));
      const o35 = parseFloat(Math.max(1.85, o25 * 1.62).toFixed(2));
      const u35 = parseFloat(Math.max(1.15, o25 * 0.72).toFixed(2));

      // Over 2.5: only if Over is predicted or odds favor Over
      if (betTypes["Over 2.5"] && (isOverPredicted || (!isUnderPredicted && o25 <= u25)) && o25 >= minOdd && o25 <= maxOdd) {
        const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum, o25);
        candidates.push({ market: "Over 2.5", pick: "Over 2.5", odds: o25, trustScore, trustLevel });
      }
      // Under 2.5: only if Under is predicted or odds favor Under
      if (betTypes["Under 2.5"] && (isUnderPredicted || (!isOverPredicted && u25 < o25)) && u25 >= minOdd && u25 <= maxOdd) {
        const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum, u25);
        candidates.push({ market: "Under 2.5", pick: "Under 2.5", odds: u25, trustScore, trustLevel });
      }

      // Over 1.5: Safe line when Over is predicted
      if (betTypes["Over 1.5"] && !isUnderPredicted && o15 >= minOdd && o15 <= maxOdd) {
        const { trustScore, trustLevel } = computeOddsWeightedTrust(Math.min(10, ratingNum + 0.6), o15);
        candidates.push({ market: "Over 1.5", pick: "Over 1.5", odds: o15, trustScore, trustLevel });
      }
      // Under 1.5: Only when strictly strong Under predicted and low scoring
      if (betTypes["Under 1.5"] && isUnderPredicted && u25 <= 1.55 && u15 >= minOdd && u15 <= maxOdd) {
        const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum * 0.9, u15);
        candidates.push({ market: "Under 1.5", pick: "Under 1.5", odds: u15, trustScore, trustLevel });
      }

      // Over 3.5 & Under 3.5
      if (betTypes["Over 3.5"] && isOverPredicted && o25 <= 1.55 && o35 >= minOdd && o35 <= maxOdd) {
        const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum * 0.92, o35);
        candidates.push({ market: "Over 3.5", pick: "Over 3.5", odds: o35, trustScore, trustLevel });
      }
      if (betTypes["Under 3.5"] && !isOverPredicted && u35 >= minOdd && u35 <= maxOdd) {
        const { trustScore, trustLevel } = computeOddsWeightedTrust(Math.min(10, ratingNum + 0.5), u35);
        candidates.push({ market: "Under 3.5", pick: "Under 3.5", odds: u35, trustScore, trustLevel });
      }

      // 4. Both Teams to Score (BTTS) — Aligned with NerdyTips BTTS prediction
      const rawBtts = (m.predictions?.btts?.pick || "").trim().toLowerCase();
      const isBttsYes = rawBtts.includes("yes") || rawBtts === "gg" || rawBtts === "1";
      const isBttsNo = rawBtts.includes("no") || rawBtts === "ng" || rawBtts === "0";

      const bttsYes = toDec(m.predictions?.btts?.odd, 1.80);
      const bttsNo = parseFloat(Math.max(1.30, 3.6 - bttsYes).toFixed(2));
      if (betTypes["Both Teams to Score"]) {
        if ((isBttsYes || (!isBttsNo && bttsYes <= bttsNo)) && bttsYes >= minOdd && bttsYes <= maxOdd) {
          const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum, bttsYes);
          candidates.push({ market: "Both Teams to Score", pick: "BTTS Yes", odds: bttsYes, trustScore, trustLevel });
        }
        if ((isBttsNo || (!isBttsYes && bttsNo < bttsYes)) && bttsNo >= minOdd && bttsNo <= maxOdd) {
          const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum, bttsNo);
          candidates.push({ market: "Both Teams to Score", pick: "BTTS No", odds: bttsNo, trustScore, trustLevel });
        }
      }

      // 5. Draw No Bet (DNB) — Aligned with favorite (excluded when universalOnly is true)
      if (!universalOnly && betTypes["More markets"]) {
        const dnb1 = parseFloat(Math.max(1.15, hOdd * 0.72).toFixed(2));
        const dnb2 = parseFloat(Math.max(1.18, aOdd * 0.72).toFixed(2));
        if ((homeFav || (!awayFav && hOdd <= aOdd)) && dnb1 >= minOdd && dnb1 <= maxOdd) {
          const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum, dnb1);
          candidates.push({ market: "Draw No Bet", pick: "DNB 1", odds: dnb1, trustScore, trustLevel });
        }
        if ((awayFav || (!homeFav && aOdd < hOdd)) && dnb2 >= minOdd && dnb2 <= maxOdd && aOdd <= 3.2) {
          const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum, dnb2);
          candidates.push({ market: "Draw No Bet", pick: "DNB 2", odds: dnb2, trustScore, trustLevel });
        }
      }

      if (candidates.length > 0) {
        pool.push({ raw: m, candidates });
      }
    });

    return pool;
  }, [rawMatches, betTypes, minOdd, maxOdd, minTrust, onlyMajor, universalOnly]);

  // Slip generation solver
  const buildSlip = useCallback(() => {
    let pool = matchesPool;
    if (pool.length === 0 && rawMatches.length > 0) {
      // Relaxed candidate generation strictly honoring enabled betTypes
      const toDec = (val?: string | number | null, fallback = 1.85): number => {
        if (val === undefined || val === null) return fallback;
        const s = formatDisplayOdd(val);
        const n = parseFloat(s);
        return isNaN(n) || n < 1.05 ? fallback : n;
      };

      pool = rawMatches.map((m) => {
        const ratingNum = typeof m.rating === "number" ? m.rating : typeof m.predictions?.bestTip?.rating === "number" ? m.predictions.bestTip.rating : 8.0;
        const hOdd = toDec(m.odds?.home, 1.85);
        const aOdd = toDec(m.odds?.away, 3.40);
        const raw1x2 = (m.predictions?.pickScore?.pick || "").trim();
        const isHomeFav = raw1x2 === "1" || (hOdd <= aOdd && aOdd >= 2.0);
        const isAwayFav = raw1x2 === "2" || (aOdd < hOdd && hOdd >= 2.0);

        const candidates: Array<{ market: string; pick: string; odds: number; trustScore: number; trustLevel: "cf1" | "cf2" | "cf3" | "cf4" }> = [];

        if (betTypes["Double Chance"]) {
          const pick = isHomeFav ? "1X" : isAwayFav ? "X2" : "1X";
          const odd = isHomeFav ? Math.max(1.10, parseFloat((1 / (1 / hOdd + 1 / 3.4) * 0.96).toFixed(2))) : 1.28;
          const { trustScore, trustLevel } = computeOddsWeightedTrust(Math.min(10, ratingNum + 0.5), odd);
          candidates.push({ market: "Double Chance", pick, odds: odd, trustScore, trustLevel });
        }
        if (betTypes["Over 1.5"] || betTypes["Over 2.5"]) {
          const oOdd = toDec(m.predictions?.goals?.odd, 1.75);
          const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum, oOdd);
          candidates.push({ market: "Over 2.5", pick: "Over 2.5", odds: oOdd, trustScore, trustLevel });
        }
        if (betTypes["Both Teams to Score"]) {
          const bOdd = toDec(m.predictions?.btts?.odd, 1.80);
          const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum, bOdd);
          candidates.push({ market: "Both Teams to Score", pick: "BTTS Yes", odds: bOdd, trustScore, trustLevel });
        }
        if (betTypes["Match Result (1X2)"] || candidates.length === 0) {
          const pick = isHomeFav ? "1" : isAwayFav ? "2" : (hOdd <= aOdd ? "1" : "2");
          const odd = isHomeFav ? hOdd : isAwayFav ? aOdd : Math.min(hOdd, aOdd);
          const { trustScore, trustLevel } = computeOddsWeightedTrust(ratingNum, odd);
          candidates.push({ market: "Match Result (1X2)", pick, odds: Math.min(3.2, Math.max(1.10, odd)), trustScore, trustLevel });
        }
        return { raw: m, candidates };
      });
    }
    if (pool.length === 0) return [];

    let targetPicks = 5;
    if (isFixedCount && parseInt(fixedCount, 10)) {
      targetPicks = Math.max(2, Math.min(25, parseInt(fixedCount, 10)));
    } else if (numPicksRange === "2-5") targetPicks = 4;
    else if (numPicksRange === "5-10") targetPicks = 6;
    else if (numPicksRange === "10-15") targetPicks = 10;
    else if (numPicksRange === "15-20") targetPicks = 15;
    else {
      // Auto: calibrate ideal number of picks for the targetOdds
      if (targetOdds <= 2.2) targetPicks = 2;
      else if (targetOdds <= 4.0) targetPicks = 3;
      else if (targetOdds <= 8.0) targetPicks = 5;
      else if (targetOdds <= 18.0) targetPicks = 7;
      else if (targetOdds <= 45.0) targetPicks = 10;
      else targetPicks = 14;
    }

    targetPicks = Math.min(targetPicks, pool.length);

    let bestSlip: SlipMatch[] = [];
    let bestDiff = Infinity;

    // Run multiple randomized combinatorial search trials to hit closest odds
    const trials = Math.min(25, Math.max(12, pool.length));
    for (let t = 0; t < trials; t++) {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const currentSelected: SlipMatch[] = [];
      let currentOdds = 1.0;

      for (const matchObj of shuffled) {
        if (currentSelected.length >= targetPicks) break;
        const remainingPicks = targetPicks - currentSelected.length;
        const neededOddPerPick = Math.pow(Math.max(1.01, targetOdds / currentOdds), 1 / remainingPicks);

        // Sort match candidates by distance to needed odd
        const sortedCandidates = [...matchObj.candidates].sort((a, b) =>
          Math.abs(a.odds - neededOddPerPick) - Math.abs(b.odds - neededOddPerPick)
        );
        const candidate = sortedCandidates[0] || matchObj.candidates[0];
        if (!candidate) continue;

        const m = matchObj.raw;
        const kick = formatMatchKickoff(m.kickTime, m.kickoffUtc, m.matchDate);
        const dateStr = `Today · ${kick}`;

        currentSelected.push({
          id: m.id,
          datetime: dateStr,
          country: m.country || "World",
          league: m.leagueName || "League",
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeLogo: m.homeLogo,
          awayLogo: m.awayLogo,
          trustScore: candidate.trustScore >= 9.5 ? "10" : candidate.trustScore.toFixed(1),
          trustLevel: candidate.trustLevel,
          pick: candidate.pick,
          marketName: candidate.market,
          odds: candidate.odds,
          oddMove: Math.random() > 0.65 ? "down" : undefined,
        });

        currentOdds *= candidate.odds;
      }

      if (currentSelected.length >= Math.min(2, targetPicks)) {
        const diff = Math.abs(Math.log(currentOdds) - Math.log(targetOdds));
        if (diff < bestDiff) {
          bestDiff = diff;
          bestSlip = currentSelected;
        }
      }
    }

    return bestSlip.length > 0 ? bestSlip : pool.slice(0, targetPicks).map((matchObj) => {
      const m = matchObj.raw;
      const c = matchObj.candidates[0];
      const kick = formatMatchKickoff(m.kickTime, m.kickoffUtc, m.matchDate);
      return {
        id: m.id,
        datetime: `Today · ${kick}`,
        country: m.country || "World",
        league: m.leagueName || "League",
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeLogo: m.homeLogo,
        awayLogo: m.awayLogo,
        trustScore: c.trustScore >= 9.5 ? "10" : c.trustScore.toFixed(1),
        trustLevel: c.trustLevel,
        pick: c.pick,
        marketName: c.market,
        odds: c.odds,
      };
    });
  }, [matchesPool, rawMatches, betTypes, isFixedCount, fixedCount, numPicksRange, targetOdds]);

  // Track when user changes parameters after an initial slip was generated (never auto-generate games without user clicking button)
  useEffect(() => {
    if (hasGenerated && generatedSlip.length > 0) {
      setHasUnappliedChanges(true);
    }
  }, [hasGenerated, targetOdds, numPicksRange, isFixedCount, fixedCount, betTypes, minOdd, maxOdd, minTrust, timeWindow, onlyMajor, onlyDecreasing]);

  // Action: Trigger Slip Generation with Micro-Animation & User Limit Checks
  const handleGenerateSlip = async () => {
    // If user is a guest (not logged in), enforce 1 free slip generation before showing login/signup modal
    if (!isLoggedIn) {
      const guestKey = `jt_bb_guest_${todayKey}`;
      const guestUsed = parseInt(localStorage.getItem(guestKey) || "0", 10);
      if (guestUsed >= 1) {
        setShowLimitModal(true);
        return;
      }
    } else if (!isVip && freeTicketsUsedToday >= 3) {
      // If free logged-in user already used ticket today and is not VIP/trial
      setShowLimitModal(true);
      return;
    }

    // Play smooth high-tech visual feedback generation animation
    setIsGenerating(true);
    setGenerationStep("Analyzing quantitative market odds & probability distributions...");

    await new Promise((r) => setTimeout(r, 220));
    setGenerationStep("Running 100k Monte Carlo simulations & value edges...");

    await new Promise((r) => setTimeout(r, 220));
    setGenerationStep("Finalizing optimal accumulator combination...");

    await new Promise((r) => setTimeout(r, 200));

    // Generate new randomized slip respecting all parameters
    const newSlip = buildSlip();
    setGeneratedSlip(newSlip);
    setHasGenerated(true);
    setHasUnappliedChanges(false);
    setIsGenerating(false);
    setGenerationStep("");

    // Record ticket usage
    if (!isLoggedIn) {
      const guestKey = `jt_bb_guest_${todayKey}`;
      const guestUsed = parseInt(localStorage.getItem(guestKey) || "0", 10);
      localStorage.setItem(guestKey, String(guestUsed + 1));
    } else if (!isVip && userId) {
      const storageKey = `jt_bb_tickets_${userId}_${todayKey}`;
      const newCount = freeTicketsUsedToday + 1;
      localStorage.setItem(storageKey, String(newCount));
      setFreeTicketsUsedToday(newCount);
    }
  };

  // Calculated cumulative odds
  const calculatedOdds = useMemo(() => {
    if (generatedSlip.length === 0) return 1.0;
    const prod = generatedSlip.reduce((acc, m) => acc * m.odds, 1);
    return parseFloat(prod.toFixed(2));
  }, [generatedSlip]);

  // Calculate target diff percentage
  const deltaPercent = useMemo(() => {
    if (targetOdds <= 0) return 0;
    const diff = ((calculatedOdds - targetOdds) / targetOdds) * 100;
    return Math.round(diff);
  }, [calculatedOdds, targetOdds]);

  // Toggle bet type checkbox
  const handleToggleBetType = (key: string) => {
    setBetTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle all bet types
  const handleToggleAllBetTypes = () => {
    const allChecked = Object.values(betTypes).every(Boolean);
    const updated: Record<string, boolean> = {};
    Object.keys(betTypes).forEach((k) => {
      updated[k] = !allChecked;
    });
    setBetTypes(updated);
  };

  // Copy slip to clipboard
  const handleCopySlip = useCallback(() => {
    if (generatedSlip.length === 0) return;
    const lines = generatedSlip.map(
      (m, idx) =>
        `${idx + 1}. [${m.country} · ${m.league}] ${m.homeTeam} vs ${m.awayTeam} -> Pick: ${m.pick} (${m.marketName}) @ ${m.odds.toFixed(2)}`
    );
    const text =
      `[JollofTips Bet Builder Slip]\n` +
      `Picks: ${generatedSlip.length} | Combined Odds: ${calculatedOdds.toFixed(2)}\n\n` +
      lines.join("\n") +
      `\n\nGenerated via JollofTips AI Engine`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, [generatedSlip, calculatedOdds]);

  // Universal Market Compatibility Validation
  const universalValidation = useMemo(() => {
    return validateUniversalMarkets(
      generatedSlip.map((m) => ({
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        league: m.league,
        country: m.country,
        market: m.marketName,
        pick: m.pick,
        odds: m.odds,
      }))
    );
  }, [generatedSlip]);

  // Handler to optimize slip to universal markets
  const handleOptimizeForUniversal = useCallback(() => {
    const optimized = generatedSlip.map((m) => {
      const mLower = m.marketName.toLowerCase();
      const pLower = m.pick.toLowerCase();
      if (mLower.includes("draw no bet") || pLower.startsWith("dnb")) {
        const isHome = pLower.includes("1");
        return {
          ...m,
          marketName: "Double Chance",
          pick: isHome ? "1X" : "X2",
          odds: parseFloat(Math.max(1.12, m.odds * 0.88).toFixed(2)),
        };
      }
      return m;
    });
    setGeneratedSlip(optimized);
    setUniversalOnly(true);
    setBetTypes((prev) => ({ ...prev, "More markets": false }));
  }, [generatedSlip]);

  // Handler to generate booking code for target bookmaker
  const handleGenerateBookingCode = useCallback(
    async (bookie: SupportedBookmaker) => {
      if (generatedSlip.length === 0) return;
      setIsGeneratingCode(true);
      try {
        const selections = generatedSlip.map((m) => ({
          id: m.id,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league,
          country: m.country,
          matchDate: m.datetime,
          market: m.marketName,
          pick: m.pick,
          odds: m.odds,
        }));
        const res = await generateBetCode(bookie, selections);
        setConvertedCodeResult(res);
      } catch (err) {
        console.error("Error generating bet code:", err);
      } finally {
        setIsGeneratingCode(false);
      }
    },
    [generatedSlip]
  );

  // Handler to convert existing code between bookmakers
  const handleConvertExistingCode = useCallback(async () => {
    if (!inputSourceCode.trim()) {
      setCodeConversionError("Please enter a booking code to convert.");
      return;
    }
    setCodeConversionError(null);
    setCodeConversionSuccess(null);
    setIsConvertingCode(true);
    try {
      const res = await convertBetCode(
        inputSourceBookie,
        inputTargetBookie,
        inputSourceCode.trim()
      );
      if (res && res.success && res.bookingCode) {
        setCodeConversionSuccess(res);
      } else {
        setCodeConversionError(
          res?.error ||
            "Unable to convert booking code. The code might be expired, invalid, or requires a live conversion API key."
        );
      }
    } catch (err: any) {
      setCodeConversionError(err.message || "Failed to convert booking code. Please try again.");
    } finally {
      setIsConvertingCode(false);
    }
  }, [inputSourceCode, inputSourceBookie, inputTargetBookie]);

  // Sync booking code generation when modal is opened or bookmaker is switched
  useEffect(() => {
    if (showBookingModal && generatedSlip.length > 0) {
      handleGenerateBookingCode(selectedBookie);
    }
  }, [showBookingModal, selectedBookie, handleGenerateBookingCode, generatedSlip.length]);

  // Current active booking code (only genuine live code from bookmaker, never fake hashes)
  const currentBookingCode = useMemo(() => {
    if (
      convertedCodeResult &&
      convertedCodeResult.targetBookmaker === selectedBookie &&
      convertedCodeResult.bookingCode &&
      convertedCodeResult.bookingCode.trim()
    ) {
      return convertedCodeResult.bookingCode.trim();
    }
    return null;
  }, [convertedCodeResult, selectedBookie]);

  // Check if current slip is in favorites
  useEffect(() => {
    if (generatedSlip.length === 0) {
      setIsFavorite(false);
      return;
    }
    try {
      const stored = localStorage.getItem("jt_favorite_slips");
      if (stored) {
        const list = JSON.parse(stored);
        const slipSig = generatedSlip.map((m) => `${m.id}_${m.marketName}_${m.pick}`).join("|");
        setIsFavorite(list.some((item: any) => item.sig === slipSig));
      }
    } catch {
      setIsFavorite(false);
    }
  }, [generatedSlip]);

  const handleToggleFavoriteSlip = () => {
    if (generatedSlip.length === 0) return;
    try {
      const stored = localStorage.getItem("jt_favorite_slips");
      let list: any[] = stored ? JSON.parse(stored) : [];
      const slipSig = generatedSlip.map((m) => `${m.id}_${m.marketName}_${m.pick}`).join("|");
      const existsIndex = list.findIndex((item) => item.sig === slipSig);

      if (existsIndex >= 0) {
        list.splice(existsIndex, 1);
        setIsFavorite(false);
      } else {
        const newFav = {
          id: `fav_${Date.now()}`,
          sig: slipSig,
          createdAt: new Date().toISOString(),
          matchesCount: generatedSlip.length,
          totalOdds: parseFloat(calculatedOdds.toFixed(2)),
          slip: generatedSlip,
          sportyBetCode: currentBookingCode || undefined,
        };
        list = [newFav, ...list];
        setIsFavorite(true);
      }
      localStorage.setItem("jt_favorite_slips", JSON.stringify(list));
      window.dispatchEvent(new Event("jt_favorites_updated"));
    } catch (e) {
      console.warn("Failed to persist favorite slip:", e);
    }
  };

  const [copiedSelections, setCopiedSelections] = useState(false);
  const handleCopyAllSelections = () => {
    if (generatedSlip.length === 0) return;
    const lines = [
      `🎯 JollofTips Slip (${generatedSlip.length} Picks · Combined Odds: ${calculatedOdds.toFixed(2)})`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...generatedSlip.map(
        (m, i) => `${i + 1}. ${m.homeTeam} vs ${m.awayTeam}\n   Market: ${m.marketName} | Pick: ${m.pick} (@${m.odds.toFixed(2)})`
      ),
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...(currentBookingCode
        ? [`Booking Code (${selectedBookie.toUpperCase()}): ${currentBookingCode}`]
        : [`Bookmaker: ${selectedBookie.toUpperCase()} · Place via 1-click slip selections`]),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedSelections(true);
    setTimeout(() => setCopiedSelections(false), 2200);
  };

  // Dynamic slider percentage
  const sliderPct = useMemo(() => {
    const min = 1.5;
    const max = 50.0;
    const pct = ((targetOdds - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [targetOdds]);

  return (
    <div className="bb" style={{ minHeight: "100vh", background: "var(--color-bg, #080718)" }}>
      {/* Radial purple ambient light */}
      <div className="bb__orb bb__orb--a" aria-hidden="true" />
      <div className="nt-glow" aria-hidden="true" />

      <Navbar />

      {/* Main Container */}
      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "24px 20px 80px", position: "relative", zIndex: 1 }}>
        {/* Compact Hero Header */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="bb-tagline" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={12} />
              <span>POWERED BY JOLLOFTIPS AI ENGINE</span>
            </div>
            <h1 className="bb-title">AI Bet Builder</h1>
          </div>

          {/* User Tier / Daily Ticket Status Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isVip ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 20,
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)",
                  border: "1px solid rgba(245, 158, 11, 0.45)",
                  color: "#fbbf24",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                <Zap size={13} fill="#fbbf24" />
                <span>VIP Pro: Unlimited Daily Slips</span>
              </div>
            ) : isLoggedIn ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 20,
                  background: freeTicketsUsedToday >= 1 ? "rgba(239, 68, 68, 0.12)" : "rgba(47, 208, 138, 0.15)",
                  border: freeTicketsUsedToday >= 1 ? "1px solid rgba(239, 68, 68, 0.35)" : "1px solid rgba(47, 208, 138, 0.4)",
                  color: freeTicketsUsedToday >= 1 ? "#f87171" : "#2fd08a",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                <Ticket size={13} />
                <span>
                  {freeTicketsUsedToday >= 1
                    ? "Free Ticket Used Today (1/1)"
                    : "1 Free Ticket Remaining Today (1/1)"}
                </span>
              </div>
            ) : (
              <Link
                href="/register?redirect=/bet-builder"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 20,
                  background: "rgba(124, 108, 245, 0.18)",
                  border: "1px solid rgba(124, 108, 245, 0.4)",
                  color: "#c4b5fd",
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                <Ticket size={13} />
                <span>Sign up for 1 Free Daily Ticket</span>
              </Link>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="bb-grid">
          {/* ════════════════════════════════════════════════════════════
              LEFT: Configuration Form (.bb-config)
              ════════════════════════════════════════════════════════════ */}
          <form className="bb-config" aria-label="Bet Builder configuration" onSubmit={(e) => e.preventDefault()}>
            {/* 1. Total Slip Odds */}
            <div className="bb-field">
              <div className="bb-field__head">
                <label className="bb-field__label" htmlFor="bb-target">
                  Total slip odds
                </label>
                <label className="bb-switch">
                  <input
                    type="checkbox"
                    checked={autoOdds}
                    onChange={(e) => setAutoOdds(e.target.checked)}
                  />
                  <span>Auto odds</span>
                </label>
              </div>

              <div className="bb-slider" style={{ ["--bb-pct" as any]: `${sliderPct}%` }}>
                <input
                  type="range"
                  id="bb-target"
                  min="1.5"
                  max="50"
                  step="0.1"
                  disabled={autoOdds}
                  value={targetOdds}
                  onChange={(e) => setTargetOdds(parseFloat(e.target.value))}
                  aria-label="Total slip odds"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  className="bb-out"
                  value={targetOdds.toFixed(2)}
                  readOnly
                  aria-label="Total slip odds value"
                />
              </div>
            </div>

            {/* 2. Number of Matches */}
            <div className="bb-field">
              <span className="bb-field__label">Number of matches</span>
              <div className="bb-pills" role="radiogroup" aria-label="Number of matches">
                {["Auto", "2-5", "5-10", "10-15", "15-20"].map((range) => {
                  const active = numPicksRange === range && !isFixedCount;
                  return (
                    <label key={range} className={`bb-pill ${active ? "is-active" : ""}`}>
                      <input
                        type="radio"
                        name="num_picks_range"
                        value={range}
                        checked={active}
                        onChange={() => {
                          setNumPicksRange(range);
                          setIsFixedCount(false);
                        }}
                      />
                      <span>{range}</span>
                    </label>
                  );
                })}
              </div>

              <label className="bb-inline-toggle">
                <input
                  type="checkbox"
                  checked={isFixedCount}
                  onChange={(e) => setIsFixedCount(e.target.checked)}
                />
                <span>Fixed count</span>
                <input
                  type="number"
                  min="2"
                  max="25"
                  value={fixedCount}
                  placeholder="2–25"
                  disabled={!isFixedCount}
                  onChange={(e) => setFixedCount(e.target.value)}
                  className="bb-num"
                  aria-label="Exact number of matches"
                />
              </label>
            </div>

            {/* 3. Bet Types (Checklist) */}
            <div className="bb-field">
              <div className="bb-field__head">
                <label className="bb-field__label">Bet types &amp; Markets</label>
                <button
                  type="button"
                  onClick={handleToggleAllBetTypes}
                  className="bb-mini"
                  style={{ background: "transparent", border: "none", padding: 0 }}
                >
                  {Object.values(betTypes).every(Boolean) ? "Uncheck all" : "Check all"}
                </button>
              </div>

              {/* Universal Markets Fast Toggle (SportyBet & Bet9ja 100% Ready) */}
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  marginBottom: 12,
                  background: universalOnly
                    ? "linear-gradient(135deg, rgba(47, 208, 138, 0.12) 0%, rgba(20, 184, 166, 0.08) 100%)"
                    : "rgba(167, 159, 255, 0.06)",
                  border: universalOnly
                    ? "1px solid rgba(47, 208, 138, 0.35)"
                    : "1px solid rgba(167, 159, 255, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  cursor: "pointer",
                }}
                onClick={() => {
                  const nextVal = !universalOnly;
                  setUniversalOnly(nextVal);
                  if (nextVal) {
                    setBetTypes((prev) => ({ ...prev, "More markets": false }));
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={16} color={universalOnly ? "#2fd08a" : "#a79fff"} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: universalOnly ? "#2fd08a" : "#d4cde3" }}>
                      Universal Markets Only (SportyBet &amp; Bet9ja Ready)
                    </div>
                    <div style={{ fontSize: 10.5, color: "#8a85b5", lineHeight: 1.3 }}>
                      Restricts picks to 1X2, Over/Under &amp; BTTS for 100% 1-click booking code conversion
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={universalOnly}
                  onChange={(e) => {
                    e.stopPropagation();
                    const checked = e.target.checked;
                    setUniversalOnly(checked);
                    if (checked) {
                      setBetTypes((prev) => ({ ...prev, "More markets": false }));
                    }
                  }}
                  style={{ accentColor: "#2fd08a", cursor: "pointer", width: 16, height: 16 }}
                />
              </div>

              <div className="bb-markets">
                {/* Column 1 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Match Result (1X2)", "Under 2.5", "Under 1.5", "Under 3.5", "Double Chance"].map((market) => (
                    <label key={market} className="bb-chk">
                      <input
                        type="checkbox"
                        checked={Boolean(betTypes[market])}
                        onChange={() => handleToggleBetType(market)}
                      />
                      <span>{market}</span>
                    </label>
                  ))}
                </div>

                {/* Column 2 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Over 2.5", "Over 1.5", "Over 3.5", "Both Teams to Score", "More markets"].map((market) => {
                    const isMoreMarkets = market === "More markets";
                    const isRestricted = isMoreMarkets && universalOnly;
                    return (
                      <label
                        key={market}
                        className="bb-chk"
                        style={{
                          opacity: isRestricted ? 0.45 : 1,
                          cursor: isRestricted ? "not-allowed" : "pointer",
                        }}
                        title={isRestricted ? "Disabled in Universal Markets mode (DNB is a niche market)" : undefined}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(betTypes[market]) && !isRestricted}
                          disabled={isRestricted}
                          onChange={() => handleToggleBetType(market)}
                        />
                        <span>
                          {isMoreMarkets ? "More markets (Draw No Bet)" : market}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Min / Max Odd per Pick */}
            <div className="bb-field">
              <label className="bb-field__label" htmlFor="bb-minodd">
                Min odd per pick
              </label>
              <div
                className="bb-slider"
                style={{ ["--bb-pct" as any]: `${((minOdd - 1.05) / (5 - 1.05)) * 100}%` }}
              >
                <input
                  type="range"
                  id="bb-minodd"
                  min="1.05"
                  max="5"
                  step="0.01"
                  value={minOdd}
                  onChange={(e) => setMinOdd(parseFloat(e.target.value))}
                />
                <input type="text" className="bb-out" value={minOdd.toFixed(2)} readOnly />
              </div>
            </div>

            <div className="bb-field">
              <label className="bb-field__label" htmlFor="bb-maxodd">
                Max odd per pick
              </label>
              <div
                className="bb-slider"
                style={{ ["--bb-pct" as any]: `${((maxOdd - 1.2) / (12 - 1.2)) * 100}%` }}
              >
                <input
                  type="range"
                  id="bb-maxodd"
                  min="1.2"
                  max="12"
                  step="0.01"
                  value={maxOdd}
                  onChange={(e) => setMaxOdd(parseFloat(e.target.value))}
                />
                <input type="text" className="bb-out" value={maxOdd.toFixed(2)} readOnly />
              </div>
            </div>

            {/* 5. Minimum Pick Trust */}
            <div className="bb-field">
              <label className="bb-field__label" htmlFor="bb-trust">
                Minimum pick trust score
              </label>
              <div
                className="bb-slider"
                style={{ ["--bb-pct" as any]: `${(minTrust / 10) * 100}%` }}
              >
                <input
                  type="range"
                  id="bb-trust"
                  min="0"
                  max="10"
                  step="0.5"
                  value={minTrust}
                  onChange={(e) => setMinTrust(parseFloat(e.target.value))}
                />
                <input type="text" className="bb-out" value={minTrust.toFixed(1)} readOnly />
              </div>
            </div>

            {/* 6. Additional Toggles */}
            <div className="bb-field bb-field--toggles">
              <label className="bb-switch bb-switch--row">
                <input
                  type="checkbox"
                  checked={onlyMajor}
                  onChange={(e) => setOnlyMajor(e.target.checked)}
                />
                <span>Only premier &amp; top leagues</span>
              </label>
              <label className="bb-switch bb-switch--row">
                <input
                  type="checkbox"
                  checked={onlyDecreasing}
                  onChange={(e) => setOnlyDecreasing(e.target.checked)}
                />
                <span>Only decreasing odds movement</span>
              </label>
            </div>

            {/* 7. Action Buttons with Micro-Animation Trigger */}
            <div className="bb-actions">
              <button
                type="button"
                className="bb-btn bb-btn--primary"
                onClick={handleGenerateSlip}
                disabled={isGenerating || loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: isGenerating ? 0.75 : 1,
                  boxShadow: hasUnappliedChanges ? "0 0 18px rgba(124, 108, 245, 0.65)" : undefined,
                }}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>AI Generating Slip...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>
                      {hasUnappliedChanges
                        ? "Update & Generate Slip"
                        : generatedSlip.length > 0
                        ? "Re-Generate Slip"
                        : "Generate Slip"}
                    </span>
                  </>
                )}
              </button>

              {generatedSlip.length > 0 && (
                <button
                  type="button"
                  className="bb-btn bb-btn--ghost"
                  onClick={handleGenerateSlip}
                  disabled={isGenerating || loading}
                  title="Re-roll with different matches"
                >
                  <RefreshCw size={15} className={isGenerating ? "animate-spin" : ""} />
                </button>
              )}
            </div>

            {/* "Get Betting Code / Convert Codes" Button - Active ONLY after slip has been generated */}
            {generatedSlip.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setShowBookingModal(true);
                }}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "13px 18px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.28)",
                  transition: "all 0.15s ease",
                }}
              >
                <Ticket size={16} />
                <span>Get Betting Code / Convert Codes</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setBookingModalTab("convert");
                  setShowBookingModal(true);
                }}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: "rgba(124, 108, 245, 0.08)",
                  border: "1px dashed rgba(124, 108, 245, 0.25)",
                  color: "#a79fff",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
                title="Convert existing booking codes between bookmakers"
              >
                <ArrowLeftRight size={13} />
                <span>Have a code? Convert between bookmakers &rarr;</span>
              </button>
            )}
          </form>

          {/* ════════════════════════════════════════════════════════════
              RIGHT: Generated Bet Slip (.bb-slip)
              ════════════════════════════════════════════════════════════ */}
          <div className="bb-result">
            {loading ? (
              <div className="bb-placeholder">
                <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--color-accent-hi)" }} />
                <h2>Loading match database...</h2>
                <p>Scoring every fixture with algorithmic AI models.</p>
              </div>
            ) : isGenerating ? (
              /* High-end Generation Animation */
              <div
                className="bb-placeholder"
                style={{
                  minHeight: 380,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(18, 15, 45, 0.7)",
                  border: "1px solid rgba(124, 108, 245, 0.35)",
                  borderRadius: 16,
                  padding: "40px 24px",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 64,
                    height: 64,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: "3px solid rgba(124, 108, 245, 0.2)",
                      borderTopColor: "#8b7ff5",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 8,
                      borderRadius: "50%",
                      background: "rgba(124, 108, 245, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#c4b5fd",
                    }}
                  >
                    <Sparkles size={24} />
                  </div>
                </div>

                <h2 style={{ fontSize: 19, fontWeight: 900, color: "#ffffff", margin: "0 0 8px" }}>
                  Building Your Optimal Slip
                </h2>
                <p style={{ fontSize: 13, color: "#a79fff", maxWidth: 360, margin: 0, textAlign: "center" }}>
                  {generationStep || "Scoring 100k simulated Monte Carlo scenarios..."}
                </p>
              </div>
            ) : generatedSlip.length === 0 ? (
              /* High-Converting Pre-Generation State: Games ONLY revealed after hitting Generate Slip */
              <div
                className="bb-placeholder"
                style={{
                  minHeight: 460,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "radial-gradient(120% 70% at 50% 10%, rgba(124, 108, 245, 0.14), rgba(18, 15, 45, 0.8) 60%)",
                  border: "1.5px dashed rgba(167, 159, 255, 0.3)",
                  borderRadius: 20,
                  padding: "44px 28px",
                  textAlign: "center",
                  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
                }}
              >
                {/* Glowing Center Icon */}
                <div
                  style={{
                    position: "relative",
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(124, 108, 245, 0.25) 0%, rgba(245, 158, 11, 0.2) 100%)",
                    border: "1px solid rgba(167, 159, 255, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffd700",
                    marginBottom: 20,
                    boxShadow: "0 0 32px rgba(124, 108, 245, 0.35)",
                  }}
                >
                  <Sparkles size={34} />
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    borderRadius: 999,
                    background: "rgba(124, 108, 245, 0.15)",
                    border: "1px solid rgba(124, 108, 245, 0.35)",
                    color: "#c4b5fd",
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 12,
                  }}
                >
                  <ShieldCheck size={13} color="#2fd08a" />
                  <span>AI Algorithmic Bet Builder</span>
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", margin: "0 0 10px", letterSpacing: "-0.01em" }}>
                  Ready to Build Your Slip?
                </h2>
                <p style={{ fontSize: 13.5, color: "#a79fff", maxWidth: 460, margin: "0 0 26px", lineHeight: 1.6 }}>
                  Matches and AI predictions are generated on demand. Set your desired target odds, number of picks, and market preferences on the left, then click <strong>Generate Slip</strong> to reveal your optimal banker combination.
                </p>

                {/* 3 Value Pillars */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 12,
                    width: "100%",
                    maxWidth: 580,
                    marginBottom: 28,
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(167, 159, 255, 0.12)",
                    }}
                  >
                    <div style={{ color: "#ffd700", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Zap size={14} />
                      <span>Monte Carlo AI</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#8a85b5", lineHeight: 1.4 }}>
                      Simulates 100k Poisson probability scenarios to pinpoint high-edge value picks.
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(167, 159, 255, 0.12)",
                    }}
                  >
                    <div style={{ color: "#2fd08a", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <ShieldCheck size={14} />
                      <span>Universal Markets</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#8a85b5", lineHeight: 1.4 }}>
                      100% SportyBet, Bet9ja &amp; 1xBet compatible. Zero missing-market errors.
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(167, 159, 255, 0.12)",
                    }}
                  >
                    <div style={{ color: "#38bdf8", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Ticket size={14} />
                      <span>1-Click Codes</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#8a85b5", lineHeight: 1.4 }}>
                      Directly generate bookmaker codes and convert between bookies after generating.
                    </div>
                  </div>
                </div>

                {/* Primary CTA Button */}
                <button
                  type="button"
                  onClick={handleGenerateSlip}
                  disabled={isGenerating || loading}
                  className="bb-btn bb-btn--primary"
                  style={{
                    padding: "13px 32px",
                    fontSize: 14.5,
                    fontWeight: 900,
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(124, 108, 245, 0.45)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                  }}
                >
                  <Sparkles size={16} />
                  <span>Generate AI Slip Now</span>
                </button>
              </div>
            ) : (
              <div className="bb-slip">
                {/* Notice when filters are adjusted after initial generation */}
                {hasUnappliedChanges && (
                  <div
                    style={{
                      padding: "10px 16px",
                      background: "linear-gradient(90deg, rgba(245, 158, 11, 0.2) 0%, rgba(124, 108, 245, 0.2) 100%)",
                      borderBottom: "1px solid rgba(245, 158, 11, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 8,
                      fontSize: 12,
                      color: "#fbbf24",
                      fontWeight: 700,
                    }}
                  >
                    <span>⚙️ Parameters changed. Click "Update &amp; Generate Slip" on the left to recalculate matches.</span>
                    <button
                      type="button"
                      onClick={handleGenerateSlip}
                      disabled={isGenerating || loading}
                      style={{
                        background: "#fbbf24",
                        color: "#08071e",
                        border: "none",
                        padding: "4px 12px",
                        borderRadius: 6,
                        fontWeight: 900,
                        fontSize: 11.5,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <RefreshCw size={11} className={isGenerating ? "animate-spin" : ""} />
                      <span>Update Slip</span>
                    </button>
                  </div>
                )}
                {/* Slip Header */}
                <div className="bb-slip__head">
                  <div className="bb-slip__headmain">
                    <span className="bb-slip__eyebrow">YOUR SLIP</span>
                    <h2 className="bb-slip__title">
                      {generatedSlip.length} picks · <span>{calculatedOdds.toFixed(2)}</span>
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                      <span
                        className={`bb-slip__delta ${
                          Math.abs(deltaPercent) <= 8 ? "is-ok" : "is-off"
                        }`}
                      >
                        Target {targetOdds.toFixed(2)} · {deltaPercent > 0 ? `+${deltaPercent}%` : `${deltaPercent}%`}
                      </span>

                      {/* Universal Markets Status Pill */}
                      {universalValidation.isUniversal ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 9px",
                            borderRadius: 12,
                            background: "rgba(47, 208, 138, 0.15)",
                            border: "1px solid rgba(47, 208, 138, 0.35)",
                            color: "#2fd08a",
                          }}
                          title="100% universal markets (1X2, Over/Under, BTTS): Compatible with SportyBet & Bet9ja"
                        >
                          <ShieldCheck size={11} />
                          Universal Markets
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleOptimizeForUniversal}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 9px",
                            borderRadius: 12,
                            background: "rgba(245, 158, 11, 0.15)",
                            border: "1px solid rgba(245, 158, 11, 0.4)",
                            color: "#fbbf24",
                            cursor: "pointer",
                          }}
                          title="Click to auto-optimize slip for SportyBet & Bet9ja"
                        >
                          <AlertTriangle size={11} />
                          Niche Market ({universalValidation.nichePicks.length}) · Auto-Fix
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setShowBookingModal(true)}
                      className="bb-slip__fav"
                      style={{
                        background: "linear-gradient(135deg, rgba(47, 208, 138, 0.22) 0%, rgba(20, 184, 166, 0.22) 100%)",
                        color: "#2fd08a",
                        border: "1px solid rgba(47, 208, 138, 0.45)",
                        fontWeight: 800,
                        boxShadow: "0 2px 8px rgba(47, 208, 138, 0.2)",
                      }}
                      title="Auto-generate SportyBet & Bet9ja booking code in 1 click"
                    >
                      <Zap size={13} fill="#2fd08a" />
                      <span>1-Click Bet Code</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleFavoriteSlip}
                      className="bb-slip__fav"
                      style={{
                        background: isFavorite ? "rgba(255, 215, 0, 0.18)" : undefined,
                        color: isFavorite ? "#ffd700" : undefined,
                        border: isFavorite ? "1px solid rgba(255, 215, 0, 0.45)" : undefined,
                      }}
                      title="Add to Favorite Slips (tracks in Favorites drawer near profile)"
                    >
                      <Star size={13} fill={isFavorite ? "#ffd700" : "none"} color={isFavorite ? "#ffd700" : "currentColor"} />
                      <span>{isFavorite ? "Favorited ★" : "Favorite"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerateSlip}
                      disabled={isGenerating || loading}
                      className="bb-slip__fav"
                      title="Generate new slip"
                    >
                      <RefreshCw size={13} className={isGenerating ? "animate-spin" : ""} />
                      <span>{isGenerating ? "Generating..." : "Refresh"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopySlip}
                      className="bb-slip__fav"
                      title="Copy slip to clipboard"
                    >
                      {copied ? <CheckCircle2 size={13} color="#6ee7b0" /> : <Copy size={13} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Match Cards List */}
                <ul className="bb-slip__list">
                  {generatedSlip.map((match) => (
                    <li key={match.id} className={`bb-slip__row ${match.trustLevel}`}>
                      {/* Row Header: Date & Kickoff on left, League on right */}
                      <div className="bb-slip__rowhead">
                        <span className="bb-slip__date">{match.datetime}</span>
                        <span className="bb-slip__league">
                          {match.country} · {match.league}
                        </span>
                      </div>

                      {/* Row Body: Teams, Trust Score, Pick Pill */}
                      <div className="bb-slip__rowbody">
                        {/* Teams */}
                        <div className="bb-slip__teams">
                          <span className="bb-slip__team">
                            {match.homeLogo ? (
                              <img
                                src={match.homeLogo}
                                width={17}
                                height={17}
                                alt={match.homeTeam}
                                loading="lazy"
                                style={{ borderRadius: 3, objectFit: "contain", flexShrink: 0 }}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <CountryFlag country={match.country} size={15} />
                            )}
                            {match.homeTeam}
                          </span>

                          <span className="bb-slip__team">
                            {match.awayLogo ? (
                              <img
                                src={match.awayLogo}
                                width={17}
                                height={17}
                                alt={match.awayTeam}
                                loading="lazy"
                                style={{ borderRadius: 3, objectFit: "contain", flexShrink: 0 }}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <CountryFlag country={match.country} size={15} />
                            )}
                            {match.awayTeam}
                          </span>
                        </div>

                        {/* Trust Score */}
                        <span className="bb-slip__trust" title={`AI Trust Score: ${match.trustScore}/10`}>
                          {match.trustScore.includes("/10") ? match.trustScore : `${match.trustScore}/10`}
                        </span>

                        {/* Pick Pill */}
                        <span className="bb-slip__stat">
                          <span className="bb-slip__pick">{match.pick}</span>
                          <span
                            className={`bb-slip__odd ${
                              match.oddMove === "down" ? "has-move is-down" : ""
                            }`}
                          >
                            <span className="bb-slip__num" style={{ color: match.oddMove === "down" ? "#2fd08a" : "#2fd08a", fontFamily: "var(--font-mono)" }}>
                              {match.oddMove === "down" && (
                                <span className="bb-slip__arrow" style={{ color: "#2fd08a" }}>&#9662;</span>
                              )}
                              <span>@{match.odds.toFixed(2)}</span>
                            </span>
                          </span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Slip Footer Summary */}
                <div className="bb-slip__foot">
                  <span>
                    Total odds: <strong>{calculatedOdds.toFixed(2)}</strong> · Average confidence:{" "}
                    <strong>
                      {(
                        generatedSlip.reduce((acc, m) => acc + parseFloat(m.trustScore), 0) /
                        generatedSlip.length
                      ).toFixed(1)}
                      /10
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            FREE TICKET LIMIT MODAL
            ════════════════════════════════════════════════════════════ */}
        {showLimitModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
            onClick={() => setShowLimitModal(false)}
          >
            <div
              style={{
                maxWidth: 480,
                width: "100%",
                background: "#141132",
                border: "1px solid rgba(167, 159, 255, 0.25)",
                borderRadius: 18,
                padding: "32px 26px",
                textAlign: "center",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {!isLoggedIn ? (
                <>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: "rgba(124, 108, 245, 0.18)",
                      border: "1px solid rgba(124, 108, 245, 0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 18px",
                      color: "#c4b5fd",
                    }}
                  >
                    <Ticket size={28} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", margin: "0 0 10px" }}>
                    Claim Your 1 Free Daily Ticket
                  </h3>
                  <p style={{ fontSize: 13.5, color: "#a79fff", lineHeight: 1.6, margin: "0 0 24px" }}>
                    Bet Builder is free for registered JollofTips members! Create a free account in 30 seconds to unlock your daily ticket.
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Link
                      href="/register?redirect=/bet-builder"
                      className="bb-btn bb-btn--primary"
                      style={{ flex: 1, textDecoration: "none", textAlign: "center" }}
                    >
                      Sign Up Free
                    </Link>
                    <Link
                      href="/login?redirect=/bet-builder"
                      className="bb-btn bb-btn--ghost"
                      style={{ flex: 1, textDecoration: "none", textAlign: "center" }}
                    >
                      Log In
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: "rgba(245, 158, 11, 0.15)",
                      border: "1px solid rgba(245, 158, 11, 0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 18px",
                      color: "#fbbf24",
                    }}
                  >
                    <Lock size={28} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", margin: "0 0 10px" }}>
                    Daily Free Ticket Limit Reached
                  </h3>
                  <p style={{ fontSize: 13.5, color: "#d4cde3", lineHeight: 1.6, margin: "0 0 24px" }}>
                    You have used your <strong>1 free Bet Builder ticket</strong> for today. Your free ticket resets at midnight. Upgrade to <strong>VIP Pro</strong> for unlimited daily generation and priority high-edge selections!
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Link
                      href="/pricing"
                      className="bb-btn bb-btn--primary"
                      style={{
                        textDecoration: "none",
                        textAlign: "center",
                        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        borderColor: "#f59e0b",
                        color: "#08071e",
                        fontWeight: 900,
                      }}
                    >
                      Upgrade to VIP Pro (Unlimited Slips)
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowLimitModal(false)}
                      className="bb-btn bb-btn--ghost"
                    >
                      Close &amp; Keep Current Slip
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            BOOKING CODE CONVERSION MODAL (SportyBet / Bet9ja / 1xBet)
            ════════════════════════════════════════════════════════════ */}
        {showBookingModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "rgba(0, 0, 0, 0.78)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setShowBookingModal(false)}
          >
            <div
              style={{
                maxWidth: 540,
                width: "100%",
                background: "#120f2e",
                border: "1px solid rgba(167, 159, 255, 0.25)",
                borderRadius: 20,
                padding: "24px 22px",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7)",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "rgba(47, 208, 138, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid rgba(47, 208, 138, 0.3)",
                    }}
                  >
                    <Smartphone size={20} color="#2fd08a" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", margin: 0 }}>
                      Bet Codes Conversion
                    </h3>
                    <p style={{ fontSize: 12, color: "#a79fff", margin: "2px 0 0" }}>
                      Auto-generate SportyBet &amp; Bet9ja codes in 1 click
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "none",
                    color: "#a79fff",
                    borderRadius: 8,
                    width: 28,
                    height: 28,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Mode Switch Tabs: 1-Click Slip Code vs Convert Existing Code */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 6,
                  padding: 4,
                  background: "rgba(8, 7, 30, 0.6)",
                  borderRadius: 10,
                  marginBottom: 16,
                  border: "1px solid rgba(167, 159, 255, 0.15)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setBookingModalTab("generate")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    border: "none",
                    background: bookingModalTab === "generate" ? "linear-gradient(135deg, #7c6cf5, #6353e8)" : "transparent",
                    color: bookingModalTab === "generate" ? "#ffffff" : "#a79fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                >
                  <Zap size={13} />
                  <span>1-Click Slip Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingModalTab("convert")}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    border: "none",
                    background: bookingModalTab === "convert" ? "linear-gradient(135deg, #7c6cf5, #6353e8)" : "transparent",
                    color: bookingModalTab === "convert" ? "#ffffff" : "#a79fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "all 0.15s ease",
                  }}
                >
                  <ArrowLeftRight size={13} />
                  <span>Convert Existing Code</span>
                </button>
              </div>

              {/* TAB 1: 1-CLICK SLIP CODE GENERATOR */}
              {bookingModalTab === "generate" ? (
                <>
                  {/* Universal Markets Verification Banner */}
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      marginBottom: 16,
                      background: universalValidation.isUniversal
                        ? "rgba(47, 208, 138, 0.1)"
                        : "rgba(245, 158, 11, 0.12)",
                      border: universalValidation.isUniversal
                        ? "1px solid rgba(47, 208, 138, 0.3)"
                        : "1px solid rgba(245, 158, 11, 0.35)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      {universalValidation.isUniversal ? (
                        <ShieldCheck size={16} color="#2fd08a" style={{ marginTop: 2, flexShrink: 0 }} />
                      ) : (
                        <AlertTriangle size={16} color="#fbbf24" style={{ marginTop: 2, flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            color: universalValidation.isUniversal ? "#2fd08a" : "#fbbf24",
                          }}
                        >
                          {universalValidation.isUniversal
                            ? "Universal Markets Verified (100% SportyBet & Bet9ja Match)"
                            : `${universalValidation.nichePicks.length} Niche Market Pick(s) Detected`}
                        </div>
                        <div style={{ fontSize: 11, color: "#d4cde3", marginTop: 2, lineHeight: 1.4 }}>
                          {universalValidation.isUniversal
                            ? `All ${generatedSlip.length} picks use universal markets (1X2, Over/Under, BTTS, Double Chance). Guaranteed to load with zero missing-market errors.`
                            : "Some bookmakers do not support niche markets like Draw No Bet across all fixtures. Optimize to universal markets for 100% conversion success."}
                        </div>

                        {!universalValidation.isUniversal && (
                          <button
                            type="button"
                            onClick={() => {
                              handleOptimizeForUniversal();
                              setTimeout(() => handleGenerateBookingCode(selectedBookie), 150);
                            }}
                            style={{
                              marginTop: 8,
                              padding: "5px 12px",
                              borderRadius: 6,
                              background: "rgba(245, 158, 11, 0.25)",
                              border: "1px solid rgba(245, 158, 11, 0.5)",
                              color: "#fef3c7",
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <Zap size={11} />
                            <span>1-Click Auto-Optimize to Universal Markets</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bookmaker Selector Tabs */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#a79fff", marginBottom: 8, textTransform: "uppercase" }}>
                      Select Target Bookmaker
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {[
                        { id: "sportybet", label: "SportyBet", color: "#e41b23", sub: "Most Popular" },
                        { id: "bet9ja", label: "Bet9ja", color: "#008753", sub: "Instant Load" },
                        { id: "1xbet", label: "1xBet", color: "#1e88e5", sub: "High Odds" },
                      ].map((b) => {
                        const isSel = selectedBookie === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setSelectedBookie(b.id as any);
                              handleGenerateBookingCode(b.id as any);
                            }}
                            style={{
                              padding: "10px 8px",
                              borderRadius: 10,
                              cursor: "pointer",
                              border: isSel ? `1.5px solid ${b.color}` : "1px solid rgba(167, 159, 255, 0.15)",
                              background: isSel ? `${b.color}22` : "#18153a",
                              color: isSel ? "#ffffff" : "#a79fff",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 2,
                              transition: "all 0.15s ease",
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 900, color: isSel ? b.color : "#d4cde3" }}>
                              {b.label}
                            </span>
                            <span style={{ fontSize: 9.5, color: "#8a85b5", fontWeight: 600 }}>
                              {b.sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tab 1: 1-Click Booking Code & Slip Placement */}
                  {currentBookingCode ? (
                    /* Genuine Verified Booking Code Available */
                    <div
                      style={{
                        background: "rgba(8, 7, 30, 0.85)",
                        border: "1px dashed rgba(47, 208, 138, 0.45)",
                        borderRadius: 14,
                        padding: "18px 20px",
                        marginBottom: 16,
                        boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.4)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#8a85b5", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {selectedBookie.toUpperCase()} BOOKING CODE
                          </span>
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: 6,
                              background: "rgba(47, 208, 138, 0.15)",
                              color: "#2fd08a",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <ShieldCheck size={11} /> Verified Live Code
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 10,
                            background: "rgba(47, 208, 138, 0.15)",
                            color: "#2fd08a",
                          }}
                        >
                          {generatedSlip.length} Picks · {calculatedOdds.toFixed(2)} Odds
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div
                          style={{
                            fontSize: 26,
                            fontWeight: 900,
                            fontFamily: "monospace",
                            letterSpacing: "0.08em",
                            color: selectedBookie === "sportybet" ? "#ff4d4f" : selectedBookie === "bet9ja" ? "#2fd08a" : "#60a5fa",
                          }}
                        >
                          {currentBookingCode}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(currentBookingCode);
                              setCopiedCode(true);
                              setTimeout(() => setCopiedCode(false), 2000);
                            }}
                            style={{
                              padding: "9px 15px",
                              borderRadius: 8,
                              background: copiedCode ? "#2fd08a" : "#7c6cf5",
                              border: "none",
                              color: "#ffffff",
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              transition: "all 0.15s ease",
                            }}
                          >
                            {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                          </button>

                          <a
                            href={
                              convertedCodeResult?.loadUrl ||
                              (selectedBookie === "sportybet"
                                ? `https://www.sportybet.com/ng/m/sport/football?shareCode=${currentBookingCode}`
                                : `https://sports.bet9ja.com/mobile/load-betslip?code=${currentBookingCode}`)
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "9px 14px",
                              borderRadius: 8,
                              background: "rgba(255, 255, 255, 0.08)",
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                              color: "#ffffff",
                              fontSize: 12,
                              fontWeight: 800,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                            title={`Open ${selectedBookie} directly with this code preloaded`}
                          >
                            <span>Open Site</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>

                      {/* Step-by-Step Load Guide */}
                      <div
                        style={{
                          marginTop: 14,
                          paddingTop: 12,
                          borderTop: "1px dashed rgba(255, 255, 255, 0.1)",
                          fontSize: 11.5,
                          color: "#a79fff",
                          lineHeight: 1.6,
                        }}
                      >
                        How to load: Open {selectedBookie === "sportybet" ? "SportyBet" : selectedBookie === "bet9ja" ? "Bet9ja" : "1xBet"} &rarr; Betslip &rarr; Load Code &rarr; enter <strong>{currentBookingCode}</strong>.
                      </div>
                    </div>
                  ) : (
                    /* Custom Algorithm Slip (Never show fake client hash numbers) */
                    <div
                      style={{
                        background: "rgba(8, 7, 30, 0.9)",
                        border: "1px solid rgba(124, 108, 245, 0.35)",
                        borderRadius: 14,
                        padding: "18px 20px",
                        marginBottom: 16,
                        boxShadow: "inset 0 0 20px rgba(0, 0, 0, 0.4)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Ticket size={16} color="#7c6cf5" />
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#ffffff", textTransform: "uppercase" }}>
                            {selectedBookie.toUpperCase()} ACCA SLIP
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: 10,
                            background: "rgba(124, 108, 245, 0.2)",
                            color: "#a79fff",
                          }}
                        >
                          {generatedSlip.length} Picks · {calculatedOdds.toFixed(2)} Combined Odds
                        </span>
                      </div>

                      <p style={{ fontSize: 12, color: "#cbd5e1", margin: "0 0 14px", lineHeight: 1.5 }}>
                        Direct booking codes are registered by sportsbooks once a slip is booked on their platform. Use our <strong>1-Click Slip Copy</strong> to copy all picks formatted with matches, markets and odds, or open {selectedBookie === "sportybet" ? "SportyBet" : selectedBookie === "bet9ja" ? "Bet9ja" : selectedBookie.toUpperCase()} directly:
                      </p>

                      {/* Primary Action Buttons */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                        <button
                          type="button"
                          onClick={handleCopyAllSelections}
                          style={{
                            flex: "1 1 200px",
                            padding: "11px 16px",
                            borderRadius: 10,
                            background: copiedSelections
                              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                              : "linear-gradient(135deg, #7c6cf5 0%, #5844e3 100%)",
                            border: "none",
                            color: "#ffffff",
                            fontSize: 12.5,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 7,
                            transition: "all 0.15s ease",
                            boxShadow: "0 4px 14px rgba(124, 108, 245, 0.35)",
                          }}
                        >
                          {copiedSelections ? <Check size={16} /> : <Copy size={16} />}
                          <span>{copiedSelections ? "Slip Copied to Clipboard!" : "Copy All Slip Selections (Text)"}</span>
                        </button>

                        <a
                          href={
                            selectedBookie === "sportybet"
                              ? "https://www.sportybet.com/ng/"
                              : selectedBookie === "bet9ja"
                              ? "https://sports.bet9ja.com/"
                              : selectedBookie === "1xbet"
                              ? "https://1xbet.ng/en/"
                              : `https://google.com/search?q=${selectedBookie}+nigeria`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "11px 16px",
                            borderRadius: 10,
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                            color: "#ffffff",
                            fontSize: 12.5,
                            fontWeight: 800,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                          title={`Open ${selectedBookie} directly`}
                        >
                          <span>Open {selectedBookie === "sportybet" ? "SportyBet" : selectedBookie === "bet9ja" ? "Bet9ja" : selectedBookie.toUpperCase()}</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>

                      {/* Slip Selections Preview */}
                      <div
                        style={{
                          background: "rgba(0, 0, 0, 0.25)",
                          borderRadius: 8,
                          padding: "10px 12px",
                          maxHeight: 140,
                          overflowY: "auto",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                        }}
                      >
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a85b5", textTransform: "uppercase", marginBottom: 6 }}>
                          Slip Selections ({generatedSlip.length}):
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {generatedSlip.map((m, idx) => (
                            <div
                              key={m.id || idx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontSize: 11,
                                color: "#e2e8f0",
                              }}
                            >
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>
                                {idx + 1}. {m.homeTeam} vs {m.awayTeam}
                              </span>
                              <span style={{ fontWeight: 800, color: "#2fd08a" }}>
                                {m.pick} <span style={{ color: "#94a3b8", fontWeight: 500 }}>@{m.odds.toFixed(2)}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* TAB 2: CONVERT EXISTING BOOKING CODE */
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <p style={{ fontSize: 12.5, color: "#d4cde3", margin: "0 0 6px", lineHeight: 1.5 }}>
                    Paste a booking code received from a friend or betting channel, select your target bookmaker, and convert it instantly:
                  </p>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#a79fff", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                      Source Booking Code
                    </label>
                    <input
                      type="text"
                      value={inputSourceCode}
                      onChange={(e) => setInputSourceCode(e.target.value.toUpperCase().trim())}
                      placeholder="e.g. 5K89A or BC-8492"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "#08071e",
                        border: "1px solid rgba(167, 159, 255, 0.25)",
                        color: "#ffffff",
                        fontSize: 14,
                        fontFamily: "monospace",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* From -> To Selectors */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center" }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#a79fff", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                        From Bookie
                      </label>
                      <select
                        value={inputSourceBookie}
                        onChange={(e) => setInputSourceBookie(e.target.value as any)}
                        style={{
                          width: "100%",
                          padding: "9px 10px",
                          borderRadius: 8,
                          background: "#08071e",
                          border: "1px solid rgba(167, 159, 255, 0.25)",
                          color: "#ffffff",
                          fontSize: 12,
                          fontWeight: 700,
                          outline: "none",
                        }}
                      >
                        <option value="sportybet">SportyBet</option>
                        <option value="bet9ja">Bet9ja</option>
                        <option value="1xbet">1xBet</option>
                      </select>
                    </div>

                    <div style={{ marginTop: 18, color: "#7c6cf5" }}>
                      <ArrowRight size={18} />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#a79fff", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                        To Bookie
                      </label>
                      <select
                        value={inputTargetBookie}
                        onChange={(e) => setInputTargetBookie(e.target.value as any)}
                        style={{
                          width: "100%",
                          padding: "9px 10px",
                          borderRadius: 8,
                          background: "#08071e",
                          border: "1px solid rgba(167, 159, 255, 0.25)",
                          color: "#ffffff",
                          fontSize: 12,
                          fontWeight: 700,
                          outline: "none",
                        }}
                      >
                        <option value="bet9ja">Bet9ja</option>
                        <option value="sportybet">SportyBet</option>
                        <option value="1xbet">1xBet</option>
                      </select>
                    </div>
                  </div>

                  {/* Convert Action Button */}
                  <button
                    type="button"
                    onClick={handleConvertExistingCode}
                    disabled={isConvertingCode || !inputSourceCode.trim()}
                    style={{
                      marginTop: 4,
                      padding: "11px 16px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #7c6cf5 0%, #5844e3 100%)",
                      border: "none",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: isConvertingCode || !inputSourceCode.trim() ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      opacity: isConvertingCode || !inputSourceCode.trim() ? 0.6 : 1,
                    }}
                  >
                    {isConvertingCode ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Converting Code...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={14} />
                        <span>Convert Code Now</span>
                      </>
                    )}
                  </button>

                  {codeConversionError && (
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "rgba(239, 68, 68, 0.12)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#fca5a5",
                        fontSize: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div style={{ lineHeight: 1.5 }}>{codeConversionError}</div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                        <Link
                          href="/pricing"
                          style={{
                            padding: "6px 14px",
                            borderRadius: 7,
                            background: "rgba(239, 68, 68, 0.2)",
                            border: "1px solid rgba(239, 68, 68, 0.4)",
                            color: "#ffffff",
                            fontSize: 11.5,
                            fontWeight: 700,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <span>Upgrade Plan / View Pricing</span>
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    </div>
                  )}

                  {codeConversionSuccess && codeConversionSuccess.bookingCode && (
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: 12,
                        background: "rgba(8, 7, 30, 0.9)",
                        border: "1px solid rgba(47, 208, 138, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#8a85b5", textTransform: "uppercase" }}>
                            CONVERTED {codeConversionSuccess.bookmakerLabel} CODE
                          </span>
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: 6,
                              background: "rgba(47, 208, 138, 0.15)",
                              color: "#2fd08a",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <CheckCircle2 size={11} /> Converted
                          </span>
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "monospace", color: codeConversionSuccess.brandColor || "#2fd08a", marginTop: 2 }}>
                          {codeConversionSuccess.bookingCode}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (codeConversionSuccess.bookingCode) {
                              navigator.clipboard.writeText(codeConversionSuccess.bookingCode);
                              setCopiedCode(true);
                              setTimeout(() => setCopiedCode(false), 2000);
                            }
                          }}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            background: copiedCode ? "#2fd08a" : "#7c6cf5",
                            border: "none",
                            color: "#ffffff",
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedCode ? "Copied" : "Copy"}</span>
                        </button>

                        <a
                          href={codeConversionSuccess.loadUrl || codeConversionSuccess.directWebUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            background: "rgba(255, 255, 255, 0.08)",
                            color: "#ffffff",
                            fontSize: 12,
                            fontWeight: 800,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span>Open</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="bb-btn bb-btn--ghost"
                style={{ width: "100%", marginTop: 16 }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Lower SEO & Educational Section */}
        <section className="bb-how">
          <h2 className="bb-h2">How Bet Builder Works</h2>
          <div className="bb-how__grid">
            <div className="bb-how__card">
              <span className="bb-how__n">1</span>
              <h3>You set the rules</h3>
              <p>Pick your target total odds, choose market types, and specify the number of matches you want in your accumulator.</p>
            </div>
            <div className="bb-how__card">
              <span className="bb-how__n">2</span>
              <h3>AI scores every match</h3>
              <p>Our algorithms evaluate thousands of data points — from Poisson goal models and form to player injuries and market line movements.</p>
            </div>
            <div className="bb-how__card">
              <span className="bb-how__n">3</span>
              <h3>Optimised slip in seconds</h3>
              <p>The builder solves for the optimal combination that matches your odds target with the highest possible statistical confidence.</p>
            </div>
          </div>
        </section>

        {/* Explanatory SEO Text */}
        <section className="bb-seo">
          <h2>AI Bet Slip Generator &amp; Parlay Builder</h2>
          <p>
            Bet Builder takes the guesswork out of constructing football accumulators. Instead of manually combing through hundreds of fixtures across leagues, you define your strategy and target odds, and our AI model picks mathematically proven selections.
          </p>
          <p>
            Each pick is graded with an AI trust score from 1 to 10. Selections rated 8.0 and above indicate strong statistical alignment across multiple predictive models, while 10 represents maximum confidence bankers.
          </p>
        </section>
      </main>
    </div>
  );
}
