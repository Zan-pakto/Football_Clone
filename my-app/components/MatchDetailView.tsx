"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Info,
  Star,
  AlertTriangle,
  Flame,
  Award,
  CircleDot,
  Check,
  TrendingUp,
  TrendingDown,
  Shield,
  Layers,
  BarChart2,
  Calendar,
  Clock,
} from "lucide-react";

interface MatchDetailViewProps {
  fixture: any;
}

export default function MatchDetailView({ fixture }: MatchDetailViewProps) {
  const [activeTab, setActiveTab] = useState<
    "tips" | "statistics" | "form" | "h2h" | "recent-matches" | "standings"
  >("tips");
  const [showBestTipExpl, setShowBestTipExpl] = useState(false);
  const [recentFilter, setRecentFilter] = useState<"all" | "home" | "away">("all");
  const [periodFilter, setPeriodFilter] = useState<"ft" | "ht">("ft");

  const matchDetails = fixture.matchDetails || null;

  // Fallback / Normalized Data
  const hero = useMemo(() => {
    if (matchDetails?.hero) return matchDetails.hero;

    const p1x2 = fixture.predictions?.find((p: any) => p.market === "1X2");
    const best = fixture.predictions?.[0];

    return {
      countryFlag: fixture.league?.country?.flag || null,
      country: fixture.league?.country?.name || "International",
      leagueName: fixture.league?.name || "League",
      homeTeam: {
        name: fixture.homeTeam?.name || "Home Team",
        logo: fixture.homeTeam?.logo || null,
        marketValue: "",
      },
      awayTeam: {
        name: fixture.awayTeam?.name || "Away Team",
        logo: fixture.awayTeam?.logo || null,
        marketValue: "",
      },
      date: fixture.matchDate || "",
      time: fixture.kickoffTime || "20:00",
      homeScore: fixture.homeScore !== null && fixture.homeScore !== undefined ? String(fixture.homeScore) : null,
      awayScore: fixture.awayScore !== null && fixture.awayScore !== undefined ? String(fixture.awayScore) : null,
      status: fixture.status === "FINISHED" ? "Finished" : fixture.status === "LIVE" ? "Live" : "Upcoming",
      odds1x2: [
        { label: "1", isTip: best?.selection === "1" || p1x2?.selection === "1", odd: fixture.odds?.home ? String(fixture.odds.home) : "1.85" },
        { label: "X", isTip: best?.selection === "X" || p1x2?.selection === "X", odd: fixture.odds?.draw ? String(fixture.odds.draw) : "3.40" },
        { label: "2", isTip: best?.selection === "2" || p1x2?.selection === "2", odd: fixture.odds?.away ? String(fixture.odds.away) : "3.80" },
      ],
      keyMoments: [],
    };
  }, [matchDetails, fixture]);

  // Tips section
  const tips = useMemo(() => {
    if (matchDetails?.tips && (matchDetails.tips.bestTip || matchDetails.tips.cards?.length > 0)) {
      return matchDetails.tips;
    }

    const best = fixture.predictions?.[0];
    const pickLabel =
      best?.selection === "1"
        ? `${hero.homeTeam.name} to win`
        : best?.selection === "2"
        ? `${hero.awayTeam.name} to win`
        : "Match draw (X)";

    return {
      warning: null,
      bestTip: best
        ? {
            pick: best.selection || "1",
            odd: String(best.odd || 1.85),
            explanation: pickLabel,
            confidence: `${((best.confidence || 75) / 10).toFixed(1)}/10`,
          }
        : undefined,
      cards: [
        {
          title: "1x2 Tip",
          pick: best?.selection || "1",
          odd: String(best?.odd || 1.85),
          confidence: "7.5/10",
          score: null,
        },
        {
          title: "Total Goals",
          pick: "Over 2.5",
          odd: "1.85",
          confidence: "6.8/10",
          score: null,
        },
        {
          title: "Both Teams To Score",
          pick: "Yes",
          odd: "1.75",
          confidence: "6.2/10",
          score: null,
        },
        {
          title: "Bet Builder Tip",
          pick: "1X & Over 1.5",
          odd: "1.55",
          confidence: "7.0/10",
          score: null,
        },
        {
          title: "Half-Time Score",
          pick: null,
          odd: null,
          confidence: null,
          score: { home: "1", away: "0" },
        },
        {
          title: "Correct Score",
          pick: null,
          odd: null,
          confidence: null,
          score: { home: "2", away: "1" },
        },
      ],
    };
  }, [matchDetails, fixture, hero]);

  // Statistics section
  const statistics = useMemo(() => {
    if (matchDetails?.statistics && matchDetails.statistics.length > 0) {
      return matchDetails.statistics;
    }
    return [
      { label: "Total Goals", home: "2.8", away: "2.5", homeLead: true, awayLead: false },
      { label: "Goals Scored", home: "1.8", away: "1.4", homeLead: true, awayLead: false },
      { label: "Goals Against", home: "1.0", away: "1.1", homeLead: false, awayLead: true },
      { label: "Expected Goals (xG)", home: "1.65", away: "1.20", homeLead: true, awayLead: false },
      { label: "Ball Possession %", home: "54%", away: "46%", homeLead: true, awayLead: false },
      { label: "Total Shots", home: "13.2", away: "10.5", homeLead: true, awayLead: false },
    ];
  }, [matchDetails]);

  // Form section
  const form = useMemo(() => {
    if (matchDetails?.form && matchDetails.form.length > 0) {
      return matchDetails.form;
    }
    return [
      { label: "Wins", home: "5", away: "4", homeLead: true, awayLead: false },
      { label: "Over 1.5 Goals", home: "8", away: "7", homeLead: true, awayLead: false },
      { label: "Over 2.5 Goals", home: "6", away: "5", homeLead: true, awayLead: false },
      { label: "Over 3.5 Goals", home: "3", away: "2", homeLead: true, awayLead: false },
      { label: "Both Teams Scored", home: "6", away: "6", homeLead: false, awayLead: false },
      { label: "Clean Sheets", home: "4", away: "3", homeLead: true, awayLead: false },
    ];
  }, [matchDetails]);

  // H2H section
  const h2h = useMemo(() => {
    if (matchDetails?.h2h && (matchDetails.h2h.tally?.homeWins || matchDetails.h2h.matches?.length > 0)) {
      return matchDetails.h2h;
    }
    return {
      tally: { homeWins: "4", draws: "3", awayWins: "3", homeRatio: "40%", drawRatio: "30%", awayRatio: "30%" },
      matches: [],
    };
  }, [matchDetails]);

  // Recent Matches section
  const recentMatches = useMemo(() => {
    if (matchDetails?.recentMatches?.home?.name || matchDetails?.recentMatches?.away?.name) {
      return matchDetails.recentMatches;
    }
    return {
      home: { name: hero.homeTeam.name, crest: hero.homeTeam.logo, form: ["W", "W", "D", "L", "W"], matches: [] },
      away: { name: hero.awayTeam.name, crest: hero.awayTeam.logo, form: ["W", "L", "W", "D", "L"], matches: [] },
    };
  }, [matchDetails, hero]);

  // Standings section
  const standings = useMemo(() => {
    if (matchDetails?.standings && matchDetails.standings.rows?.length > 0) {
      return matchDetails.standings;
    }
    return { leagueName: hero.leagueName, leagueLogo: null, rows: [] };
  }, [matchDetails, hero]);

  // Helper for 10-pip confidence track
  const renderConfidencePips = (confText?: string | null) => {
    if (!confText) return null;
    const num = parseFloat(confText.replace(/\/10/, "").trim()) || 7;
    const activeCount = Math.min(10, Math.max(1, Math.round(num)));

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background:
                  i < activeCount
                    ? "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)"
                    : "rgba(161, 152, 247, 0.15)",
                boxShadow: i < activeCount ? "0 0 6px rgba(167, 139, 250, 0.4)" : "none",
                display: "inline-block",
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#d8b4fe" }}>
          {num.toFixed(1)}
          <small style={{ fontSize: 10, color: "#9ca3af", marginLeft: 2 }}>/10</small>
        </span>
      </div>
    );
  };

  const scrollToSection = (secId: typeof activeTab) => {
    setActiveTab(secId);
    const el = document.getElementById(secId);
    if (el) {
      const topOffset = 80;
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - topOffset,
        behavior: "smooth",
      });
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "16px 16px 80px", color: "#f3f4f6" }}>
      {/* ── 1. Breadcrumbs ── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          color: "#94a3b8",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
        aria-label="Breadcrumb"
      >
        <Link href="/all-matches" style={{ color: "#a198f7", textDecoration: "none" }}>
          Football Predictions
        </Link>
        <span style={{ opacity: 0.4 }}>/</span>
        <Link href="/leagues" style={{ color: "#a198f7", textDecoration: "none" }}>
          Leagues
        </Link>
        <span style={{ opacity: 0.4 }}>/</span>
        <span style={{ color: "#cbd5e1" }}>{hero.leagueName}</span>
        <span style={{ opacity: 0.4 }}>/</span>
        <span style={{ color: "#ffffff", fontWeight: 600 }}>
          {hero.homeTeam.name} vs {hero.awayTeam.name}
        </span>
      </nav>

      {/* ── 2. Hero Match Card ── */}
      <div
        style={{
          background: "linear-gradient(180deg, #161233 0%, #0d0a22 100%)",
          border: "1px solid rgba(161, 152, 247, 0.16)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.4)",
          marginBottom: 24,
        }}
      >
        {/* League Strip Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            borderBottom: "1px solid rgba(161, 152, 247, 0.08)",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <Link
            href="/all-matches"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "rgba(161, 152, 247, 0.08)",
              color: "#a198f7",
              textDecoration: "none",
            }}
          >
            <ChevronLeft size={18} />
          </Link>

          {hero.countryFlag ? (
            <img
              src={hero.countryFlag}
              alt={hero.country}
              width={20}
              height={14}
              style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2 }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#6366f1" }} />
          )}

          <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
            {hero.country ? `${hero.country} - ${hero.leagueName}` : hero.leagueName}
          </span>
        </div>

        {/* 3-Column Match Teams & Score Banner */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            padding: "32px 20px 24px",
            gap: 16,
          }}
        >
          {/* Home Team */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(161, 152, 247, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 6px 18px rgba(0, 0, 0, 0.3)",
              }}
            >
              {hero.homeTeam.logo ? (
                <img
                  src={hero.homeTeam.logo}
                  alt={hero.homeTeam.name}
                  width={60}
                  height={60}
                  style={{ objectFit: "contain", maxWidth: "80%", maxHeight: "80%" }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <span style={{ fontSize: 24, fontWeight: 800, color: "#818cf8" }}>
                  {hero.homeTeam.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
                {hero.homeTeam.name}
              </div>
              {hero.homeTeam.marketValue && (
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                  {hero.homeTeam.marketValue}
                </div>
              )}
            </div>
          </div>

          {/* Match Score / Status Center */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6 }}>
            <div style={{ fontSize: 12, color: "#a198f7", fontWeight: 600 }}>
              <span>{hero.date}</span> {hero.time && <strong style={{ color: "#ffffff", marginLeft: 4 }}>{hero.time}</strong>}
            </div>

            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: 2,
                fontVariantNumeric: "tabular-nums",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {hero.homeScore !== null && hero.awayScore !== null ? (
                <>
                  <span>{hero.homeScore}</span>
                  <span style={{ opacity: 0.4, fontSize: 32 }}>:</span>
                  <span>{hero.awayScore}</span>
                </>
              ) : (
                <span style={{ fontSize: 22, color: "#cbd5e1" }}>VS</span>
              )}
            </div>

            <span
              style={{
                display: "inline-block",
                padding: "3px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                background:
                  hero.status.toLowerCase() === "live"
                    ? "rgba(239, 68, 68, 0.2)"
                    : hero.status.toLowerCase() === "finished"
                    ? "rgba(148, 163, 184, 0.12)"
                    : "rgba(99, 102, 241, 0.16)",
                color:
                  hero.status.toLowerCase() === "live"
                    ? "#f87171"
                    : hero.status.toLowerCase() === "finished"
                    ? "#94a3b8"
                    : "#a5b4fc",
                border:
                  hero.status.toLowerCase() === "live"
                    ? "1px solid rgba(239, 68, 68, 0.3)"
                    : "1px solid rgba(161, 152, 247, 0.15)",
              }}
            >
              {hero.status}
            </span>
          </div>

          {/* Away Team */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(161, 152, 247, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                boxShadow: "0 6px 18px rgba(0, 0, 0, 0.3)",
              }}
            >
              {hero.awayTeam.logo ? (
                <img
                  src={hero.awayTeam.logo}
                  alt={hero.awayTeam.name}
                  width={60}
                  height={60}
                  style={{ objectFit: "contain", maxWidth: "80%", maxHeight: "80%" }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <span style={{ fontSize: 24, fontWeight: 800, color: "#818cf8" }}>
                  {hero.awayTeam.name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
                {hero.awayTeam.name}
              </div>
              {hero.awayTeam.marketValue && (
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                  {hero.awayTeam.marketValue}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 1X2 Odds Strip */}
        {hero.odds1x2 && hero.odds1x2.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              padding: "0 16px 20px",
              maxWidth: 460,
              margin: "0 auto",
            }}
          >
            {hero.odds1x2.map((item: any, idx: number) => {
              const isTip = item.isTip;
              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 14px",
                    borderRadius: 10,
                    background: isTip
                      ? "linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)"
                      : "rgba(255, 255, 255, 0.03)",
                    border: isTip
                      ? "1px solid rgba(167, 139, 250, 0.4)"
                      : "1px solid rgba(161, 152, 247, 0.1)",
                    boxShadow: isTip ? "0 0 12px rgba(124, 58, 237, 0.25)" : "none",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: isTip ? "#c4b5fd" : "#94a3b8" }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: isTip ? "#ffffff" : "#cbd5e1" }}>
                    {item.odd}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Key Moments Timeline */}
        {hero.keyMoments && hero.keyMoments.length > 0 && (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid rgba(161, 152, 247, 0.08)",
              background: "rgba(0, 0, 0, 0.15)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#a198f7", marginBottom: 10 }}>
              Key Moments
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {hero.keyMoments.map((ev: any, idx: number) => {
                if (ev.isStage) {
                  return (
                    <div
                      key={idx}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#94a3b8",
                        padding: "4px 0",
                        borderBottom: "1px dashed rgba(255, 255, 255, 0.06)",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{ev.rawText}</span>
                    </div>
                  );
                }
                const isHome = ev.side === "home";
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: isHome ? "flex-start" : "flex-end",
                      gap: 8,
                      fontSize: 12,
                    }}
                  >
                    {isHome && (
                      <span style={{ fontWeight: 700, color: "#818cf8", minWidth: 32 }}>
                        {ev.minute}
                      </span>
                    )}
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: ev.type === "red" ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        border: ev.type === "red" ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(255, 255, 255, 0.08)",
                        color: ev.type === "red" ? "#fca5a5" : "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {ev.type === "goal" ? "⚽" : ev.type === "red" ? "🟥" : "•"}
                      <span>{ev.player || ev.rawText}</span>
                      {ev.score && (
                        <b style={{ color: "#a78bfa", marginLeft: 4 }}>{ev.score}</b>
                      )}
                    </span>
                    {!isHome && (
                      <span style={{ fontWeight: 700, color: "#818cf8", minWidth: 32, textAlign: "right" }}>
                        {ev.minute}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Sticky Tab Navigation Bar ── */}
      <div
        style={{
          position: "sticky",
          top: 10,
          zIndex: 40,
          background: "rgba(13, 10, 34, 0.85)",
          backdropFilter: "blur(12px)",
          borderRadius: 14,
          border: "1px solid rgba(161, 152, 247, 0.16)",
          padding: 6,
          display: "flex",
          gap: 6,
          overflowX: "auto",
          marginBottom: 28,
        }}
      >
        {[
          { id: "tips", label: "Match Tips" },
          { id: "statistics", label: "Statistics" },
          { id: "form", label: "Form" },
          { id: "h2h", label: "H2H" },
          { id: "recent-matches", label: "Recent Matches" },
          { id: "standings", label: "Standings" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id as any)}
              style={{
                flex: "1 0 auto",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#ffffff" : "#a198f7",
                background: isActive
                  ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                  : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.18s ease",
                whiteSpace: "nowrap",
                boxShadow: isActive ? "0 4px 14px rgba(79, 70, 229, 0.4)" : "none",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── 4. Section #tips (Match Tips) ── */}
      <section id="tips" style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#8b5cf6",
                boxShadow: "0 0 10px #8b5cf6",
              }}
            />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", margin: 0 }}>Match Tips</h2>
          </div>
          <span style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
            Confidence
          </span>
        </div>

        {/* Warning card if available */}
        {tips.warning && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(234, 179, 8, 0.1)",
              border: "1px solid rgba(234, 179, 8, 0.25)",
              color: "#fef08a",
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={18} style={{ color: "#eab308", flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", display: "block" }}>
                Warning
              </span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{tips.warning}</span>
            </div>
          </div>
        )}

        {/* Best Tip Card */}
        {tips.bestTip && (
          <div
            style={{
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(88, 28, 135, 0.4) 0%, rgba(30, 27, 75, 0.6) 100%)",
              border: "1px solid rgba(167, 139, 250, 0.3)",
              padding: 20,
              boxShadow: "0 10px 28px rgba(88, 28, 135, 0.25)",
              marginBottom: 20,
              position: "relative",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: "rgba(167, 139, 250, 0.2)",
                  color: "#e9d5ff",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <Star size={14} fill="#e9d5ff" />
                Best Tip
              </div>

              {tips.bestTip.explanation && (
                <button
                  type="button"
                  onClick={() => setShowBestTipExpl(!showBestTipExpl)}
                  aria-label="What does this mean?"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "none",
                    borderRadius: "50%",
                    width: 26,
                    height: 26,
                    color: "#c4b5fd",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Info size={15} />
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 12 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", letterSpacing: "0.5px" }}>
                {tips.bestTip.pick}
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#a78bfa",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <TrendingUp size={16} />
                {tips.bestTip.odd}
              </span>
            </div>

            {showBestTipExpl && tips.bestTip.explanation && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(0, 0, 0, 0.25)",
                  border: "1px solid rgba(167, 139, 250, 0.2)",
                  fontSize: 13,
                  color: "#e2e8f0",
                  marginBottom: 14,
                }}
              >
                {tips.bestTip.explanation}
              </div>
            )}

            {renderConfidencePips(tips.bestTip.confidence)}
          </div>
        )}

        {/* Prediction Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {tips.cards.map((card: any, idx: number) => {
            const hasScore = card.score !== null && card.score !== undefined;
            return (
              <div
                key={idx}
                style={{
                  background: "rgba(18, 14, 42, 0.6)",
                  border: "1px solid rgba(161, 152, 247, 0.12)",
                  borderRadius: 14,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: "rgba(99, 102, 241, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#818cf8",
                    }}
                  >
                    <Award size={14} />
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{card.title}</span>
                </div>

                {hasScore ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 14,
                      padding: "8px 0",
                    }}
                  >
                    {hero.homeTeam.logo ? (
                      <img
                        src={hero.homeTeam.logo}
                        alt=""
                        width={22}
                        height={22}
                        style={{ objectFit: "contain" }}
                      />
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 800 }}>{hero.homeTeam.name.charAt(0)}</span>
                    )}
                    <span style={{ fontSize: 24, fontWeight: 900, color: "#ffffff" }}>{card.score.home}</span>
                    <span style={{ fontSize: 20, opacity: 0.4 }}>:</span>
                    <span style={{ fontSize: 24, fontWeight: 900, color: "#ffffff" }}>{card.score.away}</span>
                    {hero.awayTeam.logo ? (
                      <img
                        src={hero.awayTeam.logo}
                        alt=""
                        width={22}
                        height={22}
                        style={{ objectFit: "contain" }}
                      />
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 800 }}>{hero.awayTeam.name.charAt(0)}</span>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "#ffffff" }}>
                      {card.pick}
                    </span>
                    {card.odd && (
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#a78bfa" }}>
                        {card.odd}
                      </span>
                    )}
                  </div>
                )}

                {card.confidence && renderConfidencePips(card.confidence)}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5. Section #statistics (Statistics) ── */}
      <section id="statistics" style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", marginBottom: 14 }}>Statistics</h2>

        <div
          style={{
            background: "rgba(18, 14, 42, 0.6)",
            border: "1px solid rgba(161, 152, 247, 0.12)",
            borderRadius: 16,
            padding: "20px 24px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#a198f7",
              marginBottom: 16,
            }}
          >
            Average / Match
          </div>

          {/* Teams Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 14,
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {hero.homeTeam.logo && (
                <img src={hero.homeTeam.logo} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
              )}
              <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>{hero.homeTeam.name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>{hero.awayTeam.name}</span>
              {hero.awayTeam.logo && (
                <img src={hero.awayTeam.logo} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
              )}
            </div>
          </div>

          {/* Metric Comparison Rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {statistics.map((row: any, idx: number) => {
              const hVal = parseFloat(row.home.replace(/%/, "")) || 0;
              const aVal = parseFloat(row.away.replace(/%/, "")) || 0;
              const total = hVal + aVal;
              const hPct = total > 0 ? Math.round((hVal / total) * 100) : 50;

              return (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span
                      style={{
                        fontWeight: row.homeLead ? 800 : 500,
                        color: row.homeLead ? "#c4b5fd" : "#cbd5e1",
                      }}
                    >
                      {row.home}
                    </span>
                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{row.label}</span>
                    <span
                      style={{
                        fontWeight: row.awayLead ? 800 : 500,
                        color: row.awayLead ? "#c4b5fd" : "#cbd5e1",
                      }}
                    >
                      {row.away}
                    </span>
                  </div>

                  {/* Dual comparison bar */}
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: "rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${hPct}%`,
                        background: row.homeLead
                          ? "linear-gradient(90deg, #7c3aed, #a78bfa)"
                          : "rgba(167, 139, 250, 0.35)",
                      }}
                    />
                    <div
                      style={{
                        width: `${100 - hPct}%`,
                        background: row.awayLead
                          ? "linear-gradient(90deg, #a78bfa, #7c3aed)"
                          : "rgba(148, 163, 184, 0.25)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. Section #form (Form) ── */}
      <section id="form" style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", marginBottom: 14 }}>Form</h2>

        <div
          style={{
            background: "rgba(18, 14, 42, 0.6)",
            border: "1px solid rgba(161, 152, 247, 0.12)",
            borderRadius: 16,
            padding: "20px 24px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#a198f7",
              marginBottom: 16,
            }}
          >
            Overview Last 10 Matches
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 14,
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {hero.homeTeam.logo && (
                <img src={hero.homeTeam.logo} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
              )}
              <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>{hero.homeTeam.name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>{hero.awayTeam.name}</span>
              {hero.awayTeam.logo && (
                <img src={hero.awayTeam.logo} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {form.map((row: any, idx: number) => {
              const hVal = parseFloat(row.home) || 0;
              const aVal = parseFloat(row.away) || 0;
              const total = hVal + aVal;
              const hPct = total > 0 ? Math.round((hVal / total) * 100) : 50;

              return (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span
                      style={{
                        fontWeight: row.homeLead ? 800 : 500,
                        color: row.homeLead ? "#c4b5fd" : "#cbd5e1",
                      }}
                    >
                      {row.home}
                    </span>
                    <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{row.label}</span>
                    <span
                      style={{
                        fontWeight: row.awayLead ? 800 : 500,
                        color: row.awayLead ? "#c4b5fd" : "#cbd5e1",
                      }}
                    >
                      {row.away}
                    </span>
                  </div>

                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: "rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${hPct}%`,
                        background: row.homeLead
                          ? "linear-gradient(90deg, #7c3aed, #a78bfa)"
                          : "rgba(167, 139, 250, 0.35)",
                      }}
                    />
                    <div
                      style={{
                        width: `${100 - hPct}%`,
                        background: row.awayLead
                          ? "linear-gradient(90deg, #a78bfa, #7c3aed)"
                          : "rgba(148, 163, 184, 0.25)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 7. Section #h2h (H2H) ── */}
      <section id="h2h" style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", marginBottom: 14 }}>H2H</h2>

        <div
          style={{
            background: "rgba(18, 14, 42, 0.6)",
            border: "1px solid rgba(161, 152, 247, 0.12)",
            borderRadius: 16,
            padding: "20px 24px",
            overflow: "hidden",
          }}
        >
          {/* Tally Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {hero.homeTeam.logo && (
                <img src={hero.homeTeam.logo} alt="" width={28} height={28} style={{ objectFit: "contain" }} />
              )}
              <span style={{ fontSize: 24, fontWeight: 900, color: "#ffffff" }}>
                {h2h.tally.homeWins}
              </span>
            </div>

            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#cbd5e1" }}>
                {h2h.tally.draws}
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8", display: "block", textTransform: "uppercase" }}>
                Draws
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#ffffff" }}>
                {h2h.tally.awayWins}
              </span>
              {hero.awayTeam.logo && (
                <img src={hero.awayTeam.logo} alt="" width={28} height={28} style={{ objectFit: "contain" }} />
              )}
            </div>
          </div>

          {/* Segmented Color Bar */}
          <div
            style={{
              height: 8,
              borderRadius: 4,
              overflow: "hidden",
              display: "flex",
              marginBottom: 24,
            }}
          >
            <span style={{ width: h2h.tally.homeRatio, background: "#6366f1" }} />
            <span style={{ width: h2h.tally.drawRatio, background: "#64748b" }} />
            <span style={{ width: h2h.tally.awayRatio, background: "#a855f7" }} />
          </div>

          {/* Latest Matches List */}
          {h2h.matches && h2h.matches.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#a198f7",
                  marginBottom: 12,
                }}
              >
                Latest Matches
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {h2h.matches.map((m: any, idx: number) => {
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#94a3b8", minWidth: 80 }}>{m.date}</span>

                      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, justifyContent: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: m.team1?.isWin ? "#ffffff" : "#cbd5e1",
                            fontWeight: m.team1?.isWin ? 700 : 500,
                            minWidth: 120,
                            justifyContent: "flex-end",
                          }}
                        >
                          <span style={{ fontSize: 13 }}>{m.team1?.name}</span>
                          {m.team1?.logo && <img src={m.team1.logo} alt="" width={18} height={18} />}
                        </div>

                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "rgba(255, 255, 255, 0.06)",
                            color: "#ffffff",
                          }}
                        >
                          {m.team1?.score} - {m.team2?.score}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: m.team2?.isWin ? "#ffffff" : "#cbd5e1",
                            fontWeight: m.team2?.isWin ? 700 : 500,
                            minWidth: 120,
                          }}
                        >
                          {m.team2?.logo && <img src={m.team2.logo} alt="" width={18} height={18} />}
                          <span style={{ fontSize: 13 }}>{m.team2?.name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 8. Section #recent-matches (Recent Matches) ── */}
      <section id="recent-matches" style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", marginBottom: 14 }}>Recent Matches</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {/* Home Team Column */}
          <div
            style={{
              background: "rgba(18, 14, 42, 0.6)",
              border: "1px solid rgba(161, 152, 247, 0.12)",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {recentMatches.home.crest && (
                  <img src={recentMatches.home.crest} alt="" width={24} height={24} style={{ objectFit: "contain" }} />
                )}
                <span style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>
                  {recentMatches.home.name || hero.homeTeam.name}
                </span>
              </div>

              {/* Form Badges */}
              <div style={{ display: "flex", gap: 4 }}>
                {recentMatches.home.form.map((f: string, idx: number) => {
                  const isW = f === "W";
                  const isD = f === "D";
                  return (
                    <span
                      key={idx}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        fontSize: 10,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isW ? "#10b981" : isD ? "#eab308" : "#ef4444",
                        color: "#ffffff",
                      }}
                    >
                      {f}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Matches list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentMatches.home.matches.map((m: any, idx: number) => {
                const isW = m.badge === "W";
                const isD = m.badge === "D";
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.04)",
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          background: isW ? "#10b981" : isD ? "#eab308" : "#ef4444",
                          color: "#ffffff",
                          fontSize: 10,
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {m.badge || "•"}
                      </span>
                      <span style={{ color: "#94a3b8" }}>{m.date}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#cbd5e1" }}>{m.homeTeam?.name || "Home"}</span>
                      <b style={{ color: "#ffffff" }}>
                        {m.homeScore} - {m.awayScore}
                      </b>
                      <span style={{ color: "#cbd5e1" }}>{m.awayTeam?.name || "Away"}</span>
                    </div>

                    {m.odd1 && (
                      <span style={{ fontSize: 11, color: "#a198f7", fontWeight: 600 }}>
                        {m.odd1} / {m.odd2}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Away Team Column */}
          <div
            style={{
              background: "rgba(18, 14, 42, 0.6)",
              border: "1px solid rgba(161, 152, 247, 0.12)",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {recentMatches.away.crest && (
                  <img src={recentMatches.away.crest} alt="" width={24} height={24} style={{ objectFit: "contain" }} />
                )}
                <span style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>
                  {recentMatches.away.name || hero.awayTeam.name}
                </span>
              </div>

              <div style={{ display: "flex", gap: 4 }}>
                {recentMatches.away.form.map((f: string, idx: number) => {
                  const isW = f === "W";
                  const isD = f === "D";
                  return (
                    <span
                      key={idx}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        fontSize: 10,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isW ? "#10b981" : isD ? "#eab308" : "#ef4444",
                        color: "#ffffff",
                      }}
                    >
                      {f}
                    </span>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentMatches.away.matches.map((m: any, idx: number) => {
                const isW = m.badge === "W";
                const isD = m.badge === "D";
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.04)",
                      fontSize: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          background: isW ? "#10b981" : isD ? "#eab308" : "#ef4444",
                          color: "#ffffff",
                          fontSize: 10,
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {m.badge || "•"}
                      </span>
                      <span style={{ color: "#94a3b8" }}>{m.date}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#cbd5e1" }}>{m.homeTeam?.name || "Home"}</span>
                      <b style={{ color: "#ffffff" }}>
                        {m.homeScore} - {m.awayScore}
                      </b>
                      <span style={{ color: "#cbd5e1" }}>{m.awayTeam?.name || "Away"}</span>
                    </div>

                    {m.odd1 && (
                      <span style={{ fontSize: 11, color: "#a198f7", fontWeight: 600 }}>
                        {m.odd1} / {m.odd2}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Section #standings (Standings Table) ── */}
      {standings.rows && standings.rows.length > 0 && (
        <section id="standings" style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", marginBottom: 14 }}>Standings</h2>

          <div
            style={{
              background: "rgba(18, 14, 42, 0.6)",
              border: "1px solid rgba(161, 152, 247, 0.12)",
              borderRadius: 16,
              padding: "16px 20px",
              overflowX: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              {standings.leagueLogo && (
                <img
                  src={standings.leagueLogo}
                  alt=""
                  width={22}
                  height={22}
                  style={{ borderRadius: 3, objectFit: "contain" }}
                />
              )}
              <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>
                {standings.leagueName || hero.leagueName}
              </span>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr style={{ color: "#94a3b8", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <th style={{ padding: "8px 10px", width: 40 }}>#</th>
                  <th style={{ padding: "8px 10px" }}>Team</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", width: 50 }}>M</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", width: 70 }}>G</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", width: 50 }}>P</th>
                </tr>
              </thead>
              <tbody>
                {standings.rows.map((row: any, idx: number) => {
                  const isMatchTeam =
                    row.isCurrent ||
                    row.teamName.toLowerCase().includes(hero.homeTeam.name.toLowerCase()) ||
                    row.teamName.toLowerCase().includes(hero.awayTeam.name.toLowerCase());

                  return (
                    <tr
                      key={idx}
                      style={{
                        background: isMatchTeam ? "rgba(99, 102, 241, 0.15)" : "transparent",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                      }}
                    >
                      <td style={{ padding: "10px", fontWeight: 700, color: isMatchTeam ? "#ffffff" : "#94a3b8" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {row.zoneClass && (
                            <span
                              style={{
                                width: 3,
                                height: 14,
                                borderRadius: 2,
                                background: row.zoneClass.includes("z1")
                                  ? "#3b82f6"
                                  : row.zoneClass.includes("z2")
                                  ? "#10b981"
                                  : "#ef4444",
                              }}
                            />
                          )}
                          <span>{row.rank}</span>
                        </div>
                      </td>

                      <td style={{ padding: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {row.teamLogo && (
                            <img src={row.teamLogo} alt="" width={20} height={20} style={{ objectFit: "contain" }} />
                          )}
                          <span
                            style={{
                              fontWeight: isMatchTeam ? 700 : 500,
                              color: isMatchTeam ? "#ffffff" : "#cbd5e1",
                            }}
                          >
                            {row.teamName}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: "10px", textAlign: "center", color: "#94a3b8" }}>{row.played}</td>
                      <td style={{ padding: "10px", textAlign: "center", color: "#94a3b8" }}>{row.goals}</td>
                      <td style={{ padding: "10px", textAlign: "center", fontWeight: 700, color: "#ffffff" }}>
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
