"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import { MatchData } from "@/lib/scraper/types";
import {
  Zap,
  Activity,
  ArrowRight,
  Star,
  Sparkles,
  CheckCircle2,
  Clock3,
  Trophy,
  RefreshCw,
} from "lucide-react";

export default function HomePage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  // Authoritative live count from the server — not derived from stale match state
  const [liveCount, setLiveCount] = useState(0);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/matches?d=0");
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        setMatches(data.matches);
      }
    } catch (err) {
      console.error("Failed to load home matches:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetches the authoritative live match count from the server.
   * Uses data.count from /api/matches/live which calls store.getLiveMatches()
   * — the single source of truth. Also patches isLive into local match state
   * using data.liveUpdates so scores update too.
   */
  const refreshLiveCount = useCallback(async () => {
    try {
      const res = await fetch("/api/matches/live?d=0");
      const data = await res.json();
      if (data.success) {
        // data.count is the authoritative live match count from getLiveMatches()
        setLiveCount(typeof data.count === "number" ? data.count : 0);

        // Also patch live scores into match state if updates exist
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
    // Call immediately on mount — don't wait 20s for first accurate count
    refreshLiveCount();
  }, [fetchMatches, refreshLiveCount]);

  // Keep refreshing every 20s
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

  /* ── Derived stats ── */
  // liveCount state is authoritative — don't re-derive from stale match list
  const liveMatches = useMemo(
    () => matches.filter((m) => m.isLive || m.status === "live" || m.status === "In Progress"),
    [matches]
  );

  const predictedMatches = useMemo(
    () => matches.filter((m) => m.predictions.bestTip.pick),
    [matches]
  );

  const upcomingMatches = useMemo(
    () =>
      matches.filter(
        (m) =>
          !m.isLive &&
          m.status !== "live" &&
          m.status !== "In Progress" &&
          m.status !== "won" &&
          m.status !== "fin" &&
          m.elapsed !== "FT"
      ),
    [matches]
  );

  const wonMatches = useMemo(
    () =>
      matches.filter(
        (m) => m.status === "won" || m.status === "fin" || m.elapsed === "FT"
      ),
    [matches]
  );

  const topPredictions = useMemo(
    () =>
      [...matches]
        .filter((m) => parseFloat(m.confidence || "0") >= 7.0 && m.predictions.bestTip.pick)
        .sort((a, b) => parseFloat(b.confidence || "0") - parseFloat(a.confidence || "0"))
        .slice(0, 4),
    [matches]
  );

  const previewGroups = useMemo(() => {
    const map: Record<
      string,
      { leagueName: string; country: string; flagUrl: string | null; matches: MatchData[] }
    > = {};
    matches.slice(0, 25).forEach((m) => {
      const key = `${m.country}_${m.leagueName}`;
      if (!map[key]) {
        map[key] = { leagueName: m.leagueName, country: m.country, flagUrl: m.flagUrl, matches: [] };
      }
      map[key].matches.push(m);
    });
    return Object.values(map);
  }, [matches]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0b0f19", color: "#f8fafc" }}>
      <Navbar liveCount={liveCount} onSync={handleSync} isSyncing={isSyncing} />

      <main style={{ flex: 1, maxWidth: 1280, width: "100%", margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Hero Banner ── */}
        <section style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 20,
          background: "linear-gradient(135deg, #121826 0%, #0f1929 50%, #0b1520 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          padding: "32px 32px 28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}>
          {/* bg glow */}
          <div style={{
            position: "absolute", top: -80, right: -60, width: 350, height: 350,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
              <Sparkles style={{ width: 13, height: 13 }} />
              Football Intelligence Engine
            </div>

            <h1 style={{ fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: 10, letterSpacing: "-0.5px" }}>
              AI Football Predictions<br />
              <span style={{ color: "#10b981" }}>&amp; Real-Time Match Data</span>
            </h1>

            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.65, maxWidth: 560, marginBottom: 22 }}>
              Real-time match data pipeline — live odds, 1X2 predictions, Over/Under goal trends, and confidence scores synced from NerdyTips.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link
                href="/all-matches"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: "#10b981", color: "#000", fontWeight: 800, fontSize: 13, textDecoration: "none", boxShadow: "0 4px 16px rgba(16,185,129,0.3)", transition: "all 0.2s" }}
              >
                Browse All Predictions <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>

              <Link
                href="/live"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: "#182032", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
              >
                <Activity style={{ width: 14, height: 14, color: "#10b981" }} />
                Live Matches ({liveCount})
              </Link>
            </div>
          </div>

          {/* ── Stat Cards Row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 28, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Predicted */}
            <StatCard
              icon={<Sparkles style={{ width: 16, height: 16, color: "#10b981" }} />}
              label="Predicted"
              value={predictedMatches.length}
              accent="#10b981"
              sublabel="with AI picks"
            />
            {/* Upcoming */}
            <StatCard
              icon={<Clock3 style={{ width: 16, height: 16, color: "#38bdf8" }} />}
              label="Upcoming"
              value={upcomingMatches.length}
              accent="#38bdf8"
              sublabel="not started yet"
            />
            {/* Won / Finished */}
            <StatCard
              icon={<CheckCircle2 style={{ width: 16, height: 16, color: "#a78bfa" }} />}
              label="Won / Finished"
              value={wonMatches.length}
              accent="#a78bfa"
              sublabel="completed today"
            />
          </div>
        </section>

        {/* ── High-Trust Predictions ── */}
        {topPredictions.length > 0 && (
          <section>
            <SectionHeader
              icon={<Star style={{ width: 16, height: 16, color: "#f59e0b", fill: "#f59e0b" }} />}
              title="Top High-Trust Picks"
              linkHref="/all-matches"
              linkLabel="View All →"
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {topPredictions.map((match) => (
                <div key={`top_${match.id}`} style={{
                  background: "#121826",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "border-color 0.2s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{match.leagueName}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", padding: "2px 8px", borderRadius: 6 }}>
                      ★ {match.confidence}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{match.homeTeam}</span>
                      {match.homeScore !== null && <span>{match.homeScore}</span>}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{match.awayTeam}</span>
                      {match.awayScore !== null && <span>{match.awayScore}</span>}
                    </div>
                  </div>

                  {match.predictions.bestTip.pick && (
                    <div style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.06em" }}>Best Pick</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: "#6ee7b7" }}>
                        {match.predictions.bestTip.pick} @{match.predictions.bestTip.odd}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Today's Matches Feed ── */}
        <section>
          <SectionHeader
            icon={<Zap style={{ width: 16, height: 16, color: "#10b981" }} />}
            title="Today's Match Predictions"
            linkHref="/all-matches"
            linkLabel="Open Full Table →"
          />

          {loading ? (
            <div style={{ padding: "64px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: "#64748b" }}>
              <RefreshCw style={{ width: 28, height: 28, color: "#10b981", animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Loading match predictions...</span>
            </div>
          ) : previewGroups.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#475569", fontSize: 13 }}>No matches found for today.</div>
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
        </section>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#0c101a", padding: "24px 20px", textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>FootyIntel AI Football Predictions &amp; Data Engine</p>
        <p style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>PostgreSQL Persistence · Dynamic Scraper · Real-Time Live Stream</p>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({ icon, label, value, accent, sublabel }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
  sublabel: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "14px 16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
        {icon}
        <span style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: accent, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#475569", fontWeight: 500 }}>{sublabel}</div>
    </div>
  );
}

function SectionHeader({ icon, title, linkHref, linkLabel }: {
  icon: React.ReactNode;
  title: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <h2 style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 800, color: "#fff" }}>
        {icon} {title}
      </h2>
      <Link href={linkHref} style={{ fontSize: 12, fontWeight: 700, color: "#10b981", textDecoration: "none" }}>
        {linkLabel}
      </Link>
    </div>
  );
}