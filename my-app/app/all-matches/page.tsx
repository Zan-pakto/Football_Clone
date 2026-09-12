"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import DateSelector from "@/components/DateSelector";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import { checkPredictionWon } from "@/components/MatchRow";
import { MatchData } from "@/lib/types";
import { RefreshCw, Search, Globe, ShieldCheck, Flame, Radio, Filter, CheckCircle2, ChevronRight, Lock, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AllMatchesPage() {
  const [d, setD] = useState("0");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "predicted" | "upcoming" | "live" | "won">("all");
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showMobileRegions, setShowMobileRegions] = useState(false);
  const [userTier, setUserTier] = useState<"free" | "premium">("free");
  const [freeTipsLimit, setFreeTipsLimit] = useState(7);
  const [freeTipsUsed, setFreeTipsUsed] = useState(0);

  const fetchMatches = useCallback(async (dayVal: string, forceSync = false) => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const url = `/api/matches?d=${dayVal}${forceSync ? "&sync=true" : ""}`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        if (data.userTier) setUserTier(data.userTier);
        if (data.freeTipsLimit) setFreeTipsLimit(data.freeTipsLimit);
        if (typeof data.freeTipsUsed === "number") setFreeTipsUsed(data.freeTipsUsed);

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
      console.error("Failed to load matches:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const pollLiveMatches = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/matches/live?d=${d}`, { headers });
      const data = await res.json();
      if (data.success && data.liveUpdates && Object.keys(data.liveUpdates).length > 0) {
        if (data.userTier) setUserTier(data.userTier);
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
    } catch (err) {
      console.error("Live poll error:", err);
    }
  }, [d]);

  useEffect(() => { fetchMatches(d); }, [d, fetchMatches]);

  useEffect(() => {
    const interval = setInterval(pollLiveMatches, 20000);
    return () => clearInterval(interval);
  }, [pollLiveMatches]);

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch(`/api/sync?d=${d}`, { method: "POST" });
      const data = await res.json();
      if (data.success) await fetchMatches(d, false);
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  /* ── Derived stats ── */
  const statCounts = useMemo(() => {
    let predicted = 0, upcoming = 0, live = 0, won = 0;
    matches.forEach((m) => {
      const isLiveM = Boolean(m.isLive || m.status === "live" || m.status === "In Progress" || (m.elapsed && /^\d+['′]/.test(m.elapsed)));
      const hasScores = m.homeScore !== null && m.awayScore !== null && m.homeScore !== "" && m.awayScore !== "";
      const isFin   = m.status === "won" || m.status === "lost" || m.status === "fin" || m.elapsed === "FT" || hasScores;
      const isWon   = m.status === "won" || (isFin && checkPredictionWon(m.predictions?.bestTip?.pick, m.homeScore, m.awayScore) === true);
      const isUp    = !isLiveM && !isFin;

      if (m.predictions?.bestTip?.pick || m.confidence) predicted++;
      if (isUp) upcoming++;
      if (isLiveM) live++;
      if (isWon) won++;
    });
    return { predicted, upcoming, live, won };
  }, [matches]);

  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    matches.forEach((m) => {
      const c = m.country || "International";
      counts[c] = (counts[c] || 0) + 1;
    });
    return counts;
  }, [matches]);

  const countries = useMemo(() => {
    return Object.keys(countryCounts).sort((a, b) => countryCounts[b] - countryCounts[a]);
  }, [countryCounts]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedCountry !== "all" && (m.country || "International") !== selectedCountry) {
        return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const home = m.homeTeam.toLowerCase();
        const away = m.awayTeam.toLowerCase();
        const league = (m.leagueName || "").toLowerCase();
        const country = (m.country || "").toLowerCase();
        if (!home.includes(q) && !away.includes(q) && !league.includes(q) && !country.includes(q)) {
          return false;
        }
      }
      if (activeFilter === "predicted") {
        return Boolean(m.predictions?.bestTip?.pick || m.confidence);
      }
      if (activeFilter === "upcoming") {
        const isLiveM = Boolean(m.isLive || m.status === "live" || m.status === "In Progress" || (m.elapsed && /^\d+['′]/.test(m.elapsed)));
        const hasScores = m.homeScore !== null && m.awayScore !== null && m.homeScore !== "" && m.awayScore !== "";
        const isFin   = m.status === "won" || m.status === "lost" || m.status === "fin" || m.elapsed === "FT" || hasScores;
        return !isLiveM && !isFin;
      }
      if (activeFilter === "live") {
        return Boolean(m.isLive || m.status === "live" || m.status === "In Progress" || (m.elapsed && /^\d+['′]/.test(m.elapsed)));
      }
      if (activeFilter === "won") {
        const hasScores = m.homeScore !== null && m.awayScore !== null && m.homeScore !== "" && m.awayScore !== "";
        const isFin   = m.status === "won" || m.status === "lost" || m.status === "fin" || m.elapsed === "FT" || hasScores;
        return m.status === "won" || (isFin && checkPredictionWon(m.predictions?.bestTip?.pick, m.homeScore, m.awayScore) === true);
      }
      return true;
    });
  }, [matches, selectedCountry, searchTerm, activeFilter]);

  const groupedByLeague = useMemo(() => {
    const map = new Map<string, { leagueName: string; country: string; flagUrl: string | null; matches: MatchData[] }>();
    filteredMatches.forEach((m) => {
      const key = `${m.country || "Int"}_${m.leagueName}`;
      if (!map.has(key)) {
        map.set(key, {
          leagueName: m.leagueName,
          country: m.country,
          flagUrl: m.flagUrl,
          matches: [],
        });
      }
      map.get(key)!.matches.push(m);
    });
    return Array.from(map.values());
  }, [filteredMatches]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar liveCount={statCounts.live} />

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "32px 20px 80px" }}>
        {/* ── Top Header & Date Controls ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div>
            <div className="gold-badge" style={{ marginBottom: 8 }}>
              <Flame size={12} />
              <span>AI Match Intelligence Feed</span>
            </div>
            <h1 style={{ fontSize: "clamp(22px, 2.5vw, 28px)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>
              Global Football Match Predictions
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              Algorithmic value odds, 1X2 market consensus, and live in-play metrics across 160+ leagues.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <DateSelector currentD={d} onSelectD={(newD) => { setD(newD); setSelectedCountry("all"); }} />
            
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              title="Sync latest live odds and matches"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                background: "var(--surface)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <RefreshCw size={13} className={isSyncing ? "animate-spin text-gold" : ""} />
              <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* ── Mobile Horizontal Region Filter Bar ── */}
        <div className="mobile-region-bar" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
            <button
              onClick={() => setSelectedCountry("all")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 999,
                background: selectedCountry === "all" ? "var(--gold)" : "var(--surface)",
                color: selectedCountry === "all" ? "var(--gold-btn-text)" : "var(--text-secondary)",
                border: selectedCountry === "all" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              <Globe size={13} />
              <span>All ({matches.length})</span>
            </button>
            {countries.slice(0, 10).map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCountry(c)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: selectedCountry === c ? "var(--gold)" : "var(--surface)",
                  color: selectedCountry === c ? "var(--gold-btn-text)" : "var(--text-secondary)",
                  border: selectedCountry === c ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                <span>{c}</span>
                <span style={{ fontSize: 10, opacity: 0.8 }}>({countryCounts[c]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Daily Free Tips Quota Banner ── */}
        {userTier === "free" ? (
          <div
            className="luxury-card"
            style={{
              marginBottom: 20,
              padding: "14px 20px",
              background: "linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)",
              border: "1px solid var(--gold-border)",
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
                  background: "var(--gold-bg)",
                  border: "1px solid var(--gold-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--gold)",
                  flexShrink: 0,
                }}
              >
                <Lock size={18} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
                    Free Tier: 7 Free Daily Tips Active
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "var(--gold-bg)",
                    border: "1px solid var(--gold-border)",
                    color: "var(--gold)",
                  }}>
                    7 / 7 Tips Unlocked Today
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "3px 0 0" }}>
                  First 7 matches have full AI predictions unlocked. Subsequent matches and live in-play picks require VIP PRO.
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
              <span>Unlock All 150+ Matches</span>
            </Link>
          </div>
        ) : (
          <div
            className="luxury-card"
            style={{
              marginBottom: 20,
              padding: "12px 18px",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldCheck size={18} color="var(--accent-green)" />
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--accent-green)" }}>
                VIP PRO Subscriber Active — 100% Unlocked Global AI Predictions & In-Play Telemetry
              </span>
            </div>
          </div>
        )}

        {/* ── Two-Column Layout (Sidebar + Match Feed) ── */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* Desktop Country Sidebar */}
          <div
            className="country-sidebar luxury-card"
            style={{
              width: 230,
              flexShrink: 0,
              overflow: "hidden",
              maxHeight: "calc(100vh - 120px)",
              overflowY: "auto",
              position: "sticky",
              top: 84,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 16px",
                background: "var(--surface-raised)",
                borderBottom: "1px solid var(--border-color)",
                fontSize: 11,
                fontWeight: 800,
                color: "var(--text-gold)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <Globe size={13} />
              <span>Browse Regions</span>
            </div>

            {/* All Countries Button */}
            <button
              onClick={() => setSelectedCountry("all")}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "11px 16px",
                fontSize: 12.5,
                fontWeight: selectedCountry === "all" ? 800 : 500,
                color: selectedCountry === "all" ? "var(--gold)" : "var(--text-secondary)",
                background: selectedCountry === "all" ? "var(--gold-bg)" : "transparent",
                border: "none",
                borderBottom: "1px solid var(--border-subtle)",
                borderLeft: selectedCountry === "all" ? "3px solid var(--gold)" : "3px solid transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <span>All Countries</span>
              <span
                className="tabular-nums"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 6,
                  background: selectedCountry === "all" ? "var(--gold)" : "var(--surface-raised)",
                  color: selectedCountry === "all" ? "var(--gold-btn-text)" : "var(--text-dim)",
                }}
              >
                {matches.length}
              </span>
            </button>

            {/* Individual Countries */}
            {countries.map((country) => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 16px",
                  fontSize: 12.5,
                  fontWeight: selectedCountry === country ? 800 : 500,
                  color: selectedCountry === country ? "var(--gold)" : "var(--text-secondary)",
                  background: selectedCountry === country ? "var(--gold-bg)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--border-subtle)",
                  borderLeft: selectedCountry === country ? "3px solid var(--gold)" : "3px solid transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                  {country}
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 6,
                    background: selectedCountry === country ? "var(--gold)" : "var(--surface-raised)",
                    color: selectedCountry === country ? "var(--gold-btn-text)" : "var(--text-dim)",
                  }}
                >
                  {countryCounts[country] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Right Feed Area */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Search Input Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderRadius: 12,
                boxShadow: "var(--shadow-subtle)",
              }}
            >
              <Search size={16} color="var(--gold)" />
              <input
                type="text"
                placeholder="Search teams, leagues, countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "var(--text-primary)",
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={{ background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* 4 Interactive Stat Filter Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 12,
              }}
            >
              {/* PREDICTED */}
              <button
                onClick={() => setActiveFilter(activeFilter === "predicted" ? "all" : "predicted")}
                className="luxury-card"
                style={{
                  padding: "14px 18px",
                  textAlign: "left",
                  cursor: "pointer",
                  border: activeFilter === "predicted" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                  background: activeFilter === "predicted" ? "var(--gold-bg)" : "var(--bg-card)",
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 800, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  AI PREDICTIONS
                </p>
                <p className="tabular-nums" style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                  {statCounts.predicted}
                </p>
              </button>

              {/* UPCOMING */}
              <button
                onClick={() => setActiveFilter(activeFilter === "upcoming" ? "all" : "upcoming")}
                className="luxury-card"
                style={{
                  padding: "14px 18px",
                  textAlign: "left",
                  cursor: "pointer",
                  border: activeFilter === "upcoming" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                  background: activeFilter === "upcoming" ? "var(--gold-bg)" : "var(--bg-card)",
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  UPCOMING
                </p>
                <p className="tabular-nums" style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                  {statCounts.upcoming}
                </p>
              </button>

              {/* LIVE */}
              <button
                onClick={() => setActiveFilter(activeFilter === "live" ? "all" : "live")}
                className="luxury-card"
                style={{
                  padding: "14px 18px",
                  textAlign: "left",
                  cursor: "pointer",
                  border: activeFilter === "live" ? "1px solid var(--accent-green)" : "1px solid var(--border-color)",
                  background: activeFilter === "live" ? "var(--accent-green-bg)" : "var(--bg-card)",
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 800, color: "var(--accent-green)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <Radio size={12} className="live-pulse" /> LIVE NOW
                </p>
                <p className="tabular-nums" style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                  {statCounts.live}
                </p>
              </button>

              {/* WON MATCHES */}
              <button
                onClick={() => setActiveFilter(activeFilter === "won" ? "all" : "won")}
                className="luxury-card"
                style={{
                  padding: "14px 18px",
                  textAlign: "left",
                  cursor: "pointer",
                  border: activeFilter === "won" ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                  background: activeFilter === "won" ? "var(--gold-bg)" : "var(--bg-card)",
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 800, color: "var(--accent-green)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  WON PICKS
                </p>
                <p className="tabular-nums" style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                  {statCounts.won}
                </p>
              </button>
            </div>

            {/* League Groups & Matches Feed */}
            {loading ? (
              <div className="luxury-card" style={{ padding: "60px 20px", textAlign: "center" }}>
                <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--gold)" }} />
                <p style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Loading quantitative match intelligence...</p>
              </div>
            ) : groupedByLeague.length === 0 ? (
              <div className="luxury-card" style={{ padding: "60px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  No matches found for this filter
                </p>
                <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  Try resetting your search query, selecting another region, or choosing a different date.
                </p>
              </div>
            ) : (
              groupedByLeague.map((group) => (
                <LeagueGroupCard
                  key={`${group.country}_${group.leagueName}`}
                  leagueName={group.leagueName}
                  country={group.country}
                  flagUrl={group.flagUrl}
                  matches={group.matches}
                />
              ))
            )}
          </div>
        </div>
      </main>

      <style>{`
        .mobile-region-bar {
          display: flex;
        }
        .country-sidebar {
          display: none;
        }
        @media (min-width: 1024px) {
          .mobile-region-bar {
            display: none !important;
          }
          .country-sidebar {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
