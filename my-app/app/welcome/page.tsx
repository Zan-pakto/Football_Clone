"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Sparkles,
  CheckCircle2,
  Lock,
  Star,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Activity,
  Trophy,
  ChevronRight,
  Zap,
} from "lucide-react";

const RECENT_PREDICTIONS = [
  {
    homeTeam: "FC Porto",
    awayTeam: "Manchester City",
    homeScore: "0",
    awayScore: "2",
    homeColor: "#2563eb",
    awayColor: "#38bdf8",
    pick: "2",
    rating: "8.7/10",
    won: true,
  },
  {
    homeTeam: "Inter",
    awayTeam: "Lazio",
    homeScore: "1",
    awayScore: "2",
    homeColor: "#1d4ed8",
    awayColor: "#67e8f9",
    pick: "Under 2.5",
    rating: "7.3/10",
    won: false,
  },
  {
    homeTeam: "Dortmund",
    awayTeam: "Villarreal",
    homeScore: "3",
    awayScore: "2",
    homeColor: "#eab308",
    awayColor: "#facc15",
    pick: "1X",
    rating: "8.4/10",
    won: true,
  },
];

function WelcomeContent() {
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState<string>("Member");

  useEffect(() => {
    const paramName = searchParams.get("name");
    if (paramName) {
      setUserName(paramName);
      return;
    }

    async function checkUser() {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (data.success && data.user?.name) {
          setUserName(data.user.name);
        }
      } catch {
        // Fallback
      }
    }
    checkUser();
  }, [searchParams]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--background)" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "40px 20px 80px", maxWidth: 960, margin: "0 auto", width: "100%" }}>
        
        {/* Top Hero Greeting */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="gold-badge" style={{ marginBottom: 14 }}>
            <Sparkles size={12} />
            WELCOME ABOARD
          </div>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 900,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
              marginBottom: 8,
            }}
          >
            Hi, {userName}!
          </h1>

          <p style={{ fontSize: 16, color: "var(--text-secondary)", margin: "10px 0 28px" }}>
            Thank you for joining <strong style={{ color: "var(--gold)" }}>JollofTips</strong>. Your smart prediction journey begins now.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/all-matches"
              className="gold-btn"
              style={{ padding: "12px 24px", fontSize: 14 }}
            >
              <span>Explore Today&apos;s Matches</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/pricing"
              className="gold-outline-btn"
              style={{ padding: "12px 24px", fontSize: 14 }}
            >
              <span>Upgrade to VIP Access</span>
            </Link>
          </div>
        </div>

        {/* Predictions Feed Card Container */}
        <div
          className="luxury-card"
          style={{
            padding: "24px",
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: 14, marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              Recent Settled Predictions
            </h2>
            <span className="status-pill-won">Verified Ledger</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {RECENT_PREDICTIONS.map((p, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    {p.homeTeam} vs {p.awayTeam}
                  </span>
                  <p style={{ fontSize: 12, color: "var(--gold)", margin: "2px 0 0", fontWeight: 600 }}>
                    Pick: {p.pick} · FT: {p.homeScore}-{p.awayScore}
                  </p>
                </div>
                <span className={p.won ? "status-pill-won" : "status-pill-lost"}>
                  {p.won ? "WON" : "LOST"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--background)" }} />}>
      <WelcomeContent />
    </Suspense>
  );
}
