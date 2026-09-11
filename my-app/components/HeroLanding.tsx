"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";

interface HeroLandingProps {
  totalMatches?: number;
}

export default function HeroLanding({ totalMatches = 0 }: HeroLandingProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
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
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        padding: "0 0 0",
        overflow: "hidden",
      }}
    >
      {/* ── Ambient Gold Glow (top-center) ── */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70vw",
          height: "60vh",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 45%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Right side ambient ── */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          right: "-5%",
          width: "40vw",
          height: "50vh",
          background:
            "radial-gradient(ellipse at 100% 50%, rgba(201,168,76,0.06) 0%, transparent 65%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Main Grid Container ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 1280,
          width: "100%",
          margin: "0 auto",
          padding: "120px 32px 80px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "64px",
          alignItems: "center",
        }}
      >
        {/* ════ LEFT — Editorial Copy ════ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(32px)",
            transition: "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {/* Overline */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "1px",
                background: "var(--gold)",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.14em",
                color: "var(--gold)",
                textTransform: "uppercase",
                fontFamily: "var(--font-sans)",
              }}
            >
              AI-Powered Football Intelligence
            </span>
          </div>

          {/* Display Headline */}
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(56px, 7vw, 96px)",
                fontWeight: 800,
                lineHeight: 1.0,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              Predict.
              <br />
              <span style={{ color: "var(--gold)" }}>Win.</span>
              <br />
              Repeat.
            </h1>
          </div>

          {/* Descriptor */}
          <p
            style={{
              fontSize: "clamp(15px, 1.4vw, 17px)",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              maxWidth: "420px",
              fontWeight: 400,
              fontFamily: "var(--font-sans)",
              margin: 0,
            }}
          >
            JollofTips generates AI predictions for every football match played
            anywhere in the world — 700+ leagues, updated daily.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            {/* Primary — Gold ghost */}
            <button
              id="hero-cta-predictions"
              onClick={scrollToMatches}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "14px 28px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid var(--gold)",
                color: "var(--gold)",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                letterSpacing: "0.02em",
                transition: "all 0.22s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--gold)";
                e.currentTarget.style.color = "#09090f";
                e.currentTarget.style.boxShadow = "0 6px 28px rgba(201,168,76,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--gold)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span>See Today&apos;s Picks</span>
              <ArrowRight style={{ width: 16, height: 16 }} />
            </button>

            {/* Secondary — ghost text link */}
            <Link
              href="/all-matches"
              id="hero-cta-all-matches"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 24px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid var(--border-strong)",
                color: "var(--text-secondary)",
                fontSize: "14px",
                fontWeight: 500,
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                letterSpacing: "0.01em",
                transition: "all 0.22s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-strong)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <span>All Matches</span>
            </Link>
          </div>

          {/* Social proof strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              paddingTop: "8px",
              flexWrap: "wrap",
            }}
          >
            {[
              { label: totalMatches > 0 ? `${totalMatches}` : "500+", sub: "Matches Today" },
              { label: "700+", sub: "Leagues Covered" },
              { label: "89%", sub: "AI Accuracy" },
            ].map((stat) => (
              <div key={stat.sub} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {stat.label}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-dim)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {stat.sub}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ════ RIGHT — Prestige Preview Card ════ */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(48px)",
            transition:
              "opacity 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s",
          }}
        >
          {/* Main Prediction Card */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              borderRadius: "20px",
              padding: "32px",
              backdropFilter: "blur(20px)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.08), 0 0 0 1px var(--gold-border)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Gold corner accent */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "140px",
                height: "140px",
                background:
                  "radial-gradient(circle at 100% 0%, var(--gold-glow) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Card header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "var(--text-gold)",
                    textTransform: "uppercase",
                    fontFamily: "var(--font-sans)",
                    marginBottom: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />
                  AI Bet of the Day
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  Highest confidence pick
                </div>
              </div>

              {/* Confidence Badge */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "30px",
                    fontWeight: 700,
                    color: "var(--text-gold)",
                    lineHeight: 1,
                  }}
                >
                  89%
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--text-dim)",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginTop: "3px",
                  }}
                >
                  Confidence
                </span>
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                background: "var(--border)",
                marginBottom: "24px",
              }}
            />

            {/* Match row with authentic team logos and flags */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              {/* Home team */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  flex: 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border-strong)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      position: "relative",
                    }}
                  >
                    <img
                      src="https://media.api-sports.io/football/teams/541.png"
                      alt="Real Madrid"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      background: "var(--surface-overlay)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      border: "1px solid var(--border)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>🇪🇸</span> ESP
                  </span>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Real Madrid
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                      marginTop: "2px",
                    }}
                  >
                    Home · Win favoured
                  </div>
                </div>
              </div>

              {/* vs Badge */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  padding: "0 12px",
                }}
              >
                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border-strong)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  VS
                </div>
              </div>

              {/* Away team */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "8px",
                  flex: 1,
                  textAlign: "right",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexDirection: "row-reverse" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border-strong)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      position: "relative",
                    }}
                  >
                    <img
                      src="https://media.api-sports.io/football/teams/505.png"
                      alt="Inter Milan"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      background: "var(--surface-overlay)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      border: "1px solid var(--border)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>🇮🇹</span> ITA
                  </span>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Inter Milan
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                      marginTop: "2px",
                    }}
                  >
                    Away · Form 4-1-0
                  </div>
                </div>
              </div>
            </div>

            {/* Prediction result box */}
            <div
              style={{
                background: "var(--gold-bg)",
                border: "1px solid var(--gold-border)",
                borderRadius: "12px",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: "var(--text-gold)",
                    textTransform: "uppercase",
                    marginBottom: "3px",
                  }}
                >
                  AI Prediction Pick
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Home Win (1)
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    marginBottom: "3px",
                  }}
                >
                  Odds
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "var(--text-gold)",
                  }}
                >
                  1.72
                </div>
              </div>
            </div>

            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { icon: TrendingUp, text: "Statistical model consensus: 89% Strong", color: "var(--accent-green)" },
                { icon: Shield, text: "UEFA Champions League · Group Stage · Santiago Bernabéu", color: "var(--gold)" },
              ].map(({ icon: Icon, text, color }) => (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <Icon
                    style={{
                      width: 15,
                      height: 15,
                      color: color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom floating stats pill */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                borderRadius: "999px",
                background: "var(--surface)",
                border: "1px solid var(--border-strong)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                fontSize: "12px",
                color: "var(--text-primary)",
                fontWeight: 600,
              }}
            >
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "var(--accent-green)",
                  boxShadow: "0 0 8px rgba(34,197,94,0.6)",
                }}
                className="live-pulse"
              />
              <span>
                {totalMatches > 0
                  ? `${totalMatches} predictions live now`
                  : "Predictions updated daily"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Responsive: stack on mobile ── */}
      <style>{`
        @media (max-width: 900px) {
          section > div {
            grid-template-columns: 1fr !important;
            padding: 100px 20px 60px !important;
            gap: 48px !important;
          }
        }
      `}</style>
    </section>
  );
}
