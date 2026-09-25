"use client";

import Link from "next/link";
import { ShieldCheck, ArrowUpRight, ShieldAlert, Sparkles } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: "Telegram",
      handle: "@Jolloftips247",
      href: "https://t.me/Jolloftips247",
      color: "#229ED9",
      bgHover: "rgba(34, 158, 217, 0.12)",
      borderColor: "rgba(34, 158, 217, 0.35)",
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.96z" />
        </svg>
      ),
    },
    {
      name: "X (Twitter)",
      handle: "@jolloftips",
      href: "https://x.com/jolloftips",
      color: "var(--gold)",
      bgHover: "rgba(255, 255, 255, 0.08)",
      borderColor: "rgba(255, 255, 255, 0.22)",
      icon: (
        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      handle: "jolloftips",
      href: "https://www.facebook.com/jolloftips",
      color: "#1877F2",
      bgHover: "rgba(24, 119, 242, 0.12)",
      borderColor: "rgba(24, 119, 242, 0.35)",
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  const columns: Record<string, FooterLink[]> = {
    Predictions: [
      { label: "Today's Picks", href: "/" },
      { label: "All Matches", href: "/all-matches" },
      { label: "Bet of the Day", href: "/bet-of-the-day" },
      { label: "Bet Builder", href: "/bet-builder" },
      { label: "Leagues", href: "/leagues" },
    ],
    Tools: [
      { label: "Rollovers", href: "/rollovers" },
      { label: "Hit & Win", href: "/hit-and-win" },
      { label: "Progress Tracker", href: "/progress" },
      { label: "Live Matches", href: "/all-matches" },
      { label: "How It Works", href: "/how-it-works" },
    ],
    "Legal & Trust": [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "18+ Responsible Gaming", href: "/terms#responsible-gaming" },
      { label: "Account Dashboard", href: "/account" },
      { label: "VIP Pricing", href: "/pricing" },
    ],
    Community: [
      { label: "Telegram Channel", href: "https://t.me/Jolloftips247", external: true },
      { label: "X / Twitter", href: "https://x.com/jolloftips", external: true },
      { label: "Facebook Page", href: "https://www.facebook.com/jolloftips", external: true },
      { label: "Analytics Blog", href: "/blog" },
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
          {/* Brand & Socials Column */}
          <div style={{ maxWidth: 320 }}>
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
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--gold-bg)",
                  border: "1px solid var(--gold-border)",
                  color: "var(--gold)",
                  fontWeight: 900,
                  fontSize: 15,
                }}
              >
                JT
              </div>
              <span
                style={{
                  fontSize: 19,
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
                marginBottom: 18,
              }}
            >
              High-accuracy statistical algorithmic match tips, probability models, and xG data across 160+ football leagues worldwide.
            </p>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
              <span className="gold-badge" style={{ fontSize: 11, padding: "3px 9px" }}>
                <ShieldCheck size={12} />
                Audited Ledger
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 12,
                  background: "rgba(234, 179, 8, 0.1)",
                  border: "1px solid rgba(234, 179, 8, 0.28)",
                  color: "#facc15",
                }}
              >
                <ShieldAlert size={12} />
                Strictly 18+
              </span>
            </div>

            {/* Official Social Links Header */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 10,
                }}
              >
                Official Social Channels
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {socialLinks.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                      textDecoration: "none",
                      fontSize: 12.5,
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = s.bgHover;
                      e.currentTarget.style.borderColor = s.borderColor;
                      e.currentTarget.style.transform = "translateX(3px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                      e.currentTarget.style.borderColor = "var(--border-color)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ color: s.color, display: "flex", alignItems: "center" }}>{s.icon}</span>
                      <span>{s.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "monospace" }}>
                      {s.handle}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(columns).map(([category, items]) => (
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
                    {item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 13,
                          color: "var(--text-secondary)",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          transition: "color 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--gold)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                      >
                        <span>{item.label}</span>
                        <ArrowUpRight size={12} color="var(--text-dim)" />
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        style={{
                          fontSize: 13,
                          color: "var(--text-secondary)",
                          textDecoration: "none",
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
                    )}
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
          <div>
            <p style={{ margin: "0 0 4px" }}>
              © {currentYear} JollofTips. All algorithmic models & rights reserved.
            </p>
            <p style={{ margin: 0, fontSize: 11 }}>
              Independent sports predictive technology · Not a bookmaker · Please gamble responsibly (18+).
            </p>
          </div>

          {/* Quick Legal & Social Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <Link
              href="/terms"
              style={{ color: "var(--text-secondary)", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              Terms of Service
            </Link>
            <span>·</span>
            <Link
              href="/privacy"
              style={{ color: "var(--text-secondary)", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              Privacy Policy
            </Link>
            <span>·</span>
            <a
              href="https://t.me/Jolloftips247"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#229ED9", textDecoration: "none" }}
            >
              Telegram
            </a>
            <span>·</span>
            <a
              href="https://x.com/jolloftips"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--gold)", textDecoration: "none" }}
            >
              X
            </a>
            <span>·</span>
            <a
              href="https://www.facebook.com/jolloftips"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#1877F2", textDecoration: "none" }}
            >
              Facebook
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
