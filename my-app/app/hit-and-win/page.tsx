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
  Sparkles,
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
      icon: <Zap style={{ width: 22, height: 22, color: "var(--gold)" }} />,
      title: "AI Smart Acca Builder",
      desc: "Our machine learning engine automatically constructs mathematically optimized accumulator slips ranging from 3.00x up to 50.00x odds.",
      tag: "Engine v4.5",
    },
    {
      icon: <Trophy style={{ width: 22, height: 22, color: "var(--gold)" }} />,
      title: "Streak & Leaderboard Arena",
      desc: "Compete against fellow punters in daily streak prediction challenges. Ascend the leaderboard and claim monthly rewards and VIP badges.",
      tag: "Community",
    },
    {
      icon: <ShieldCheck style={{ width: 22, height: 22, color: "var(--accent-green)" }} />,
      title: "Risk-Hedging Analysis",
      desc: "Instant safety scores, probability distribution matrices, and suggested insurance selections for high-multiplier betting tickets.",
      tag: "Risk Analytics",
    },
    {
      icon: <Target style={{ width: 22, height: 22, color: "var(--gold)" }} />,
      title: "Verified Hit Rate Auditing",
      desc: "Every multi-bet ticket is timestamped on the public ledger with immutable settlement verification right after full-time.",
      tag: "100% Transparent",
    },
  ];

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 20px 80px", position: "relative" }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 1, marginBottom: 48 }}>
          {/* Status Badge */}
          <div className="gold-badge" style={{ marginBottom: 16 }}>
            <Flame size={14} />
            <span>HIT & WIN ARENA • COMING SOON</span>
          </div>

          <h1 style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 900,
            color: "var(--text-primary)",
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            maxWidth: 820,
            margin: "0 auto 16px",
          }}>
            The Next-Gen <span style={{ color: "var(--gold)" }}>High-Roller</span> Acca Experience
          </h1>

          <p style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            maxWidth: 640,
            margin: "0 auto 32px",
          }}>
            We are engineering a proprietary multi-match value accumulator synthesizer engineered to maximize expected value while curbing drawdown risk.
          </p>

          {/* Email Subscription Box */}
          <div style={{
            maxWidth: 500,
            margin: "0 auto",
            background: "var(--bg-surface)",
            border: "1px solid var(--gold-border)",
            borderRadius: 14,
            padding: 8,
            boxShadow: "var(--shadow-card)",
          }}>
            {subscribed ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "12px",
                color: "var(--accent-green)",
                fontWeight: 700,
                fontSize: 14,
              }}>
                <CheckCircle2 size={18} />
                <span>You&apos;re on the priority VIP early-access list!</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
                <div style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 14px",
                }}>
                  <Mail size={16} color="var(--text-dim)" />
                  <input
                    type="email"
                    required
                    placeholder="Enter email for priority early access..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "var(--text-primary)",
                      fontSize: 13,
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="gold-btn"
                  style={{
                    padding: "10px 20px",
                    fontSize: 13,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>Notify Me</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          marginBottom: 48,
        }}>
          {upcomingFeatures.map((f, i) => (
            <div
              key={i}
              className="luxury-card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: "var(--gold-bg)",
                    border: "1px solid var(--gold-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {f.icon}
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "var(--surface-raised)",
                    color: "var(--text-dim)",
                    border: "1px solid var(--border-color)",
                  }}>
                    {f.tag}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
