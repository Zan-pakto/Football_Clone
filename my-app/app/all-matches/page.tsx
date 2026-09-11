"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import DateSelector from "@/components/DateSelector";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import { checkPredictionWon } from "@/components/MatchRow";
import { MatchData } from "@/lib/types";
import { RefreshCw, Search, Globe, ShieldCheck, Flame, Radio } from "lucide-react";

export default function AllMatchesPage() {
  const [d, setD] = useState("0");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "predicted" | "upcoming" | "live" | "won">("all");
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchMatches = useCallback(async (dayVal: string, forceSync = false) => {
    try {
      setLoading(true);
      const url = `/api/matches?d=${dayVal}${forceSync ? "&sync=true" : ""}`;
      const res = await fetch(url);
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
      console.error("Failed to load matches:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const pollLiveMatches = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/live?d=${d}`);
      const data = await res.json();
      if (data.success && data.liveUpdates && Object.keys(data.liveUpdates).length > 0) {
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

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 20px 80px" }}>
        {/* ── Top Header & Date Selector ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Today&apos;s Football Predictions
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
              High-accuracy statistical algorithmic match tips across global football leagues.
            </p>
          </div>
          <DateSelector currentD={d} onSelectD={(newD) => { setD(newD); setSelectedCountry("all"); }} />
        </div>

        {/* ── Two-Column Layout (Sidebar + Match Feed) ── */}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* Country Sidebar */}
          <div
            className="country-sidebar luxury-card"
            style={{
              width: 220,
              flexShrink: 0,
              overflow: "hidden",
              maxHeight: "calc(100vh - 120px)",
              overflowY: "auto",
              position: "sticky",
              top: 84,
            }}
          >
            {/* All Countries Button */}
            <button
              onClick={() => setSelectedCountry("all")}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                fontSize: 12,
                fontWeight: selectedCountry === "all" ? 800 : 500,
                color: selectedCountry === "all" ? "var(--gold)" : "var(--text-secondary)",
                background: selectedCountry === "all" ? "var(--gold-bg)" : "transparent",
                border: "none",
                borderBottom: "1px solid var(--border-color)",
                borderLeft: selectedCountry === "all" ? "3px solid var(--gold)" : "3px solid transparent",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Globe size={14} />
                All Countries
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 6px",
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
                  padding: "10px 16px",
                  fontSize: 12,
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
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 6px",
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
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
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
            </div>

            {/* 4 Stat Filter Cards */}
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
                  PREDICTED
                </p>
                <p style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
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
                <p style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
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
                  <Radio size={12} className="animate-pulse" /> LIVE
                </p>
                <p style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
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
                  WON MATCHES
                </p>
                <p style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                  {statCounts.won}
                </p>
              </button>
            </div>

            {/* League Groups & Matches Feed */}
            {loading ? (
              <div className="luxury-card" style={{ padding: "60px 20px", textAlign: "center" }}>
                <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--gold)" }} />
                <p style={{ color: "var(--text-secondary)" }}>Loading algorithmic match data...</p>
              </div>
            ) : groupedByLeague.length === 0 ? (
              <div className="luxury-card" style={{ padding: "60px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  No matches found for this filter
                </p>
                <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  Try selecting another country or date.
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
    </div>
  );
}
