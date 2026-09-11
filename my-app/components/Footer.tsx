"use client";

import Link from "next/link";
import { ShieldCheck, Activity, Trophy, Sparkles, Globe, Lock, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: "linear-gradient(180deg, #10142e 0%, #0c0f24 100%)",
      borderTop: "1px solid rgba(168, 85, 247, 0.22)",
      color: "#a5b4fc",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top subtle ambient glow */}
      <div style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "600px",
        height: "200px",
        background: "radial-gradient(ellipse at 50% 0%, rgba(168, 85, 247, 0.2) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        maxWidth: 1320,
        margin: "0 auto",
        padding: "64px 20px 32px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* ── Main Footer Grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "40px 32px",
          marginBottom: 48,
        }}>
          {/* Brand Column (Spans 1.4fr on wide screens) */}
          <div style={{ gridColumn: "span 1", minWidth: 240 }}>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 16 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
                boxShadow: "0 0 14px rgba(249,115,22,0.45)",
                transform: "skew(-6deg)",
              }}>
                <span style={{
                  color: "#ffffff",
                  fontWeight: 900,
                  fontSize: 16,
                  fontStyle: "italic",
                  letterSpacing: "-0.5px",
                  transform: "skew(6deg)",
                }}>
                  JT
                </span>
              </div>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em" }}>
                Jollof<span style={{ color: "#818cf8" }}>Tips</span>
              </span>
            </Link>

            <p style={{ fontSize: 13, lineHeight: 1.6, color: "#64748b", margin: "0 0 20px" }}>
              High-conviction AI football prediction models, real-time live statistical data, and verified daily value tips across 120+ global leagues.
            </p>

            {/* Model Status Pill */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              padding: "5px 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              color: "#34d399",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
              <span>AI Engine v4.2 Operational</span>
            </div>
          </div>

          {/* Column 1: Markets & Tips */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
              Predictions
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <li>
                <Link href="/bet-of-the-day" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.15s" }}>
                  AI Bet of the Day
                </Link>
              </li>
              <li>
                <Link href="/all-matches" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.15s" }}>
                  All Daily Fixtures
                </Link>
              </li>
              <li>
                <Link href="/live" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.15s" }}>
                  Live In-Play Scores
                </Link>
              </li>
              <li>
                <Link href="/all-matches?filter=won" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.15s" }}>
                  Over/Under Goals Tips
                </Link>
              </li>
              <li>
                <Link href="/all-matches" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.15s" }}>
                  Both Teams to Score (BTTS)
                </Link>
              </li>
              <li>
                <Link href="/hit-and-win" style={{ color: "#fb923c", textDecoration: "none", transition: "color 0.15s", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span>Hit & Win Arena</span>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: "rgba(249,115,22,0.15)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.3)" }}>SOON</span>
                </Link>
              </li>
              <li>
                <Link href="/blog" style={{ color: "#818cf8", textDecoration: "none", transition: "color 0.15s", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span>Research & Blog</span>
                  <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}>SOON</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Competitions */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
              Top Leagues
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <li>
                <Link href="/leagues" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.15s" }}>
                  Premier League
                </Link>
              </li>
              <li>
                <Link href="/leagues" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.15s" }}>
                  UEFA Champions League
                </Link>
              </li>
              <li>
                <Link href="/leagues" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.15s" }}>
                  La Liga
                </Link>
              </li>
              <li>
                <Link href="/leagues" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.15s" }}>
                  Serie A
                </Link>
              </li>
              <li>
                <Link href="/leagues" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.15s" }}>
                  Bundesliga
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform & Trust */}
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 16px" }}>
              Transparency
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <li>
                <Link href="/progress" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.15s", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span>Settled Track Record</span>
                  <ArrowUpRight style={{ width: 12, height: 12, color: "#818cf8" }} />
                </Link>
              </li>
              <li>
                <Link href="/pricing" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.15s" }}>
                  Premium Membership
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.15s" }}>
                  How Algorithm Works
                </Link>
              </li>
              <li>
                <Link href="/account/sessions" style={{ color: "#94a3b8", textDecoration: "none", transition: "color 0.15s" }}>
                  Device Session Manager
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Middle Compliance & Security Ribbon ── */}
        <div style={{
          padding: "20px 24px",
          background: "rgba(12, 15, 36, 0.6)",
          border: "1px solid rgba(99, 102, 241, 0.12)",
          borderRadius: 12,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 32,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <ShieldCheck style={{ width: 16, height: 16, color: "#818cf8" }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#ffffff" }}>
                18+ Responsible Platform & Data Accuracy Guarantee
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>
                Predictions are statistical probabilities generated by quantitative models for educational and entertainment purposes.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#c7d2fe",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "4px 10px",
              borderRadius: 6,
            }}>
              18+ Only
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#34d399",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              padding: "4px 10px",
              borderRadius: 6,
            }}>
              SSL Encrypted
            </span>
          </div>
        </div>

        {/* ── Bottom Legal & Copyright Bar ── */}
        <div style={{
          paddingTop: 24,
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          fontSize: 12,
          color: "#64748b",
        }}>
          <div>
            &copy; {currentYear} JollofTips Technologies Inc. All rights reserved.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/privacy" style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}>
              Terms of Service
            </Link>
            <Link href="/responsible-gaming" style={{ color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}>
              Responsible Gaming
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
