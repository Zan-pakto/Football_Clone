"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import { MatchData } from "@/lib/scraper/types";
import { RefreshCw } from "lucide-react";

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
                return {
                  ...m,
                  status: live.status || m.status,
                  elapsed: live.elapsed || m.elapsed,
                  homeScore: live.homeScore !== null && live.homeScore !== undefined ? String(live.homeScore) : m.homeScore,
                  awayScore: live.awayScore !== null && live.awayScore !== undefined ? String(live.awayScore) : m.awayScore,
                  isLive: true,
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

  // Show up to 25 matches as preview groups, grouped by league
  const previewGroups = useMemo(() => {
    const map: Record<string, { leagueName: string; country: string; flagUrl: string | null; matches: MatchData[] }> = {};
    matches.slice(0, 30).forEach((m) => {
      const key = `${m.country}_${m.leagueName}`;
      if (!map[key]) {
        map[key] = { leagueName: m.leagueName, country: m.country, flagUrl: m.flagUrl, matches: [] };
      }
      map[key].matches.push(m);
    });
    return Object.values(map);
  }, [matches]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#080d18", color: "#f8fafc" }}>
      <Navbar liveCount={liveCount} onSync={handleSync} isSyncing={isSyncing} />

      <main style={{ flex: 1, maxWidth: 1200, width: "100%", margin: "0 auto", padding: "24px 16px" }}>

        {/* ── Hero ── */}
        <section style={{ marginBottom: 32, textAlign: "center", padding: "40px 20px 32px" }}>
          <h1 style={{ fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 14 }}>
            AI Football Predictions
          </h1>
          <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 24px" }}>
            NerdyTips generates predictions with its own AI model for every football match played anywhere in the world — plus 7 free tips every single day.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="#predictions"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 24px", borderRadius: 6,
                background: "#10b981", color: "#000",
                fontWeight: 800, fontSize: 13, textDecoration: "none",
              }}
            >
              See Free Predictions
            </Link>
            <Link
              href="/all-matches"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "11px 24px", borderRadius: 6,
                background: "transparent", color: "#e2e8f0",
                border: "1px solid rgba(255,255,255,0.15)",
                fontWeight: 700, fontSize: 13, textDecoration: "none",
              }}
            >
              All Matches
            </Link>
          </div>
        </section>

        {/* ── Today's Predictions (free preview) ── */}
        <section id="predictions">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
              Today&apos;s Football Predictions
            </h2>
            <Link href="/all-matches" style={{ fontSize: 12, fontWeight: 700, color: "#10b981", textDecoration: "none" }}>
              See All Predictions →
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: "64px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "#64748b" }}>
              <RefreshCw style={{ width: 28, height: 28, color: "#10b981", animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Loading match predictions...</span>
            </div>
          ) : previewGroups.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#475569", fontSize: 13 }}>
              No matches found for today.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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

          {/* See All link */}
          {!loading && matches.length > 30 && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Link
                href="/all-matches"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "10px 24px", borderRadius: 6,
                  background: "#0d1220", border: "1px solid rgba(255,255,255,0.12)",
                  color: "#e2e8f0", fontWeight: 700, fontSize: 13, textDecoration: "none",
                }}
              >
                See All Predictions ({matches.length} matches) →
              </Link>
            </div>
          )}
        </section>

        {/* ── Our Story ── */}
        <section style={{ marginTop: 56, padding: "32px", background: "#0d1220", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 12 }}>Our Story - Engineered to Win</h2>
          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.75, marginBottom: 8 }}>
            We developed a proprietary AI football prediction model that uses machine learning to generate accurate, data-driven tips.
            Our Java-based software combines Artificial Intelligence, Mathematical Modeling, and Machine Learning to deliver AI-driven football predictions with unmatched consistency.
          </p>
          <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.75 }}>
            Complete transparency: We maintain full openness with our clients, inviting you to monitor our entire progress firsthand.
          </p>
        </section>

        {/* ── Top Leagues ── */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 14 }}>Top Leagues</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { label: "Premier League", href: "/leagues" },
              { label: "La Liga", href: "/leagues" },
              { label: "Bundesliga", href: "/leagues" },
              { label: "Serie A", href: "/leagues" },
              { label: "Ligue 1", href: "/leagues" },
              { label: "Champions League", href: "/leagues" },
              { label: "Europa League", href: "/leagues" },
              { label: "Conference League", href: "/leagues" },
            ].map((league) => (
              <Link
                key={league.label}
                href={league.href}
                style={{
                  padding: "7px 14px", borderRadius: 6,
                  background: "#0d1220", border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12, fontWeight: 600, color: "#94a3b8", textDecoration: "none",
                  transition: "all 0.15s",
                }}
              >
                {league.label}
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#0a0e18", padding: "32px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ maxWidth: 280 }}>
              <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 8 }}>NERDYTIPS</p>
              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.65 }}>
                Get the best football predictions powered by AI! NerdyTips analyzes 160+ leagues to deliver accurate betting tips and insights.
              </p>
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Top Leagues</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {["Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1"].map((l) => (
                  <Link key={l} href="/leagues" style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>{l} Predictions</Link>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Matches</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "All Matches", href: "/all-matches" },
                  { label: "Leagues", href: "/leagues" },
                ].map((item) => (
                  <Link key={item.label} href={item.href} style={{ fontSize: 12, color: "#64748b", textDecoration: "none" }}>{item.label}</Link>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#475569" }}>
              © 2026 · AI Football Predictions · Powered by NT Apex AI
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