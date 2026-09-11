"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Sparkles,
  Cpu,
  Database,
  Layers,
  Filter,
  BarChart3,
  TrendingUp,
  Target,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  ArrowRight,
  Flame,
  Scale,
  Brain,
  Sliders,
  ChevronRight,
  HelpCircle,
  Clock,
  Award,
  Globe,
  Shuffle,
  Percent,
  Crown,
} from "lucide-react";

export default function HowItWorksPage() {
  // Interactive Simulator State
  const [homeTeam, setHomeTeam] = useState("Arsenal");
  const [awayTeam, setAwayTeam] = useState("Chelsea");
  const [homeForm, setHomeForm] = useState(85); // 0-100
  const [awayForm, setAwayForm] = useState(70); // 0-100
  const [homeXg, setHomeXg] = useState(2.2); // xG
  const [awayXg, setAwayXg] = useState(1.1); // xG
  const [homeAdvantage, setHomeAdvantage] = useState(true);
  const [keyInjuries, setKeyInjuries] = useState(false);

  // Active FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Active Stage Tab
  const [activeStage, setActiveStage] = useState<number>(1);

  // Calculate simulated probabilities based on user tweaks
  const calculateSimulation = () => {
    let homeWeight = homeForm * 0.4 + homeXg * 25 + (homeAdvantage ? 12 : 0) - (keyInjuries ? 10 : 0);
    let awayWeight = awayForm * 0.4 + awayXg * 25;

    const totalWeight = homeWeight + awayWeight + 30; // +30 for draw weight
    const homeProb = Math.min(88, Math.max(15, Math.round((homeWeight / totalWeight) * 100)));
    const awayProb = Math.min(80, Math.max(10, Math.round((awayWeight / totalWeight) * 100)));
    const drawProb = Math.max(10, 100 - (homeProb + awayProb));

    const totalXg = homeXg + awayXg;
    const over25Prob = Math.min(92, Math.max(20, Math.round((totalXg / 3.8) * 100)));
    const bttsProb = Math.min(85, Math.max(25, Math.round(((homeXg * awayXg) / 3.2) * 100)));

    // Simulated odds vs True odds
    const fairOddsHome = (100 / homeProb).toFixed(2);
    const bookieOddsHome = (Number(fairOddsHome) * 1.12).toFixed(2); // Simulated +EV edge
    const valueEdge = (((Number(bookieOddsHome) * homeProb) / 100 - 1) * 100).toFixed(1);

    return {
      homeProb,
      drawProb,
      awayProb,
      over25Prob,
      bttsProb,
      fairOddsHome,
      bookieOddsHome,
      valueEdge: Number(valueEdge) > 0 ? `+${valueEdge}%` : `${valueEdge}%`,
      isEdgePositive: Number(valueEdge) > 0,
    };
  };

  const sim = calculateSimulation();

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", color: "var(--foreground)" }}>
      <Navbar />

      {/* Embedded CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flowDashLeftToRight {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes pulseGlowRing {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }

        @keyframes moveArrowThroughFunnel {
          0% { transform: translateX(-18px); opacity: 0; }
          30% { opacity: 0.9; }
          70% { opacity: 0.9; }
          100% { transform: translateX(38px); opacity: 0; }
        }

        @keyframes outputSuccessPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(16, 185, 129, 0.4); transform: scale(1); }
          50% { box-shadow: 0 0 22px rgba(16, 185, 129, 0.85); transform: scale(1.08); }
        }

        @keyframes bounceChevron {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }

        .animated-stream-line {
          stroke-dasharray: 4, 4;
          animation: flowDashLeftToRight 0.9s linear infinite;
        }

        .animated-synapse {
          stroke-dasharray: 3, 3;
          animation: flowDashLeftToRight 0.8s linear infinite;
        }

        .animated-synapse-fast {
          stroke-dasharray: 3, 3;
          animation: flowDashLeftToRight 0.5s linear infinite;
        }
      `}} />

      {/* ── Section 1: Hero Header ── */}
      <section
        style={{
          position: "relative",
          padding: "130px 16px 80px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Background Ethereal Glow */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "900px",
            height: "450px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.1) 40%, transparent 70%)",
            filter: "blur(90px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#818cf8",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              padding: "6px 18px",
              borderRadius: 999,
              marginBottom: 20,
              boxShadow: "0 0 24px rgba(99, 102, 241, 0.18)",
            }}
          >
            <Brain style={{ width: 15, height: 15, color: "#818cf8" }} />
            <span>THE QUANTITATIVE ARCHITECTURE</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(34px, 5.5vw, 62px)",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              margin: "0 0 24px",
            }}
          >
            Inside JT Apex AI: How Our Football Intelligence Engine Works
          </h1>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "clamp(15px, 2vw, 18px)",
              lineHeight: 1.65,
              maxWidth: 760,
              margin: "0 auto 36px",
            }}
          >
            A transparent look into our mathematical pipeline — transforming raw match statistics, expected goals (xG), lineup telemetry, and odds feeds into verified, high-conviction predictions.
          </p>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
              maxWidth: 840,
              margin: "0 auto 40px",
              padding: "20px 24px",
              background: "linear-gradient(135deg, rgba(21, 26, 56, 0.8) 0%, rgba(14, 17, 39, 0.9) 100%)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              borderRadius: 16,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#818cf8", marginBottom: 2 }}>120+</div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Global Leagues Tracked</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#34d399", marginBottom: 2 }}>4,200+</div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Data Points Per Match</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#fbbf24", marginBottom: 2 }}>100,000</div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Monte Carlo Runs / Game</div>
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#a78bfa", marginBottom: 2 }}>&lt; 0.2s</div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Live Inference Latency</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <a
              href="#pipeline"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 28px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 800,
                textDecoration: "none",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                boxShadow: "0 4px 20px rgba(112, 101, 240, 0.4)",
              }}
            >
              <span>Explore 4-Stage Pipeline</span>
              <ChevronRight style={{ width: 16, height: 16 }} />
            </a>

            <a
              href="#simulator"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 26px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                backdropFilter: "blur(8px)",
              }}
            >
              <Sliders style={{ width: 16, height: 16, color: "#818cf8" }} />
              <span>Try Live AI Simulator</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Section 2: 4-Stage Quantitative Pipeline ── */}
      <section id="pipeline" className="scroll-mt-24" style={{ maxWidth: 1240, margin: "0 auto", padding: "60px 16px 80px" }}>
        
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            STEP-BY-STEP BREAKDOWN
          </div>
          <h2 style={{ fontSize: "clamp(26px, 3.8vw, 38px)", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            The 4-Stage Algorithmic Pipeline
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 15, maxWidth: 640, margin: "0 auto" }}>
            How raw telemetry travels from stadiums across the world into settled, actionable intelligence.
          </p>
        </div>

        {/* Stage Selector Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 36,
          }}
        >
          {[
            { step: 1, title: "01. Data Ingestion" },
            { step: 2, title: "02. Normalization" },
            { step: 3, title: "03. JT Apex Neural Engine" },
            { step: 4, title: "04. Value Edge & Settlement" },
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => setActiveStage(item.step)}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                background: activeStage === item.step ? "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)" : "rgba(21, 26, 56, 0.8)",
                border: activeStage === item.step ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(99, 102, 241, 0.2)",
                color: activeStage === item.step ? "#ffffff" : "#94a3b8",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: activeStage === item.step ? "0 4px 18px rgba(112, 101, 240, 0.4)" : "none",
              }}
            >
              {item.title}
            </button>
          ))}
        </div>

        {/* Active Stage Detailed Card */}
        <div
          style={{
            background: "linear-gradient(180deg, rgba(21, 26, 56, 0.95) 0%, rgba(14, 17, 39, 0.98) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: 20,
            padding: "36px 30px",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.12)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 36,
            alignItems: "center",
          }}
        >
          {/* Left Column: Stage Explanation */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 6,
                background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                color: "#ffffff",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.06em",
                marginBottom: 16,
              }}
            >
              STAGE 0{activeStage} OF 04
            </div>

            {activeStage === 1 && (
              <>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", marginBottom: 14 }}>
                  High-Throughput Ingestion & Live Sensor Feeds
                </h3>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                  Our distributed scraper infrastructure connects directly to licensed sports data providers and optical tracking APIs across 120+ football leagues.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#cbd5e1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                    <span><strong>Expected Goals (xG) & Shot Quality:</strong> Open-play xG, set-piece threat, defensive vulnerability index.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                    <span><strong>Player Telemetry & Rotation:</strong> Confirmed starting XI, key player injuries, fatigue indexes.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                    <span><strong>Market Sentiment & Odds Movement:</strong> Real-time tracking of 30+ sharp global bookmakers.</span>
                  </div>
                </div>
              </>
            )}

            {activeStage === 2 && (
              <>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", marginBottom: 14 }}>
                  Algorithmic Normalization & Noise Cleansing
                </h3>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                  Raw football match data contains random luck, flukey deflections, red-card distortions, and blowout scores. Our cleaning pipeline strips out statistical noise to isolate genuine team caliber.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#cbd5e1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                    <span><strong>Garbage-Time Dampening:</strong> Late goals scored against 10 men are down-weighted.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                    <span><strong>Home Advantage Calibration:</strong> Stadium atmosphere, travel distance, and pitch dimensions.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                    <span><strong>Recency Decay Multiplier:</strong> Recent fixtures weighted 3.2x higher than matches from 6 months ago.</span>
                  </div>
                </div>
              </>
            )}

            {activeStage === 3 && (
              <>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", marginBottom: 14 }}>
                  JT Apex Neural Engine & Monte Carlo Simulations
                </h3>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                  Our proprietary model, <strong>JT Apex</strong>, leverages a hybrid Bidirectional LSTM (Long Short-Term Memory) neural network combined with Bivariate Poisson goal distribution equations.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#cbd5e1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                    <span><strong>100,000 Match Simulations:</strong> Every game is simulated 100,000 times before kickoff.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                    <span><strong>Multi-Market Matrix:</strong> Derives true probabilities for 1X2, Over/Under, BTTS, and Correct Scores.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                    <span><strong>Non-Linear Pattern Recognition:</strong> Discovers tactical matchup advantages invisible to human eyes.</span>
                  </div>
                </div>
              </>
            )}

            {activeStage === 4 && (
              <>
                <h3 style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", marginBottom: 14 }}>
                  Value Edge Identification & Immutable Settlement
                </h3>
                <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                  Predicting winners is only half the battle. Our system compares the AI true probability against live market odds to flag mispriced value opportunities (+EV).
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#cbd5e1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                    <span><strong>Mathematical Edge Formula:</strong> Edge % = (AI Prob × Bookie Odds) - 1.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                    <span><strong>AI Bet of the Day Flagging:</strong> Top consensus picks with &gt;12% mathematical value edge.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                    <span><strong>100% Verified Track Record:</strong> Every pick is timestamped before kickoff and settled against final scores.</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Animated Vector Diagram */}
          <div
            style={{
              background: "linear-gradient(180deg, rgba(16, 20, 48, 0.95) 0%, rgba(10, 13, 34, 0.98) 100%)",
              borderRadius: 16,
              border: "1px solid rgba(99, 102, 241, 0.25)",
              padding: "24px",
              minHeight: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Tech grid overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "radial-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 0)",
                backgroundSize: "16px 16px",
                opacity: 0.5,
              }}
            />

            {/* Stage 1 Graphic: Moving streams */}
            {activeStage === 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 360, position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(30, 37, 78, 0.9)", border: "1px solid rgba(99, 102, 241, 0.35)", fontSize: 11, fontWeight: 800, color: "#a5b4fc" }}>
                    📊 Match Stats
                  </div>
                  <div style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(30, 37, 78, 0.9)", border: "1px solid rgba(99, 102, 241, 0.35)", fontSize: 11, fontWeight: 800, color: "#a5b4fc" }}>
                    🎯 Expected Goals (xG)
                  </div>
                  <div style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(30, 37, 78, 0.9)", border: "1px solid rgba(99, 102, 241, 0.35)", fontSize: 11, fontWeight: 800, color: "#a5b4fc" }}>
                    ⚡ Lineup Telemetry
                  </div>
                  <div style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(30, 37, 78, 0.9)", border: "1px solid rgba(99, 102, 241, 0.35)", fontSize: 11, fontWeight: 800, color: "#a5b4fc" }}>
                    📈 Odds Movements
                  </div>
                </div>

                <svg width="90" height="120" viewBox="0 0 90 120" fill="none">
                  <path d="M 0 20 C 40 20, 50 60, 90 60" stroke="#818cf8" strokeWidth="2" className="animated-stream-line" />
                  <path d="M 0 50 C 40 50, 50 60, 90 60" stroke="#a855f7" strokeWidth="2" className="animated-stream-line" />
                  <path d="M 0 80 C 40 80, 50 60, 90 60" stroke="#818cf8" strokeWidth="2" className="animated-stream-line" />
                  <path d="M 0 105 C 40 105, 50 60, 90 60" stroke="#a855f7" strokeWidth="2" className="animated-stream-line" />
                  <circle cx="20" cy="20" r="3" fill="#fff">
                    <animate attributeName="cx" values="0;85" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="20;60" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                </svg>

                <div style={{ width: 80, height: 80, borderRadius: 14, background: "linear-gradient(135deg, #1e2555 0%, #14193c 100%)", border: "2px solid #818cf8", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(129, 140, 248, 0.4)" }}>
                  <Database style={{ width: 32, height: 32, color: "#818cf8" }} />
                </div>
              </div>
            )}

            {/* Stage 2 Graphic: Funnel filter */}
            {activeStage === 2 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 360, position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 80 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 50, height: 8, background: "rgba(148, 163, 184, 0.3)", borderRadius: 4 }} />
                    <span style={{ fontSize: 11, color: "#f87171", fontWeight: 900 }}>×</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 38, height: 8, background: "rgba(148, 163, 184, 0.3)", borderRadius: 4 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 54, height: 8, background: "rgba(148, 163, 184, 0.3)", borderRadius: 4 }} />
                    <span style={{ fontSize: 11, color: "#f87171", fontWeight: 900 }}>×</span>
                  </div>
                </div>

                <div style={{ position: "relative", width: 64, height: 84, borderRadius: 10, background: "rgba(30, 37, 85, 0.8)", border: "1.5px solid #818cf8", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(99, 102, 241, 0.35)" }}>
                  <Filter style={{ width: 28, height: 28, color: "#818cf8" }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, width: 80, position: "relative" }}>
                  <div style={{ position: "absolute", top: -20, right: 0, width: 24, height: 24, borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", border: "1.5px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center", animation: "outputSuccessPulse 1.8s infinite ease-in-out" }}>
                    <CheckCircle2 style={{ width: 14, height: 14, color: "#34d399" }} />
                  </div>
                  <div style={{ width: 70, height: 8, background: "linear-gradient(90deg, #818cf8, #a5b4fc)", borderRadius: 4, boxShadow: "0 0 8px rgba(129,140,248,0.4)" }} />
                  <div style={{ width: 55, height: 8, background: "linear-gradient(90deg, #818cf8, #a5b4fc)", borderRadius: 4, boxShadow: "0 0 8px rgba(129,140,248,0.4)" }} />
                  <div style={{ width: 65, height: 8, background: "linear-gradient(90deg, #818cf8, #a5b4fc)", borderRadius: 4, boxShadow: "0 0 8px rgba(129,140,248,0.4)" }} />
                </div>
              </div>
            )}

            {/* Stage 3 Graphic: Neural network */}
            {activeStage === 3 && (
              <div style={{ width: "100%", maxWidth: 360, height: 180, position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="100%" height="160" viewBox="0 0 280 140" fill="none">
                  {/* Layer 1 -> Layer 2 */}
                  <line x1="40" y1="30" x2="110" y2="20" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" className="animated-synapse" />
                  <line x1="40" y1="30" x2="110" y2="70" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" className="animated-synapse" />
                  <line x1="40" y1="70" x2="110" y2="70" stroke="#a855f7" strokeWidth="2" className="animated-synapse-fast" />
                  <line x1="40" y1="110" x2="110" y2="70" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" className="animated-synapse" />
                  <line x1="40" y1="110" x2="110" y2="120" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" className="animated-synapse" />

                  {/* Layer 2 -> Layer 3 */}
                  <line x1="110" y1="20" x2="180" y2="40" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" className="animated-synapse" />
                  <line x1="110" y1="70" x2="180" y2="40" stroke="#a855f7" strokeWidth="2" className="animated-synapse-fast" />
                  <line x1="110" y1="70" x2="180" y2="100" stroke="#a855f7" strokeWidth="2" className="animated-synapse-fast" />
                  <line x1="110" y1="120" x2="180" y2="100" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" className="animated-synapse" />

                  {/* Layer 3 -> Output */}
                  <line x1="180" y1="40" x2="245" y2="70" stroke="#10b981" strokeWidth="2.5" className="animated-synapse-fast" />
                  <line x1="180" y1="100" x2="245" y2="70" stroke="#10b981" strokeWidth="2.5" className="animated-synapse-fast" />

                  {/* Nodes */}
                  <circle cx="40" cy="30" r="5" fill="#6366f1" />
                  <circle cx="40" cy="70" r="5" fill="#818cf8" />
                  <circle cx="40" cy="110" r="5" fill="#6366f1" />

                  <circle cx="110" cy="20" r="6" fill="#a5b4fc" />
                  <circle cx="110" cy="70" r="7" fill="#8b5cf6" stroke="#c084fc" strokeWidth="2" />
                  <circle cx="110" cy="120" r="6" fill="#a5b4fc" />

                  <circle cx="180" cy="40" r="6.5" fill="#818cf8" />
                  <circle cx="180" cy="100" r="6.5" fill="#818cf8" />

                  <circle cx="245" cy="70" r="16" fill="#0f291e" stroke="#10b981" strokeWidth="2.5" />
                </svg>
                <div style={{ position: "absolute", right: 26, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", animation: "outputSuccessPulse 1.8s infinite ease-in-out" }}>
                  <CheckCircle2 style={{ width: 20, height: 20, color: "#34d399" }} />
                </div>
              </div>
            )}

            {/* Stage 4 Graphic: Value Edge Gauge */}
            {activeStage === 4 && (
              <div style={{ width: "100%", maxWidth: 320, textAlign: "center", position: "relative", zIndex: 2 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>
                  VALUE EDGE CALCULATION
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#34d399", marginBottom: 8 }}>
                  +14.8% Edge Found
                </div>
                <div style={{ background: "rgba(30, 37, 78, 0.8)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#94a3b8" }}>AI Model Fair Odds:</span>
                  <strong style={{ color: "#818cf8" }}>1.65 (60.6%)</strong>
                </div>
                <div style={{ background: "rgba(30, 37, 78, 0.8)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 8 }}>
                  <span style={{ color: "#94a3b8" }}>Market Price:</span>
                  <strong style={{ color: "#34d399" }}>1.90 (52.6%)</strong>
                </div>
              </div>
            )}
          </div>

        </div>

      </section>

      {/* ── Section 3: Interactive Live AI Simulator ── */}
      <section id="simulator" className="scroll-mt-24" style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 16px 80px" }}>
        
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#fbbf24", fontSize: 11, fontWeight: 800, marginBottom: 12 }}>
            <Sparkles style={{ width: 13, height: 13 }} />
            <span>INTERACTIVE TESTBENCH</span>
          </div>
          <h2 style={{ fontSize: "clamp(26px, 3.8vw, 38px)", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            Live Match Neural Simulator
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 15, maxWidth: 680, margin: "0 auto" }}>
            Tweak real-world parameters like Expected Goals, form, home advantage, and injuries to see how the JT Apex neural network instantly recalculates outcome probabilities.
          </p>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, rgba(21, 26, 56, 0.95) 0%, rgba(15, 18, 42, 0.98) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: 20,
            padding: "32px",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 32,
          }}
        >
          {/* Simulator Inputs */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <Sliders style={{ width: 18, height: 18, color: "#818cf8" }} />
              <span>Input Telemetry Parameters</span>
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Home Team Form Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "#cbd5e1", fontWeight: 700 }}>Arsenal Recent Form Rating:</span>
                  <strong style={{ color: "#818cf8" }}>{homeForm}/100</strong>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={homeForm}
                  onChange={(e) => setHomeForm(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#818cf8" }}
                />
              </div>

              {/* Away Team Form Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "#cbd5e1", fontWeight: 700 }}>Chelsea Recent Form Rating:</span>
                  <strong style={{ color: "#818cf8" }}>{awayForm}/100</strong>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={awayForm}
                  onChange={(e) => setAwayForm(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#818cf8" }}
                />
              </div>

              {/* Home Expected Goals (xG) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "#cbd5e1", fontWeight: 700 }}>Arsenal Avg Expected Goals (xG):</span>
                  <strong style={{ color: "#34d399" }}>{homeXg.toFixed(1)} xG</strong>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.5"
                  step="0.1"
                  value={homeXg}
                  onChange={(e) => setHomeXg(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#34d399" }}
                />
              </div>

              {/* Away Expected Goals (xG) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "#cbd5e1", fontWeight: 700 }}>Chelsea Avg Expected Goals (xG):</span>
                  <strong style={{ color: "#34d399" }}>{awayXg.toFixed(1)} xG</strong>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.5"
                  step="0.1"
                  value={awayXg}
                  onChange={(e) => setAwayXg(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#34d399" }}
                />
              </div>

              {/* Toggle Switches */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setHomeAdvantage(!homeAdvantage)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: homeAdvantage ? "rgba(99, 102, 241, 0.25)" : "rgba(255, 255, 255, 0.05)",
                    border: homeAdvantage ? "1px solid #818cf8" : "1px solid rgba(255, 255, 255, 0.1)",
                    color: homeAdvantage ? "#ffffff" : "#94a3b8",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {homeAdvantage ? "✓ Home Turf Advantage (+12%)" : "+ Add Home Advantage"}
                </button>

                <button
                  type="button"
                  onClick={() => setKeyInjuries(!keyInjuries)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: keyInjuries ? "rgba(239, 68, 68, 0.25)" : "rgba(255, 255, 255, 0.05)",
                    border: keyInjuries ? "1px solid #f87171" : "1px solid rgba(255, 255, 255, 0.1)",
                    color: keyInjuries ? "#ffffff" : "#94a3b8",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {keyInjuries ? "⚠ Key Starter Injured (-10%)" : "+ Simulate Key Player Injury"}
                </button>
              </div>
            </div>
          </div>

          {/* Simulator Live Outputs */}
          <div
            style={{
              background: "rgba(10, 13, 34, 0.85)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              borderRadius: 16,
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>
                  AI Probability Matrix
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 4, background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                  100k Simulations Completed
                </span>
              </div>

              {/* 1X2 Probabilities */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "#cbd5e1" }}>Arsenal Win (1):</span>
                    <strong style={{ color: "#818cf8" }}>{sim.homeProb}% (Fair @ {sim.fairOddsHome})</strong>
                  </div>
                  <div style={{ width: "100%", height: 8, background: "rgba(255, 255, 255, 0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${sim.homeProb}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #818cf8)", transition: "width 0.3s ease" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "#cbd5e1" }}>Draw (X):</span>
                    <strong style={{ color: "#a5b4fc" }}>{sim.drawProb}%</strong>
                  </div>
                  <div style={{ width: "100%", height: 8, background: "rgba(255, 255, 255, 0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${sim.drawProb}%`, height: "100%", background: "linear-gradient(90deg, #818cf8, #a5b4fc)", transition: "width 0.3s ease" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "#cbd5e1" }}>Chelsea Win (2):</span>
                    <strong style={{ color: "#94a3b8" }}>{sim.awayProb}%</strong>
                  </div>
                  <div style={{ width: "100%", height: 8, background: "rgba(255, 255, 255, 0.08)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${sim.awayProb}%`, height: "100%", background: "linear-gradient(90deg, #94a3b8, #cbd5e1)", transition: "width 0.3s ease" }} />
                  </div>
                </div>
              </div>

              {/* Secondary Goal Markets */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ padding: "12px", borderRadius: 8, background: "rgba(21, 26, 56, 0.8)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Over 2.5 Goals</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#34d399" }}>{sim.over25Prob}%</div>
                </div>
                <div style={{ padding: "12px", borderRadius: 8, background: "rgba(21, 26, 56, 0.8)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>Both Teams to Score</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24" }}>{sim.bttsProb}%</div>
                </div>
              </div>
            </div>

            {/* Edge Alert Ribbon */}
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                background: sim.isEdgePositive ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                border: sim.isEdgePositive ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Market Value Edge</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: sim.isEdgePositive ? "#34d399" : "#f87171" }}>
                  {sim.valueEdge} Expected Value
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 8px", borderRadius: 4, background: sim.isEdgePositive ? "#10b981" : "#ef4444", color: "#ffffff" }}>
                {sim.isEdgePositive ? "POSITIVE EV" : "NO VALUE"}
              </span>
            </div>
          </div>
        </div>

      </section>

      {/* ── Section 4: What The AI Model Does For You ── */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 16px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            CORE ADVANTAGES
          </div>
          <h2 style={{ fontSize: "clamp(26px, 3.8vw, 38px)", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            Why AI Models Outperform Emotional Betting
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 15, maxWidth: 640, margin: "0 auto" }}>
            Eliminating human bias, superstition, and fan loyalty with pure statistical consistency.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          
          <div style={{ background: "rgba(21, 26, 56, 0.8)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: 16, padding: "24px" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(139, 92, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa", marginBottom: 16 }}>
              <Scale style={{ width: 22, height: 22 }} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>Zero Emotion & Bias</h3>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
              The model does not care about club popularity or media hype. It evaluates raw underlying goal expectancy and squad efficiency purely on merit.
            </p>
          </div>

          <div style={{ background: "rgba(21, 26, 56, 0.8)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: 16, padding: "24px" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399", marginBottom: 16 }}>
              <Clock style={{ width: 22, height: 22 }} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>Sub-Second News Adaptation</h3>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
              When official starting XIs drop 60 minutes before kickoff, the algorithm recalibrates team strength within 12 seconds to catch slow bookmaker adjustments.
            </p>
          </div>

          <div style={{ background: "rgba(21, 26, 56, 0.8)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: 16, padding: "24px" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24", marginBottom: 16 }}>
              <Target style={{ width: 22, height: 22 }} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>Confidence Level Grading</h3>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
              Every tip is scored from 70% to 95% confidence so you can scale your stakes responsibly instead of treating every fixture equally.
            </p>
          </div>

          <div style={{ background: "rgba(21, 26, 56, 0.8)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: 16, padding: "24px" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(99, 102, 241, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8", marginBottom: 16 }}>
              <ShieldCheck style={{ width: 22, height: 22 }} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>Immutable Settlement Track Record</h3>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
              Predictions are permanently recorded before the match begins and settled automatically against official referee whistles. Zero retro-editing.
            </p>
          </div>

        </div>
      </section>

      {/* ── Section 5: Transparent FAQ ── */}
      <section style={{ maxWidth: 840, margin: "0 auto", padding: "20px 16px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 900, color: "#ffffff", margin: "0 0 10px" }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Everything you need to know about our data sources, model updates, and accuracy.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              q: "How does the AI handle sudden red cards or referee decisions?",
              a: "In-play models dynamically adjust goal expectancies based on historical 10-vs-11 match data (reducing the penalized team's xG by ~38% on average). Post-match, our cleaning pipeline dampens scores skewed by red cards to prevent poisoning future predictions."
            },
            {
              q: "Can JT Apex predict underdog upsets?",
              a: "Yes. In fact, underdog value is where quantitative models shine the most. By detecting when a favourite's xG is declining or when their schedule congestion causes fatigue, JT Apex regularly uncovers high-odds double chance (1X / X2) and Draw opportunities."
            },
            {
              q: "How often is the AI model re-trained?",
              a: "JT Apex undergoes automated continuous learning. Hyperparameters are re-calibrated every Monday across all 120+ leagues once weekend fixtures have settled."
            },
            {
              q: "Are predictions guaranteed to win?",
              a: "No quantitative model can guarantee a 100% win rate because football inherently has randomness. Our objective is long-term positive mathematical expectancy (+EV) with verified win-rates averaging 85%+ across high-confidence markets."
            },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(21, 26, 56, 0.85)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={{
                  width: "100%",
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 700,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span>{item.q}</span>
                <span style={{ fontSize: 18, color: "#818cf8" }}>{openFaq === idx ? "−" : "+"}</span>
              </button>

              {openFaq === idx && (
                <div style={{ padding: "0 20px 18px", color: "#94a3b8", fontSize: 13, lineHeight: 1.6 }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 6: Bottom CTA ── */}
      <section style={{ maxWidth: 1120, margin: "0 auto 80px", padding: "0 16px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(30, 37, 85, 0.95) 0%, rgba(18, 22, 54, 0.98) 100%)",
            border: "1px solid rgba(139, 92, 246, 0.35)",
            borderRadius: 20,
            padding: "48px 32px",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(139, 92, 246, 0.2)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#ffffff", margin: "0 0 14px", letterSpacing: "-0.02em" }}>
            Ready to Explore Today&apos;s AI Predictions?
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 15, maxWidth: 620, margin: "0 auto 32px" }}>
            Access verified tips across 120+ leagues with confidence scores, xG projections, and value edges updated in real time.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <Link
              href="/all-matches"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 30px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(112, 101, 240, 0.4)",
              }}
            >
              <span>View Today&apos;s Fixtures</span>
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>

            <Link
              href="/pricing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 28px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <Crown style={{ width: 16, height: 16, color: "#fbbf24" }} />
              <span>Unlock VIP Pro Access</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
