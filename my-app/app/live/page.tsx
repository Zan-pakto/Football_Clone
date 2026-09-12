"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import { MatchData } from "@/lib/types";
import { Activity, RefreshCw, Radio, Lock, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

export default function LivePage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userTier, setUserTier] = useState<"free" | "premium">("free");

  const fetchLiveMatches = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch("/api/matches/live?d=0", { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        if (data.userTier) setUserTier(data.userTier);
        setMatches(data.matches);
      }
    } catch (err) {
      console.error("Failed to load live page matches:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const pollLiveUpdates = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch("/api/matches/live?d=0", { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        if (data.userTier) setUserTier(data.userTier);
        setMatches(data.matches);
      }
    } catch (err) {
      console.error("Live poll error:", err);
    }
  }, []);

  useEffect(() => { fetchLiveMatches(); }, [fetchLiveMatches]);

  useEffect(() => {
    const interval = setInterval(pollLiveUpdates, 15000);
    return () => clearInterval(interval);
  }, [pollLiveUpdates]);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/sync?d=0", { method: "POST" });
      const data = await res.json();
      if (data.success) await fetchLiveMatches();
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const liveMatches = useMemo(
    () => matches.filter((m) => m.isLive || m.status === "live" || m.status === "In Progress"),
    [matches]
  );

  const leagueGroups = useMemo(() => {
    const map: Record<string, { leagueName: string; country: string; flagUrl: string | null; matches: MatchData[] }> = {};
    liveMatches.forEach((m) => {
      const key = `${m.country}_${m.leagueName}`;
      if (!map[key]) map[key] = { leagueName: m.leagueName, country: m.country, flagUrl: m.flagUrl, matches: [] };
      map[key].matches.push(m);
    });
    return Object.values(map);
  }, [liveMatches]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "transparent", color: "#f8fafc" }}>
      <Navbar liveCount={liveMatches.length} onSync={handleSync} isSyncing={isSyncing} />

      <main style={{ flex: 1, maxWidth: 1280, width: "100%", margin: "0 auto", padding: "84px 20px 60px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 18 }}>
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, fontWeight: 900, color: "#fff" }}>
              <Radio style={{ width: 22, height: 22, color: "#10b981", animation: "pulse 2s infinite" }} />
              Live In-Progress Matches
            </h1>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Real-time live scores, elapsed match minutes, and live prediction monitoring
            </p>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)",
            padding: "8px 14px", borderRadius: 12,
            fontSize: 12, fontWeight: 700, color: "#34d399",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "ping 1.2s infinite" }} />
            Auto-polling every 15s
          </div>
        </div>

        {/* ── In-Play Kickoff Lock Banner ── */}
        {userTier === "free" ? (
          <div
            className="tech-card"
            style={{
              padding: "14px 20px",
              background: "linear-gradient(135deg, rgba(0, 245, 155, 0.06) 0%, rgba(13, 20, 36, 0.9) 100%)",
              border: "1px solid var(--accent-emerald-border)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "var(--accent-emerald-bg)",
                  border: "1px solid var(--accent-emerald-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-emerald)",
                  flexShrink: 0,
                }}
              >
                <Lock size={18} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
                    In-Play Kickoff Lock Active
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "rgba(244, 63, 94, 0.15)",
                    border: "1px solid rgba(244, 63, 94, 0.3)",
                    color: "var(--accent-red)",
                  }}>
                    Picks Masked at Kickoff
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "3px 0 0" }}>
                  Free users can view real-time scores and clock telemetry. Full in-play AI picks unlock with VIP PRO or upon full-time whistle.
                </p>
              </div>
            </div>

            <Link
              href="/pricing"
              className="gold-btn"
              style={{
                padding: "8px 16px",
                fontSize: 12,
                textDecoration: "none",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Sparkles size={13} />
              <span>Unlock Live VIP Picks</span>
            </Link>
          </div>
        ) : (
          <div
            className="luxury-card"
            style={{
              padding: "12px 18px",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <ShieldCheck size={18} color="var(--accent-green)" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent-green)" }}>
              VIP PRO Access Active — Unrestricted Real-Time In-Play AI Telemetry & Confidence Consensus
            </span>
          </div>
        )}

        {/* Live Feed */}
        {loading ? (
          <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: "#64748b" }}>
            <RefreshCw style={{ width: 32, height: 32, color: "#10b981", animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>Connecting to Live Match Stream...</p>
          </div>
        ) : liveMatches.length === 0 ? (
          <div style={{
            padding: "64px 24px", background: "#0f1624", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
          }}>
            <Activity style={{ width: 40, height: 40, color: "#334155" }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>No Live Matches Right Now</h3>
            <p style={{ fontSize: 13, color: "#64748b", maxWidth: 420 }}>
              There are currently no active live matches in progress for today. Check upcoming scheduled matches on the All Matches page.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {leagueGroups.map((group, idx) => (
              <LeagueGroupCard
                key={`live_${group.country}_${group.leagueName}_${idx}`}
                leagueName={group.leagueName}
                country={group.country}
                flagUrl={group.flagUrl}
                matches={group.matches}
              />
            ))}
          </div>
        )}
      </main>



      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
