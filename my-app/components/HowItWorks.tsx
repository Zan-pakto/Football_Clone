"use client";

import React, { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Filter, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Brain,
  Cpu,
  Layers
} from "lucide-react";
import Link from "next/link";

export default function HowItWorks() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const steps = [
    {
      num: "01",
      icon: <Layers size={22} color="var(--gold)" />,
      title: "Data Ingestion & Optical Tracking",
      desc: "Scrapes over 4,200 data points per fixture — including xG, pitch dimensions, lineup rotation, and real-time sharp market movements.",
      tag: "Live Pipeline",
    },
    {
      num: "02",
      icon: <Brain size={22} color="var(--gold)" />,
      title: "JT Apex Neural Engine",
      desc: "Simulates each matchup 100,000 times using Poisson distribution & Bi-LSTM neural networks to calculate authentic outcome probabilities.",
      tag: "100k Monte Carlo Runs",
    },
    {
      num: "03",
      icon: <Target size={22} color="var(--gold)" />,
      title: "Mathematical Value Edge",
      desc: "Identifies discrepancies where model probabilities exceed bookmaker implied odds, highlighting positive expected value (+EV) picks.",
      tag: "+EV Identification",
    },
  ];

  return (
    <section 
      id="how-it-works" 
      className="scroll-mt-20"
      style={{
        position: "relative",
        padding: "80px 20px 100px",
        background: "transparent",
        overflow: "hidden",
      }}
    >
      <span id="story" style={{ position: "absolute", top: -80, left: 0 }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
        
        {/* Section Header */}
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 56px" }}>
          <div className="gold-badge" style={{ marginBottom: 14 }}>
            <Sparkles size={12} />
            HOW IT WORKS
          </div>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 900,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            marginBottom: 16,
          }}>
            From Stadium Telemetry to <span style={{ color: "var(--gold)" }}>Verified Intelligence</span>
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            A rigorous quantitative framework transforming raw statistics into high-conviction mathematical tips.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
          marginBottom: 48,
        }}>
          {steps.map((s, idx) => (
            <div
              key={s.num}
              className="luxury-card"
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                padding: "32px 28px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderColor: hoveredCard === idx ? "var(--gold)" : "var(--border-color)",
                transform: hoveredCard === idx ? "translateY(-4px)" : "none",
                transition: "all 0.25s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "var(--gold-bg)",
                    border: "1px solid var(--gold-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {s.icon}
                  </div>
                  <span style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: "var(--text-dim)",
                    fontFamily: "var(--font-mono)",
                  }}>
                    {s.num}
                  </span>
                </div>

                <span style={{
                  display: "inline-block",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "var(--gold)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 8,
                }}>
                  {s.tag}
                </span>

                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>
                  {s.title}
                </h3>

                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {s.desc}
                </p>
              </div>

              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 16, marginTop: 24, display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>
                <CheckCircle2 size={14} />
                <span>Algorithmic Step Complete</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Call to action link */}
        <div style={{ textAlign: "center" }}>
          <Link
            href="/how-it-works"
            className="gold-btn"
            style={{ padding: "12px 28px", fontSize: 14 }}
          >
            <span>Read Detailed Mathematical Documentation</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
