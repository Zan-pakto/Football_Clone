"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { MatchData } from "@/lib/types";

import {
  Sparkles,
  RotateCcw,
  Check,
  ChevronRight,
  Shield,
  Zap,
} from "lucide-react";

interface SlipItem {
  id: string;
  datetime: string;
  countryLeague: string;
  homeTeam: string;
  awayTeam: string;
  homeLogoColor: string;
  awayLogoColor: string;
  trustScore: number;
  marketType: string;
  pick: string;
  odds: number;
}

const TEAM_COLORS = [
  "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#14b8a6", "#f97316", "#6366f1"
];

function getDeterministicColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
}

export default function BetBuilderPage() {
  // Filter States
  const [totalSlipOdds, setTotalSlipOdds] = useState<number>(5.0);
  const [autoOdds, setAutoOdds] = useState<boolean>(false);
  const [matchCountRange, setMatchCountRange] = useState<string>("Auto");
  const [isFixedCount, setIsFixedCount] = useState<boolean>(false);
  const [fixedCountVal, setFixedCountVal] = useState<string>("7");

  // Bet Types Checkbox State
  const [betTypes, setBetTypes] = useState<Record<string, boolean>>({
    "Match Result (1X2)": true,
    "Over 2.5": true,
    "Under 2.5": true,
    "Over 1.5": true,
    "Under 1.5": true,
    "Over 3.5": true,
    "Under 3.5": true,
    "Both Teams to Score": true,
    "Double Chance": true,
    "More markets": true,
  });

  // Min / Max Odd Per Pick
  const [minOdd, setMinOdd] = useState<number>(1.15);
  const [maxOdd, setMaxOdd] = useState<number>(1.80);

  // Match Window
  const [matchWindow, setMatchWindow] = useState<string>("Today + tomorrow");

  // Minimum Pick Trust
  const [minTrust, setMinTrust] = useState<number>(5.0);

  // Additional options
  const [onlyImportantLeagues, setOnlyImportantLeagues] = useState<boolean>(false);
  const [onlyDecreasingOdds, setOnlyDecreasingOdds] = useState<boolean>(false);

  // Real Matches Pool
  const [availableMatches, setAvailableMatches] = useState<SlipItem[]>([]);
  const [slipItems, setSlipItems] = useState<SlipItem[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Fetch real fixtures from Bzzoiro API
  useEffect(() => {
    let isMounted = true;
    async function loadRealMatches() {
      try {
        const [resToday, resTmr] = await Promise.all([
          fetch("/api/matches?d=0"),
          fetch("/api/matches?d=1"),
        ]);
        const dataToday = await resToday.json();
        const dataTmr = await resTmr.json();

        const combined: MatchData[] = [
          ...(Array.isArray(dataToday.matches) ? dataToday.matches : []),
          ...(Array.isArray(dataTmr.matches) ? dataTmr.matches : []),
        ];

        const mappedPool: SlipItem[] = combined.map((m, idx) => {
          const confNum = m.confidence ? parseInt(m.confidence.replace("%", ""), 10) : 85;
          const trust = Number(Math.min(10, Math.max(7, Math.round(confNum / 10) + 0.5)).toFixed(1));
          const homeOdd = parseFloat(m.odds?.home || "1.45") || 1.45;
          const pick1x2 = m.predictions?.pickScore?.pick || "1";

          return {
            id: m.id || `m-${idx}`,
            datetime: m.kickTime ? `Today · ${m.kickTime}` : "Today · 20:00",
            countryLeague: `${m.country} · ${m.leagueName}`,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            homeLogoColor: getDeterministicColor(m.homeTeam),
            awayLogoColor: getDeterministicColor(m.awayTeam),
            trustScore: trust,
            marketType: "Match Result (1X2)",
            pick: pick1x2,
            odds: homeOdd,
          };
        });

        if (isMounted && mappedPool.length > 0) {
          setAvailableMatches(mappedPool);
          setSlipItems(mappedPool.slice(0, 6));
        }
      } catch (err) {
        console.error("Failed to load matches for Bet Builder:", err);
      }
    }
    loadRealMatches();
    return () => { isMounted = false; };
  }, []);

  const toggleBetType = (key: string) => {
    setBetTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleUncheckAll = () => {
    setBetTypes((prev) => {
      const updated: Record<string, boolean> = {};
      Object.keys(prev).forEach((k) => {
        updated[k] = false;
      });
      return updated;
    });
  };

  const handleResetFilters = () => {
    setTotalSlipOdds(5.0);
    setAutoOdds(false);
    setMatchCountRange("Auto");
    setIsFixedCount(false);
    setFixedCountVal("7");
    setMinOdd(1.15);
    setMaxOdd(1.80);
    setMatchWindow("Today + tomorrow");
    setMinTrust(5.0);
    setOnlyImportantLeagues(false);
    setOnlyDecreasingOdds(false);
    setBetTypes({
      "Match Result (1X2)": true,
      "Over 2.5": true,
      "Under 2.5": true,
      "Over 1.5": true,
      "Under 1.5": true,
      "Over 3.5": true,
      "Under 3.5": true,
      "Both Teams to Score": true,
      "Double Chance": true,
      "More markets": true,
    });
    setSlipItems(availableMatches.slice(0, 6));
  };

  const handleGenerateSlip = () => {
    if (availableMatches.length === 0) return;
    setIsGenerating(true);
    setTimeout(() => {
      let count = 6;
      if (isFixedCount && parseInt(fixedCountVal, 10)) {
        count = Math.min(Math.max(2, parseInt(fixedCountVal, 10)), availableMatches.length);
      } else if (matchCountRange === "2-5") {
        count = 4;
      } else if (matchCountRange === "5-10") {
        count = 7;
      } else if (matchCountRange === "10-15") {
        count = 10;
      } else if (matchCountRange === "15-20") {
        count = 12;
      }

      // Filter pool by odds and trust
      const filteredPool = availableMatches.filter(
        (m) => m.odds >= minOdd && m.odds <= maxOdd && m.trustScore >= minTrust
      );
      const sourcePool = filteredPool.length >= count ? filteredPool : availableMatches;
      const shuffled = [...sourcePool].sort(() => 0.5 - Math.random());
      setSlipItems(shuffled.slice(0, Math.min(count, shuffled.length)));
      setIsGenerating(false);
    }, 350);
  };

  // Calculations
  const calculatedTotalOdds = useMemo(() => {
    if (slipItems.length === 0) return 0;
    const mult = slipItems.reduce((acc, m) => acc * m.odds, 1);
    return Number(mult.toFixed(2));
  }, [slipItems]);

  const averageTrust = useMemo(() => {
    if (slipItems.length === 0) return 0;
    const sum = slipItems.reduce((acc, m) => acc + m.trustScore, 0);
    return Number((sum / slipItems.length).toFixed(1));
  }, [slipItems]);

  const targetDiffPct = useMemo(() => {
    if (totalSlipOdds === 0) return "+0%";
    const diff = ((calculatedTotalOdds - totalSlipOdds) / totalSlipOdds) * 100;
    const sign = diff >= 0 ? "+" : "";
    return `${sign}${Math.round(diff)}%`;
  }, [calculatedTotalOdds, totalSlipOdds]);

  const hitProbability = useMemo(() => {
    if (calculatedTotalOdds <= 0) return "0.0%";
    const prob = (1 / calculatedTotalOdds) * 100 * 1.08; // slightly favorable margin
    return `${Math.min(95, Math.max(2, prob)).toFixed(1)}%`;
  }, [calculatedTotalOdds]);

  return (
    <div style={{ background: "transparent", minHeight: "100vh", color: "#f8fafc", fontFamily: "inherit" }}>
      <Navbar />

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "84px 16px 80px" }}>
        
        {/* ── Page Header / Title ── */}
        <div style={{ marginBottom: 24, marginTop: 8 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(168, 85, 247, 0.16)",
            border: "1px solid rgba(168, 85, 247, 0.35)",
            borderRadius: 999,
            padding: "4px 14px",
            fontSize: 11,
            fontWeight: 800,
            color: "#c084fc",
            marginBottom: 10,
            letterSpacing: "0.5px",
            boxShadow: "0 0 16px rgba(168, 85, 247, 0.2)",
          }}>
            <span>✦</span> POWERED BY NT APEX AI
          </div>

          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.5px",
          }}>
            Bet Builder
          </h1>
        </div>

        {/* ── 2-Column Exact Layout ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: 20,
          alignItems: "start",
        }}>

          {/* ════════ LEFT COLUMN: FILTERS ════════ */}
          <div style={{
            background: "rgba(20, 25, 56, 0.92)",
            border: "1px solid rgba(168, 85, 247, 0.24)",
            borderRadius: 16,
            padding: "22px 20px",
            boxShadow: "0 10px 32px rgba(0, 0, 0, 0.45), 0 0 24px rgba(139, 92, 246, 0.08)",
            backdropFilter: "blur(14px)",
          }}>
            
            {/* TOTAL SLIP ODDS */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.6px" }}>
                  TOTAL SLIP ODDS
                </span>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={autoOdds}
                    onChange={(e) => setAutoOdds(e.target.checked)}
                    style={{ accentColor: "#6366f1", cursor: "pointer", width: 14, height: 14 }}
                  />
                  Auto odds
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                  <input
                    type="range"
                    min="1.5"
                    max="50"
                    step="0.5"
                    value={totalSlipOdds}
                    disabled={autoOdds}
                    onChange={(e) => setTotalSlipOdds(parseFloat(e.target.value))}
                    style={{
                      width: "100%",
                      accentColor: "#6366f1",
                      cursor: autoOdds ? "not-allowed" : "pointer",
                      opacity: autoOdds ? 0.4 : 1,
                    }}
                  />
                </div>
                <span style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#ffffff",
                  minWidth: 44,
                  textAlign: "right",
                  fontFamily: "monospace"
                }}>
                  {totalSlipOdds.toFixed(2)}
                </span>
              </div>
            </div>

            {/* NUMBER OF MATCHES */}
            <div style={{ marginBottom: 24 }}>
              <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.6px", marginBottom: 10 }}>
                NUMBER OF MATCHES
              </span>
              
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {["Auto", "2-5", "5-10", "10-15", "15-20"].map((range) => {
                  const isSelected = matchCountRange === range && !isFixedCount;
                  return (
                    <button
                      key={range}
                      onClick={() => {
                        setMatchCountRange(range);
                        setIsFixedCount(false);
                      }}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        border: isSelected ? "1px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.08)",
                        background: isSelected ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.03)",
                        color: isSelected ? "#ffffff" : "#94a3b8",
                        cursor: "pointer",
                      }}
                    >
                      {range}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isFixedCount}
                    onChange={(e) => setIsFixedCount(e.target.checked)}
                    style={{ accentColor: "#6366f1", cursor: "pointer", width: 14, height: 14 }}
                  />
                  Fixed count
                </label>
                <input
                  type="text"
                  value={fixedCountVal}
                  placeholder="2-25"
                  disabled={!isFixedCount}
                  onChange={(e) => setFixedCountVal(e.target.value)}
                  style={{
                    width: 68,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: 6,
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 8px",
                    textAlign: "center",
                    opacity: isFixedCount ? 1 : 0.4,
                  }}
                />
              </div>
            </div>

            {/* BET TYPES */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.6px" }}>
                  BET TYPES
                </span>
                <button
                  onClick={handleUncheckAll}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 6,
                    padding: "2px 8px",
                    color: "#94a3b8",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Uncheck all
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 12px" }}>
                {[
                  ["Match Result (1X2)", "Over 2.5"],
                  ["Under 2.5", "Over 1.5"],
                  ["Under 1.5", "Over 3.5"],
                  ["Under 3.5", "Both Teams to Score"],
                  ["Double Chance", "More markets"],
                ].map(([left, right], idx) => (
                  <div key={idx} style={{ display: "contents" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#cbd5e1", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(betTypes[left])}
                        onChange={() => toggleBetType(left)}
                        style={{ accentColor: "#6366f1", width: 14, height: 14, cursor: "pointer" }}
                      />
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{left}</span>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#cbd5e1", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={Boolean(betTypes[right])}
                        onChange={() => toggleBetType(right)}
                        style={{ accentColor: "#6366f1", width: 14, height: 14, cursor: "pointer" }}
                      />
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{right}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* MIN ODD PER PICK */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.6px", marginBottom: 8 }}>
                MIN ODD PER PICK
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <input
                  type="range"
                  min="1.05"
                  max="3.00"
                  step="0.05"
                  value={minOdd}
                  onChange={(e) => setMinOdd(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#6366f1", cursor: "pointer" }}
                />
                <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff", minWidth: 36, textAlign: "right", fontFamily: "monospace" }}>
                  {minOdd.toFixed(2)}
                </span>
              </div>
            </div>

            {/* MAX ODD PER PICK */}
            <div style={{ marginBottom: 24 }}>
              <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.6px", marginBottom: 8 }}>
                MAX ODD PER PICK
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <input
                  type="range"
                  min="1.20"
                  max="5.00"
                  step="0.05"
                  value={maxOdd}
                  onChange={(e) => setMaxOdd(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#6366f1", cursor: "pointer" }}
                />
                <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff", minWidth: 36, textAlign: "right", fontFamily: "monospace" }}>
                  {maxOdd.toFixed(2)}
                </span>
              </div>
            </div>

            {/* MATCH WINDOW */}
            <div style={{ marginBottom: 24 }}>
              <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.6px", marginBottom: 10 }}>
                MATCH WINDOW
              </span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Today", "Today + tomorrow", "Next 3 days"].map((win) => {
                  const isSel = matchWindow === win;
                  return (
                    <button
                      key={win}
                      onClick={() => setMatchWindow(win)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        border: isSel ? "1px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.08)",
                        background: isSel ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.03)",
                        color: isSel ? "#ffffff" : "#94a3b8",
                        cursor: "pointer",
                      }}
                    >
                      {win}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MINIMUM PICK TRUST */}
            <div style={{ marginBottom: 24 }}>
              <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.6px", marginBottom: 8 }}>
                MINIMUM PICK TRUST
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={minTrust}
                  onChange={(e) => setMinTrust(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#6366f1", cursor: "pointer" }}
                />
                <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff", minWidth: 36, textAlign: "right", fontFamily: "monospace" }}>
                  {minTrust.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Checkboxes: Only important leagues / Only decreasing odds */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={onlyImportantLeagues}
                  onChange={(e) => setOnlyImportantLeagues(e.target.checked)}
                  style={{ accentColor: "#6366f1", width: 14, height: 14, cursor: "pointer" }}
                />
                Only important leagues
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={onlyDecreasingOdds}
                  onChange={(e) => setOnlyDecreasingOdds(e.target.checked)}
                  style={{ accentColor: "#6366f1", width: 14, height: 14, cursor: "pointer" }}
                />
                Only decreasing odds
              </label>
            </div>

            {/* Bottom Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleResetFilters}
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.09)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  color: "#cbd5e1",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                Reset filters
              </button>

              <button
                onClick={handleGenerateSlip}
                disabled={isGenerating}
                style={{
                  flex: 1.5,
                  background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 16px",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isGenerating ? "not-allowed" : "pointer",
                  boxShadow: "0 0 24px rgba(139, 92, 246, 0.5)",
                  transition: "all 0.15s ease",
                  opacity: isGenerating ? 0.7 : 1,
                }}
              >
                {isGenerating ? "Generating..." : "Generate slip"}
              </button>
            </div>

          </div>


          {/* ════════ RIGHT COLUMN: YOUR SLIP ════════ */}
          <div style={{
            background: "rgba(20, 25, 56, 0.92)",
            border: "1px solid rgba(168, 85, 247, 0.24)",
            borderRadius: 16,
            padding: "24px 22px",
            boxShadow: "0 10px 32px rgba(0, 0, 0, 0.45), 0 0 24px rgba(139, 92, 246, 0.08)",
            backdropFilter: "blur(14px)",
          }}>
            
            {/* Slip Header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#c084fc", boxShadow: "0 0 8px #c084fc" }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: "#c084fc", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  YOUR SLIP
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", margin: 0 }}>
                  {slipItems.length} picks · {calculatedTotalOdds.toFixed(2)}
                </h2>

                <div style={{
                  background: "rgba(16, 185, 129, 0.16)",
                  border: "1px solid rgba(16, 185, 129, 0.35)",
                  borderRadius: 999,
                  padding: "4px 12px",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#34d399",
                }}>
                  Target {totalSlipOdds.toFixed(2)} · {targetDiffPct}
                </div>
              </div>
            </div>

            {/* Match Rows List */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {slipItems.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    padding: "16px 0",
                    borderTop: idx === 0 ? "1px solid rgba(168, 85, 247, 0.12)" : "1px solid rgba(168, 85, 247, 0.12)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {/* Row Top Line: Datetime (left) and League (right) */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#94a3b8" }}>
                    <span>{item.datetime}</span>
                    <span style={{ color: "#c7d2fe" }}>{item.countryLeague}</span>
                  </div>

                  {/* Row Main Line: Teams (left), Trust score (center), Pick button (right) */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                    
                    {/* Teams with small logo dots */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "#ffffff" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.homeLogoColor, flexShrink: 0 }} />
                        <span>{item.homeTeam}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "#ffffff" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.awayLogoColor, flexShrink: 0 }} />
                        <span>{item.awayTeam}</span>
                      </div>
                    </div>

                    {/* Green Trust Score */}
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#10b981", padding: "0 12px" }}>
                      {item.trustScore}
                    </div>

                    {/* Pick + Odds Button (Purple Container) */}
                    <div style={{
                      background: "rgba(139, 92, 246, 0.22)",
                      border: "1px solid rgba(168, 85, 247, 0.45)",
                      borderRadius: 8,
                      minWidth: 64,
                      padding: "6px 14px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 12px rgba(139, 92, 246, 0.15)",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: "#ffffff" }}>
                        {item.pick}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#c7d2fe", display: "flex", alignItems: "center", gap: 2 }}>
                        <span>·</span>
                        <span>{item.odds.toFixed(2)}</span>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Slip Bottom Summary Section */}
            <div style={{
              marginTop: 20,
              paddingTop: 18,
              borderTop: "1px solid rgba(168, 85, 247, 0.18)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 13,
            }}>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#94a3b8" }}>Total odds:</span>
                <strong style={{ color: "#ffffff" }}>{calculatedTotalOdds.toFixed(2)}</strong>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#94a3b8" }}>Average trust:</span>
                <strong style={{ color: "#ffffff" }}>{averageTrust.toFixed(1)}</strong>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#94a3b8" }}>Hit probability:</span>
                <strong style={{ color: "#ffffff" }}>{hitProbability}</strong>
              </div>
            </div>

          </div>

        </div>

      </main>

      <style>{`
        @media (max-width: 900px) {
          main > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
