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
      { label: "Live Matches", href: "/all-matches" },
      { label: "How It Works", href: "/how-it-works" },
    ],
    Company: [
      { label: "Blog", href: "/blog" },
      { label: "VIP Pricing", href: "/pricing" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Account", href: "/account" },
    ],
  };

  return (
    <footer
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-color)",
        color: "var(--text-secondary)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "60px 24px 36px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Main Grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "40px",
            marginBottom: 48,
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
                  borderRadius: 10,
                  background: "var(--gold-bg)",
                  border: "1px solid var(--gold-border)",
                  color: "var(--gold)",
                  fontWeight: 900,
                  fontSize: 14,
                }}
              >
                JT
              </div>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.03em",
                }}
              >
                JOLLOF<span style={{ color: "var(--gold)" }}>TIPS</span>
              </span>
            </Link>

            <p
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--text-secondary)",
                marginBottom: 20,
              }}
            >
              High-accuracy statistical algorithmic match tips across 160+ football leagues worldwide.
            </p>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="gold-badge">
                <ShieldCheck size={12} />
                Audited Ledger
              </span>
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 14,
                }}
              >
                {category}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        transition: "color 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--gold)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom Bar ── */}
        <div
          style={{
            borderTop: "1px solid var(--border-color)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 12,
            color: "var(--text-dim)",
          }}
        >
          <p>© {currentYear} JollofTips. All algorithmic models & rights reserved.</p>
          <p>Strictly 18+ · Please gamble responsibly.</p>
        </div>
      </div>
    </footer>
  );
}
