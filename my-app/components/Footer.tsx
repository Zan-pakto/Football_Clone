"use client";

import Link from "next/link";
import { ShieldCheck, Trophy, Globe, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    Predictions: [
      { label: "Today's Picks", href: "/" },
      { label: "All Matches", href: "/all-matches" },
      { label: "Bet of the Day", href: "/bet-of-the-day" },
      { label: "Bet Builder", href: "/bet-builder" },
      { label: "Leagues", href: "/leagues" },
    ],
    Tools: [
      { label: "Hit & Win", href: "/hit-and-win" },
      { label: "Progress Tracker", href: "/progress" },
      { label: "Live Matches", href: "/live" },
      { label: "How It Works", href: "/how-it-works" },
    ],
    Company: [
      { label: "Blog", href: "/blog" },
      { label: "Pricing", href: "/pricing" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Join", href: "/join" },
    ],
  };

  return (
    <footer
      style={{
        background: "#09090f",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        color: "#8a8a9a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Very subtle top gold glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "500px",
          height: "120px",
          background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "72px 32px 40px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Main Grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr repeat(3, 1fr)",
            gap: "40px 48px",
            marginBottom: 56,
          }}
        >
          {/* Brand Column */}
          <div>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.28)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "#c9a84c",
                    fontWeight: 800,
                    fontSize: 15,
                    letterSpacing: "-0.5px",
                  }}
                >
                  JT
                </span>
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#f5f3ee",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                JOLLOF<span style={{ color: "#c9a84c" }}>TIPS</span>
              </span>
            </Link>

            <p
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: "#484858",
                margin: "0 0 24px",
                maxWidth: 280,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              High-conviction AI football prediction models across 700+ global
              leagues. Free daily tips, updated in real time.
            </p>

            {/* Status pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 14px",
                borderRadius: 999,
                background: "rgba(34,197,94,0.06)",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 8px rgba(34,197,94,0.6)",
                }}
                className="live-pulse"
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", letterSpacing: "0.04em" }}>
                AI Model Active
              </span>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "#c9a84c",
                  textTransform: "uppercase",
                  marginBottom: 18,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {title}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    style={{
                      fontSize: 13,
                      color: "#484858",
                      textDecoration: "none",
                      fontWeight: 400,
                      transition: "color 0.18s ease",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#f5f3ee";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#484858";
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Divider ── */}
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.05)",
            marginBottom: 32,
          }}
        />

        {/* ── Bottom Bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#2a2a3d", fontFamily: "'Inter', sans-serif" }}>
              © {currentYear} JollofTips. All rights reserved.
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck style={{ width: 12, height: 12, color: "#2a2a3d" }} />
              <span style={{ fontSize: 11, color: "#2a2a3d", fontFamily: "'Inter', sans-serif" }}>
                For informational purposes only. Bet responsibly.
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Globe style={{ width: 12, height: 12, color: "#2a2a3d" }} />
              <span style={{ fontSize: 11, color: "#2a2a3d", fontFamily: "'Inter', sans-serif" }}>
                700+ Leagues
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Trophy style={{ width: 12, height: 12, color: "#c9a84c" }} />
              <span style={{ fontSize: 11, color: "#484858", fontFamily: "'Inter', sans-serif" }}>
                89% AI Accuracy
              </span>
            </div>
            <Link
              href="/progress"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11,
                color: "#c9a84c",
                textDecoration: "none",
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                transition: "opacity 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              <ArrowUpRight style={{ width: 12, height: 12 }} />
              Track Record
            </Link>
          </div>
        </div>
      </div>

      {/* Responsive footer grid */}
      <style>{`
        @media (max-width: 900px) {
          footer > div > div:first-child {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 540px) {
          footer > div > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
