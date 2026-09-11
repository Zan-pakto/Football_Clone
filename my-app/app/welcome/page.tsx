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

const MEDIA_LOGOS = [
  { name: "YahooSports", color: "#6001d2" },
  { name: "PlanetFootball", color: "#38bdf8" },
  { name: "BeSoccer", color: "#10b981" },
  { name: "DAZN", color: "#fbbf24" },
  { name: "OneFootball", color: "#f97316" },
  { name: "FlashScore", color: "#ef4444" },
];

const RECENT_PREDICTIONS = [
  {
    homeTeam: "FC Porto",
    awayTeam: "Manchester City",
    homeScore: "0",
    awayScore: "2",
    homeColor: "#2563eb",
    awayColor: "#38bdf8",
    pick: "2",
    rating: "5.7/10",
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
    rating: "4.3/10",
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
    rating: "7.4/10",
    won: true,
  },
  {
    homeTeam: "Orense",
    awayTeam: "Guayaquil City",
    homeScore: "4",
    awayScore: "3",
    homeColor: "#10b981",
    awayColor: "#0284c7",
    pick: "1",
    rating: "5.8/10",
    won: true,
  },
  {
    homeTeam: "Paysandu",
    awayTeam: "Brusque",
    homeScore: "1",
    awayScore: "2",
    homeColor: "#38bdf8",
    awayColor: "#f97316",
    pick: "X2",
    rating: "2.6/10",
    won: true,
  },
];

const UPCOMING_MATCHES = [
  { home: "Barcelona", away: "Feyenoord", time: "22:15", countdown: "5h 59m" },
  { home: "Stuttgart", away: "Viking", time: "22:15", countdown: "5h 59m" },
];

const REVIEWS = [
  {
    name: "Joseph",
    date: "5 months ago",
    title: "Best prediction app/site",
    review:
      "Firstly, it's the banker tips... More than 90% accurate. Secondly, the number of goals on the app, u can decide to go for GG & over2.5, the accuracy on the app prediction is far better than other apps and sites because I have used different ones and JollofTips is outstanding.",
  },
  {
    name: "Ben Are Wealth",
    date: "4 months ago",
    title: "Wonderful experience",
    review:
      "Its been a wonderful experience since I started using their services even though at the beginning it was a bit rocky but things improved later on and 70% of their games won.",
  },
  {
    name: "Daniel Olara",
    date: "1 year ago",
    title: "Bankers are good",
    review:
      "The Bankers are especially good. Betting is not a crystal ball to get 100% predictions 365 days a year. But if you want good insights, or want to make an informed decision, then use this site. This is what separates sports betting from gambling.",
  },
];

