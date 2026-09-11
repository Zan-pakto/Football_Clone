"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  Globe2,
  BrainCircuit,
  BarChart3,
  Cpu,
  Target,
  Flame,
  CheckCircle2,
  ArrowRight,
  Database,
  Layers,
  Activity,
  Sliders,
  Award,
} from "lucide-react";

interface TrustStripProps {
  totalMatches?: number;
}

// ── 3. Trust / Statistics Strip ──
export function TrustStrip({ totalMatches = 0 }: TrustStripProps) {
  const stats = [
    {
      value: "100,000+",
      label: "Matches Analyzed",
      sub: "Historical backtest ledger",
      icon: Database,
    },
    {
      value: "700+",
      label: "Leagues Covered",
      sub: "Global tier 1 to tier 4",
      icon: Globe2,
    },
    {
      value: "89.4%",
      label: "Banker Accuracy",
      sub: "Top confidence tier",
      icon: Target,
    },
    {
      value: totalMatches > 0 ? `${totalMatches}` : "500+",
      label: "Predictions Today",
      sub: "Updated in real-time",
      icon: Zap,
    },
  ];

  return (
    <section
      style={{
        borderTop: "1px solid var(--border-color)",
        borderBottom: "1px solid var(--border-color)",
        background: "var(--surface-raised)",
        padding: "36px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px",
        }}
      >
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "12px 16px",
                borderRadius: "12px",
                background: "var(--surface)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "var(--gold-bg)",
                  border: "1px solid var(--gold-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--gold)",
                  flexShrink: 0,
                }}
              >
                <Icon size={22} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                    lineHeight: 1.1,
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginTop: "2px",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    fontWeight: 500,
                  }}
                >
                  {item.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── 4. How JollofTips Works ──
export function HowJollofTipsWorks() {
  const steps = [
    {
      num: "01",
      title: "Match Data & Telemetry",
      desc: "Ingests millions of verified data points: real-time xG, passing networks, player fatigue, team rotation, weather conditions, and referee tendencies.",
      icon: Database,
    },
    {
      num: "02",
      title: "Statistical Analysis",
      desc: "Applies bivariate Poisson distribution matrices and Bayesian dynamic form weighting to remove human emotion and isolate true mathematical probability.",
      icon: BarChart3,
    },
    {
      num: "03",
      title: "AI Prediction Engine",
      desc: "Simulates each fixture 10,000 times through the proprietary JT Apex neural network, predicting outcomes for 1X2, Over/Under, and Both Teams To Score.",
      icon: BrainCircuit,
    },
    {
      num: "04",
      title: "Confidence & Value Score",
      desc: "Assigns a calibrated 0–100% confidence score and identifies discrepancies between algorithmic odds and bookmaker market inefficiencies.",
      icon: Award,
    },
  ];

  return (
    <section
      id="how-it-works"
      style={{
        padding: "80px 20px",
        maxWidth: 1360,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 50px" }}>
        <div className="gold-badge" style={{ marginBottom: 14 }}>
          <Sparkles size={12} />
          QUANTITATIVE METHODOLOGY
        </div>
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 900,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            margin: "0 0 14px",
          }}
        >
          How JollofTips Works
        </h2>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
          Four disciplined quantitative steps transform raw sports telemetry into high-confidence match intelligence.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="luxury-card"
              style={{
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "var(--gold)",
                    background: "var(--gold-bg)",
                    border: "1px solid var(--gold-border)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                  }}
                >
                  STEP {s.num}
                </span>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-primary)",
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>

              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                  margin: "0 0 10px",
                }}
              >
                {s.title}
              </h3>

              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.65,
                  margin: 0,
                  flexGrow: 1,
                }}
              >
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── 6. AI Intelligence Section ──
export function AIIntelligenceSection() {
  const models = [
    {
      title: "Expected Goals (xG) Regressions",
      desc: "Shot-location quality metrics, danger zone entries, and conversion probabilities replace noisy surface scores with underlying football performance reality.",
      metric: "0.01xG precision",
    },
    {
      title: "10,000-Scenario Monte Carlo",
      desc: "Every matchup is run ten thousand times across stochastic permutations to quantify scorelines, draw probability, and goal line variance.",
      metric: "10k iterations/match",
    },
    {
      title: "Poisson Goal Distribution",
      desc: "Independent attack-defense strength ratings evaluate the exact likelihood of 0, 1, 2, 3+ goals for both home and away sides.",
      metric: "Bivariate density",
    },
    {
      title: "Market Discrepancy Radar",
      desc: "Continuously scans global odds movements to highlight positive Expected Value (+EV) bets where sportsbooks underprice true probabilities.",
      metric: "Live +EV identification",
    },
  ];

  return (
    <section
      style={{
        padding: "80px 20px",
        background: "var(--surface-raised)",
        borderTop: "1px solid var(--border-color)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <div style={{ maxWidth: 1360, margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 50px" }}>
          <div className="gold-badge" style={{ marginBottom: 14 }}>
            <Cpu size={12} />
            JT APEX AI ENGINE
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 900,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              margin: "0 0 14px",
            }}
          >
            Engineering Unbiased Match Intelligence
          </h2>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
            Our multi-layer prediction architecture strips away human bias, gut feelings, and media narratives to deliver purely quantitative football probabilities.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {models.map((m, idx) => (
            <div
              key={idx}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-color)",
                borderRadius: "14px",
                padding: "26px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-block",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--gold)",
                    background: "var(--gold-bg)",
                    border: "1px solid var(--gold-border)",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    marginBottom: "12px",
                  }}
                >
                  {m.metric}
                </div>
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    margin: "0 0 8px",
                  }}
                >
                  {m.title}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
                  {m.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 7. Performance / Accuracy Section ──
export function PerformanceAccuracySection() {
  const tiers = [
    {
      name: "Banker Picks",
      range: "85% – 95% Confidence",
      rate: "89.4%",
      desc: "Top echelon AI consensus with overwhelming Poisson alignment.",
      color: "var(--gold)",
    },
    {
      name: "Value Edge",
      range: "75% – 84% Confidence",
      rate: "78.2%",
      desc: "High positive expected value picks capitalizing on sportsbook mispricing.",
      color: "var(--accent-green)",
    },
    {
      name: "Consensus",
      range: "70% – 74% Confidence",
      rate: "71.6%",
      desc: "Solid probability selections for multi-leg accumulators and combos.",
      color: "var(--text-primary)",
    },
  ];

  return (
    <section style={{ padding: "80px 20px", maxWidth: 1360, margin: "0 auto" }}>
      <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 50px" }}>
        <div className="gold-badge" style={{ marginBottom: 14 }}>
          <ShieldCheck size={12} />
          VERIFIED TRACK RECORD
        </div>
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 42px)",
            fontWeight: 900,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            margin: "0 0 14px",
          }}
        >
          Performance & Accuracy Breakdown
        </h2>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
          Every prediction is audited and recorded in an immutable public ledger. We publish transparent accuracy tiers rather than cherry-picked highlights.
        </p>
      </div>

      {/* Tier Matrix Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {tiers.map((t, idx) => (
          <div
            key={idx}
            className="luxury-card"
            style={{
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              borderTop: `3px solid ${t.color}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 4px" }}>
                  {t.name}
                </h3>
                <span style={{ fontSize: "12px", color: "var(--text-dim)", fontWeight: 600 }}>
                  {t.range}
                </span>
              </div>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 900,
                  fontFamily: "var(--font-mono)",
                  color: t.color,
                  lineHeight: 1,
                }}
              >
                {t.rate}
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65, margin: "0 0 20px" }}>
              {t.desc}
            </p>

            {/* Visual Bar */}
            <div style={{ height: "6px", background: "var(--surface-raised)", borderRadius: "3px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: t.rate,
                  background: t.color,
                  borderRadius: "3px",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Transparent Ledger CTA */}
      <div style={{ textAlign: "center" }}>
        <Link
          href="/progress"
          className="gold-btn"
          style={{
            padding: "12px 28px",
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          <span>Explore Verified Historical Audit Ledger</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}

// ── 8. Why JollofTips (5 Core Pillars) ──
export function WhyJollofTips() {
  const pillars = [
    {
      title: "AI-Powered Predictions",
      desc: "Machine learning algorithms trained on over a decade of match records calculate unbiased probabilities without emotional attachment.",
      icon: Cpu,
    },
    {
      title: "700+ Global Leagues",
      desc: "From the Premier League and UEFA Champions League to regional tier 3 divisions, receive consistent analytical depth across all competitions.",
      icon: Globe2,
    },
    {
      title: "Calibrated Confidence Scores",
      desc: "Every tip comes with a quantified percentage score so you immediately understand the mathematical edge and risk profile.",
      icon: Target,
    },
    {
      title: "Historical Transparency",
      desc: "Every single bet outcome is archived into our publicly accessible performance ledger. No deleted losses, no fabricated records.",
      icon: ShieldCheck,
    },
    {
      title: "Data-Driven Value Edge",
      desc: "Algorithms compare modeled probabilities against current market odds to identify mispriced lines before market correction.",
      icon: TrendingUp,
    },
  ];

  return (
    <section
      style={{
        padding: "80px 20px",
        background: "var(--surface-raised)",
        borderTop: "1px solid var(--border-color)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      <div style={{ maxWidth: 1360, margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 50px" }}>
          <div className="gold-badge" style={{ marginBottom: 14 }}>
            <Award size={12} />
            THE JOLLOFTIPS ADVANTAGE
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 900,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              margin: "0 0 14px",
            }}
          >
            Why Choose JollofTips
          </h2>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
            Built for analytical punters who value mathematical rigor, transparency, and statistical edges over generic sports chatter.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="luxury-card"
                style={{
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "var(--gold-bg)",
                    border: "1px solid var(--gold-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--gold)",
                  }}
                >
                  <Icon size={20} />
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  {p.title}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── 9. Premium CTA Banner ──
export function PremiumCTABanner() {
  return (
    <section style={{ padding: "80px 20px", maxWidth: 1360, margin: "0 auto" }}>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--gold-border)",
          borderRadius: "20px",
          padding: "48px 36px",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(0,0,0,0.06), 0 0 0 1px rgba(201,168,76,0.12)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "60%",
            height: "100%",
            background: "radial-gradient(ellipse at 50% 0%, var(--gold-glow) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
          <div className="gold-badge" style={{ marginBottom: 16 }}>
            <Sparkles size={12} />
            INSTANT ANALYTICAL ACCESS
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 4.5vw, 44px)",
              fontWeight: 900,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
              margin: "0 0 16px",
              lineHeight: 1.15,
            }}
          >
            Elevate Your Football Predictions With AI Intelligence
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "var(--text-secondary)",
              lineHeight: 1.65,
              margin: "0 0 32px",
            }}
          >
            Access today&apos;s computer-simulated picks, xG breakdowns, and high-confidence banker predictions across 700+ worldwide leagues.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/all-matches"
              className="gold-btn"
              style={{
                padding: "14px 32px",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <span>Explore All Predictions</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/pricing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                borderRadius: "10px",
                background: "var(--surface-raised)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <span>View VIP Plans</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
