"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  ShieldAlert,
  Activity,
  UserCheck,
  Lock,
  Zap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle2,
  Info,
  Play,
  Share2,
} from "lucide-react";

interface MatchDetailViewProps {
  fixture: any;
}

export default function MatchDetailView({ fixture }: MatchDetailViewProps) {
  const [activeNav, setActiveNav] = useState("tips");
  const [statsTab, setStatsTab] = useState<"cmp" | "pred" | "real">("cmp");
  const [previewExpanded, setPreviewExpanded] = useState(false);

  const isLive = fixture.status === "LIVE";
  const isFinished = fixture.status === "FINISHED";

  // Predictions lookup
  const p1x2 = fixture.predictions?.find((p: any) => p.market === "1X2");
  const pGoals = fixture.predictions?.find((p: any) => p.market === "OVER_UNDER");
  const pBtts = fixture.predictions?.find((p: any) => p.market === "BTTS");
  const bestTip = fixture.predictions && fixture.predictions.length > 0
    ? [...fixture.predictions].sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0))[0]
    : p1x2 || null;

  // Best tip explanation
  const bestTipExpl = useMemo(() => {
    if (!bestTip) return "Match tip available";
    if (bestTip.market === "1X2") {
      if (bestTip.selection === "1") return `${fixture.homeTeam.name} to win`;
      if (bestTip.selection === "2") return `${fixture.awayTeam.name} to win`;
      return "Match to end in a draw (X)";
    }
    if (bestTip.market === "OVER_UNDER") {
      return `${bestTip.selection} total goals`;
    }
    if (bestTip.market === "BTTS") {
      return bestTip.selection === "Yes" ? "Both teams to score" : "At least one team clean sheet";
    }
    return bestTip.selection;
  }, [bestTip, fixture]);

  // Derived combo bet builder
  const comboPick = useMemo(() => {
    const double = p1x2?.selection === "1" ? "1X" : p1x2?.selection === "2" ? "X2" : "1X";
    const goalsPick = pGoals?.selection || "Over 1.5";
    return `${double} & ${goalsPick}`;
  }, [p1x2, pGoals]);

  const comboOdd = useMemo(() => {
    const o1 = Number(p1x2?.odd || 1.45);
    const o2 = Number(pGoals?.odd || 1.35);
    return (Math.min(o1, o2) * 1.18).toFixed(2);
  }, [p1x2, pGoals]);

  // Actual vs Predicted Stats
  const rawStats = fixture.stats || {};
  const homeStats = rawStats.home || {};
  const awayStats = rawStats.away || {};

  const actualStats = useMemo(() => ({
    xg: { home: Number(homeStats.xg?.actual || fixture.expectedGoals?.home || 1.45), away: Number(awayStats.xg?.actual || fixture.expectedGoals?.away || 1.15) },
    possession: { home: homeStats.ball_possession ?? 50, away: awayStats.ball_possession ?? 50 },
    shots: { home: homeStats.total_shots ?? 12, away: awayStats.total_shots ?? 10 },
    onTarget: { home: homeStats.shots_on_target ?? 5, away: awayStats.shots_on_target ?? 4 },
    offTarget: { home: homeStats.shots_off_target ?? 7, away: awayStats.shots_off_target ?? 6 },
    corners: { home: homeStats.corner_kicks ?? 5, away: awayStats.corner_kicks ?? 4 },
    yellowCards: { home: homeStats.yellow_cards ?? 2, away: awayStats.yellow_cards ?? 1 },
    fouls: { home: homeStats.fouls ?? 11, away: awayStats.fouls ?? 9 },
  }), [homeStats, awayStats, fixture]);

  const predictedStats = useMemo(() => ({
    xg: { home: Number(fixture.expectedGoals?.home || 1.6), away: Number(fixture.expectedGoals?.away || 1.05) },
    possession: { home: p1x2?.selection === "1" ? 58 : p1x2?.selection === "2" ? 44 : 50, away: p1x2?.selection === "1" ? 42 : p1x2?.selection === "2" ? 56 : 50 },
    shots: { home: p1x2?.selection === "1" ? 15 : 10, away: p1x2?.selection === "2" ? 14 : 9 },
    onTarget: { home: 6, away: 4 },
    offTarget: { home: 7, away: 6 },
    corners: { home: 5, away: 4 },
    yellowCards: { home: 2, away: 2 },
    fouls: { home: 10, away: 11 },
  }), [fixture, p1x2]);

  // Incidents grouping
  const incidents = useMemo(() => {
    return Array.isArray(fixture.incidents) ? fixture.incidents : [];
  }, [fixture.incidents]);

  const h2h = fixture.headToHead || {};
  const h2hTotal = h2h.total_matches || 0;
  const h2hHomePct = h2hTotal > 0 ? Math.round(((h2h.home_wins || 0) / h2hTotal) * 100) : 33;
  const h2hDrawPct = h2hTotal > 0 ? Math.round(((h2h.draws || 0) / h2hTotal) * 100) : 34;
  const h2hAwayPct = Math.max(0, 100 - h2hHomePct - h2hDrawPct);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 16px 80px" }}>
      {/* ── Breadcrumb Navigation ── */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8a85b5", marginBottom: 16 }}>
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Football Predictions</Link>
        <span style={{ opacity: 0.4 }}>/</span>
        <Link href="/leagues" style={{ color: "inherit", textDecoration: "none" }}>Leagues</Link>
        <span style={{ opacity: 0.4 }}>/</span>
        <span style={{ color: "#a79fff" }}>{fixture.league?.name || "League"}</span>
        <span style={{ opacity: 0.4 }}>/</span>
        <span style={{ color: "#ffffff", fontWeight: 700 }}>{fixture.homeTeam.name} vs {fixture.awayTeam.name}</span>
      </nav>

      {/* ── Match Hero Header Card (NerdyTips Style) ── */}
      <div
        style={{
          borderRadius: 20,
          background: "linear-gradient(180deg, #18153f 0%, #120f33 100%)",
          border: "1px solid rgba(167, 159, 255, 0.16)",
          boxShadow: "0 24px 48px -12px rgba(0,0,0,0.65)",
          padding: "24px 20px 28px",
          position: "relative",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {/* Top League Ribbon */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <Link
            href="/all-matches"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#a79fff",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 8,
              background: "rgba(167, 159, 255, 0.08)",
              border: "1px solid rgba(167, 159, 255, 0.15)",
            }}
          >
            <ArrowLeft size={14} /> Back
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {fixture.league?.country?.flag && (
              <img
                src={fixture.league.country.flag}
                alt=""
                style={{ width: 18, height: 13, objectFit: "cover", borderRadius: 2 }}
              />
            )}
            <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", letterSpacing: "0.02em" }}>
              {fixture.league?.country?.name} • {fixture.league?.name}
            </span>
          </div>

          <div style={{ width: 60 }} />
        </div>

        {/* Teams, Crests, Scores & Kickoff Grid */}
        <div
          className="nt-hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 16,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          {/* Home Team */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div
              className="nt-team-crest"
              style={{
                width: 76,
                height: 76,
                borderRadius: 20,
                background: "radial-gradient(circle, #252054 0%, #17133b 100%)",
                border: "1px solid rgba(167, 159, 255, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 12,
                boxShadow: "0 10px 24px rgba(0,0,0,0.4)",
              }}
            >
              {fixture.homeTeam.logo ? (
                <img src={fixture.homeTeam.logo} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              ) : (
                <span style={{ fontSize: 26, fontWeight: 900, color: "#a79fff" }}>{fixture.homeTeam.name.charAt(0)}</span>
              )}
            </div>
            <span className="nt-team-name" style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", lineHeight: 1.2 }}>
              {fixture.homeTeam.name}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#7874a4", background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: 6 }}>
              Win Odd: {fixture.odds?.home ? Number(fixture.odds.home).toFixed(2) : "1.85"}
            </span>
          </div>

          {/* Center Score & Match Status */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#8a85b5" }}>
              {new Date(fixture.kickoffTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })} •{" "}
              {new Date(fixture.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>

            {isLive ? (
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 14px",
                    borderRadius: 999,
                    background: "rgba(255, 93, 120, 0.16)",
                    border: "1px solid rgba(255, 93, 120, 0.4)",
                    color: "#ff5d78",
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff5d78", animation: "ping 1.2s infinite" }} />
                  LIVE {fixture.elapsed || "65'"}
                </div>
                <div className="nt-hero-score" style={{ fontSize: 44, fontWeight: 900, color: "#ffffff", letterSpacing: "3px", fontFamily: "var(--font-mono)" }}>
                  {fixture.homeScore ?? 0} : {fixture.awayScore ?? 0}
                </div>
              </div>
            ) : isFinished ? (
              <div>
                <div className="nt-hero-score" style={{ fontSize: 44, fontWeight: 900, color: "#ffffff", letterSpacing: "3px", fontFamily: "var(--font-mono)" }}>
                  {fixture.homeScore} : {fixture.awayScore}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: "rgba(47, 208, 138, 0.15)",
                    color: "#2fd08a",
                    border: "1px solid rgba(47, 208, 138, 0.3)",
                    textTransform: "uppercase",
                  }}
                >
                  Full Time
                </span>
                {fixture.homeScoreHT !== null && fixture.homeScoreHT !== undefined && (
                  <div style={{ fontSize: 11, color: "#7874a4", marginTop: 4 }}>
                    HT: {fixture.homeScoreHT} - {fixture.awayScoreHT}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="nt-hero-score" style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
                  VS
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "4px 12px",
                    borderRadius: 999,
                    background: "rgba(139, 127, 245, 0.15)",
                    color: "#a79fff",
                    border: "1px solid rgba(139, 127, 245, 0.3)",
                    textTransform: "uppercase",
                  }}
                >
                  Upcoming
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div
              className="nt-team-crest"
              style={{
                width: 76,
                height: 76,
                borderRadius: 20,
                background: "radial-gradient(circle, #252054 0%, #17133b 100%)",
                border: "1px solid rgba(167, 159, 255, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 12,
                boxShadow: "0 10px 24px rgba(0,0,0,0.4)",
              }}
            >
              {fixture.awayTeam.logo ? (
                <img src={fixture.awayTeam.logo} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              ) : (
                <span style={{ fontSize: 26, fontWeight: 900, color: "#a79fff" }}>{fixture.awayTeam.name.charAt(0)}</span>
              )}
            </div>
            <span className="nt-team-name" style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", lineHeight: 1.2 }}>
              {fixture.awayTeam.name}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#7874a4", background: "rgba(255,255,255,0.04)", padding: "3px 8px", borderRadius: 6 }}>
              Win Odd: {fixture.odds?.away ? Number(fixture.odds.away).toFixed(2) : "3.80"}
            </span>
          </div>
        </div>

        {/* 1X2 Odds Selector Row (NerdyTips Style with tip highlight) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
            padding: "12px",
            borderRadius: 14,
            background: "rgba(10, 8, 29, 0.6)",
            border: "1px solid rgba(167, 159, 255, 0.1)",
          }}
        >
          {/* Home Win Odd */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: p1x2?.selection === "1" ? "rgba(139, 127, 245, 0.2)" : "rgba(255,255,255,0.03)",
              border: p1x2?.selection === "1" ? "1px solid #8b7ff5" : "1px solid transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: "#a79fff" }}>1 (Home)</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-mono)" }}>
              {fixture.odds?.home ? Number(fixture.odds.home).toFixed(2) : "1.85"}
            </span>
          </div>

          {/* Draw Odd */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: p1x2?.selection === "X" ? "rgba(139, 127, 245, 0.2)" : "rgba(255,255,255,0.03)",
              border: p1x2?.selection === "X" ? "1px solid #8b7ff5" : "1px solid transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: "#a79fff" }}>X (Draw)</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-mono)" }}>
              {fixture.odds?.draw ? Number(fixture.odds.draw).toFixed(2) : "3.40"}
            </span>
          </div>

          {/* Away Win Odd */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: p1x2?.selection === "2" ? "rgba(139, 127, 245, 0.2)" : "rgba(255,255,255,0.03)",
              border: p1x2?.selection === "2" ? "1px solid #8b7ff5" : "1px solid transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: "#a79fff" }}>2 (Away)</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-mono)" }}>
              {fixture.odds?.away ? Number(fixture.odds.away).toFixed(2) : "4.10"}
            </span>
          </div>
        </div>

        {/* ── Incidents Key Moments (Goals, Cards, VAR) ── */}
        {incidents.length > 0 && (
          <div style={{ marginTop: 20, borderTop: "1px solid rgba(167, 159, 255, 0.1)", paddingTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#a79fff", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, textAlign: "center" }}>
              Key Match Incidents
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
              {incidents.map((inc: any, idx: number) => {
                const isHome = inc.is_home;
                const isGoal = inc.type === "goal";
                const isCard = inc.type === "card" || inc.type === "yellowCard" || inc.type === "redCard";
                const isVar = inc.type === "varDecision";

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isHome ? "flex-start" : "flex-end",
                      gap: 10,
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: "rgba(20, 17, 50, 0.5)",
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#7874a4", fontFamily: "var(--font-mono)" }}>
                      {inc.minute}&apos;{inc.added_time ? `+${inc.added_time}` : ""}
                    </span>

                    {isGoal && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "#2fd08a" }}>
                        ⚽ <span>{inc.player}</span>
                        {inc.assist && <small style={{ color: "#7874a4", fontWeight: 600 }}>(Assist: {inc.assist})</small>}
                        <b style={{ color: "#ffffff", marginLeft: 4 }}>({inc.home_score}-{inc.away_score})</b>
                      </span>
                    )}

                    {isCard && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: inc.card_type === "red" ? "#ff5d78" : "#ffb020" }}>
                        <span>{inc.card_type === "red" ? "🟥" : "🟨"}</span>
                        <span>{inc.player}</span>
                      </span>
                    )}

                    {isVar && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#8b7ff5" }}>
                        <span>[VAR]</span>
                        <span>{inc.player}: {inc.decision || "Review"}</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Sub-navigation Bar ── */}
      <div
        style={{
          position: "sticky",
          top: 64,
          zIndex: 30,
          background: "rgba(10, 8, 29, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(167, 159, 255, 0.12)",
          padding: "8px 0",
          marginBottom: 24,
          display: "flex",
          gap: 8,
          overflowX: "auto",
        }}
      >
        {[
          { id: "tips", label: "Match Tips" },
          { id: "preview", label: "AI Preview" },
          { id: "statistics", label: "Statistics" },
          { id: "lineups", label: "Lineups" },
          { id: "h2h", label: "H2H & Form" },
          { id: "highlights", label: "Highlights" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveNav(tab.id);
              const el = document.getElementById(tab.id);
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 800,
              background: activeNav === tab.id ? "rgba(139, 127, 245, 0.2)" : "transparent",
              color: activeNav === tab.id ? "#ffffff" : "#8a85b5",
              border: activeNav === tab.id ? "1px solid rgba(139, 127, 245, 0.4)" : "1px solid transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 1. Match Tips Section ── */}
      <section id="tips" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={20} color="#8b7ff5" />
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#ffffff" }}>Match Tips</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#a79fff" }}>
            <Sparkles size={13} color="#8b7ff5" /> Live AI Engine: dc-blend-v1
          </div>
        </div>

        {/* NerdyTips Best Tip Showcase Box */}
        {bestTip && (
          <div
            style={{
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(139, 127, 245, 0.2) 0%, rgba(30, 24, 70, 0.5) 100%)",
              border: "1px solid rgba(139, 127, 245, 0.35)",
              padding: "20px 24px",
              marginBottom: 20,
              boxShadow: "0 12px 28px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ffb020", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <Star size={16} fill="#ffb020" /> Best Tip
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#a79fff" }}>Official Confidence</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#ffffff", lineHeight: 1.2 }}>
                  {bestTip.selection}
                </div>
                <div style={{ fontSize: 13, color: "#2fd08a", fontWeight: 700, marginTop: 4 }}>
                  {bestTipExpl} • Odds: {bestTip.odd ? Number(bestTip.odd).toFixed(2) : "1.85"}
                </div>
              </div>

              {/* 10-Point Segmented Confidence Bar */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div style={{ display: "flex", gap: 3 }}>
                  {Array.from({ length: 10 }).map((_, i) => {
                    const score = Math.round((bestTip.confidence || 75) / 10);
                    const isOn = i < score;
                    return (
                      <span
                        key={i}
                        style={{
                          width: 8,
                          height: 18,
                          borderRadius: 2,
                          background: isOn ? "#8b7ff5" : "rgba(167, 159, 255, 0.15)",
                          boxShadow: isOn ? "0 0 8px rgba(139, 127, 245, 0.5)" : "none",
                        }}
                      />
                    );
                  })}
                </div>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#ffffff" }}>
                  {((bestTip.confidence || 75) / 10).toFixed(1)} <small style={{ color: "#7874a4", fontSize: 10 }}>/ 10</small>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Cards 2-Column Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {/* 1X2 Tip Card */}
          <div style={{ background: "#161338", border: "1px solid rgba(167, 159, 255, 0.12)", borderRadius: 14, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#a79fff", textTransform: "uppercase" }}>1X2 Match Winner</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#2fd08a" }}>{p1x2?.confidence || 75}% Trust</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", marginBottom: 4 }}>
              {p1x2?.selection || "1"}
            </div>
            <div style={{ fontSize: 12, color: "#2fd08a", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
              Odd: {p1x2?.odd ? Number(p1x2.odd).toFixed(2) : "1.75"}
            </div>
          </div>

          {/* Total Goals Tip Card */}
          <div style={{ background: "#161338", border: "1px solid rgba(167, 159, 255, 0.12)", borderRadius: 14, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#a79fff", textTransform: "uppercase" }}>Total Goals</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#2fd08a" }}>{pGoals?.confidence || 71}% Trust</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", marginBottom: 4 }}>
              {pGoals?.selection || "Over 2.5"}
            </div>
            <div style={{ fontSize: 12, color: "#2fd08a", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
              Odd: {pGoals?.odd ? Number(pGoals.odd).toFixed(2) : "1.41"}
            </div>
          </div>

          {/* Both Teams To Score (BTTS) */}
          <div style={{ background: "#161338", border: "1px solid rgba(167, 159, 255, 0.12)", borderRadius: 14, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#a79fff", textTransform: "uppercase" }}>Both Teams to Score</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#2fd08a" }}>{pBtts?.confidence || 54}% Trust</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", marginBottom: 4 }}>
              {pBtts?.selection || "Yes"}
            </div>
            <div style={{ fontSize: 12, color: "#2fd08a", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
              Odd: {pBtts?.odd ? Number(pBtts.odd).toFixed(2) : "1.85"}
            </div>
          </div>

          {/* Bet Builder Combo Card */}
          <div style={{ background: "#161338", border: "1px solid rgba(167, 159, 255, 0.12)", borderRadius: 14, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#a79fff", textTransform: "uppercase" }}>Bet Builder Combo</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#2fd08a" }}>High Value</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", marginBottom: 4 }}>
              {comboPick}
            </div>
            <div style={{ fontSize: 12, color: "#2fd08a", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
              Estimated Odd: {comboOdd}
            </div>
          </div>

          {/* Predicted Half-Time Score Card */}
          <div style={{ background: "#161338", border: "1px solid rgba(167, 159, 255, 0.12)", borderRadius: 14, padding: "16px" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#a79fff", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Predicted Half-Time Score
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-mono)" }}>
              <span>{fixture.homeScoreHT !== null && fixture.homeScoreHT !== undefined ? fixture.homeScoreHT : "1"}</span>
              <span style={{ color: "#7874a4" }}>:</span>
              <span>{fixture.awayScoreHT !== null && fixture.awayScoreHT !== undefined ? fixture.awayScoreHT : "0"}</span>
            </div>
          </div>

          {/* Predicted Correct Score Card */}
          <div style={{ background: "#161338", border: "1px solid rgba(167, 159, 255, 0.12)", borderRadius: 14, padding: "16px" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#a79fff", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Predicted Correct Score
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 20, fontWeight: 900, color: "#2fd08a", fontFamily: "var(--font-mono)" }}>
              <span>{fixture.predictedScore ? fixture.predictedScore.replace("-", " : ") : "2 : 0"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. AI Editorial Match Preview Section ── */}
      <section id="preview" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Activity size={20} color="#8b7ff5" />
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#ffffff" }}>
            AI Editorial Match Preview & Analysis
          </h2>
        </div>

        <div
          style={{
            borderRadius: 18,
            background: "linear-gradient(180deg, #18153f 0%, #120f33 100%)",
            border: "1px solid rgba(167, 159, 255, 0.14)",
            padding: "24px 28px",
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", marginBottom: 14 }}>
            {fixture.homeTeam.name} vs {fixture.awayTeam.name} Prediction & Betting Analysis
          </h3>

          <p style={{ fontSize: 13, lineHeight: 1.7, color: "#c6c2e8", marginBottom: 14 }}>
            This fixture features <b>{fixture.homeTeam.name}</b> hosting <b>{fixture.awayTeam.name}</b> in the{" "}
            <b>{fixture.league?.name || "League"}</b> on{" "}
            {new Date(fixture.kickoffTime).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.
            Our predictive AI blend (model version <code>dc-blend-v1</code>) has processed historical head-to-head metrics, team form, and tactical formations.
          </p>

          <div
            style={{
              padding: "16px 20px",
              borderRadius: 12,
              background: "rgba(10, 8, 29, 0.7)",
              border: "1px solid rgba(167, 159, 255, 0.12)",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: "#ffb020", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Key AI Takeaways & Best Bets
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#ffffff", lineHeight: 1.8 }}>
              <li><b>Best Selection:</b> {bestTipExpl} (Odds: {bestTip?.odd ? Number(bestTip.odd).toFixed(2) : "1.85"})</li>
              <li><b>Expected Goals (xG):</b> {fixture.homeTeam.name} ({actualStats.xg.home.toFixed(2)}) vs {fixture.awayTeam.name} ({actualStats.xg.away.toFixed(2)})</li>
              <li><b>Predicted Final Score:</b> {fixture.predictedScore || "2-0"}</li>
              <li><b>Goals Market:</b> {pGoals?.selection || "Over 2.5"} goals recommended</li>
            </ul>
          </div>

          {previewExpanded && (
            <div style={{ fontSize: 13, lineHeight: 1.7, color: "#c6c2e8", marginTop: 14 }}>
              <p>
                <b>Tactical Outlook:</b> With projected ball possession leaning towards the favourites, the match is anticipated to see high-tempo flank progression and calculated set-piece routines. In past meetings, both sides have generated an average of{" "}
                <b>{h2h.avg_total_goals ? h2h.avg_total_goals.toFixed(1) : "2.6"} goals per encounter</b>.
              </p>
              <p>
                <b>Discipline & Cards:</b> Referees in this competition typically maintain close control. Expect under 4.5 total yellow cards and moderate foul counts across 90 minutes.
              </p>
            </div>
          )}

          <button
            onClick={() => setPreviewExpanded(!previewExpanded)}
            style={{
              marginTop: 12,
              background: "transparent",
              border: "none",
              color: "#8b7ff5",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: 0,
            }}
          >
            {previewExpanded ? <>Read Less <ChevronUp size={14} /></> : <>Read Full Match Breakdown <ChevronDown size={14} /></>}
          </button>
        </div>
      </section>

      {/* ── 3. Stats: Predicted vs Actual Comparison Section ── */}
      <section id="statistics" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={20} color="#8b7ff5" />
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#ffffff" }}>
              Stats: Predicted vs Actual
            </h2>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", background: "rgba(10, 8, 29, 0.7)", borderRadius: 10, padding: 3, border: "1px solid rgba(167, 159, 255, 0.15)" }}>
            {(["cmp", "pred", "real"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setStatsTab(t)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  background: statsTab === t ? "#8b7ff5" : "transparent",
                  color: statsTab === t ? "#ffffff" : "#8a85b5",
                  transition: "all 0.2s",
                }}
              >
                {t === "cmp" ? "Comparison" : t === "pred" ? "Predicted" : "Actual"}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            background: "#161338",
            border: "1px solid rgba(167, 159, 255, 0.12)",
            padding: "20px 24px",
          }}
        >
          {/* Teams Header in Stats */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid rgba(167, 159, 255, 0.1)" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{fixture.homeTeam.name}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#7874a4", textTransform: "uppercase" }}>Metrics</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{fixture.awayTeam.name}</span>
          </div>

          {/* Metric Rows */}
          {[
            { label: "Expected Goals (xG)", hAct: actualStats.xg.home.toFixed(2), aAct: actualStats.xg.away.toFixed(2), hPred: predictedStats.xg.home.toFixed(2), aPred: predictedStats.xg.away.toFixed(2), hRatio: 55, aRatio: 45 },
            { label: "Ball Possession", hAct: `${actualStats.possession.home}%`, aAct: `${actualStats.possession.away}%`, hPred: `${predictedStats.possession.home}%`, aPred: `${predictedStats.possession.away}%`, hRatio: Number(actualStats.possession.home), aRatio: Number(actualStats.possession.away) },
            { label: "Total Shots", hAct: actualStats.shots.home, aAct: actualStats.shots.away, hPred: predictedStats.shots.home, aPred: predictedStats.shots.away, hRatio: 52, aRatio: 48 },
            { label: "Shots on Target", hAct: actualStats.onTarget.home, aAct: actualStats.onTarget.away, hPred: predictedStats.onTarget.home, aPred: predictedStats.onTarget.away, hRatio: 55, aRatio: 45 },
            { label: "Shots Off Target", hAct: actualStats.offTarget.home, aAct: actualStats.offTarget.away, hPred: predictedStats.offTarget.home, aPred: predictedStats.offTarget.away, hRatio: 50, aRatio: 50 },
            { label: "Corners", hAct: actualStats.corners.home, aAct: actualStats.corners.away, hPred: predictedStats.corners.home, aPred: predictedStats.corners.away, hRatio: 46, aRatio: 54 },
            { label: "Yellow Cards", hAct: actualStats.yellowCards.home, aAct: actualStats.yellowCards.away, hPred: predictedStats.yellowCards.home, aPred: predictedStats.yellowCards.away, hRatio: 50, aRatio: 50 },
            { label: "Fouls", hAct: actualStats.fouls.home, aAct: actualStats.fouls.away, hPred: predictedStats.fouls.home, aPred: predictedStats.fouls.away, hRatio: 48, aRatio: 52 },
          ].map((row, idx) => (
            <div key={idx} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 4 }}>
                <div style={{ fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-mono)" }}>
                  {statsTab === "pred" ? row.hPred : row.hAct}
                  {statsTab === "cmp" && <small style={{ color: "#7874a4", marginLeft: 4 }}>({row.hPred})</small>}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#a79fff" }}>{row.label}</div>
                <div style={{ fontWeight: 800, color: "#ffffff", fontFamily: "var(--font-mono)" }}>
                  {statsTab === "cmp" && <small style={{ color: "#7874a4", marginRight: 4 }}>({row.aPred})</small>}
                  {statsTab === "pred" ? row.aPred : row.aAct}
                </div>
              </div>

              {/* Dual-Sided Bar */}
              <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
                <div style={{ width: `${row.hRatio}%`, background: "#8b7ff5", transition: "width 0.4s" }} />
                <div style={{ width: `${row.aRatio}%`, background: "#ff5d78", transition: "width 0.4s" }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Tactical Lineups & Formations Section ── */}
      <section id="lineups" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserCheck size={20} color="#2fd08a" />
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#ffffff" }}>
              Starting Lineups & Formations
            </h2>
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 6,
              background: fixture.lineupStatus === "confirmed" ? "rgba(47, 208, 138, 0.15)" : "rgba(139, 127, 245, 0.15)",
              color: fixture.lineupStatus === "confirmed" ? "#2fd08a" : "#a79fff",
              border: fixture.lineupStatus === "confirmed" ? "1px solid rgba(47, 208, 138, 0.3)" : "1px solid rgba(139, 127, 245, 0.3)",
              textTransform: "uppercase",
            }}
          >
            {fixture.lineupStatus === "confirmed" ? "Confirmed Official Starting XI" : "AI-Predicted Starting Lineup"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {/* Home Team Lineup */}
          <div style={{ background: "#161338", border: "1px solid rgba(167, 159, 255, 0.12)", borderRadius: 16, padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid rgba(167, 159, 255, 0.1)" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>{fixture.homeTeam.name}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#8b7ff5", fontFamily: "var(--font-mono)" }}>
                {fixture.lineups?.home?.formation || "4-3-3"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(fixture.lineups?.home?.startingXl || []).length > 0 ? (
                fixture.lineups.home.startingXl.map((p: any, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ffffff" }}>
                      <span style={{ color: "#7874a4", fontFamily: "var(--font-mono)", width: 20 }}>#{p.number}</span>
                      <span>{p.name}</span>
                    </div>
                    <span style={{ color: "#a79fff", fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(167, 159, 255, 0.08)" }}>
                      {p.position || "M"}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: "#7874a4" }}>Roster will be published prior to kickoff</div>
              )}
            </div>
          </div>

          {/* Away Team Lineup */}
          <div style={{ background: "#161338", border: "1px solid rgba(167, 159, 255, 0.12)", borderRadius: 16, padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid rgba(167, 159, 255, 0.1)" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>{fixture.awayTeam.name}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#ff5d78", fontFamily: "var(--font-mono)" }}>
                {fixture.lineups?.away?.formation || "4-3-3"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(fixture.lineups?.away?.startingXl || []).length > 0 ? (
                fixture.lineups.away.startingXl.map((p: any, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#ffffff" }}>
                      <span style={{ color: "#7874a4", fontFamily: "var(--font-mono)", width: 20 }}>#{p.number}</span>
                      <span>{p.name}</span>
                    </div>
                    <span style={{ color: "#ff5d78", fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(255, 93, 120, 0.08)" }}>
                      {p.position || "M"}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: "#7874a4" }}>Roster will be published prior to kickoff</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Head-to-Head & Form Section ── */}
      <section id="h2h" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <TrendingUp size={20} color="#8b7ff5" />
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#ffffff" }}>
            Head-to-Head History & Record
          </h2>
        </div>

        <div style={{ background: "#161338", border: "1px solid rgba(167, 159, 255, 0.12)", borderRadius: 18, padding: "20px 24px" }}>
          {/* Tally Numbers */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "center", marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#2fd08a", display: "block" }}>{h2h.home_wins || 0}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#7874a4" }}>{fixture.homeTeam.name} Wins</span>
            </div>
            <div>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#a79fff", display: "block" }}>{h2h.draws || 0}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#7874a4" }}>Draws</span>
            </div>
            <div>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#ff5d78", display: "block" }}>{h2h.away_wins || 0}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#7874a4" }}>{fixture.awayTeam.name} Wins</span>
            </div>
          </div>

          {/* Tally Ratio Bar */}
          <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 20 }}>
            <div style={{ width: `${h2hHomePct}%`, background: "#2fd08a" }} />
            <div style={{ width: `${h2hDrawPct}%`, background: "#a79fff" }} />
            <div style={{ width: `${h2hAwayPct}%`, background: "#ff5d78" }} />
          </div>

          {/* Past Encounters */}
          {Array.isArray(h2h.recent_matches) && h2h.recent_matches.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#a79fff", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                Recent Head-to-Head Encounters
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {h2h.recent_matches.slice(0, 5).map((m: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "rgba(10, 8, 29, 0.5)",
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: "#7874a4", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                      {m.date ? new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Past Match"}
                    </span>
                    <div style={{ fontWeight: 800, color: "#ffffff" }}>
                      {m.home} <b style={{ color: "#2fd08a", margin: "0 6px" }}>{m.score}</b> {m.away}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 6. Highlights Video Clips Section ── */}
      {fixture.highlights && fixture.highlights.length > 0 && (
        <section id="highlights" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Play size={20} color="#ffb020" />
            <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#ffffff" }}>
              Official Match Goal Clips & Highlights
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {fixture.highlights.map((h: any, i: number) => (
              <a
                key={i}
                href={h.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "#161338",
                  border: "1px solid rgba(167, 159, 255, 0.12)",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "transform 0.2s",
                }}
              >
                {h.thumbnail && (
                  <div style={{ width: "100%", height: 140, background: "#0a081d", position: "relative" }}>
                    <img src={h.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid rgba(255,255,255,0.4)",
                      }}
                    >
                      <Play size={18} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                    </div>
                  </div>
                )}
                <div style={{ padding: "14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#ffffff", marginBottom: 6 }}>
                    {h.title}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#8b7ff5" }}>
                    Watch on YouTube →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Responsive Styling ── */}
      <style>{`
        @media (max-width: 600px) {
          .nt-hero-grid {
            gap: 6px !important;
          }
          .nt-team-crest {
            width: 52px !important;
            height: 52px !important;
            border-radius: 14px !important;
            padding: 8px !important;
          }
          .nt-team-name {
            font-size: 13.5px !important;
            max-width: 105px !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }
          .nt-hero-score {
            font-size: 32px !important;
            letter-spacing: 1px !important;
          }
        }
      `}</style>
    </div>
  );
}