function WelcomeContent() {
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState<string>("Member");

  useEffect(() => {
    // 1. Try URL param
    const paramName = searchParams.get("name");
    if (paramName) {
      setUserName(paramName);
      return;
    }

    // 2. Try session check
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "transparent", color: "#f8fafc" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "90px 16px 80px", maxWidth: 1040, margin: "0 auto", width: "100%" }}>
        
        {/* ── Top Hero Greeting ── */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h1
            style={{
              fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              marginBottom: 8,
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span>Hi, {userName}</span>
            <div
              style={{
                width: 48,
                height: 4,
                borderRadius: 2,
                background: "linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%)",
                marginTop: 6,
              }}
            />
          </h1>

          <p style={{ fontSize: 17, fontWeight: 500, color: "#94a3b8", margin: "10px 0 32px" }}>
            Thank you for joining <strong style={{ color: "#ffffff" }}>JollofTips</strong>
          </p>

          {/* Media Logos Banner */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              You may have seen us on
            </span>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: "20px 28px",
              }}
            >
              {MEDIA_LOGOS.map((logo) => (
                <div
                  key={logo.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(20, 25, 56, 0.6)",
                    border: "1px solid rgba(168, 85, 247, 0.15)",
                    padding: "8px 16px",
                    borderRadius: 10,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: logo.color }} />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: "#cbd5e1" }}>{logo.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* ── Section: Latest AI Predictions ── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 800,
              color: "#a855f7",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            — RECENT RESULTS —
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em", margin: "0 0 6px" }}>
            Latest AI Predictions
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            Real predictions, real results. Full transparency.
          </p>
        </div>

        {/* Predictions Feed Card Container */}
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto 40px",
            background: "rgba(20, 25, 56, 0.75)",
            border: "1px solid rgba(168, 85, 247, 0.22)",
            borderRadius: 18,
            padding: "16px 20px",
            boxShadow: "0 15px 40px rgba(0, 0, 0, 0.5), 0 0 25px rgba(139, 92, 246, 0.1)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {RECENT_PREDICTIONS.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "rgba(10, 14, 35, 0.65)",
                  border: "1px solid rgba(168, 85, 247, 0.14)",
                  borderRadius: 12,
                  gap: 16,
                }}
              >
                {/* Match Teams + Scores */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.homeColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{m.homeTeam}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{m.homeScore}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.awayColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{m.awayTeam}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{m.awayScore}</span>
                    </div>
                  </div>
                </div>

                {/* Pick Pill */}
                <div
                  style={{
                    background: "rgba(139, 92, 246, 0.25)",
                    border: "1px solid rgba(168, 85, 247, 0.45)",
                    borderRadius: 8,
                    padding: "6px 14px",
                    minWidth: 70,
                    textAlign: "center",
                    fontWeight: 900,
                    fontSize: 13,
                    color: "#ffffff",
                  }}
                >
                  {m.pick}
                </div>

                {/* Rating + Won Checkmark */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", minWidth: 44, textAlign: "right" }}>
                    {m.rating}
                  </span>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: m.won ? "rgba(16, 185, 129, 0.18)" : "rgba(239, 68, 68, 0.18)",
                      border: m.won ? "1px solid #10b981" : "1px solid #ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: m.won ? "#10b981" : "#ef4444",
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    {m.won ? "✓" : "✕"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 14 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: "#34d399" }}>
              83% prediction accuracy
            </span>
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 14,
            maxWidth: 760,
            margin: "0 auto 28px",
          }}
        >
          {[
            { val: "191", label: "MATCHES TODAY" },
            { val: "72%", label: "BANKER SUCCESS" },
            { val: "4.5", label: "TRUSTPILOT" },
            { val: "700+", label: "LEAGUES COVERED" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(20, 25, 56, 0.8)",
                border: "1px solid rgba(168, 85, 247, 0.2)",
                borderRadius: 14,
                padding: "16px 14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", marginBottom: 2 }}>{stat.val}</div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94a3b8", letterSpacing: "0.05em" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Primary CTA 1 */}
        <div style={{ textAlign: "center", marginBottom: 70 }}>
          <Link
            href="/pricing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "15px 36px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 10px 30px rgba(139, 92, 246, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "transform 0.15s ease",
            }}
          >
            <span>Unlock All Predictions</span>
          </Link>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
            From $4.99/mo · That&apos;s just $0.17/day
          </div>
        </div>


        {/* ── Section: Coming Up Next Locked Matches ── */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#c084fc", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            Coming up next
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.01em", margin: "0 0 6px" }}>
            Don&apos;t miss the predictions for UEFA Champions League
          </h2>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            Our AI has already analyzed these matches
          </p>
        </div>

        <div
          style={{
            maxWidth: 700,
            margin: "0 auto 24px",
            background: "rgba(20, 25, 56, 0.75)",
            border: "1px solid rgba(168, 85, 247, 0.22)",
            borderRadius: 16,
            padding: "12px 18px",
          }}
        >
          {UPCOMING_MATCHES.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 10px",
                borderBottom: idx === 0 ? "1px solid rgba(168, 85, 247, 0.12)" : "none",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "#ffffff" }}>{m.home}</span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "#ffffff" }}>{m.away}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8" }}>{m.time}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
                  <span>{m.countdown}</span>
                  <Lock style={{ width: 12, height: 12, color: "#a855f7" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginBottom: 70 }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(168, 85, 247, 0.15)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              color: "#c084fc",
              marginBottom: 16,
            }}
          >
            + 98 more matches today
          </div>

          <div>
            <Link
              href="/pricing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 34px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                color: "#ffffff",
                fontSize: 14.5,
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(139, 92, 246, 0.4)",
              }}
            >
              Unlock All Predictions
            </Link>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
              From $4.99/mo · 3-Day Money Back Guarantee
            </div>
          </div>
        </div>


        {/* ── Section: Trusted By Thousands / Testimonials ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#a855f7", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
            — TRUSTED BY THOUSANDS —
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em", margin: "0 0 10px" }}>
            Don&apos;t Just Take Our Word For It
          </h2>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(20, 25, 56, 0.8)",
              border: "1px solid rgba(168, 85, 247, 0.2)",
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 12,
              color: "#94a3b8",
            }}
          >
            <span>Showing our reviews from</span>
            <span style={{ color: "#34d399", fontWeight: 800 }}>★ Trustpilot</span>
          </div>
        </div>

        {/* 3 Review Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
            marginBottom: 70,
          }}
        >
          {REVIEWS.map((r, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(20, 25, 56, 0.85)",
                border: "1px solid rgba(168, 85, 247, 0.2)",
                borderRadius: 16,
                padding: "22px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 3, color: "#10b981" }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} style={{ width: 14, height: 14, fill: "#10b981" }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#34d399", display: "flex", alignItems: "center", gap: 3 }}>
                    <CheckCircle2 style={{ width: 12, height: 12 }} /> Verified
                  </span>
                </div>

                <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>{r.title}</h4>
                <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "#94a3b8", margin: 0 }}>
                  &ldquo;{r.review}&rdquo;
                </p>
              </div>

              <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>
                {r.name} · {r.date}
              </div>
            </div>
          ))}
        </div>


        {/* ── Section: 3-Card FAQ Grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginBottom: 60,
          }}
        >
          <div
            style={{
              background: "rgba(20, 25, 56, 0.75)",
              border: "1px solid rgba(168, 85, 247, 0.18)",
              borderRadius: 16,
              padding: "20px 22px",
            }}
          >
            <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>Can I cancel anytime?</h4>
            <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "#94a3b8", margin: 0 }}>
              Yes, anytime. No strings attached — cancel with one click whenever you want.
            </p>
          </div>

          <div
            style={{
              background: "rgba(20, 25, 56, 0.75)",
              border: "1px solid rgba(168, 85, 247, 0.18)",
              borderRadius: 16,
              padding: "20px 22px",
            }}
          >
            <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>What if it&apos;s not for me?</h4>
            <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "#94a3b8", margin: 0 }}>
              You get 3 days of full access. If you&apos;re not happy, just ask for your money back. No questions asked.
            </p>
          </div>

          <div
            style={{
              background: "rgba(20, 25, 56, 0.75)",
              border: "1px solid rgba(168, 85, 247, 0.18)",
              borderRadius: 16,
              padding: "20px 22px",
            }}
          >
            <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>Does JollofTips predict matches worldwide?</h4>
            <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "#94a3b8", margin: 0 }}>
              Yes! We cover leagues globally and 700+ leagues worldwide — from Champions League to local competitions.
            </p>
          </div>
        </div>


        {/* ── Section: Ready to Start Winning CTA ── */}
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "linear-gradient(135deg, rgba(26, 32, 74, 0.9) 0%, rgba(15, 20, 48, 0.95) 100%)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            borderRadius: 24,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.15)",
          }}
        >
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em", margin: "0 0 8px" }}>
            Ready to Start Winning?
          </h2>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 24px" }}>
            Join 12,000+ members who trust our AI. Try risk-free for 3 days.
          </p>

          <div>
            <Link
              href="/pricing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "16px 42px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 10px 30px rgba(139, 92, 246, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <span>Unlock All Predictions</span>
            </Link>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 10 }}>
              From $4.99/mo · That&apos;s just $0.17/day
            </div>
            <div style={{ fontSize: 11.5, color: "#34d399", fontWeight: 700, marginTop: 4 }}>
              ✓ 3-Day Money-Back Guarantee
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Loading welcome experience...</div>}>
      <WelcomeContent />
    </Suspense>
  );
}
