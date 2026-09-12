"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Radio,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Cpu,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  Flame,
  ChevronRight,
  Activity,
  Plus,
  ChevronDown,
} from "lucide-react";

interface HeroLandingProps {
  totalMatches?: number;
}

type MarketTab = "1x2" | "goals" | "btts" | "scores";

interface MatchSimulation {
  id: string;
  tabTitle: string;
  tabIcon: "banker" | "live" | "value" | "monte";
  badge: string;
  league: string;
  country: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore?: number;
  awayScore?: number;
  isLive?: boolean;
  liveMin?: string;
  homeXg: number;
  awayXg: number;
  possession: { h: number; a: number };
  fieldTilt: { h: number; a: number };
  prob1: number;
  probX: number;
  prob2: number;
  goalsOver25: number;
  goalsUnder25: number;
  bttsYes: number;
  bttsNo: number;
  topCorrectScores: { score: string; prob: number; odd: string }[];
  bookieOdds: { h: string; d: string; a: string; o25: string; u25: string; bttsYes: string };
  fairOdds: { h: string; d: string; a: string };
  bestTip: string;
  bestTipMarket: string;
  bestTipOdds: string;
  evEdge: string;
  confidenceScore: number;
  simulationsCount: string;
  keyMetric: string;
}

const SIMULATIONS_DATA: MatchSimulation[] = [
  {
    id: "banker_ucl",
    tabTitle: "Banker of the Day",
    tabIcon: "banker",
    badge: "94.2% ALGORITHMIC CERTAINTY",
    league: "UEFA Champions League",
    country: "Europe",
    time: "Tonight • 20:00",
    homeTeam: "Real Madrid",
    awayTeam: "Inter Milan",
    homeLogo: "https://cdn.nerdytips.com/public/img/logos/541.webp?width=48",
    awayLogo: "https://cdn.nerdytips.com/public/img/logos/505.webp?width=48",
    homeXg: 2.54,
    awayXg: 0.98,
    possession: { h: 62, a: 38 },
    fieldTilt: { h: 71, a: 29 },
    prob1: 64,
    probX: 21,
    prob2: 15,
    goalsOver25: 68,
    goalsUnder25: 32,
    bttsYes: 59,
    bttsNo: 41,
    topCorrectScores: [
      { score: "2 - 1", prob: 14.2, odd: "8.50" },
      { score: "2 - 0", prob: 12.8, odd: "9.00" },
      { score: "3 - 1", prob: 10.5, odd: "14.00" },
    ],
    bookieOdds: { h: "1.75", d: "3.85", a: "4.80", o25: "1.68", u25: "2.15", bttsYes: "1.72" },
    fairOdds: { h: "1.56", d: "4.76", a: "6.66" },
    bestTip: "Real Madrid Win & Over 1.5 Goals",
    bestTipMarket: "1X2 + TOTAL GOALS",
    bestTipOdds: "1.92",
    evEdge: "+16.4% Value Edge",
    confidenceScore: 9.4,
    simulationsCount: "100,000",
    keyMetric: "Home xG dominance 2.54 vs 0.98 • 71% Field Tilt",
  },
  {
    id: "live_radar_epl",
    tabTitle: "In-Play Live Radar",
    tabIcon: "live",
    badge: "LIVE '68 TELEMETRY",
    league: "English Premier League",
    country: "England",
    time: "LIVE IN-PLAY",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    homeLogo: "https://cdn.nerdytips.com/public/img/logos/42.webp?width=48",
    awayLogo: "https://cdn.nerdytips.com/public/img/logos/49.webp?width=48",
    homeScore: 1,
    awayScore: 0,
    isLive: true,
    liveMin: "68'",
    homeXg: 2.18,
    awayXg: 0.65,
    possession: { h: 58, a: 42 },
    fieldTilt: { h: 66, a: 34 },
    prob1: 78,
    probX: 16,
    prob2: 6,
    goalsOver25: 42,
    goalsUnder25: 58,
    bttsYes: 28,
    bttsNo: 72,
    topCorrectScores: [
      { score: "2 - 0", prob: 38.5, odd: "2.20" },
      { score: "1 - 0", prob: 31.0, odd: "2.80" },
      { score: "2 - 1", prob: 12.5, odd: "6.50" },
    ],
    bookieOdds: { h: "1.25", d: "5.50", a: "13.00", o25: "2.10", u25: "1.72", bttsYes: "2.40" },
    fairOdds: { h: "1.18", d: "6.25", a: "16.6" },
    bestTip: "Arsenal Win & Under 3.5 Total",
    bestTipMarket: "LIVE IN-PLAY COMBINATION",
    bestTipOdds: "1.65",
    evEdge: "+19.8% Live Value",
    confidenceScore: 9.1,
    simulationsCount: "100,000",
    keyMetric: "Arsenal 7 shots inside box in 2nd half • 0.65 away xG allowed",
  },
  {
    id: "poisson_value_seriea",
    tabTitle: "Poisson +EV Edge",
    tabIcon: "value",
    badge: "+22.4% EXPECTED VALUE",
    league: "Italian Serie A",
    country: "Italy",
    time: "Tomorrow • 19:45",
    homeTeam: "Napoli",
    awayTeam: "AS Roma",
    homeLogo: "https://cdn.nerdytips.com/public/img/logos/492.webp?width=48",
    awayLogo: "https://cdn.nerdytips.com/public/img/logos/497.webp?width=48",
    homeXg: 1.88,
    awayXg: 1.45,
    possession: { h: 54, a: 46 },
    fieldTilt: { h: 56, a: 44 },
    prob1: 46,
    probX: 27,
    prob2: 27,
    goalsOver25: 64,
    goalsUnder25: 36,
    bttsYes: 66,
    bttsNo: 34,
    topCorrectScores: [
      { score: "2 - 1", prob: 13.5, odd: "9.00" },
      { score: "1 - 1", prob: 12.8, odd: "7.00" },
      { score: "2 - 2", prob: 9.2, odd: "15.00" },
    ],
    bookieOdds: { h: "2.10", d: "3.40", a: "3.60", o25: "1.82", u25: "2.02", bttsYes: "1.85" },
    fairOdds: { h: "2.17", d: "3.70", a: "3.70" },
    bestTip: "Both Teams To Score (BTTS Yes)",
    bestTipMarket: "BTTS VALUE EDGE",
    bestTipOdds: "1.85",
    evEdge: "+22.4% EV Discrepancy",
    confidenceScore: 8.8,
    simulationsCount: "100,000",
    keyMetric: "Bookie priced BTTS at 54% • Poisson model calculates 66%",
  },
  {
    id: "monte_carlo_acca",
    tabTitle: "Monte Carlo Acca",
    tabIcon: "monte",
    badge: "91.8% COMPOUNDED PROBABILITY",
    league: "Multi-League Mega Acca",
    country: "Global",
    time: "Weekend Special",
    homeTeam: "Bayern Munich",
    awayTeam: "Dortmund",
    homeLogo: "https://cdn.nerdytips.com/public/img/logos/157.webp?width=48",
    awayLogo: "https://cdn.nerdytips.com/public/img/logos/165.webp?width=48",
    homeXg: 2.82,
    awayXg: 1.34,
    possession: { h: 64, a: 36 },
    fieldTilt: { h: 69, a: 31 },
    prob1: 67,
    probX: 19,
    prob2: 14,
    goalsOver25: 75,
    goalsUnder25: 25,
    bttsYes: 62,
    bttsNo: 38,
    topCorrectScores: [
      { score: "3 - 1", prob: 15.1, odd: "11.00" },
      { score: "2 - 1", prob: 13.4, odd: "9.50" },
      { score: "3 - 2", prob: 8.8, odd: "19.00" },
    ],
    bookieOdds: { h: "1.52", d: "4.80", a: "5.80", o25: "1.45", u25: "2.75", bttsYes: "1.58" },
    fairOdds: { h: "1.49", d: "5.26", a: "7.14" },
    bestTip: "Over 2.5 Total Match Goals",
    bestTipMarket: "GOALS TOTAL",
    bestTipOdds: "1.45",
    evEdge: "+14.8% Edge",
    confidenceScore: 9.3,
    simulationsCount: "100,000",
    keyMetric: "Combined xG 4.16 • Der Klassiker historical 84% Over 2.5 rate",
  },
];

