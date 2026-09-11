"use client";

import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { MatchData } from "@/lib/types";
import {
  Sparkles,
  RotateCcw,
  Check,
  ChevronRight,
  Shield,
  Zap,
  Copy,
  CheckCircle2,
  Layers,
  SlidersHorizontal,
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
  const [totalSlipOdds, setTotalSlipOdds] = useState<number>(5.0);
  const [autoOdds, setAutoOdds] = useState<boolean>(false);
  const [matchCountRange, setMatchCountRange] = useState<string>("Auto");
  const [isFixedCount, setIsFixedCount] = useState<boolean>(false);
  const [fixedCountVal, setFixedCountVal] = useState<string>("7");

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

  const [minOdd, setMinOdd] = useState<number>(1.15);
  const [maxOdd, setMaxOdd] = useState<number>(1.80);
  const [availableMatches, setAvailableMatches] = useState<SlipItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function loadMatches() {
      try {
        setLoading(true);
        const res = await fetch("/api/matches?d=0");
        const data = await res.json();
        if (data.success && Array.isArray(data.matches)) {
          const items: SlipItem[] = data.matches.map((m: MatchData) => {
            const best = m.predictions?.bestTip?.pick || "1";
            const bestOdd = parseFloat(m.predictions?.bestTip?.odd || m.odds.home || "1.50");
            const conf = m.confidence ? parseInt(m.confidence.replace("%", ""), 10) / 10 : 8.8;

            return {
              id: m.id,
              datetime: `Today · ${m.kickTime || "19:00"}`,
              countryLeague: `${m.country || "Int"} - ${m.leagueName || "League"}`,
              homeTeam: m.homeTeam,
              awayTeam: m.awayTeam,
              homeLogoColor: getDeterministicColor(m.homeTeam),
              awayLogoColor: getDeterministicColor(m.awayTeam),
              trustScore: Math.min(9.9, Math.max(7.5, conf)),
              marketType: "Best Tip",
              pick: best,
              odds: isNaN(bestOdd) ? 1.50 : bestOdd,
            };
          });
          setAvailableMatches(items);
        }
      } catch (err) {
        console.error("Failed to load bet builder pool:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, []);

  const generatedSlip = useMemo(() => {
    if (availableMatches.length === 0) return [];

    let targetCount = 6;
    if (matchCountRange === "2-5") targetCount = 4;
    else if (matchCountRange === "5-10") targetCount = 6;
    else if (matchCountRange === "10-15") targetCount = 10;
    else if (matchCountRange === "15-20") targetCount = 15;
    if (isFixedCount && parseInt(fixedCountVal)) {
      targetCount = parseInt(fixedCountVal);
    }

    return availableMatches.slice(0, targetCount);
  }, [availableMatches, matchCountRange, isFixedCount, fixedCountVal]);

  const calculatedTotalOdds = useMemo(() => {
    if (generatedSlip.length === 0) return 5.0;
    const total = generatedSlip.reduce((acc, item) => acc * item.odds, 1);
    return parseFloat(total.toFixed(2));
  }, [generatedSlip]);

  const handleToggleBetType = (key: string) => {
    setBetTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAll = (val: boolean) => {
    setBetTypes((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => (next[k] = val));
      return next;
    });
  };

  const handleCopySlip = () => {
    const text = generatedSlip
      .map((p, i) => `${i + 1}. [${p.countryLeague}] ${p.homeTeam} vs ${p.awayTeam} -> ${p.pick} @ ${p.odds}`)
      .join("\n");
    const full = `🎯 JollofTips Bet Builder Slip (${generatedSlip.length} picks · Total Odds: ${calculatedTotalOdds}):\n${text}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar />

      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "28px 20px 80px" }}>
        {/* Header Badge */}
        <div style={{ marginBottom: 24 }}>
          <div className="gold-badge" style={{ marginBottom: 10 }}>
            <Sparkles size={12} />
            POWERED BY JT ALGORITHMIC ENGINE
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Smart Bet Builder
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Generate high-trust customized accumulator slips matching your exact target odds and market preferences.
          </p>
        </div>

        {/* ── Builder Grid (Controls on Left, Slip on Right) ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, alignItems: "flex-start" }}>
          
          {/* LEFT: Controls Panel */}
          <div className="luxury-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* 1. TOTAL SLIP ODDS */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  TOTAL SLIP ODDS
                </span>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={autoOdds}
                    onChange={(e) => setAutoOdds(e.target.checked)}
                    style={{ accentColor: "var(--gold)" }}
                  />
                  Auto odds
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <input
                  type="range"
                  min="2.00"
                  max="50.00"
                  step="0.5"
                  disabled={autoOdds}
                  value={totalSlipOdds}
                  onChange={(e) => setTotalSlipOdds(parseFloat(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: 18, fontWeight: 900, color: "var(--gold)", minWidth: 60, textAlign: "right" }}>
                  {totalSlipOdds.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 2. NUMBER OF MATCHES */}
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 12 }}>
                NUMBER OF MATCHES
              </span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {["Auto", "2-5", "5-10", "10-15", "15-20"].map((r) => {
                  const isSel = matchCountRange === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setMatchCountRange(r)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: isSel ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                        background: isSel ? "var(--gold)" : "var(--surface-raised)",
                        color: isSel ? "var(--gold-btn-text)" : "var(--text-secondary)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isFixedCount}
                  onChange={(e) => setIsFixedCount(e.target.checked)}
                  style={{ accentColor: "var(--gold)" }}
                />
                Fixed count
                {isFixedCount && (
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={fixedCountVal}
                    onChange={(e) => setFixedCountVal(e.target.value)}
                    style={{
                      width: 50,
                      padding: "2px 6px",
                      borderRadius: 6,
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  />
                )}
              </label>
            </div>

            {/* 3. BET TYPES */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  BET TYPES
                </span>
                <button
                  onClick={() => handleSelectAll(false)}
                  style={{ background: "transparent", border: "none", color: "var(--gold)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Uncheck all
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {Object.keys(betTypes).map((bt) => (
                  <label key={bt} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={betTypes[bt]}
                      onChange={() => handleToggleBetType(bt)}
                      style={{ accentColor: "var(--gold)" }}
                    />
                    {bt}
                  </label>
                ))}
              </div>
            </div>

            {/* 4. MIN / MAX ODDS PER PICK */}
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 12 }}>
                ODDS RANGE PER PICK ({minOdd.toFixed(2)} - {maxOdd.toFixed(2)})
              </span>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="range"
                  min="1.05"
                  max="3.00"
                  step="0.05"
                  value={minOdd}
                  onChange={(e) => setMinOdd(parseFloat(e.target.value))}
                  style={{ flex: 1 }}
                />
                <input
                  type="range"
                  min="1.30"
                  max="5.00"
                  step="0.05"
                  value={maxOdd}
                  onChange={(e) => setMaxOdd(parseFloat(e.target.value))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Slip Generator Results */}
          <div className="luxury-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: 16 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                  YOUR ACCUMULATOR SLIP
                </p>
                <p style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                  {generatedSlip.length} picks · {calculatedTotalOdds}
                </p>
              </div>

              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: "var(--accent-green-bg)",
                  border: "1px solid var(--accent-green-border)",
                  color: "var(--accent-green)",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Target {totalSlipOdds.toFixed(2)}
              </span>
            </div>

            {/* Picks List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 520, overflowY: "auto" }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                  Generating optimal algorithmic picks...
                </div>
              ) : generatedSlip.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                  No picks match this exact filter criteria.
                </div>
              ) : (
                generatedSlip.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 10,
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600 }}>
                        {item.countryLeague} · {item.datetime}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.homeLogoColor }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.homeTeam}</span>
                        <span style={{ fontSize: 12, color: "var(--text-dim)" }}>vs</span>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.awayLogoColor }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{item.awayTeam}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent-green)" }}>
                        {item.trustScore.toFixed(1)}
                      </span>
                      <div
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "var(--gold-bg)",
                          border: "1px solid var(--gold-border)",
                          color: "var(--gold)",
                          textAlign: "center",
                          minWidth: 70,
                        }}
                      >
                        <p style={{ fontSize: 11, fontWeight: 800, margin: 0 }}>{item.pick}</p>
                        <p style={{ fontSize: 11, fontWeight: 600, margin: 0, opacity: 0.85 }}>· {item.odds.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopySlip}
              className="gold-btn"
              style={{ width: "100%", padding: "12px", marginTop: 8 }}
            >
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              <span>{copied ? "Slip Copied to Clipboard!" : "Copy Generated Slip"}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
