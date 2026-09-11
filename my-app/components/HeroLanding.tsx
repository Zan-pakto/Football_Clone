"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, ShieldCheck, Sparkles, Activity, BarChart2 } from "lucide-react";

interface HeroLandingProps {
  totalMatches?: number;
}

export default function HeroLanding({ totalMatches = 0 }: HeroLandingProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const scrollToMatches = () => {
    const el = document.getElementById("matches-feed");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      style={{
        position: "relative",
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        padding: "40px 0 60px",
        overflow: "hidden",
        background: "var(--background)",
      }}
    >
      {/* ── Ambient Gold Lighting ── */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "75vw",
          height: "55vh",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.14) 0%, rgba(201,168,76,0.03) 50%, transparent 75%)",
          filter: "blur(70px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Main Grid Container ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 1360,
          width: "100%",
          margin: "0 auto",
          padding: "20px 24px",
          display: "grid",
          gridTemplateColumns: "1.05fr 1fr",
          gap: "48px",
          alignItems: "center",
        }}
      >
        {/* ════ LEFT — Editorial Copy ════ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Small Gold Badge */}
          <div style={{ display: "inline-flex" }}>
            <span
              className="gold-badge"
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                padding: "6px 14px",
              }}
            >
              <Sparkles size={13} />
              AI-POWERED FOOTBALL INTELLIGENCE
            </span>
          </div>

          {/* Large Black Headline with Gold Accent */}
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(44px, 5.8vw, 76px)",
                fontWeight: 900,
                lineHeight: 1.04,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Predict Smarter.
              <br />
              <span style={{ color: "var(--gold)" }}>Win With Data.</span>
            </h1>
          </div>

          {/* Supporting Description */}
          <p
            style={{
              fontSize: "clamp(15px, 1.35vw, 17px)",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              maxWidth: "520px",
              fontWeight: 400,
              fontFamily: "var(--font-sans)",
              margin: 0,
            }}
          >
            JollofTips harnesses multi-variable Poisson algorithms, live expected goals (xG) telemetry, and 10,000-scenario Monte Carlo simulations across 700+ leagues to deliver quantified football betting edges.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", paddingTop: "4px" }}>
            {/* Gold Primary CTA */}
            <button
              id="hero-cta-predictions"
              onClick={scrollToMatches}
              className="gold-btn"
              style={{
                padding: "14px 28px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                borderRadius: "10px",
              }}
            >
              <span>View Today&apos;s Predictions</span>
              <ArrowRight size={16} />
            </button>

            {/* Secondary Outlined Black/Surface CTA */}
            <Link
              href="/all-matches"
              id="hero-cta-all-matches"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 24px",
                borderRadius: "10px",
                background: "var(--surface-raised)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--gold)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-color)";
                e.currentTarget.style.transform = "none";
              }}
            >
              <span>Explore Matches</span>
            </Link>
          </div>

          {/* Micro Trust Indicators */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              paddingTop: "6px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={16} color="var(--gold)" />
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                Audited 89.4% Banker Accuracy
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--accent-green)",
                  boxShadow: "0 0 8px rgba(34,197,94,0.6)",
                }}
              />
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                {totalMatches > 0 ? `${totalMatches} matches live analyzed today` : "Live telemetry active"}
              </span>
            </div>
          </div>
        </div>

        {/* ════ RIGHT — Original Football Stadium Analytics Visual ════ */}
        <div
          style={{
            position: "relative",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(32px)",
            transition:
              "opacity 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s, transform 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s",
          }}
        >
          {/* Outer Luxury Stadium Container */}
          <div
            style={{
              position: "relative",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid var(--gold-border)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.12), 0 0 0 1px rgba(201,168,76,0.15)",
              background: "var(--surface)",
            }}
          >
            {/* Custom Generated Football Analytics Stadium Visual */}
            <div style={{ position: "relative", width: "100%", height: "420px", overflow: "hidden" }}>
              <img
                src="/hero-stadium.jpg"
                alt="JollofTips Luxury Football Analytics Stadium"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 40%",
                  transform: "scale(1.02)",
                  transition: "transform 0.6s ease",
                }}
              />
              {/* Stadium gradient overlay for seamless luxury contrast */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(9,9,15,0.92) 0%, rgba(9,9,15,0.4) 45%, rgba(9,9,15,0.15) 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Top Telemetry Header Badge inside image */}
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  right: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: "999px",
                    background: "rgba(9,9,15,0.8)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    color: "var(--gold)",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  <Activity size={12} />
                  <span>MONTE CARLO SIMULATION #10,482</span>
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: "999px",
                    background: "rgba(9,9,15,0.8)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--accent-green)",
                      boxShadow: "0 0 6px #22c55e",
                    }}
                  />
                  <span>LIVE ODDS TELEMETRY</span>
                </div>
              </div>
            </div>

            {/* Inset Prediction & Statistics Overlay Card */}
            <div
              style={{
                background: "var(--surface)",
                borderTop: "1px solid var(--gold-border)",
                padding: "20px 24px",
                position: "relative",
              }}
            >
              {/* Match Header & Confidence Percentage */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      color: "var(--gold)",
                      textTransform: "uppercase",
                      marginBottom: "2px",
                    }}
                  >
                    UEFA CHAMPIONS LEAGUE · FEATURED AI CONSENSUS
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Real Madrid vs Inter Milan
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 900,
                      color: "var(--gold)",
                      lineHeight: 1,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    89%
                  </div>
                  <div
                    style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    CONFIDENCE
                  </div>
                </div>
              </div>

              {/* Stats Grid Pill Bar */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr 1fr",
                  gap: "8px",
                  background: "var(--surface-raised)",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div>
                  <div style={{ fontSize: "9px", color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase" }}>
                    AI PICK
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>
                    Home Win (1)
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "9px", color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase" }}>
                    BEST ODDS
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--gold)", fontFamily: "var(--font-mono)" }}>
                    @ 1.72
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "9px", color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase" }}>
                    xG PROJECTION
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    2.34 - 0.88
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Breakpoints */}
      <style>{`
        @media (max-width: 960px) {
          section > div {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
            padding: 10px 16px !important;
          }
        }
      `}</style>
    </section>
  );
}
