"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import { MatchData } from "@/lib/scraper/types";
import { RefreshCw, ChevronDown, ArrowRight, Trophy, Sparkles } from "lucide-react";

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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#070b18", color: "#f8fafc", overflowX: "hidden" }}>
      <Navbar liveCount={liveCount} onSync={handleSync} isSyncing={isSyncing} />

      {/* ── EXACT FULL-HEIGHT NERDYTIPS HERO SECTION ── */}
      <section style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "calc(100vh - 60px)",
        paddingTop: "40px",
        paddingBottom: "60px",
        backgroundColor: "#070b18",
        backgroundImage: "url('https://cdn.nerdytips.com/public/img/st/header-bg-st.webp')",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        boxSizing: "border-box",
      }}>
        {/* Seamless bottom vignette to gently fade feet into the background */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(7, 11, 24, 0) 30%, rgba(7, 11, 24, 0.3) 70%, #070b18 100%), linear-gradient(to bottom, transparent 80%, #070b18 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }} />

        {/* Hero Content */}
        <div style={{
          position: "relative",
          zIndex: 5,
          maxWidth: 780,
          margin: "0 auto",
          padding: "0 20px",
          textAlign: "center",
        }}>
          {/* Main Title */}
          <h1 style={{
            fontSize: "clamp(34px, 4.6vw, 50px)",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.6px",
            lineHeight: 1.15,
            marginBottom: 16,
            textShadow: "0 4px 24px rgba(0,0,0,0.9)",
          }}>
            AI Football Predictions
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: "clamp(13px, 1.8vw, 14.5px)",
            color: "#94a3b8",
            lineHeight: 1.7,
            maxWidth: 560,
            margin: "0 auto 28px",
            fontWeight: 400,
            textShadow: "0 2px 10px rgba(0,0,0,0.9)",
          }}>
            NerdyTips generates predictions with its own AI model for every football match played anywhere in the world — plus 7 free tips every single day.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
            {/* Primary Button */}
            <a
              href="#predictions"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "11px 26px",
                borderRadius: 8,
                background: "#6366f1",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 13.5,
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.45)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#4f46e5";
                e.currentTarget.style.boxShadow = "0 6px 26px rgba(99, 102, 241, 0.65)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#6366f1";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(99, 102, 241, 0.45)";
              }}
            >
              <span>See Free Predictions</span>
              <ChevronDown style={{ width: 15, height: 15 }} />
            </a>

            {/* Secondary Button */}
            <Link
              href="/all-matches"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "11px 26px",
                borderRadius: 8,
                background: "rgba(0, 0, 0, 0.25)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                fontWeight: 600,
                fontSize: 13.5,
                textDecoration: "none",
                backdropFilter: "blur(8px)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.25)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
              }}
            >
              All Matches
            </Link>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, maxWidth: 1240, width: "100%", margin: "0 auto", padding: "40px 16px 40px" }}>

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
      `}</style>
    </div>
  );
}