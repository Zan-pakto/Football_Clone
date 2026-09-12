"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  CheckCircle2,
  ArrowRight,
  Database,
  Filter,
  Brain,
  Layers,
} from "lucide-react";
import Link from "next/link";

export default function HowItWorks() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section 
      id="how-it-works" 
      className="scroll-mt-20"
      style={{
        position: "relative",
        padding: "90px 20px 110px",
        background: "transparent",
        overflow: "hidden",
      }}
    >
      <span id="story" style={{ position: "absolute", top: -80, left: 0 }} />

      {/* Embedded High-Performance CSS Animations for moving nodes and signals */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flowDashGold {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes pulseGoldRing {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.18); opacity: 1; }
        }

        @keyframes outputSuccessPulseGold {
          0%, 100% { box-shadow: 0 0 10px rgba(212, 175, 55, 0.3); transform: scale(1); }
          50% { box-shadow: 0 0 22px rgba(212, 175, 55, 0.7); transform: scale(1.06); }
        }

        .gold-stream-line {
          stroke-dasharray: 4, 4;
          animation: flowDashGold 1s linear infinite;
        }

        .gold-synapse {
          stroke-dasharray: 3, 3;
          animation: flowDashGold 0.8s linear infinite;
        }
      `}} />

      <div style={{ maxWidth: 1320, margin: "0 auto", position: "relative", zIndex: 1 }}>
        
        {/* Section Header */}
        <div style={{ textAlign: "center", maxWidth: 800, margin: "0 auto 60px" }}>
          <div className="gold-badge" style={{ marginBottom: 16 }}>
            <Sparkles size={12} />
            <span>BEHIND THE AI PREDICTIONS</span>
          </div>

          <h2 style={{
            fontSize: "clamp(30px, 4.5vw, 48px)",
            fontWeight: 900,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
            marginBottom: 16,
          }}>
            How Our AI Football Predictions Work
          </h2>

          <p style={{
            fontSize: "clamp(14px, 1.8vw, 16px)",
            color: "var(--text-secondary)",
            lineHeight: 1.65,
            maxWidth: 720,
            margin: "0 auto",
          }}>
            Our multi-tiered algorithmic pipeline processes millions of live data points across 160+ leagues to generate unbiased, high-probability betting insights.
          </p>
        </div>

        {/* 3 Interactive Visual Step Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: 24,
          marginBottom: 48,
        }}>
          
          {/* ── CARD 01: Data Collection & Integration ── */}
          <div
            className="luxury-card"
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderColor: hoveredCard === 1 ? "var(--gold)" : "var(--border-color)",
              transform: hoveredCard === 1 ? "translateY(-4px)" : "none",
              transition: "all 0.25s ease",
            }}
          >
            <div>
              <div style={{ marginBottom: 20 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 6,
                    background: "var(--gold-bg)",
                    border: "1px solid var(--gold-border)",
                    color: "var(--gold)",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  STEP 01
                </span>
              </div>

              {/* Vector Diagram: Sensor Ingestion Box */}
              <div
                style={{
                  height: 170,
                  borderRadius: 14,
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-color)",
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 16px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Left Telemetry Pills */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 80 }}>
                  {[
                    { icon: "POI", label: "01" },
                    { icon: "xG", label: "02" },
                    { icon: "SIM", label: "03" },
                    { icon: "VAL", label: "04" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--gold)",
                      }}
                    >
                      <span style={{ fontSize: 9, opacity: 0.8 }}>{item.icon}</span>
                      <span style={{ fontSize: 9, color: "var(--text-dim)" }}>{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Animated Connecting Stream Curves */}
                <svg width="100" height="120" viewBox="0 0 100 120" fill="none" style={{ flex: 1, margin: "0 4px" }}>
                  <path d="M 10 20 C 50 20, 60 60, 95 60" stroke="var(--gold)" strokeWidth="1.5" className="gold-stream-line" opacity="0.7" />
                  <path d="M 10 48 C 50 48, 60 60, 95 60" stroke="var(--gold-light)" strokeWidth="1.5" className="gold-stream-line" opacity="0.9" />
                  <path d="M 10 75 C 50 75, 60 60, 95 60" stroke="var(--gold)" strokeWidth="1.5" className="gold-stream-line" opacity="0.7" />
                  <path d="M 10 102 C 50 102, 60 60, 95 60" stroke="var(--gold-light)" strokeWidth="1.5" className="gold-stream-line" opacity="0.9" />
                  <circle cx="20" cy="20" r="3" fill="var(--gold)">
                    <animate attributeName="cx" values="10;90" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="20;60" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="20" cy="102" r="3" fill="var(--gold-light)">
                    <animate attributeName="cx" values="10;90" dur="1.4s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="102;60" dur="1.4s" repeatCount="indefinite" />
                  </circle>
                </svg>

                {/* Central Processor Core */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    background: "var(--gold-bg)",
                    border: "2px solid var(--gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 20px var(--gold-glow)",
                    position: "relative",
                  }}
                >
                  <Database size={26} color="var(--gold)" />
                  <div
                    style={{
                      position: "absolute",
                      inset: -6,
                      borderRadius: 18,
                      border: "1px dashed var(--gold-border)",
                      animation: "pulseGoldRing 2s infinite ease-in-out",
                    }}
                  />
                </div>
              </div>

              {/* Text Description */}
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>
                Data Collection and Integration
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                Our software collects verified football data from official and licensed sports data providers through secure APIs. This information covers every aspect of the game — from match statistics, xG (expected goals), and ball possession to player rotation and live odds fluctuations.
              </p>
            </div>
          </div>

          {/* ── CARD 02: Data Normalization & Validation ── */}
          <div
            className="luxury-card"
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderColor: hoveredCard === 2 ? "var(--gold)" : "var(--border-color)",
              transform: hoveredCard === 2 ? "translateY(-4px)" : "none",
              transition: "all 0.25s ease",
            }}
          >
            <div>
              <div style={{ marginBottom: 20 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 6,
                    background: "var(--gold-bg)",
                    border: "1px solid var(--gold-border)",
                    color: "var(--gold)",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  STEP 02
                </span>
              </div>

              {/* Vector Diagram: Normalization Funnel */}
              <div
                style={{
                  height: 170,
                  borderRadius: 14,
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-color)",
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  padding: "0 16px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Noisy Raw Inputs */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 65 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 44, height: 6, background: "var(--border-strong)", borderRadius: 3 }} />
                    <span style={{ fontSize: 10, color: "var(--accent-red)", fontWeight: 900 }}>×</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 32, height: 6, background: "var(--border-strong)", borderRadius: 3 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 48, height: 6, background: "var(--border-strong)", borderRadius: 3 }} />
                    <span style={{ fontSize: 10, color: "var(--accent-red)", fontWeight: 900 }}>×</span>
                  </div>
                </div>

                <span style={{ fontSize: 14, color: "var(--text-dim)", fontWeight: 700 }}>→</span>

                {/* Filter Funnel Unit */}
                <div
                  style={{
                    width: 58,
                    height: 70,
                    borderRadius: 12,
                    background: "var(--bg-card)",
                    border: "1.5px solid var(--gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 16px var(--gold-glow)",
                  }}
                >
                  <Filter size={24} color="var(--gold)" />
                </div>

                <span style={{ fontSize: 14, color: "var(--text-dim)", fontWeight: 700 }}>→</span>

                {/* Normalized Validated Output Lines */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 75, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      top: -16,
                      right: 0,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--accent-green-bg)",
                      border: "1.5px solid var(--accent-green)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle2 size={13} color="var(--accent-green)" />
                  </div>
                  <div style={{ width: 60, height: 6, background: "var(--gold)", borderRadius: 3, boxShadow: "0 0 8px var(--gold-glow)" }} />
                  <div style={{ width: 45, height: 6, background: "var(--gold)", borderRadius: 3, boxShadow: "0 0 8px var(--gold-glow)" }} />
                  <div style={{ width: 55, height: 6, background: "var(--gold)", borderRadius: 3, boxShadow: "0 0 8px var(--gold-glow)" }} />
                </div>
              </div>

              {/* Text Description */}
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>
                Data Normalization and Validation
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                Once collected, the data must be normalized to ensure quality and consistency. Machine learning models require standardized and validated inputs. Every dataset is cleaned, structured, and cross-referenced to remove noise and anomalies before entering the neural pipeline.
              </p>
            </div>
          </div>

          {/* ── CARD 03: Predictive Intelligence with JT Apex ── */}
          <div
            className="luxury-card"
            onMouseEnter={() => setHoveredCard(3)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderColor: hoveredCard === 3 ? "var(--gold)" : "var(--border-color)",
              transform: hoveredCard === 3 ? "translateY(-4px)" : "none",
              transition: "all 0.25s ease",
            }}
          >
            <div>
              <div style={{ marginBottom: 20 }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 6,
                    background: "var(--gold-bg)",
                    border: "1px solid var(--gold-border)",
                    color: "var(--gold)",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  STEP 03
                </span>
              </div>

              {/* Vector Diagram: Neural Network Synapses */}
              <div
                style={{
                  height: 170,
                  borderRadius: 14,
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-color)",
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 12px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <svg width="100%" height="130" viewBox="0 0 280 130" fill="none">
                  {/* Layer 1 to Layer 2 */}
                  <line x1="30" y1="25" x2="105" y2="20" stroke="var(--gold)" strokeWidth="1" opacity="0.6" className="gold-synapse" />
                  <line x1="30" y1="25" x2="105" y2="65" stroke="var(--gold)" strokeWidth="1.5" className="gold-synapse" />
                  <line x1="30" y1="65" x2="105" y2="65" stroke="var(--gold-light)" strokeWidth="2" className="gold-synapse" />
                  <line x1="30" y1="105" x2="105" y2="65" stroke="var(--gold)" strokeWidth="1.5" className="gold-synapse" />
                  <line x1="30" y1="105" x2="105" y2="110" stroke="var(--gold)" strokeWidth="1" opacity="0.6" className="gold-synapse" />

                  {/* Layer 2 to Layer 3 */}
                  <line x1="105" y1="20" x2="180" y2="35" stroke="var(--gold)" strokeWidth="1" opacity="0.6" className="gold-synapse" />
                  <line x1="105" y1="65" x2="180" y2="35" stroke="var(--gold-light)" strokeWidth="2" className="gold-synapse" />
                  <line x1="105" y1="65" x2="180" y2="95" stroke="var(--gold-light)" strokeWidth="2" className="gold-synapse" />
                  <line x1="105" y1="110" x2="180" y2="95" stroke="var(--gold)" strokeWidth="1" opacity="0.6" className="gold-synapse" />

                  {/* Layer 3 to Output Node */}
                  <line x1="180" y1="35" x2="245" y2="65" stroke="var(--accent-green)" strokeWidth="2.5" className="gold-synapse" />
                  <line x1="180" y1="95" x2="245" y2="65" stroke="var(--accent-green)" strokeWidth="2.5" className="gold-synapse" />

                  {/* Nodes */}
                  <circle cx="30" cy="25" r="5" fill="var(--gold)" />
                  <circle cx="30" cy="65" r="5.5" fill="var(--gold-light)" />
                  <circle cx="30" cy="105" r="5" fill="var(--gold)" />

                  <circle cx="105" cy="20" r="5.5" fill="var(--gold)" />
                  <circle cx="105" cy="65" r="7" fill="var(--gold-light)" stroke="var(--gold)" strokeWidth="2" />
                  <circle cx="105" cy="110" r="5.5" fill="var(--gold)" />

                  <circle cx="180" cy="35" r="6" fill="var(--gold-light)" />
                  <circle cx="180" cy="95" r="6" fill="var(--gold-light)" />

                  {/* Output Node (Gold/Green verified) */}
                  <circle cx="245" cy="65" r="16" fill="var(--accent-green-bg)" stroke="var(--accent-green)" strokeWidth="2" />
                </svg>

                <div style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  <CheckCircle2 size={18} color="var(--accent-green)" />
                </div>
              </div>

              {/* Text Description */}
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>
                Predictive Intelligence with JT Apex
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                At this stage, our proprietary model, <strong>JT Apex</strong>, takes over. Developed by our AI engineering team, JT Apex combines deep neural networks with pattern recognition to interpret complex football dynamics and generate high-probability value predictions.
              </p>
            </div>
          </div>

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