const MARQUEE_VERIFIED_WINS = [
  { match: "Sevilla vs Valencia", pick: "1X", logoH: "https://cdn.nerdytips.com/public/img/logos/536.webp?width=48", logoA: "https://cdn.nerdytips.com/public/img/logos/532.webp?width=48" },
  { match: "Venezia vs Fiorentina", pick: "Over 1.5", logoH: "https://cdn.nerdytips.com/public/img/logos/517.webp?width=48", logoA: "https://cdn.nerdytips.com/public/img/logos/502.webp?width=48" },
  { match: "Union Berlin vs Schalke", pick: "Over 2.5", logoH: "https://cdn.nerdytips.com/public/img/logos/182.webp?width=48", logoA: "https://cdn.nerdytips.com/public/img/logos/174.webp?width=48" },
  { match: "Cagliari vs Lecce", pick: "1X", logoH: "https://cdn.nerdytips.com/public/img/logos/490.webp?width=48", logoA: "https://cdn.nerdytips.com/public/img/logos/867.webp?width=48" },
  { match: "Juventus vs AC Milan", pick: "1X", logoH: "https://cdn.nerdytips.com/public/img/logos/496.webp?width=48", logoA: "https://cdn.nerdytips.com/public/img/logos/489.webp?width=48" },
  { match: "Arsenal vs Chelsea", pick: "Under 3.5", logoH: "https://cdn.nerdytips.com/public/img/logos/42.webp?width=48", logoA: "https://cdn.nerdytips.com/public/img/logos/49.webp?width=48" },
  { match: "Frankfurt vs Augsburg", pick: "Over 2.5", logoH: "https://cdn.nerdytips.com/public/img/logos/169.webp?width=48", logoA: "https://cdn.nerdytips.com/public/img/logos/170.webp?width=48" },
  { match: "Real Madrid vs Inter", pick: "1X & O1.5", logoH: "https://cdn.nerdytips.com/public/img/logos/541.webp?width=48", logoA: "https://cdn.nerdytips.com/public/img/logos/505.webp?width=48" },
  { match: "Bayern vs Dortmund", pick: "Over 2.5", logoH: "https://cdn.nerdytips.com/public/img/logos/157.webp?width=48", logoA: "https://cdn.nerdytips.com/public/img/logos/165.webp?width=48" },
  { match: "Swansea vs Burnley", pick: "Under 3.5", logoH: "https://cdn.nerdytips.com/public/img/logos/76.webp?width=48", logoA: "https://cdn.nerdytips.com/public/img/logos/44.webp?width=48" },
];

