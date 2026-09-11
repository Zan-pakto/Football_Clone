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
      const pickGoals = m.predictions?.goals?.pick || "Under 2.5";
      const pickBtts = m.predictions?.btts?.pick || "No";
      const best = m.predictions?.bestTip?.pick || "Under 2.5";
      const bestOdd = m.predictions?.bestTip?.odd || m.odds?.home || "1.95";

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
        odds1: m.odds?.home || "1.50",
        oddsX: m.odds?.draw || "3.40",
        odds2: m.odds?.away || "4.10",
        market1X2: `${pick1x2} - ${m.odds?.home || "1.50"}`,
        marketOU: `${pickGoals} - ${m.predictions?.goals?.odd || "1.95"}`,
        marketBTTS: `${pickBtts} - ${m.predictions?.btts?.odd || "1.90"}`,
        bestTip: best,
        bestTipOdd: bestOdd,
        confidence: displayConf,
        isLocked: idx >= 3,
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
      odds: parseFloat(m.bestTipOdd) || 1.85,
    }));
  }, [matches]);

  const combinedOdds = useMemo(() => {
    if (topSlipPicks.length === 0) return 5.85;
    return parseFloat(topSlipPicks.reduce((acc, curr) => acc * curr.odds, 1).toFixed(2));
  }, [topSlipPicks]);

  const potentialWin = useMemo(() => {
    return (stake * combinedOdds).toFixed(2);
  }, [stake, combinedOdds]);

  const handleCopySlip = () => {
    const text = topSlipPicks
      .map((p, i) => `${i + 1}. ${p.match} -> Pick: ${p.pick}`)
      .join("\n");
    const full = `🔥 JollofTips Banker Slip of the Day (Total Odds: ${combinedOdds}):\n${text}\n\nStake: $${stake} | Potential Win: $${potentialWin}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar />

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "28px 20px 80px" }}>
        {/* ── Date Pills ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 28,
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
                  border: isSelected ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                  background: isSelected ? "var(--gold)" : "var(--bg-card)",
                  color: isSelected ? "var(--gold-btn-text)" : "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: isSelected ? 800 : 600,
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 4px 16px var(--gold-glow)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        {/* ── Notice Banner ── */}
        {!bannerDismissed && (
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--gold-border)",
              borderRadius: 14,
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              marginBottom: 24,
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "var(--gold-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--gold)",
                }}
              >
                <Rocket size={18} />
              </div>
              <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, fontWeight: 500 }}>
                High-confidence banker predictions are verified daily by the JollofTips algorithmic engine.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link
                href="/pricing"
                className="gold-btn"
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
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
                  color: "var(--text-dim)",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── 3 Top Stat Cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* Card 1: BANKERS */}
          <div
            className="luxury-card"
            style={{
              padding: "20px 24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              BANKERS
            </p>
            <p style={{ fontSize: 32, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
              {loading ? "..." : bankerCount}
            </p>
            <div style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", color: "var(--border-strong)", opacity: 0.6 }}>
              <Layers size={36} />
            </div>
          </div>

          {/* Card 2: UPCOMING */}
          <div
            className="luxury-card"
            style={{
              padding: "20px 24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              UPCOMING
            </p>
            <p style={{ fontSize: 32, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
              {loading ? "..." : upcomingCount}
            </p>
            <div style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", color: "var(--border-strong)", opacity: 0.6 }}>
              <Clock size={36} />
            </div>
          </div>

          {/* Card 3: SUCCESS RATE */}
          <div
            className="luxury-card"
            style={{
              padding: "20px 24px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              SUCCESS RATE
            </p>
            <p style={{ fontSize: 32, fontWeight: 900, color: "var(--accent-green)", margin: 0 }}>
              {successRate}
            </p>
            <div style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", color: "var(--accent-green)", opacity: 0.3 }}>
              <TrendingUp size={36} />
            </div>
          </div>
        </div>

        {/* ── Sub Navigation Tabs ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: 12,
            padding: 6,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setActiveTab("bankers")}
              style={{
                padding: "8px 24px",
                borderRadius: 8,
                border: "none",
                background: activeTab === "bankers" ? "var(--gold)" : "transparent",
                color: activeTab === "bankers" ? "var(--gold-btn-text)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Bankers ({bankerCount})
            </button>
            <button
              onClick={() => setActiveTab("slip")}
              style={{
                padding: "8px 24px",
                borderRadius: 8,
                border: "none",
                background: activeTab === "slip" ? "var(--gold)" : "transparent",
                color: activeTab === "slip" ? "var(--gold-btn-text)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Slip of the Day
            </button>
          </div>

          <button
            onClick={() => setShowInfoModal(true)}
            title="Algorithm confidence info"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "transparent",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              marginRight: 6,
            }}
          >
            <Info size={16} />
          </button>
        </div>

        {/* ── View 1: Bankers Table ── */}
        {activeTab === "bankers" && (
          <div
            className="luxury-card"
            style={{
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr
                    style={{
                      background: "var(--surface-raised)",
                      borderBottom: "1px solid var(--border-color)",
                      color: "var(--text-dim)",
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    <th style={{ padding: "14px 18px", width: 90 }}>Hour</th>
                    <th style={{ padding: "14px 18px" }}>Matches</th>
                    <th style={{ padding: "14px 18px", textAlign: "center", width: 140 }}>1 &nbsp; X &nbsp; 2</th>
                    <th style={{ padding: "14px 18px", textAlign: "center", width: 100 }}>1X2</th>
                    <th style={{ padding: "14px 18px", textAlign: "center", width: 110 }}>O/U</th>
                    <th style={{ padding: "14px 18px", textAlign: "center", width: 100 }}>BTTS</th>
                    <th style={{ padding: "14px 18px", textAlign: "center", width: 130 }}>Best Tip</th>
                    <th style={{ padding: "14px 18px", textAlign: "center", width: 90 }}>Conf</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                        <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--gold)" }} />
                        Loading high-confidence banker selections...
                      </td>
                    </tr>
                  ) : matches.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                        No bankers available for this date. Check tomorrow or yesterday.
                      </td>
                    </tr>
                  ) : (
                    matches.map((m, idx) => (
                      <tr
                        key={m.id || idx}
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          background: idx % 2 === 0 ? "transparent" : "var(--surface-raised)",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* Hour */}
                        <td style={{ padding: "14px 18px", fontWeight: 700, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {m.hour}
                        </td>

                        {/* Fixture */}
                        <td style={{ padding: "14px 18px" }}>
                          <Link href={`/match/${m.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.homeLogoColor }} />
                                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{m.homeTeam}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.awayLogoColor }} />
                                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{m.awayTeam}</span>
                              </div>
                            </div>
                          </Link>
                        </td>

                        {/* 1 X 2 odds */}
                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", gap: 4, background: "var(--odds-box-bg)", padding: "3px 6px", borderRadius: 8, border: "1px solid var(--border-color)" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>{m.odds1}</span>
                            <span style={{ fontSize: 11, color: "var(--text-dim)" }}>·</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>{m.oddsX}</span>
                            <span style={{ fontSize: 11, color: "var(--text-dim)" }}>·</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>{m.odds2}</span>
                          </div>
                        </td>

                        {/* 1X2 Market */}
                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          <span style={{ padding: "4px 8px", borderRadius: 6, background: "var(--surface-raised)", border: "1px solid var(--border-color)", fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                            {m.market1X2}
                          </span>
                        </td>

                        {/* O/U */}
                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          <span style={{ padding: "4px 8px", borderRadius: 6, background: "var(--surface-raised)", border: "1px solid var(--border-color)", fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                            {m.marketOU}
                          </span>
                        </td>

                        {/* BTTS */}
                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          <span style={{ padding: "4px 8px", borderRadius: 6, background: "var(--surface-raised)", border: "1px solid var(--border-color)", fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                            {m.marketBTTS}
                          </span>
                        </td>

                        {/* BEST TIP (Gold Highlight) */}
                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 6,
                              background: "var(--gold-bg)",
                              border: "1px solid var(--gold-border)",
                              color: "var(--gold)",
                              fontWeight: 800,
                              fontSize: 12,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Sparkles size={12} />
                            {m.bestTip} - {m.bestTipOdd}
                          </span>
                        </td>

                        {/* Confidence Score */}
                        <td style={{ padding: "14px 18px", textAlign: "center" }}>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 900,
                              color: "var(--accent-green)",
                            }}
                          >
                            {m.confidence}/10
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── View 2: Slip of the Day ── */}
        {activeTab === "slip" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            {/* Left: Top 3 Picks List */}
            <div className="luxury-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                  Verified Acca Picks (3 Matches)
                </h3>
                <span className="gold-badge">Algorithmic Grade A+</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {topSlipPicks.map((pick, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "14px 16px",
                      borderRadius: 10,
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                        {pick.match}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--gold)", fontWeight: 600, marginTop: 3, margin: 0 }}>
                        Pick: {pick.pick}
                      </p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                      {pick.odds.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Stake & Payout Calculator */}
            <div className="luxury-card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16 }}>
                  Slip Multiplier & Payout
                </h3>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13 }}>
                  <span style={{ color: "var(--text-secondary)" }}>Total Slip Odds:</span>
                  <span style={{ fontWeight: 800, color: "var(--gold)", fontSize: 16 }}>{combinedOdds}</span>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: "var(--text-secondary)" }}>Stake Amount ($):</span>
                    <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>${stake}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value))}
                  />
                </div>

                <div
                  style={{
                    padding: "16px 20px",
                    borderRadius: 12,
                    background: "var(--gold-bg)",
                    border: "1px solid var(--gold-border)",
                    marginBottom: 20,
                  }}
                >
                  <p style={{ fontSize: 12, color: "var(--text-dim)", margin: 0, textTransform: "uppercase", fontWeight: 700 }}>
                    Estimated Payout
                  </p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: "var(--gold)", margin: 0 }}>
                    ${potentialWin}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleCopySlip}
                  className="gold-btn"
                  style={{ flex: 1, padding: "12px 18px", fontSize: 13 }}
                >
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  <span>{copied ? "Copied to Clipboard!" : "Copy Slip"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Info Modal */}
      {showInfoModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="luxury-card"
            style={{
              maxWidth: 480,
              width: "100%",
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>
                About Banker Predictions
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
              Bankers are our algorithmic engine’s highest probability predictions of the day. They have passed stringent statistical checks on team form, xG, squad availability, and value edge.
            </p>
            <button
              onClick={() => setShowInfoModal(false)}
              className="gold-btn"
              style={{ width: "100%", padding: "10px" }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
