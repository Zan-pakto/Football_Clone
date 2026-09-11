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
  Brain,
  Sliders,
  ChevronRight,
  Clock,
  Award,
  Crown,
} from "lucide-react";

export default function HowItWorksPage() {
  const [homeForm, setHomeForm] = useState(85);
  const [awayForm, setAwayForm] = useState(70);
  const [homeXg, setHomeXg] = useState(2.2);
  const [awayXg, setAwayXg] = useState(1.1);
  const [homeAdvantage, setHomeAdvantage] = useState(true);
  const [keyInjuries, setKeyInjuries] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeStage, setActiveStage] = useState<number>(1);

  const calculateSimulation = () => {
    let homeWeight = homeForm * 0.4 + homeXg * 25 + (homeAdvantage ? 12 : 0) - (keyInjuries ? 10 : 0);
    let awayWeight = awayForm * 0.4 + awayXg * 25;

    const totalWeight = homeWeight + awayWeight + 30;
    const homeProb = Math.min(88, Math.max(15, Math.round((homeWeight / totalWeight) * 100)));
    const awayProb = Math.min(80, Math.max(10, Math.round((awayWeight / totalWeight) * 100)));
    const drawProb = Math.max(10, 100 - (homeProb + awayProb));

    const totalXg = homeXg + awayXg;
    const over25Prob = Math.min(92, Math.max(20, Math.round((totalXg / 3.8) * 100)));
    const bttsProb = Math.min(85, Math.max(25, Math.round(((homeXg * awayXg) / 3.2) * 100)));

    const fairOddsHome = (100 / homeProb).toFixed(2);
    const bookieOddsHome = (Number(fairOddsHome) * 1.12).toFixed(2);
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

      {/* Hero Section */}
      <section style={{ padding: "60px 20px 60px", textAlign: "center", position: "relative" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div className="gold-badge" style={{ marginBottom: 16 }}>
            <Brain size={14} />
            <span>THE QUANTITATIVE ARCHITECTURE</span>
          </div>

          <h1 style={{
            fontSize: "clamp(32px, 5vw, 54px)",
            fontWeight: 900,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            margin: "0 0 20px",
          }}>
            Inside JT Apex AI: How Our Football Intelligence Engine Works
          </h1>

          <p style={{
            color: "var(--text-secondary)",
            fontSize: "clamp(15px, 2vw, 17px)",
            lineHeight: 1.65,
            maxWidth: 760,
            margin: "0 auto 36px",
          }}>
            A transparent look into our mathematical pipeline — transforming raw match statistics, expected goals (xG), lineup telemetry, and odds feeds into verified, high-conviction predictions.
          </p>

          {/* Quick Metrics Bar */}
          <div
            className="luxury-card"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
              maxWidth: 840,
              margin: "0 auto 40px",
              padding: "24px",
            }}
          >
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--gold)", marginBottom: 2 }}>160+</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Global Leagues Tracked</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--accent-green)", marginBottom: 2 }}>4,200+</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Data Points Per Match</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--gold)", marginBottom: 2 }}>100,000</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Monte Carlo Runs / Game</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--accent-green)", marginBottom: 2 }}>&lt; 0.2s</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Live Inference Latency</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: 4-Stage Pipeline ── */}
      <section id="pipeline" style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 20px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "var(--text-primary)", margin: "0 0 10px" }}>
            The 4-Stage Algorithmic Pipeline
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            How raw telemetry travels from stadiums across the world into settled, actionable intelligence.
          </p>
        </div>

        {/* Stage Selector Tabs */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          {[
            { step: 1, title: "01. Data Ingestion" },
            { step: 2, title: "02. Normalization" },
            { step: 3, title: "03. Neural Engine" },
            { step: 4, title: "04. Value Settlement" },
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => setActiveStage(item.step)}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                background: activeStage === item.step ? "var(--gold)" : "var(--surface-raised)",
                border: activeStage === item.step ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                color: activeStage === item.step ? "var(--gold-btn-text)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {item.title}
            </button>
          ))}
        </div>

        {/* Detailed Stage Card */}
        <div className="luxury-card" style={{ padding: "36px 32px" }}>
          {activeStage === 1 && (
            <div>
              <span className="gold-badge" style={{ marginBottom: 12 }}>STAGE 01 OF 04</span>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", marginBottom: 12 }}>
                High-Throughput Ingestion & Live Sensor Feeds
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                Our distributed scraper infrastructure connects directly to licensed sports data providers and optical tracking APIs across 160+ football leagues.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="var(--accent-green)" />
                  <span><strong>Expected Goals (xG) & Shot Quality:</strong> Open-play xG, set-piece threat, defensive vulnerability index.</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="var(--accent-green)" />
                  <span><strong>Player Telemetry & Rotation:</strong> Confirmed starting XI, key player injuries, fatigue indexes.</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="var(--accent-green)" />
                  <span><strong>Market Sentiment & Odds Movement:</strong> Real-time tracking of 30+ sharp global bookmakers.</span>
                </div>
              </div>
            </div>
          )}

          {activeStage === 2 && (
            <div>
              <span className="gold-badge" style={{ marginBottom: 12 }}>STAGE 02 OF 04</span>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", marginBottom: 12 }}>
                Algorithmic Normalization & Noise Cleansing
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                Raw football match data contains random luck, deflections, and red-card distortions. Our cleaning pipeline strips out statistical noise to isolate genuine team caliber.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="var(--accent-green)" />
                  <span><strong>Garbage-Time Dampening:</strong> Late goals scored against 10 men are down-weighted.</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--accent-green)" }}>
                  <CheckCircle2 size={16} color="var(--accent-green)" />
                  <span><strong>Home Advantage Calibration:</strong> Stadium atmosphere, travel distance, and pitch dimensions.</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="var(--accent-green)" />
                  <span><strong>Recency Decay Multiplier:</strong> Recent fixtures weighted higher than matches from 6 months ago.</span>
                </div>
              </div>
            </div>
          )}

          {activeStage === 3 && (
            <div>
              <span className="gold-badge" style={{ marginBottom: 12 }}>STAGE 03 OF 04</span>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", marginBottom: 12 }}>
                JT Apex Neural Engine & Monte Carlo Simulations
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                Our proprietary neural engine leverages hybrid Bi-LSTM models combined with Poisson goal distribution equations.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="var(--accent-green)" />
                  <span><strong>100,000 Simulations / Match:</strong> Every game is simulated 100,000 times before kickoff.</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="var(--accent-green)" />
                  <span><strong>Multi-Market Matrix:</strong> Derives true probabilities for 1X2, Over/Under, BTTS, and Correct Scores.</span>
                </div>
              </div>
            </div>
          )}

          {activeStage === 4 && (
            <div>
              <span className="gold-badge" style={{ marginBottom: 12 }}>STAGE 04 OF 04</span>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", marginBottom: 12 }}>
                Value Edge Identification & Immutable Settlement
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                Our system compares AI true probability against live market odds to flag mispriced value opportunities (+EV).
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="var(--accent-green)" />
                  <span><strong>Mathematical Edge Formula:</strong> Edge % = (AI Prob × Bookie Odds) - 1.</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-primary)" }}>
                  <CheckCircle2 size={16} color="var(--accent-green)" />
                  <span><strong>Immutable Track Record:</strong> Every pick is timestamped before kickoff and settled against final scores.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 3: Interactive Live AI Simulator ── */}
      <section id="simulator" style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div className="gold-badge" style={{ marginBottom: 10 }}>
            <Sparkles size={12} />
            INTERACTIVE TESTBENCH
          </div>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "var(--text-primary)", margin: "0 0 10px" }}>
            Live Match Neural Simulator
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 680, margin: "0 auto" }}>
            Tweak real-world parameters like Expected Goals and form to see how the JT Apex neural network instantly recalculates outcome probabilities.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {/* Controls */}
          <div className="luxury-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <Sliders size={18} color="var(--gold)" />
              Input Telemetry Parameters
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Arsenal Recent Form:</span>
                  <strong style={{ color: "var(--gold)" }}>{homeForm}/100</strong>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={homeForm}
                  onChange={(e) => setHomeForm(Number(e.target.value))}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Chelsea Recent Form:</span>
                  <strong style={{ color: "var(--gold)" }}>{awayForm}/100</strong>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={awayForm}
                  onChange={(e) => setAwayForm(Number(e.target.value))}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Arsenal Expected Goals (xG):</span>
                  <strong style={{ color: "var(--accent-green)" }}>{homeXg.toFixed(1)} xG</strong>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.5"
                  step="0.1"
                  value={homeXg}
                  onChange={(e) => setHomeXg(Number(e.target.value))}
                />
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setHomeAdvantage(!homeAdvantage)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: homeAdvantage ? "var(--gold-bg)" : "var(--surface-raised)",
                    border: homeAdvantage ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                    color: homeAdvantage ? "var(--gold)" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {homeAdvantage ? "✓ Home Advantage (+12%)" : "+ Add Home Advantage"}
                </button>

                <button
                  type="button"
                  onClick={() => setKeyInjuries(!keyInjuries)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    background: keyInjuries ? "var(--accent-red-bg)" : "var(--surface-raised)",
                    border: keyInjuries ? "1px solid var(--accent-red)" : "1px solid var(--border-color)",
                    color: keyInjuries ? "var(--accent-red)" : "var(--text-secondary)",
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

          {/* Probability Outputs */}
          <div className="luxury-card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                  AI Probability Matrix
                </span>
                <span className="status-pill-won">100k Simulations</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "var(--text-secondary)" }}>Arsenal Win (1):</span>
                    <strong style={{ color: "var(--gold)" }}>{sim.homeProb}% (Fair @ {sim.fairOddsHome})</strong>
                  </div>
                  <div style={{ width: "100%", height: 8, background: "var(--surface-raised)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${sim.homeProb}%`, height: "100%", background: "var(--gold)", transition: "width 0.3s ease" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "var(--text-secondary)" }}>Draw (X):</span>
                    <strong style={{ color: "var(--text-primary)" }}>{sim.drawProb}%</strong>
                  </div>
                  <div style={{ width: "100%", height: 8, background: "var(--surface-raised)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${sim.drawProb}%`, height: "100%", background: "var(--text-dim)", transition: "width 0.3s ease" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "var(--text-secondary)" }}>Chelsea Win (2):</span>
                    <strong style={{ color: "var(--text-primary)" }}>{sim.awayProb}%</strong>
                  </div>
                  <div style={{ width: "100%", height: 8, background: "var(--surface-raised)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${sim.awayProb}%`, height: "100%", background: "var(--text-dim)", transition: "width 0.3s ease" }} />
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "14px 18px",
                borderRadius: 10,
                background: sim.isEdgePositive ? "var(--accent-green-bg)" : "var(--accent-red-bg)",
                border: sim.isEdgePositive ? "1px solid var(--accent-green-border)" : "1px solid var(--accent-red-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Market Value Edge</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: sim.isEdgePositive ? "var(--accent-green)" : "var(--accent-red)" }}>
                  {sim.valueEdge} Expected Value
                </div>
              </div>
              <span className={sim.isEdgePositive ? "status-pill-won" : "status-pill-lost"}>
                {sim.isEdgePositive ? "POSITIVE EV" : "NO VALUE"}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
