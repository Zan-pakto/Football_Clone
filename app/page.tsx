"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import { MatchData } from "@/lib/scraper/types";
import { RefreshCw, ChevronDown, ArrowRight, ShieldCheck, Zap, BarChart3, Trophy, Sparkles, BrainCircuit, Activity, Cpu } from "lucide-react";

export default function HomePage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [liveCount, setLiveCount] = useState(0);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/matches?d=0");
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        setMatches((prev) => {
          if (prev.length === 0) return data.matches;
          const prevMap = new Map(prev.map((m) => [m.id, m]));
          return data.matches.map((fresh: MatchData) => {
            const existing = prevMap.get(fresh.id);
            if (existing && existing.predictions?.bestTip?.pick && !fresh.predictions?.bestTip?.pick) {
              return {
                ...fresh,
                predictions: existing.predictions,
                confidence: existing.confidence || fresh.confidence,
              };
            }
            return fresh;
          });
        });
      }
    } catch (err) {
      console.error("Failed to load home matches:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshLiveCount = useCallback(async () => {
    try {
      const res = await fetch("/api/matches/live?d=0");
      const data = await res.json();
      if (data.success) {
        setLiveCount(typeof data.count === "number" ? data.count : 0);
        if (data.liveUpdates && Object.keys(data.liveUpdates).length > 0) {
          setMatches((prev) =>
            prev.map((m) => {
              const live = data.liveUpdates[m.id];
              if (live) {
                const isStillLive = Boolean(live.isLive ?? (live.status === "In Progress" || (live.elapsed && /^\d+['′]/.test(live.elapsed))));
                return {
                  ...m,
                  status: live.status && m.status !== "won" ? live.status : m.status,
                  elapsed: live.elapsed || m.elapsed,
                  homeScore: live.homeScore !== null && live.homeScore !== undefined ? String(live.homeScore) : m.homeScore,
                  awayScore: live.awayScore !== null && live.awayScore !== undefined ? String(live.awayScore) : m.awayScore,
                  isLive: isStillLive,
                };
              }
              return m;
            })
          );
        }
      }
    } catch (err) {
      console.error("Home live poll error:", err);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    refreshLiveCount();
  }, [fetchMatches, refreshLiveCount]);

  useEffect(() => {
    const interval = setInterval(refreshLiveCount, 20000);
    return () => clearInterval(interval);
  }, [refreshLiveCount]);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/sync?d=0", { method: "POST" });
      const data = await res.json();
      if (data.success) await fetchMatches();
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Group top matches by league for preview
  const previewGroups = useMemo(() => {
    const map: Record<string, { leagueName: string; country: string; flagUrl: string | null; matches: MatchData[] }> = {};
    matches.slice(0, 35).forEach((m) => {
      const key = `${m.country}_${m.leagueName}`;
      if (!map[key]) {
        map[key] = { leagueName: m.leagueName, country: m.country, flagUrl: m.flagUrl, matches: [] };
      }
      map[key].matches.push(m);
    });
    return Object.values(map);
  }, [matches]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#060814", color: "#f8fafc", overflowX: "hidden" }}>
      <Navbar liveCount={liveCount} onSync={handleSync} isSyncing={isSyncing} />

      {/* ── ULTRA-MODERN AI HERO SECTION ── */}
      <section style={{
        position: "relative",
        overflow: "hidden",
        paddingTop: "60px",
        paddingBottom: "80px",
        background: "radial-gradient(ellipse 90% 70% at 50% 30%, #0e1638 0%, #060814 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Ambient Glows */}
        <div style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "680px",
          height: "420px",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(45, 212, 191, 0.16) 40%, rgba(6, 8, 20, 0) 75%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 1,
        }} />

        {/* Cyber Holographic AI Football Sphere & Orbitals */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -52%)",
          width: "500px",
          height: "500px",
          pointerEvents: "none",
          zIndex: 2,
          opacity: 0.35,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <svg viewBox="0 0 400 400" width="480" height="480" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-orb-svg">
            <defs>
              <linearGradient id="aiGlow1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#6366f1" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0" />
                <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="coreLight" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
                <stop offset="60%" stopColor="#6366f1" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#060814" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Core Neural Glow */}
            <circle cx="200" cy="200" r="140" fill="url(#coreLight)" />

            {/* Rotating Orbital Track 1 */}
            <ellipse cx="200" cy="200" rx="170" ry="60" stroke="url(#orbitGrad)" strokeWidth="1.5" strokeDasharray="8 6" className="orbit-spin-1" transform="rotate(-25 200 200)" />
            {/* Rotating Orbital Track 2 */}
            <ellipse cx="200" cy="200" rx="170" ry="60" stroke="url(#orbitGrad)" strokeWidth="1.5" strokeDasharray="12 8" className="orbit-spin-2" transform="rotate(35 200 200)" />

            {/* High-Tech Futuristic Football Mesh */}
            {/* Outer Sphere Rim */}
            <circle cx="200" cy="200" r="110" stroke="url(#aiGlow1)" strokeWidth="2" strokeDasharray="5 3" opacity="0.85" />
            <circle cx="200" cy="200" r="112" stroke="#6366f1" strokeWidth="1" opacity="0.3" />

            {/* Hexagonal Pentagons & Vertex Connections */}
            {/* Center Pentagon */}
            <polygon points="200,165 230,185 220,220 180,220 170,185" fill="#090d22" stroke="#2dd4bf" strokeWidth="1.6" />
            <circle cx="200" cy="165" r="3" fill="#2dd4bf" />
            <circle cx="230" cy="185" r="3" fill="#2dd4bf" />
            <circle cx="220" cy="220" r="3" fill="#2dd4bf" />
            <circle cx="180" cy="220" r="3" fill="#2dd4bf" />
            <circle cx="170" cy="185" r="3" fill="#2dd4bf" />

            {/* Radiating AI Neural Rays */}
            <line x1="200" y1="165" x2="200" y2="105" stroke="#818cf8" strokeWidth="1.4" strokeDasharray="3 3" />
            <line x1="230" y1="185" x2="285" y2="160" stroke="#818cf8" strokeWidth="1.4" strokeDasharray="3 3" />
            <line x1="220" y1="220" x2="270" y2="265" stroke="#818cf8" strokeWidth="1.4" strokeDasharray="3 3" />
            <line x1="180" y1="220" x2="130" y2="265" stroke="#818cf8" strokeWidth="1.4" strokeDasharray="3 3" />
            <line x1="170" y1="185" x2="115" y2="160" stroke="#818cf8" strokeWidth="1.4" strokeDasharray="3 3" />

            {/* Top Outer Polygon */}
            <polygon points="200,105 160,118 170,155 200,165 230,155 240,118" fill="none" stroke="#6366f1" strokeWidth="1.2" opacity="0.7" />
            {/* Right Outer Polygon */}
            <polygon points="230,185 285,160 300,195 275,230 220,220" fill="none" stroke="#6366f1" strokeWidth="1.2" opacity="0.7" />
            {/* Left Outer Polygon */}
            <polygon points="170,185 115,160 100,195 125,230 180,220" fill="none" stroke="#6366f1" strokeWidth="1.2" opacity="0.7" />
            {/* Bottom Outer Polygon */}
            <polygon points="180,220 220,220 235,260 200,290 165,260" fill="none" stroke="#6366f1" strokeWidth="1.2" opacity="0.7" />

            {/* Latitude / Curvature Matrix Lines */}
            <path d="M95 180 Q200 230 305 180" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.35" />
            <path d="M105 220 Q200 270 295 220" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.25" />
            <path d="M180 95 Q230 200 180 305" stroke="#818cf8" strokeWidth="1" strokeOpacity="0.3" />
            <path d="M220 95 Q170 200 220 305" stroke="#818cf8" strokeWidth="1" strokeOpacity="0.3" />

            {/* Glowing Data Nodes */}
            <circle cx="200" cy="105" r="4" fill="#6366f1" className="node-pulse" />
            <circle cx="285" cy="160" r="4" fill="#2dd4bf" className="node-pulse" />
            <circle cx="270" cy="265" r="4" fill="#a855f7" className="node-pulse" />
            <circle cx="130" cy="265" r="4" fill="#2dd4bf" className="node-pulse" />
            <circle cx="115" cy="160" r="4" fill="#6366f1" className="node-pulse" />
          </svg>
        </div>

        {/* Perspective Pitch Grid on Bottom */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "120px",
          background: "linear-gradient(to top, rgba(99, 102, 241, 0.08) 0%, transparent 100%)",
          maskImage: "linear-gradient(to top, black 30%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 100%)",
          pointerEvents: "none",
        }} />

        {/* Hero Content */}
        <div style={{
          position: "relative",
          zIndex: 5,
          maxWidth: 860,
          margin: "0 auto",
          padding: "0 20px",
          textAlign: "center",
        }}>
          {/* Top AI Badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            background: "rgba(99, 102, 241, 0.12)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: 999,
            marginBottom: 20,
            backdropFilter: "blur(10px)",
          }}>
            <span style={{ position: "relative", display: "flex", width: 7, height: 7 }}>
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "#2dd4bf", opacity: 0.75,
                animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
              }} />
              <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: "#2dd4bf" }} />
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#cbd5e1", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Next-Gen AI Match Forecasting • 160+ Leagues
            </span>
          </div>

          {/* Main Title */}
          <h1 style={{
            fontSize: "clamp(34px, 5.5vw, 62px)",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-1px",
            lineHeight: 1.12,
            marginBottom: 18,
            textShadow: "0 4px 30px rgba(0,0,0,0.9)",
          }}>
            AI Football Predictions
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: "clamp(13px, 2vw, 15px)",
            color: "#94a3b8",
            lineHeight: 1.75,
            maxWidth: 640,
            margin: "0 auto 32px",
            fontWeight: 400,
          }}>
            NerdyTips generates predictions with its own AI model for every football match played anywhere in the world — plus 7 free tips every single day.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginBottom: 36 }}>
            {/* Primary Button */}
            <a
              href="#predictions"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 32px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: 14,
                textDecoration: "none",
                boxShadow: "0 6px 25px rgba(124, 58, 237, 0.4)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(124, 58, 237, 0.55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 25px rgba(124, 58, 237, 0.4)";
              }}
            >
              <span>See Free Predictions</span>
              <ChevronDown style={{ width: 16, height: 16 }} />
            </a>

            {/* Secondary Button */}
            <Link
              href="/all-matches"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "13px 32px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.04)",
                color: "#f1f5f9",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                backdropFilter: "blur(10px)",
                transition: "background 0.15s ease, border-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
              }}
            >
              All Matches
            </Link>
          </div>

          {/* Floating High-Tech Feature Chips */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              borderRadius: 8,
              background: "rgba(13, 19, 44, 0.7)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(6px)",
              fontSize: 12,
              color: "#cbd5e1",
            }}>
              <Activity style={{ width: 14, height: 14, color: "#10b981" }} />
              <span style={{ fontWeight: 700 }}>Poisson & ML Probability Models</span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              borderRadius: 8,
              background: "rgba(13, 19, 44, 0.7)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(6px)",
              fontSize: 12,
              color: "#cbd5e1",
            }}>
              <Cpu style={{ width: 14, height: 14, color: "#6366f1" }} />
              <span style={{ fontWeight: 700 }}>Real-Time Live Odds Tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, maxWidth: 1240, width: "100%", margin: "0 auto", padding: "32px 16px" }}>

        {/* Quick Highlights Bar */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
          marginBottom: 36,
        }}>
          {[
            {
              icon: <BrainCircuit style={{ width: 20, height: 20, color: "#a855f7" }} />,
              title: "AI Prediction Engine",
              desc: "160+ leagues processed with continuous machine learning algorithms",
            },
            {
              icon: <Zap style={{ width: 20, height: 20, color: "#10b981" }} />,
              title: "Real-Time Live Insights",
              desc: "Instant live odds shifts, score changes, and in-play calculations",
            },
            {
              icon: <ShieldCheck style={{ width: 20, height: 20, color: "#38bdf8" }} />,
              title: "7 Free Daily Tips",
              desc: "Highest probability selections provided free every single day",
            },
          ].map((feature, i) => (
            <div
              key={i}
              style={{
                background: "#0c1022",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              <div style={{
                background: "rgba(255, 255, 255, 0.05)",
                padding: 10,
                borderRadius: 10,
                flexShrink: 0,
              }}>
                {feature.icon}
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#ffffff", marginBottom: 3 }}>
                  {feature.title}
                </h4>
                <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Predictions Section ── */}
        <section id="predictions" style={{ scrollMarginTop: 80 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: "#ffffff", display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles style={{ width: 18, height: 18, color: "#6366f1" }} />
                Today&apos;s Football Predictions
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Explore live AI probability indicators, 1X2 odds, BTTS, and confidence rates
              </p>
            </div>
            <Link
              href="/all-matches"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#6366f1",
                display: "flex",
                alignItems: "center",
                gap: 4,
                textDecoration: "none",
              }}
            >
              <span>See All Matches</span>
              <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: "#64748b" }}>
              <RefreshCw style={{ width: 32, height: 32, color: "#6366f1", animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Analyzing and loading AI predictions...</span>
            </div>
          ) : previewGroups.length === 0 ? (
            <div style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "#64748b",
              background: "#0c1022",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
            }}>
              No matches currently available for today. Click Sync or check back shortly.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {previewGroups.map((group, idx) => (
                <LeagueGroupCard
                  key={`home_${group.country}_${group.leagueName}_${idx}`}
                  leagueName={group.leagueName}
                  country={group.country}
                  flagUrl={group.flagUrl}
                  matches={group.matches}
                />
              ))}
            </div>
          )}

          {/* View More Matches Button */}
          {!loading && matches.length > 35 && (
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <Link
                href="/all-matches"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 28px",
                  borderRadius: 8,
                  background: "#0d1326",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                  transition: "background 0.15s ease",
                }}
              >
                <span>View Full Schedule ({matches.length} matches)</span>
                <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          )}
        </section>

        {/* ── Our Story / Engineered to Win ── */}
        <section id="story" style={{
          marginTop: 64,
          padding: "36px",
          background: "linear-gradient(135deg, #0c1024 0%, #090c1b 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ padding: "6px 12px", background: "rgba(99,102,241,0.15)", borderRadius: 6, color: "#818cf8", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Technology
            </div>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", marginBottom: 14 }}>
            Our Story - Engineered to Win
          </h2>
          <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.8, marginBottom: 12 }}>
            NerdyTips was built on a single goal: creating a robust mathematical framework for football analysis.
            Our proprietary AI model combines deep statistical regression, Poisson distribution algorithms, team tactical metrics, and real-time form indicators to produce high-probability picks.
          </p>
          <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.8 }}>
            Complete transparency is our cornerstone. We track all past match prediction histories, allowing users to verify our overall strike rates across major world leagues.
          </p>
        </section>

        {/* ── Top Leagues Directory Quick Links ── */}
        <section style={{ marginTop: 48, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: 8 }}>
              <Trophy style={{ width: 16, height: 16, color: "#f59e0b" }} /> Top Leagues Coverage
            </h2>
            <Link href="/leagues" style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", textDecoration: "none" }}>
              Explore All Leagues →
            </Link>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              { label: "Premier League", country: "England" },
              { label: "La Liga", country: "Spain" },
              { label: "Bundesliga", country: "Germany" },
              { label: "Serie A", country: "Italy" },
              { label: "Ligue 1", country: "France" },
              { label: "Champions League", country: "Europe" },
              { label: "Europa League", country: "Europe" },
              { label: "Conference League", country: "Europe" },
            ].map((league) => (
              <Link
                key={league.label}
                href={`/all-matches?q=${encodeURIComponent(league.label)}`}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  background: "#0c1022",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#cbd5e1",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "#cbd5e1";
                }}
              >
                <span>{league.label}</span>
                <span style={{ fontSize: 10, color: "#64748b" }}>({league.country})</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* ── NerdyTips Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#050711", padding: "40px 20px 28px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 48, justifyContent: "space-between", marginBottom: 32 }}>
            <div style={{ maxWidth: 320 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: 5,
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: 13,
                  fontStyle: "italic",
                }}>
                  NT
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "0.5px" }}>
                  NERDYTIPS
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
                NerdyTips is an AI-driven football match forecasting platform analyzing 160+ leagues worldwide to generate high-probability betting insights.
              </p>
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Links</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link href="/all-matches" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>All Football Matches</Link>
                <Link href="/all-matches?filter=predicted" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>AI Predictions</Link>
                <Link href="/all-matches?filter=live" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>Live Scores</Link>
                <Link href="/leagues" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>Leagues Directory</Link>
              </div>
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Top Competitions</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1"].map((l) => (
                  <Link key={l} href={`/all-matches?q=${encodeURIComponent(l)}`} style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>
                    {l} Predictions
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 20, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#475569" }}>
              © 2026 NerdyTips • AI Football Predictions & In-Depth Analytics Engine
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes orbitRotate1 {
          0% { transform: rotate(-25deg); }
          100% { transform: rotate(335deg); }
        }
        @keyframes orbitRotate2 {
          0% { transform: rotate(35deg); }
          100% { transform: rotate(-325deg); }
        }
        @keyframes nodePulseGlow {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
        .orbit-spin-1 {
          transform-origin: 200px 200px;
          animation: orbitRotate1 24s linear infinite;
        }
        .orbit-spin-2 {
          transform-origin: 200px 200px;
          animation: orbitRotate2 30s linear infinite;
        }
        .node-pulse {
          animation: nodePulseGlow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}