export default function HeroLanding({ totalMatches = 198 }: HeroLandingProps) {
  const [selectedId, setSelectedId] = useState<string>("banker_ucl");
  const [activeMarket, setActiveMarket] = useState<MarketTab>("1x2");
  const [isSimulating, setIsSimulating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addedToSlip, setAddedToSlip] = useState(false);

  const activeSim = useMemo(() => {
    return SIMULATIONS_DATA.find((s) => s.id === selectedId) || SIMULATIONS_DATA[0];
  }, [selectedId]);

  const handleReSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 600);
  };

  const handleCopyTip = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(
        `${activeSim.homeTeam} vs ${activeSim.awayTeam} | Best Pick: ${activeSim.bestTip} @ ${activeSim.bestTipOdds} | Trust: ${activeSim.confidenceScore}/10`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddToSlip = () => {
    setAddedToSlip(true);
    setTimeout(() => setAddedToSlip(false), 2500);
  };

  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden", background: "#0a081d" }}>
      {/* ══════════════════════════════════════════════════════════════
          1. ICONIC NERDYTIPS GRAND HERO SECTION WITH STADIUM BACKDROP
          ══════════════════════════════════════════════════════════════ */}
      <section
        style={{
          position: "relative",
          width: "100%",
          minHeight: "78vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 16px 50px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Backlit Stadium & Footballer Silhouette Art */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('https://cdn.nerdytips.com/public/img/st/header-bg-st.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            zIndex: 0,
            opacity: 0.88,
          }}
        />

        {/* Ambient Halo Glow & Depth Veils */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(closest-side at 50% 36%, rgba(124, 108, 245, 0.28) 0%, rgba(47, 208, 138, 0.07) 45%, transparent 75%)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(10, 8, 29, 0.25) 0%, rgba(10, 8, 29, 0.7) 60%, #0a081d 100%)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* Hero Content Layer */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: 880,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >

          {/* Master Headline (Exact NerdyTips Visual Formula) */}
          <h1
            style={{
              fontSize: "clamp(2.7rem, 5.5vw, 4.6rem)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: "#ffffff",
              margin: 0,
            }}
          >
            AI <span className="gradient-text">Football</span> Predictions
          </h1>

          {/* Authentic NerdyTips Lede Subtitle */}
          <p
            style={{
              fontSize: "clamp(15px, 1.8vw, 17px)",
              lineHeight: 1.65,
              color: "#d4cde3",
              maxWidth: 620,
              margin: 0,
            }}
          >
            JollofTips offers AI football predictions from its own quantitative model. Since 2021, it has simulated over <strong style={{ color: "#ffffff" }}>274,510</strong> matches across <strong style={{ color: "#ffffff" }}>711</strong> leagues. Every day, top predictions are free — no account needed.
          </p>

          {/* Action Buttons Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 14,
              marginTop: 10,
              width: "100%",
            }}
          >
            <a
              href="#matches-feed"
              className="btn-primary"
              style={{ minWidth: 200 }}
            >
              <span>See Free Predictions</span>
              <ChevronDown size={17} />
            </a>

            <Link
              href="/all-matches"
              className="btn-ghost"
              style={{ minWidth: 150 }}
            >
              <span>All Matches</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          2. INFINITE LIVE MARQUEE TICKER (VERIFIED WON TIPS)
          ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          width: "100%",
          position: "relative",
          zIndex: 10,
          background: "rgba(8, 7, 30, 0.92)",
          borderTop: "1px solid rgba(167, 159, 255, 0.12)",
          borderBottom: "1px solid rgba(167, 159, 255, 0.12)",
          padding: "10px 0",
          overflow: "hidden",
          maskImage: "linear-gradient(90deg, transparent 0%, #000 5%, #000 95%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 5%, #000 95%, transparent 100%)",
        }}
      >
        <div className="marquee-track">
          {[...MARQUEE_VERIFIED_WINS, ...MARQUEE_VERIFIED_WINS].map((win, idx) => (
            <div
              key={idx}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "0 22px",
                fontSize: 13,
                color: "#d4cde3",
                whiteSpace: "nowrap",
                borderRight: "1px solid rgba(167, 159, 255, 0.08)",
              }}
            >
              {win.logoH && (
                <img
                  src={win.logoH}
                  alt=""
                  style={{ width: 16, height: 16, objectFit: "contain" }}
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
              )}
              <span style={{ fontWeight: 600, color: "#ffffff" }}>{win.match}</span>
              {win.logoA && (
                <img
                  src={win.logoA}
                  alt=""
                  style={{ width: 16, height: 16, objectFit: "contain" }}
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
              )}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "#2fd08a",
                  background: "rgba(47, 208, 138, 0.14)",
                  border: "1px solid rgba(47, 208, 138, 0.35)",
                  padding: "1px 7px",
                  borderRadius: 6,
                }}
              >
                <CheckCircle2 size={12} color="#2fd08a" />
                {win.pick}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. HIGH-TECH AI MATCH INTELLIGENCE TERMINAL (100K MONTE CARLO)
          ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          maxWidth: 1120,
          margin: "44px auto 30px",
          padding: "0 16px",
          position: "relative",
          zIndex: 5,
        }}
      >
        <div
          style={{
            borderRadius: 20,
            background: "rgba(20, 17, 50, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(167, 159, 255, 0.16)",
            boxShadow: "0 24px 50px -14px rgba(0,0,0,0.8), 0 0 35px -10px rgba(124, 108, 245, 0.25)",
            overflow: "hidden",
          }}
        >
          {/* Terminal Window Header Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "11px 18px",
              background: "#1b183d",
              borderBottom: "1px solid rgba(167, 159, 255, 0.12)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#fb7185" }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#e8c34a" }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#2fd08a" }} />
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 800,
                  color: "#a79fff",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                AI MATCH INTELLIGENCE TERMINAL
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 10.5,
                  fontFamily: "var(--font-mono)",
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: "rgba(124, 108, 245, 0.15)",
                  color: "#8b7ff5",
                  border: "1px solid rgba(124, 108, 245, 0.25)",
                  fontWeight: 700,
                }}
              >
                {activeSim.simulationsCount} sims
              </span>

              <button
                onClick={handleReSimulate}
                title="Recalculate Monte Carlo Run"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#7874a4",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RotateCcw size={14} className={isSimulating ? "animate-spin" : ""} color="#8b7ff5" />
              </button>
            </div>
          </div>

          {/* Scenario Tabs */}
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: "8px 14px",
              background: "#0e0c26",
              borderBottom: "1px solid rgba(167, 159, 255, 0.08)",
              overflowX: "auto",
            }}
            className="no-scrollbar"
          >
            {SIMULATIONS_DATA.map((sim) => {
              const isActive = sim.id === selectedId;
              return (
                <button
                  key={sim.id}
                  onClick={() => setSelectedId(sim.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    border: "none",
                    cursor: "pointer",
                    background: isActive ? "#7c6cf5" : "transparent",
                    color: isActive ? "#ffffff" : "#a79fff",
                    boxShadow: isActive ? "0 4px 14px rgba(124, 108, 245, 0.45)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {sim.tabIcon === "banker" && <Flame size={13} color={isActive ? "#fff" : "#2fd08a"} />}
                  {sim.tabIcon === "live" && <Radio size={13} color={isActive ? "#fff" : "#ff5d78"} />}
                  {sim.tabIcon === "value" && <TrendingUp size={13} color={isActive ? "#fff" : "#8b7ff5"} />}
                  {sim.tabIcon === "monte" && <BarChart3 size={13} color={isActive ? "#fff" : "#a79fff"} />}
                  <span>{sim.tabTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Terminal Body */}
          <div
            style={{
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              opacity: isSimulating ? 0.4 : 1,
              transition: "opacity 0.2s ease",
            }}
          >
            {/* Fixture Matchup Banner */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#a79fff", fontWeight: 800, textTransform: "uppercase", fontSize: 11, letterSpacing: "0.04em" }}>
                  {activeSim.league}
                </span>
                <span style={{ color: "#7874a4" }}>•</span>
                <span style={{ color: "#7874a4", fontSize: 11 }}>{activeSim.country}</span>
              </div>

              {activeSim.isLive ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: "rgba(255, 93, 120, 0.15)",
                    border: "1px solid rgba(255, 93, 120, 0.35)",
                    color: "#ff5d78",
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  <Radio size={12} color="#ff5d78" /> LIVE {activeSim.liveMin}
                </span>
              ) : (
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 6,
                    background: "#1b183d",
                    color: "#a79fff",
                    fontSize: 11,
                    fontWeight: 700,
                    border: "1px solid rgba(167, 159, 255, 0.1)",
                  }}
                >
                  {activeSim.time}
                </span>
              )}
            </div>

            {/* Clash Teams Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
                gap: 16,
                padding: "12px 14px",
                borderRadius: 14,
                background: "#1b183d",
                border: "1px solid rgba(167, 159, 255, 0.1)",
              }}
            >
              {/* Home Team */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {activeSim.homeLogo ? (
                  <img src={activeSim.homeLogo} alt="" style={{ width: 26, height: 26, objectFit: "contain" }} />
                ) : (
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#7c6cf5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11 }}>
                    {activeSim.homeTeam.charAt(0)}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: "#ffffff" }}>{activeSim.homeTeam}</div>
                  <div style={{ fontSize: 11, color: "#a79fff", marginTop: 2 }}>
                    xG <span style={{ color: "#2fd08a", fontWeight: 700 }}>{activeSim.homeXg}</span> • Poss {activeSim.possession.h}%
                  </div>
                </div>
              </div>

              {/* VS Badge */}
              <div style={{ textAlign: "center" }}>
                {activeSim.isLive ? (
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-mono)" }}>
                    {activeSim.homeScore} - {activeSim.awayScore}
                  </div>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#7874a4" }}>VS</span>
                )}
              </div>

              {/* Away Team */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, textAlign: "right" }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: "#ffffff" }}>{activeSim.awayTeam}</div>
                  <div style={{ fontSize: 11, color: "#a79fff", marginTop: 2 }}>
                    Poss {activeSim.possession.a}% • xG <span style={{ color: "#2fd08a", fontWeight: 700 }}>{activeSim.awayXg}</span>
                  </div>
                </div>
                {activeSim.awayLogo ? (
                  <img src={activeSim.awayLogo} alt="" style={{ width: 26, height: 26, objectFit: "contain" }} />
                ) : (
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#221f4a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 11 }}>
                    {activeSim.awayTeam.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            {/* Market Tabs Switcher */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 6,
                background: "#0e0c26",
                padding: 4,
                borderRadius: 10,
                border: "1px solid rgba(167, 159, 255, 0.08)",
              }}
            >
              {[
                { id: "1x2", label: "1X2 Full Time" },
                { id: "goals", label: "Goals (O/U 2.5)" },
                { id: "btts", label: "BTTS Yes/No" },
                { id: "scores", label: "Top Scores" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMarket(m.id as MarketTab)}
                  style={{
                    padding: "7px 4px",
                    borderRadius: 7,
                    fontSize: 11.5,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    background: activeMarket === m.id ? "#7c6cf5" : "transparent",
                    color: activeMarket === m.id ? "#ffffff" : "#a79fff",
                    transition: "all 0.15s ease",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Probability Breakdown Bar */}
            {activeMarket === "1x2" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700 }}>
                  <span style={{ color: "#ffffff" }}>1 (Home): {activeSim.prob1}%</span>
                  <span style={{ color: "#a79fff" }}>X (Draw): {activeSim.probX}%</span>
                  <span style={{ color: "#ffffff" }}>2 (Away): {activeSim.prob2}%</span>
                </div>
                <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", background: "#1b183d" }}>
                  <div style={{ width: `${activeSim.prob1}%`, background: "#7c6cf5" }} />
                  <div style={{ width: `${activeSim.probX}%`, background: "rgba(167, 159, 255, 0.35)" }} />
                  <div style={{ width: `${activeSim.prob2}%`, background: "#2fd08a" }} />
                </div>
              </div>
            )}

            {activeMarket === "goals" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700 }}>
                  <span style={{ color: "#2fd08a" }}>Over 2.5: {activeSim.goalsOver25}%</span>
                  <span style={{ color: "#a79fff" }}>Under 2.5: {activeSim.goalsUnder25}%</span>
                </div>
                <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", background: "#1b183d" }}>
                  <div style={{ width: `${activeSim.goalsOver25}%`, background: "#2fd08a" }} />
                  <div style={{ width: `${activeSim.goalsUnder25}%`, background: "#7c6cf5" }} />
                </div>
              </div>
            )}

            {activeMarket === "btts" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700 }}>
                  <span style={{ color: "#2fd08a" }}>BTTS Yes: {activeSim.bttsYes}%</span>
                  <span style={{ color: "#a79fff" }}>BTTS No: {activeSim.bttsNo}%</span>
                </div>
                <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", background: "#1b183d" }}>
                  <div style={{ width: `${activeSim.bttsYes}%`, background: "#2fd08a" }} />
                  <div style={{ width: `${activeSim.bttsNo}%`, background: "rgba(167, 159, 255, 0.35)" }} />
                </div>
              </div>
            )}

            {activeMarket === "scores" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {activeSim.topCorrectScores.map((sc, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px",
                      borderRadius: 8,
                      background: "#1b183d",
                      border: "1px solid rgba(167, 159, 255, 0.1)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-mono)" }}>{sc.score}</div>
                    <div style={{ fontSize: 10.5, color: "#2fd08a", fontWeight: 700, marginTop: 2 }}>{sc.prob}% Prob</div>
                    <div style={{ fontSize: 10.5, color: "#7874a4", fontFamily: "var(--font-mono)" }}>@{sc.odd}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Best Tip Highlight Card */}
            <div
              style={{
                padding: "14px 18px",
                borderRadius: 14,
                background: "linear-gradient(135deg, rgba(124, 108, 245, 0.2) 0%, rgba(27, 24, 61, 0.95) 100%)",
                border: "1px solid rgba(124, 108, 245, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Confidence Badge */}
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: "#141132",
                    border: "1px solid rgba(124, 108, 245, 0.5)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 900, color: "#2fd08a", fontFamily: "var(--font-mono)", lineHeight: 1 }}>
                    {activeSim.confidenceScore}
                  </span>
                  <span style={{ fontSize: 8.5, color: "#7874a4", fontWeight: 700, marginTop: 2 }}>/10</span>
                </div>

                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: "#8b7ff5", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {activeSim.bestTipMarket}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#ffffff", marginTop: 2 }}>
                    {activeSim.bestTip}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#a79fff", marginTop: 2 }}>
                    Odds: <span style={{ color: "#2fd08a", fontWeight: 800, fontFamily: "var(--font-mono)" }}>@{activeSim.bestTipOdds}</span>
                    <span style={{ margin: "0 6px", color: "#7874a4" }}>•</span>
                    <span style={{ color: "#2fd08a", fontWeight: 700 }}>{activeSim.evEdge}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={handleCopyTip}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: "#141132",
                    border: "1px solid rgba(167, 159, 255, 0.22)",
                    color: "#ffffff",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={14} color="#2fd08a" />
                      <span style={{ color: "#2fd08a" }}>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} color="#a79fff" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleAddToSlip}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: addedToSlip ? "rgba(47, 208, 138, 0.22)" : "rgba(124, 108, 245, 0.3)",
                    border: addedToSlip ? "1px solid #2fd08a" : "1px solid #7c6cf5",
                    color: addedToSlip ? "#2fd08a" : "#ffffff",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {addedToSlip ? (
                    <>
                      <Check size={14} color="#2fd08a" />
                      <span>Added to Acca</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} color="#8b7ff5" />
                      <span>Add to Acca</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Terminal Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "11px 20px",
              background: "#1b183d",
              borderTop: "1px solid rgba(167, 159, 255, 0.08)",
              fontSize: 11.5,
            }}
          >
            <span style={{ color: "#7874a4" }}>{activeSim.keyMetric}</span>
            <Link
              href="/all-matches"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                color: "#8b7ff5",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              <span>View All 160+ Matches</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
