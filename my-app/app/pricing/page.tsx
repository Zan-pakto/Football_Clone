import Navbar from "@/components/Navbar";
import { Check, Zap, Crown, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 20px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="gold-badge" style={{ marginBottom: 14 }}>
            <Crown size={14} />
            PREMIUM ACCESS & VIP ALGORITHMIC TIPS
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 12px", color: "var(--text-primary)" }}>
            Choose the Perfect Plan for <span style={{ color: "var(--gold)" }}>Consistent Value</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 620, margin: "0 auto", lineHeight: 1.6 }}>
            Get unlimited access to all algorithmic high-confidence match predictions, Bet of the Day, and value accumulators.
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
          <div className="luxury-card" style={{
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Free Starter</h3>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "var(--surface-raised)", color: "var(--text-dim)", border: "1px solid var(--border-color)" }}>
                  Free Forever
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 24 }}>
                Explore daily football predictions with standard confidence access.
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 28 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)" }}>$0</span>
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>/month</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {[
                  "Free daily match tips",
                  "Standard 1X2 Match Predictions",
                  "Live Match Scores & Minutes",
                  "Public Track Record Access",
                ].map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-secondary)" }}>
                    <Check size={16} color="var(--accent-green)" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/all-matches"
              className="gold-outline-btn"
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px",
                fontSize: 14,
              }}
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro VIP Tier (Featured) */}
          <div className="luxury-card" style={{
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderColor: "var(--gold)",
            boxShadow: "var(--shadow-glow)",
            position: "relative",
          }}>
            <div style={{ position: "absolute", top: -12, right: 24 }}>
              <span className="gold-badge" style={{ background: "var(--gold)", color: "var(--gold-btn-text)", borderColor: "var(--gold)" }}>
                <Sparkles size={11} /> MOST POPULAR
              </span>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--gold)" }}>VIP Pro Access</h3>
                <span className="gold-badge">Best Value</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 24 }}>
                Full algorithmic access, unlocked high-confidence bankers, and real-time value odds edges.
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 28 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)" }}>$19.99</span>
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>/month</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {[
                  "Unlimited Banker of the Day Access",
                  "100k Monte Carlo Simulated Probabilities",
                  "Mathematical Value Edge (+EV) Alerts",
                  "Custom Acca Bet Builder Unlocked",
                  "VIP Telegram / Push Notification Alerts",
                ].map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                    <Check size={16} color="var(--gold)" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/register"
              className="gold-btn"
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px",
                fontSize: 14,
              }}
            >
              Unlock VIP Pro Now
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
