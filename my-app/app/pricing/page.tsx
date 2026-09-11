import Navbar from "@/components/Navbar";
import { Check, Zap, Crown, ShieldCheck, Sparkles, Star } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div style={{ background: "transparent", minHeight: "100vh", color: "#f8fafc" }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "90px 16px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            borderRadius: 999,
            background: "rgba(99, 102, 241, 0.12)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            color: "#818cf8",
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 16,
          }}>
            <Crown style={{ width: 15, height: 15 }} />
            PREMIUM ACCESS & UNLIMITED AI TIPS
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.5px", margin: "0 0 12px", color: "#ffffff" }}>
            Choose the Perfect Plan for Smarter Football Predictions
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 15, maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>
            Get unlimited access to all AI high-confidence match predictions, Bet of the Day, live in-play tips, and in-depth match stats.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 24,
          alignItems: "stretch",
        }}>
          {/* Free Tier */}
          <div style={{
            background: "#0d1222",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#fff" }}>Free Starter</h3>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                  Free Forever
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, marginBottom: 24 }}>
                Explore daily football predictions with standard confidence access.
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 28 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: "#ffffff" }}>$0</span>
                <span style={{ fontSize: 13, color: "#64748b" }}>/month</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {[
                  "7 Free AI Tips per day",
                  "Standard 1X2 Match Predictions",
                  "Live Match Scores & Minutes",
                  "Basic League Standings",
                  "Public Track Record Access",
                ].map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#cbd5e1" }}>
                    <Check style={{ width: 16, height: 16, color: "#10b981", flexShrink: 0 }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/all-matches"
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Continue Free
            </Link>
          </div>

          {/* Premium Monthly (Featured) */}
          <div style={{
            background: "linear-gradient(180deg, #111833 0%, #0d1222 100%)",
            border: "2px solid #6366f1",
            borderRadius: 16,
            padding: 32,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 0 30px rgba(99, 102, 241, 0.2)",
          }}>
            <div style={{
              position: "absolute",
              top: -12,
              right: 24,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.5px",
              padding: "4px 12px",
              borderRadius: 999,
              textTransform: "uppercase",
            }}>
              Most Popular
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                  <Zap style={{ width: 18, height: 18, color: "#818cf8" }} />
                  Premium Pro
                </h3>
              </div>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, marginBottom: 24 }}>
                Complete unlimited access to all AI match models, value odds, and live tips.
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 28 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: "#ffffff" }}>$19.99</span>
                <span style={{ fontSize: 13, color: "#64748b" }}>/month</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {[
                  "Unlimited AI Tips across all 15+ Leagues",
                  "High-Confidence Bet of the Day",
                  "Over/Under 2.5, BTTS & Double Chance",
                  "Full Lineups & Injury Reports",
                  "Up to 5 Active Device Sessions",
                  "Live In-Play AI Updates",
                  "Priority Email & Telegram Alerts",
                ].map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#ffffff" }}>
                    <Check style={{ width: 16, height: 16, color: "#818cf8", flexShrink: 0 }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 14,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
              }}
            >
              Start 7-Day Free Trial
            </button>
          </div>

          {/* Annual VIP */}
          <div style={{
            background: "#0d1222",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#fff" }}>Annual VIP</h3>
                <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                  Save 40%
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, marginBottom: 24 }}>
                For dedicated football fans and analysts wanting maximum value.
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 28 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: "#ffffff" }}>$139.99</span>
                <span style={{ fontSize: 13, color: "#64748b" }}>/year</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {[
                  "Everything in Premium Pro",
                  "Dedicated VIP Algorithm Feed",
                  "Early Kickoff Alerts 48h in advance",
                  "Historical ML Backtest Exports",
                  "Direct Developer / Quant Support",
                ].map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#cbd5e1" }}>
                    <Check style={{ width: 16, height: 16, color: "#10b981", flexShrink: 0 }} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Get Annual VIP
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
