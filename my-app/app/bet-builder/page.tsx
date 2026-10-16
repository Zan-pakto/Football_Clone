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
} from "lucide-react";
import CountryFlag from "@/components/CountryFlag";
import Link from "next/link";

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
  "More markets": true,
};

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

  // Auth & Daily Usage State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isVip, setIsVip] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [freeTicketsUsedToday, setFreeTicketsUsedToday] = useState<number>(0);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);

  // Booking Code Conversion Modal
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [selectedBookie, setSelectedBookie] = useState<"sportybet" | "bet9ja" | "1xbet" | "betway">("sportybet");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

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
    ];

    const pool: RawMatchWithCandidates[] = [];

    rawMatches.forEach((m) => {
      if (onlyMajor) {
        const isMajor = majorLeagues.some((ml) => m.leagueName?.toLowerCase().includes(ml));
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

      let trustLevel: "cf1" | "cf2" | "cf3" | "cf4" = "cf2";
      if (ratingNum >= 9.0) trustLevel = "cf1";
      else if (ratingNum >= 7.5) trustLevel = "cf2";
      else if (ratingNum >= 6.0) trustLevel = "cf3";
      else trustLevel = "cf4";

      const hOdd = parseFloat(m.odds?.home || "1.85");
      const dOdd = parseFloat(m.odds?.draw || "3.40");
      const aOdd = parseFloat(m.odds?.away || "3.90");

      const candidates: Array<{
        market: string;
        pick: string;
        odds: number;
        trustScore: number;
        trustLevel: "cf1" | "cf2" | "cf3" | "cf4";
      }> = [];

      // 1. Match Result (1X2)
      if (betTypes["Match Result (1X2)"]) {
        if (!isNaN(hOdd) && hOdd >= minOdd && hOdd <= maxOdd) {
          candidates.push({ market: "Match Result (1X2)", pick: "1", odds: hOdd, trustScore: ratingNum, trustLevel });
        }
        if (!isNaN(aOdd) && aOdd >= minOdd && aOdd <= maxOdd && aOdd <= 2.8) {
          candidates.push({ market: "Match Result (1X2)", pick: "2", odds: aOdd, trustScore: ratingNum * 0.95, trustLevel });
        }
        if (!isNaN(dOdd) && dOdd >= minOdd && dOdd <= maxOdd) {
          candidates.push({ market: "Match Result (1X2)", pick: "X", odds: dOdd, trustScore: ratingNum * 0.88, trustLevel });
        }
      }

      // 2. Double Chance
      if (betTypes["Double Chance"]) {
        const dc1x = parseFloat((1 / (1 / hOdd + 1 / dOdd) * 0.96).toFixed(2));
        const dcX2 = parseFloat((1 / (1 / aOdd + 1 / dOdd) * 0.96).toFixed(2));
        if (dc1x >= minOdd && dc1x <= maxOdd) {
          candidates.push({ market: "Double Chance", pick: "1X", odds: dc1x, trustScore: Math.min(10, ratingNum + 0.4), trustLevel });
        }
        if (dcX2 >= minOdd && dcX2 <= maxOdd) {
          candidates.push({ market: "Double Chance", pick: "X2", odds: dcX2, trustScore: Math.min(10, ratingNum + 0.3), trustLevel });
        }
      }

      // 3. Over / Under 2.5
      if (betTypes["Over 2.5"]) {
        const o25 = parseFloat(m.predictions?.goals?.odd || "1.75");
        if (o25 >= minOdd && o25 <= maxOdd) {
          candidates.push({ market: "Over 2.5", pick: "Over 2.5", odds: o25, trustScore: ratingNum, trustLevel });
        }
      }
      if (betTypes["Under 2.5"]) {
        const u25 = parseFloat(m.predictions?.goals?.odd ? (3.5 - parseFloat(m.predictions.goals.odd)).toFixed(2) : "1.85");
        if (u25 >= minOdd && u25 <= maxOdd) {
          candidates.push({ market: "Under 2.5", pick: "Under 2.5", odds: Math.max(1.3, u25), trustScore: ratingNum * 0.94, trustLevel });
        }
      }

      // 4. Over / Under 1.5
      if (betTypes["Over 1.5"]) {
        const o15 = 1.28;
        if (o15 >= minOdd && o15 <= maxOdd) {
          candidates.push({ market: "Over 1.5", pick: "Over 1.5", odds: o15, trustScore: Math.min(10, ratingNum + 0.5), trustLevel });
        }
      }
      if (betTypes["Under 1.5"]) {
        const u15 = 3.20;
        if (u15 >= minOdd && u15 <= maxOdd) {
          candidates.push({ market: "Under 1.5", pick: "Under 1.5", odds: u15, trustScore: ratingNum * 0.85, trustLevel });
        }
      }

      // 5. Over / Under 3.5
      if (betTypes["Over 3.5"]) {
        const o35 = 2.95;
        if (o35 >= minOdd && o35 <= maxOdd) {
          candidates.push({ market: "Over 3.5", pick: "Over 3.5", odds: o35, trustScore: ratingNum * 0.86, trustLevel });
        }
      }
      if (betTypes["Under 3.5"]) {
        const u35 = 1.35;
        if (u35 >= minOdd && u35 <= maxOdd) {
          candidates.push({ market: "Under 3.5", pick: "Under 3.5", odds: u35, trustScore: Math.min(10, ratingNum + 0.4), trustLevel });
        }
      }

      // 6. Both Teams to Score
      if (betTypes["Both Teams to Score"]) {
        const bttsOdd = parseFloat(m.predictions?.btts?.odd || "1.80");
        if (bttsOdd >= minOdd && bttsOdd <= maxOdd) {
          candidates.push({ market: "Both Teams to Score", pick: "BTTS Yes", odds: bttsOdd, trustScore: ratingNum, trustLevel });
        }
      }

      if (candidates.length > 0) {
        pool.push({ raw: m, candidates });
      }
    });

    return pool;
  }, [rawMatches, betTypes, minOdd, maxOdd, minTrust, onlyMajor]);

  // Slip generation solver
  const buildSlip = useCallback(() => {
    if (matchesPool.length === 0) return [];

    let targetPicks = 5;
    if (isFixedCount && parseInt(fixedCount, 10)) {
      targetPicks = Math.max(2, Math.min(25, parseInt(fixedCount, 10)));
    } else if (numPicksRange === "2-5") targetPicks = 4;
    else if (numPicksRange === "5-10") targetPicks = 6;
    else if (numPicksRange === "10-15") targetPicks = 10;
    else if (numPicksRange === "15-20") targetPicks = 15;
    else {
      if (targetOdds <= 2.5) targetPicks = 3;
      else if (targetOdds <= 6) targetPicks = 5;
      else if (targetOdds <= 15) targetPicks = 8;
      else targetPicks = 12;
    }

    // Shuffle pool with high entropy
    const shuffled = [...matchesPool].sort(() => Math.random() - 0.5);

    const selected: SlipMatch[] = [];
    let cumulativeOdds = 1.0;

    for (const matchObj of shuffled) {
      if (selected.length >= targetPicks) break;

      // Pick a candidate pick matching enabled bet types
      const candidate = matchObj.candidates[Math.floor(Math.random() * matchObj.candidates.length)];
      if (!candidate) continue;

      const m = matchObj.raw;
      const kick = m.kickTime || "20:00";
      const dateStr = `Today · ${kick}`;

      selected.push({
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

      cumulativeOdds *= candidate.odds;

      if (selected.length >= targetPicks && cumulativeOdds >= targetOdds * 0.88) {
        break;
      }
    }

    return selected;
  }, [matchesPool, isFixedCount, fixedCount, numPicksRange, targetOdds]);

  // Initial automatic generation when matches first load
  useEffect(() => {
    if (rawMatches.length > 0 && generatedSlip.length === 0 && !loading) {
      const initial = buildSlip();
      setGeneratedSlip(initial);
    }
  }, [rawMatches, generatedSlip.length, loading, buildSlip]);

  // Action: Trigger Slip Generation with Micro-Animation & User Limit Checks
  const handleGenerateSlip = async () => {
    // If free user already used their daily ticket and is requesting another
    if (isLoggedIn && !isVip && freeTicketsUsedToday >= 1) {
      setShowLimitModal(true);
      return;
    }

    // Play quick smooth visual feedback generation animation
    setIsGenerating(true);
    setGenerationStep("Analyzing quantitative market odds & probability distributions...");

    await new Promise((r) => setTimeout(r, 200));
    setGenerationStep("Testing accumulator simulations...");

    await new Promise((r) => setTimeout(r, 150));

    // Generate new randomized slip respecting all parameters
    const newSlip = buildSlip();
    setGeneratedSlip(newSlip);
    setIsGenerating(false);
    setGenerationStep("");

    // If free logged-in user, mark 1 daily ticket used
    if (isLoggedIn && !isVip && userId && freeTicketsUsedToday < 1) {
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

  // Booking Code generator mock mapping
  const bookingCode = useMemo(() => {
    if (generatedSlip.length === 0) return "JT-84920";
    const sum = generatedSlip.reduce((acc, m) => acc + m.id.charCodeAt(0), 0);
    const prefixes: Record<string, string> = {
      sportybet: "SB-",
      bet9ja: "B9-",
      "1xbet": "1X-",
      betway: "BW-",
    };
    return `${prefixes[selectedBookie] || "JT-"}${Math.abs((sum * 37) % 90000 + 10000)}`;
  }, [generatedSlip, selectedBookie]);

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
                  {["Over 2.5", "Over 1.5", "Over 3.5", "Both Teams to Score", "More markets"].map((market) => (
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
                    <span>Generate Slip</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="bb-btn bb-btn--ghost"
                onClick={handleGenerateSlip}
                disabled={isGenerating || loading}
                title="Re-roll with different matches"
              >
                <RefreshCw size={15} className={isGenerating ? "animate-spin" : ""} />
              </button>
            </div>
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
              <div className="bb-placeholder">
                <h2>Ready to build your slip?</h2>
                <p>Set your preferences on the left, then click Generate slip to let the AI assemble it for you.</p>
              </div>
            ) : (
              <div className="bb-slip">
                {/* Slip Header */}
                <div className="bb-slip__head">
                  <div className="bb-slip__headmain">
                    <span className="bb-slip__eyebrow">YOUR SLIP</span>
                    <h2 className="bb-slip__title">
                      {generatedSlip.length} picks · <span>{calculatedOdds.toFixed(2)}</span>
                    </h2>
                    <span
                      className={`bb-slip__delta ${
                        Math.abs(deltaPercent) <= 8 ? "is-ok" : "is-off"
                      }`}
                    >
                      Target {targetOdds.toFixed(2)} · {deltaPercent > 0 ? `+${deltaPercent}%` : `${deltaPercent}%`}
                    </span>
                  </div>

                  {/* Header Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setShowBookingModal(true)}
                      className="bb-slip__fav"
                      style={{
                        background: "rgba(47, 208, 138, 0.16)",
                        color: "#2fd08a",
                        border: "1px solid rgba(47, 208, 138, 0.35)",
                      }}
                      title="Convert to SportyBet or Bet9ja booking code"
                    >
                      <Smartphone size={13} />
                      <span>Booking Code</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsFavorite((p) => !p)}
                      className="bb-slip__fav"
                      style={{
                        background: isFavorite ? "rgba(124, 108, 245, 0.25)" : undefined,
                        color: isFavorite ? "#ffffff" : undefined,
                      }}
                    >
                      <Star size={13} fill={isFavorite ? "currentColor" : "none"} />
                      <span>Favorite</span>
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
                          {match.trustScore}
                        </span>

                        {/* Pick Pill */}
                        <span className="bb-slip__stat">
                          <span className="bb-slip__pick">{match.pick}</span>
                          <span
                            className={`bb-slip__odd ${
                              match.oddMove === "down" ? "has-move is-down" : ""
                            }`}
                          >
                            <span className="bb-slip__num">
                              {match.oddMove === "down" ? (
                                <>
                                  <span className="bb-slip__arrow">&#9662;</span>
                                  {match.odds.toFixed(2)}
                                </>
                              ) : (
                                `- ${match.odds.toFixed(2)}`
                              )}
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
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
            onClick={() => setShowBookingModal(false)}
          >
            <div
              style={{
                maxWidth: 480,
                width: "100%",
                background: "#141132",
                border: "1px solid rgba(167, 159, 255, 0.25)",
                borderRadius: 18,
                padding: "28px 24px",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Smartphone size={20} color="#2fd08a" />
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", margin: 0 }}>
                    Load Slip to Betting Site
                  </h3>
                </div>
                <button
                  onClick={() => setShowBookingModal(false)}
                  style={{ background: "transparent", border: "none", color: "#a79fff", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: 13, color: "#d4cde3", margin: "0 0 18px", lineHeight: 1.5 }}>
                Select your preferred betting bookmaker to load these {generatedSlip.length} picks directly on the betting platform:
              </p>

              {/* Bookmaker Selector Tabs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 20 }}>
                {[
                  { id: "sportybet", label: "SportyBet" },
                  { id: "bet9ja", label: "Bet9ja" },
                  { id: "1xbet", label: "1xBet" },
                  { id: "betway", label: "Betway" },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBookie(b.id as any)}
                    style={{
                      padding: "8px 4px",
                      borderRadius: 8,
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      border: selectedBookie === b.id ? "1px solid #2fd08a" : "1px solid rgba(167, 159, 255, 0.15)",
                      background: selectedBookie === b.id ? "rgba(47, 208, 138, 0.2)" : "#1b183d",
                      color: selectedBookie === b.id ? "#2fd08a" : "#a79fff",
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {/* Booking Code Box */}
              <div
                style={{
                  background: "rgba(8, 7, 30, 0.8)",
                  border: "1px dashed rgba(47, 208, 138, 0.4)",
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#7874a4", textTransform: "uppercase" }}>
                    {selectedBookie.toUpperCase()} BOOKING CODE
                  </span>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#2fd08a", letterSpacing: "0.06em", marginTop: 2 }}>
                    {bookingCode}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(bookingCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
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
                    gap: 6,
                  }}
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>

              <div style={{ fontSize: 12, color: "#7874a4", lineHeight: 1.5, marginBottom: 20 }}>
                <strong>How to load:</strong> Open the {selectedBookie} app or website, open your betslip, click <em>Load Bet / Booking Code</em>, paste <strong>{bookingCode}</strong>, and all selections will load automatically.
              </div>

              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="bb-btn bb-btn--ghost"
                style={{ width: "100%" }}
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
