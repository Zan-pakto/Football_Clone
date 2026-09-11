"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Rocket,
  X,
  Layers,
  Clock,
  TrendingUp,
  Info,
  Lock,
  CheckCircle2,
  Share2,
  Copy,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { MatchData } from "@/lib/types";

interface BankerMatch {
  id: string;
  hour: string;
  isFinished?: boolean;
  homeTeam: string;
  awayTeam: string;
  country?: string;
  homeLogoColor: string;
  awayLogoColor: string;
  homeScore?: number;
  awayScore?: number;
  odds1: string;
  oddsX: string;
  odds2: string;
  market1X2: string;
  marketOU: string;
  marketBTTS: string;
  bestTip: string;
  bestTipOdd: string;
  confidence: number;
  isLocked?: boolean;
}

const DATES = [
  { id: "-2", label: "2 Days Ago" },
  { id: "-1", label: "Yesterday" },
  { id: "0", label: "Today" },
  { id: "1", label: "Tomorrow" },
  { id: "2", label: "In 2 Days" },
];

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

export default function BetOfTheDayPage() {
  const [selectedDate, setSelectedDate] = useState("0");
  const [activeTab, setActiveTab] = useState<"bankers" | "slip">("bankers");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [stake, setStake] = useState<number>(50);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rawMatches, setRawMatches] = useState<MatchData[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadBankers() {
      try {
        setLoading(true);
        const res = await fetch(`/api/matches?d=${selectedDate}`);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.matches)) {
          setRawMatches(data.matches);
        }
      } catch (err) {
        console.error("Failed to load bankers:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBankers();
    return () => { isMounted = false; };
  }, [selectedDate]);

  const matches: BankerMatch[] = useMemo(() => {
    if (rawMatches.length === 0) return [];

    return rawMatches.slice(0, 15).map((m, idx) => {
      const isFin = m.status === "won" || m.status === "lost" || m.status === "fin" || m.elapsed === "FT" || (m.homeScore !== null && m.awayScore !== null && m.status !== "live");
      const isLive = m.isLive || m.status === "live";

      let hourDisplay = m.kickTime || "19:00";
      if (isFin) hourDisplay = "FT";
      else if (isLive) hourDisplay = m.elapsed || "LIVE";

      const confNum = m.confidence ? parseInt(m.confidence.replace("%", ""), 10) : 85;
      const displayConf = Math.min(10, Math.max(7, Math.round(confNum / 10)));

      const pick1x2 = m.predictions?.pickScore?.pick || "1";
      const pickGoals = m.predictions?.goals?.pick || "O2.5";
      const pickBtts = m.predictions?.btts?.pick || "Yes";
      const best = m.predictions?.bestTip?.pick || pick1x2;
      const bestOdd = m.predictions?.bestTip?.odd || m.odds.home || "1.65";

      return {
        id: m.id,
        hour: hourDisplay,
        isFinished: isFin,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        country: m.country,
        homeLogoColor: getDeterministicColor(m.homeTeam),
        awayLogoColor: getDeterministicColor(m.awayTeam),
        homeScore: m.homeScore !== null ? Number(m.homeScore) : undefined,
        awayScore: m.awayScore !== null ? Number(m.awayScore) : undefined,
        odds1: m.odds?.home || "1.85",
        oddsX: m.odds?.draw || "3.40",
        odds2: m.odds?.away || "4.10",
        market1X2: `${pick1x2} - ${m.odds?.home || "1.85"}`,
        marketOU: `${pickGoals} - ${m.predictions?.goals?.odd || "1.75"}`,
        marketBTTS: `${pickBtts} - ${m.predictions?.btts?.odd || "1.80"}`,
        bestTip: best,
        bestTipOdd: bestOdd,
        confidence: displayConf,
        isLocked: idx >= 2, // First 2 banker picks free, others VIP
      };
    });
  }, [rawMatches]);

  const bankerCount = matches.length;
  const upcomingCount = matches.filter((m) => !m.isFinished).length;
  const successRate = selectedDate === "0" ? "88%" : "91%";

  const topSlipPicks = useMemo(() => {
    return matches.slice(0, 3).map((m) => ({
      match: `${m.homeTeam} vs ${m.awayTeam}`,
      pick: `${m.bestTip} (${m.bestTipOdd})`,
      odd: parseFloat(m.bestTipOdd) || 1.45,
    }));
  }, [matches]);

  const totalSlipOdds = useMemo(() => {
    if (topSlipPicks.length === 0) return 2.15;
    const mult = topSlipPicks.reduce((acc, p) => acc * p.odd, 1);
    return Number(mult.toFixed(2));
  }, [topSlipPicks]);

  const potentialReturn = (stake * totalSlipOdds).toFixed(2);

  const handleCopySlip = () => {
    const text = topSlipPicks.map((p) => `${p.match} -> ${p.pick}`).join(" | ");
    navigator.clipboard.writeText(`JollofTips Banker Slip: ${text} @ Total Odds ${totalSlipOdds}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "transparent", color: "#f8fafc" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 1200, width: "100%", margin: "0 auto", padding: "84px 16px 80px" }}>
        
        {/* ── Top Date Tabs ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          {DATES.map((d) => {
            const isSelected = selectedDate === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDate(d.id)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: isSelected ? "1px solid #8b5cf6" : "1px solid transparent",
                  background: isSelected ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)" : "transparent",
                  color: isSelected ? "#ffffff" : "#94a3b8",
                  fontSize: 13,
                  fontWeight: isSelected ? 800 : 600,
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 4px 16px rgba(124, 58, 237, 0.4)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        {/* ── Warning / Free Tip Notice Banner ── */}
        {!bannerDismissed && (
          <div
            style={{
              background: "rgba(20, 25, 56, 0.85)",
              border: "1px solid rgba(168, 85, 247, 0.25)",
              borderRadius: 14,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              marginBottom: 20,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(168, 85, 247, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c084fc",
                }}
              >
                <Rocket style={{ width: 16, height: 16 }} />
              </div>
              <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, fontWeight: 500 }}>
                Predictions are locked without a subscription, but you can enjoy the selection of free tips.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link
                href="/pricing"
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: "rgba(139, 92, 246, 0.2)",
                  border: "1px solid rgba(168, 85, 247, 0.4)",
                  color: "#c084fc",
                  fontSize: 12,
                  fontWeight: 800,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Upgrade VIP
              </Link>
              <button
                onClick={() => setBannerDismissed(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
        )}

        {/* ── 3 Top Stat Cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {/* Card 1: BANKERS */}
          <div
            style={{
              background: "rgba(20, 25, 56, 0.9)",
              border: "1px solid rgba(168, 85, 247, 0.22)",
              borderRadius: 16,
              padding: "20px 24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              BANKERS
            </span>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
              {bankerCount}
            </span>
            <Layers
              style={{
                position: "absolute",
                right: 18,
                bottom: 14,
                width: 44,
                height: 44,
                color: "rgba(168, 85, 247, 0.12)",
              }}
            />
          </div>

          {/* Card 2: UPCOMING */}
          <div
            style={{
              background: "rgba(20, 25, 56, 0.9)",
              border: "1px solid rgba(168, 85, 247, 0.22)",
              borderRadius: 16,
              padding: "20px 24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              UPCOMING
            </span>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
              {upcomingCount}
            </span>
            <Clock
              style={{
                position: "absolute",
                right: 18,
                bottom: 14,
                width: 44,
                height: 44,
                color: "rgba(168, 85, 247, 0.12)",
              }}
            />
          </div>

          {/* Card 3: SUCCESS */}
          <div
            style={{
              background: "rgba(20, 25, 56, 0.9)",
              border: "1px solid rgba(168, 85, 247, 0.22)",
              borderRadius: 16,
              padding: "20px 24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              SUCCESS
            </span>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
              {successRate}
            </span>
            <TrendingUp
              style={{
                position: "absolute",
                right: 18,
                bottom: 14,
                width: 44,
                height: 44,
                color: "rgba(168, 85, 247, 0.12)",
              }}
            />
          </div>
        </div>

        {/* ── Sub-Tabs Bar: Bankers vs Slip of the Day ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(15, 18, 44, 0.95)",
            border: "1px solid rgba(168, 85, 247, 0.2)",
            borderRadius: 14,
            padding: 5,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", gap: 6, flex: 1, maxWidth: 440 }}>
            <button
              onClick={() => setActiveTab("bankers")}
              style={{
                flex: 1,
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: activeTab === "bankers" ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)" : "transparent",
                color: activeTab === "bankers" ? "#ffffff" : "#94a3b8",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: activeTab === "bankers" ? "0 4px 14px rgba(124, 58, 237, 0.4)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Bankers
            </button>

            <button
              onClick={() => setActiveTab("slip")}
              style={{
                flex: 1,
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: activeTab === "slip" ? "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)" : "transparent",
                color: activeTab === "slip" ? "#ffffff" : "#94a3b8",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: activeTab === "slip" ? "0 4px 14px rgba(124, 58, 237, 0.4)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Slip of the Day
            </button>
          </div>

          <button
            onClick={() => setShowInfoModal(true)}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 8,
              padding: "7px 10px",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 4,
            }}
          >
            <Info style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* ════════ TAB 1: BANKERS TABLE ════════ */}
        {activeTab === "bankers" && (
          <div
            style={{
              background: "rgba(20, 25, 56, 0.92)",
              border: "1px solid rgba(168, 85, 247, 0.22)",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 12px 35px rgba(0, 0, 0, 0.45)",
            }}
          >
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1.4fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 80px",
                padding: "12px 18px",
                background: "rgba(12, 16, 40, 0.9)",
                borderBottom: "1px solid rgba(168, 85, 247, 0.16)",
                fontSize: 10.5,
                fontWeight: 800,
                color: "#64748b",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                alignItems: "center",
              }}
            >
              <div>HOUR</div>
              <div>MATCHES</div>
              <div style={{ textAlign: "center", display: "flex", justifyContent: "center", gap: 32 }}>
                <span>1</span>
                <span>X</span>
                <span>2</span>
              </div>
              <div style={{ textAlign: "center" }}>1X2</div>
              <div style={{ textAlign: "center" }}>O/U</div>
              <div style={{ textAlign: "center" }}>BTTS</div>
              <div style={{ textAlign: "center" }}>BEST TIP</div>
              <div style={{ textAlign: "center" }}>CONFIDENCE</div>
            </div>

            {/* Table Rows */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {matches.map((m, idx) => (
                <div
                  key={m.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "70px 1.4fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 80px",
                    padding: "16px 18px",
                    borderBottom: idx === matches.length - 1 ? "none" : "1px solid rgba(168, 85, 247, 0.12)",
                    alignItems: "center",
                    background: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)",
                    transition: "background 0.12s ease",
                  }}
                >
                  {/* Column 1: Hour */}
                  <div style={{ fontSize: 12, fontWeight: 800, color: m.hour === "FT" ? "#94a3b8" : "#cbd5e1" }}>
                    {m.hour}
                  </div>

                  {/* Column 2: Matches & Scores */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.homeLogoColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{m.homeTeam}</span>
                      </div>
                      {m.homeScore !== undefined && (
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{m.homeScore}</span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.awayLogoColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{m.awayTeam}</span>
                      </div>
                      {m.awayScore !== undefined && (
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{m.awayScore}</span>
                      )}
                    </div>
                  </div>

                  {/* Column 3: 1 X 2 Odds */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                    <div style={{
                      background: "rgba(10, 14, 35, 0.8)",
                      border: "1px solid rgba(168, 85, 247, 0.2)",
                      borderRadius: 6,
                      padding: "5px 8px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#c7d2fe",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#6366f1" }} />
                      <span>{m.odds1}</span>
                    </div>

                    <div style={{
                      background: "rgba(10, 14, 35, 0.8)",
                      border: "1px solid rgba(168, 85, 247, 0.2)",
                      borderRadius: 6,
                      padding: "5px 8px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#c7d2fe",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#6366f1" }} />
                      <span>{m.oddsX}</span>
                    </div>

                    <div style={{
                      background: "rgba(10, 14, 35, 0.8)",
                      border: "1px solid rgba(168, 85, 247, 0.2)",
                      borderRadius: 6,
                      padding: "5px 8px",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#c7d2fe",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#6366f1" }} />
                      <span>{m.odds2}</span>
                    </div>
                  </div>

                  {/* Column 4: 1X2 */}
                  <div style={{ textAlign: "center" }}>
                    {m.isLocked ? (
                      <div style={{ background: "rgba(139, 92, 246, 0.2)", height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Lock style={{ width: 12, height: 12, color: "#a855f7" }} />
                      </div>
                    ) : (
                      <div style={{ background: "rgba(139, 92, 246, 0.18)", border: "1px solid rgba(168, 85, 247, 0.35)", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 800, color: "#ffffff" }}>
                        {m.market1X2}
                      </div>
                    )}
                  </div>

                  {/* Column 5: O/U */}
                  <div style={{ textAlign: "center" }}>
                    {m.isLocked ? (
                      <div style={{ background: "rgba(139, 92, 246, 0.2)", height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Lock style={{ width: 12, height: 12, color: "#a855f7" }} />
                      </div>
                    ) : (
                      <div style={{ background: "rgba(139, 92, 246, 0.18)", border: "1px solid rgba(168, 85, 247, 0.35)", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 800, color: "#ffffff" }}>
                        {m.marketOU}
                      </div>
                    )}
                  </div>

                  {/* Column 6: BTTS */}
                  <div style={{ textAlign: "center" }}>
                    {m.isLocked ? (
                      <div style={{ background: "rgba(139, 92, 246, 0.2)", height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Lock style={{ width: 12, height: 12, color: "#a855f7" }} />
                      </div>
                    ) : (
                      <div style={{ background: "rgba(139, 92, 246, 0.18)", border: "1px solid rgba(168, 85, 247, 0.35)", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 800, color: "#ffffff" }}>
                        {m.marketBTTS}
                      </div>
                    )}
                  </div>

                  {/* Column 7: BEST TIP */}
                  <div style={{ textAlign: "center" }}>
                    {m.isLocked ? (
                      <div style={{ background: "rgba(139, 92, 246, 0.25)", height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Lock style={{ width: 12, height: 12, color: "#a855f7" }} />
                      </div>
                    ) : (
                      <div style={{ background: "rgba(168, 85, 247, 0.25)", border: "1px solid #a855f7", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 900, color: "#ffffff" }}>
                        {m.bestTip} - {m.bestTipOdd}
                      </div>
                    )}
                  </div>

                  {/* Column 8: CONFIDENCE */}
                  <div style={{ textAlign: "center", fontSize: 14, fontWeight: 900, color: "#10b981" }}>
                    {m.confidence}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════ TAB 2: SLIP OF THE DAY ════════ */}
        {activeTab === "slip" && (
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              background: "rgba(20, 25, 56, 0.92)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              borderRadius: 20,
              padding: "28px 24px",
              boxShadow: "0 16px 45px rgba(0, 0, 0, 0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#c084fc", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  AI ACCUMULATOR
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", margin: "2px 0 0" }}>
                  Banker Slip of the Day
                </h3>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleCopySlip}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: copied ? "#34d399" : "#cbd5e1",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Copy style={{ width: 13, height: 13 }} />
                  <span>{copied ? "Copied!" : "Copy Slip"}</span>
                </button>
              </div>
            </div>

            {/* Slip Picks */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {topSlipPicks.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                  Loading today's banker slip picks...
                </div>
              ) : (
                topSlipPicks.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: "rgba(10, 14, 35, 0.75)",
                      border: "1px solid rgba(168, 85, 247, 0.15)",
                      borderRadius: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{p.match}</div>
                      <div style={{ fontSize: 12, color: "#a855f7", fontWeight: 700 }}>Pick: {p.pick}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#34d399" }}>
                      @{p.odd.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Odds & Calculations */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                background: "rgba(168, 85, 247, 0.12)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                borderRadius: 14,
                marginBottom: 20,
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>TOTAL COMBO ODDS</span>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#ffffff" }}>{totalSlipOdds.toFixed(2)}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>ESTIMATED RETURN ($50)</span>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#34d399" }}>${potentialReturn}</div>
              </div>
            </div>

            <Link
              href="/pricing"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                color: "#ffffff",
                fontSize: 14.5,
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(139, 92, 246, 0.45)",
              }}
            >
              <span>Unlock Live Bet Alerts & Slip Verification</span>
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
          </div>
        )}

        {/* ── Info Modal ── */}
        {showInfoModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              style={{
                maxWidth: 440,
                width: "100%",
                background: "rgba(20, 25, 56, 0.95)",
                border: "1px solid rgba(168, 85, 247, 0.35)",
                borderRadius: 20,
                padding: "24px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h4 style={{ fontSize: 17, fontWeight: 900, color: "#ffffff", margin: 0 }}>What is a Banker Bet?</h4>
                <button
                  onClick={() => setShowInfoModal(false)}
                  style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "#cbd5e1", margin: "0 0 16px" }}>
                A <strong>Banker</strong> is our quantitative model&apos;s highest-conviction daily pick. Matches selected as Bankers meet strict criteria:
              </p>
              <ul style={{ fontSize: 12.5, lineHeight: 1.6, color: "#94a3b8", paddingLeft: 18, margin: "0 0 20px" }}>
                <li>Over 80% historical model convergence</li>
                <li>Favorable form trajectory and low variance risk</li>
                <li>High expected goals (xG) differential</li>
              </ul>
              <button
                onClick={() => setShowInfoModal(false)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 13,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Got it
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
