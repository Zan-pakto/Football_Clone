"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Flame,
  Trophy,
  Zap,
  ShieldCheck,
  Mail,
  CheckCircle2,
  ArrowRight,
  Target,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default function HitAndWinPage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  const upcomingFeatures = [
    {
      icon: <Zap style={{ width: 22, height: 22, color: "#f59e0b" }} />,
      title: "AI Smart Acca Builder",
      desc: "Our machine learning engine automatically constructs mathematically optimized accumulator slips ranging from 3.00x up to 50.00x odds.",
      tag: "Engine v4.5",
    },
    {
      icon: <Trophy style={{ width: 22, height: 22, color: "#eab308" }} />,
      title: "Streak & Leaderboard Arena",
      desc: "Compete against fellow punters in daily streak prediction challenges. Ascend the leaderboard and claim monthly rewards and VIP badges.",
      tag: "Community",
    },
    {
      icon: <ShieldCheck style={{ width: 22, height: 22, color: "#10b981" }} />,
      title: "Risk-Hedging Analysis",
      desc: "Instant safety scores, probability distribution matrices, and suggested insurance selections for high-multiplier betting tickets.",
      tag: "Risk Analytics",
    },
    {
      icon: <Target style={{ width: 22, height: 22, color: "#818cf8" }} />,
      title: "Verified Hit Rate Auditing",
      desc: "Every multi-bet ticket is timestamped on the public ledger with immutable settlement verification right after full-time.",
      tag: "100% Transparent",
    },
  ];

  return (
    <div style={{ background: "transparent", minHeight: "100vh", color: "#f8fafc" }}>
      <Navbar />

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "110px 16px 80px", position: "relative" }}>
        {/* Glow backdrop effects */}
        <div style={{
          position: "absolute",
          top: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "700px",
          height: "380px",
          background: "radial-gradient(ellipse at center, rgba(249, 115, 22, 0.15) 0%, rgba(99, 102, 241, 0.12) 45%, transparent 70%)",
          filter: "blur(90px)",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Hero Section */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 1, marginBottom: 56 }}>
          {/* Status Badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            borderRadius: 999,
            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%)",
            border: "1px solid rgba(249, 115, 22, 0.35)",
            color: "#fb923c",
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 20,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            boxShadow: "0 0 20px rgba(249, 115, 22, 0.2)",
          }}>
            <Flame style={{ width: 15, height: 15, color: "#f97316" }} />
            <span>HIT & WIN ARENA • COMING SOON</span>
            <span style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 8px #22c55e",
            }} />
          </div>

          <h1 style={{
            fontSize: "clamp(32px, 5.5vw, 56px)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            margin: "0 0 16px",
            color: "#ffffff",
            lineHeight: 1.15,
          }}>
            Hit & Win: The Ultimate <br />
            <span style={{
              background: "linear-gradient(135deg, #f97316 0%, #fb923c 40%, #818cf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              AI Multi-Bet & Streak Arena
            </span>
          </h1>

          <p style={{
            color: "#94a3b8",
            fontSize: "clamp(15px, 2vw, 18px)",
            maxWidth: 680,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}>
            We are engineering a proprietary high-yield accumulator and streak prediction platform.
            Harness statistical machine learning algorithms to build winning combo slips with mathematically validated edge.
          </p>

          {/* Email Notification Form */}
          <div style={{
            maxWidth: 520,
            margin: "0 auto 40px",
            background: "rgba(18, 22, 50, 0.75)",
            border: "1px solid rgba(249, 115, 22, 0.25)",
            borderRadius: 14,
            padding: "8px",
            backdropFilter: "blur(12px)",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.45), 0 0 20px rgba(249, 115, 22, 0.1)",
          }}>
            {!subscribed ? (
              <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 220, padding: "8px 12px" }}>
                  <Mail style={{ width: 18, height: 18, color: "#94a3b8" }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email for early VIP access..."
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ffffff",
                      fontSize: 14,
                      outline: "none",
                      width: "100%",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 22px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: 13,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 18px rgba(249, 115, 22, 0.4)",
                    transition: "transform 0.15s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <span>Notify Me</span>
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </button>
              </form>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", color: "#34d399", fontWeight: 700, fontSize: 14 }}>
                <CheckCircle2 style={{ width: 18, height: 18 }} />
                <span>You are on the VIP early access list! We will notify you first.</span>
              </div>
            )}
          </div>

          {/* Launch Progress Meter */}
          <div style={{
            maxWidth: 420,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "12px 18px",
            borderRadius: 10,
            background: "rgba(12, 15, 36, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
              <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: 5 }}>
                <Clock style={{ width: 13, height: 13, color: "#fb923c" }} /> Development Status
              </span>
              <span style={{ color: "#fb923c" }}>82% Completed • Beta Testing</span>
            </div>
            <div style={{ width: "100%", height: 6, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              <div style={{ width: "82%", height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #f97316 0%, #eab308 100%)" }} />
            </div>
          </div>
        </div>

        {/* Feature Teasers Grid */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: "0 0 6px" }}>
              What&apos;s Coming in the Hit & Win Suite
            </h2>
            <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
              Engineered specifically for high-probability accumulator crafting
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}>
            {upcomingFeatures.map((feat, idx) => (
              <div
                key={idx}
                style={{
                  background: "linear-gradient(180deg, rgba(18, 22, 54, 0.8) 0%, rgba(12, 16, 40, 0.9) 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 14,
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {feat.icon}
                    </div>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#fb923c",
                      background: "rgba(249, 115, 22, 0.12)",
                      border: "1px solid rgba(249, 115, 22, 0.25)",
                      padding: "3px 8px",
                      borderRadius: 6,
                      textTransform: "uppercase",
                    }}>
                      {feat.tag}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>
                    {feat.title}
                  </h3>
                  <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Fallback CTA */}
        <div style={{
          background: "linear-gradient(135deg, rgba(17, 22, 54, 0.9) 0%, rgba(10, 13, 34, 0.95) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          borderRadius: 16,
          padding: "32px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", margin: "0 0 6px" }}>
              Explore Live Fixtures & Predictions Today
            </h3>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
              While Hit & Win is finalizing, check our daily AI-analyzed match fixtures and verified track record.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/bet-builder"
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
              }}
            >
              Try Bet Builder
            </Link>
            <Link
              href="/all-matches"
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              View All Matches
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
