"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import DateSelector from "@/components/DateSelector";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import { MatchData } from "@/lib/scraper/types";
import { RefreshCw, ShieldAlert } from "lucide-react";

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
        setMatches(data.matches);
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

  /* ── Derived stats (real numbers matching NerdyTips) ── */
  const statCounts = useMemo(() => {
    let predicted = 0, upcoming = 0, live = 0, won = 0;
    matches.forEach((m) => {
      const isLiveM = m.isLive || m.status === "live" || m.status === "In Progress";
      const isWon   = m.status === "won";
      const isFin   = isWon || m.status === "lost" || m.status === "fin" || m.elapsed === "FT";
      const isUp    = !isLiveM && !isFin;

      if (m.predictions?.bestTip?.pick || m.confidence) predicted++;
      if (isUp) upcoming++;
      if (isLiveM) live++;
      if (isWon) won++;
    });
    return { predicted, upcoming, live, won };
  }, [matches]);

  const liveCount = statCounts.live;

  // Country counts for sidebar
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    matches.forEach((m) => {
      if (m.country) counts[m.country] = (counts[m.country] || 0) + 1;
    });
    return counts;
  }, [matches]);

  const countries = useMemo(
    () => Object.keys(countryCounts).sort((a, b) => countryCounts[b] - countryCounts[a]),
    [countryCounts]
  );

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // Status filter
      if (activeFilter === "predicted" && (!m.predictions?.bestTip?.pick && !m.confidence)) return false;
      if (activeFilter === "live" && !(m.isLive || m.status === "live" || m.status === "In Progress")) return false;
      if (activeFilter === "upcoming") {
        const isLiveM = m.isLive || m.status === "live" || m.status === "In Progress";
        const isFin   = m.status === "won" || m.status === "lost" || m.status === "fin" || m.elapsed === "FT";
        if (isLiveM || isFin) return false;
      }
      if (activeFilter === "won" && m.status !== "won") return false;
      // Country filter
      if (selectedCountry !== "all" && m.country.toLowerCase() !== selectedCountry.toLowerCase()) return false;
      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (
          !m.homeTeam.toLowerCase().includes(q) &&
          !m.awayTeam.toLowerCase().includes(q) &&
          !m.leagueName.toLowerCase().includes(q) &&
          !m.country.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [matches, selectedCountry, searchTerm, activeFilter]);

  const leagueGroups = useMemo(() => {
    const groupsMap: Record<string, { leagueName: string; country: string; flagUrl: string | null; matches: MatchData[] }> = {};
    filteredMatches.forEach((m) => {
      const key = `${m.country}_${m.leagueName}`;
      if (!groupsMap[key]) groupsMap[key] = { leagueName: m.leagueName, country: m.country, flagUrl: m.flagUrl, matches: [] };
      groupsMap[key].matches.push(m);
    });
    return Object.values(groupsMap);
  }, [filteredMatches]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#080d18", color: "#f8fafc" }}>
      <Navbar liveCount={liveCount} onSync={handleManualSync} isSyncing={isSyncing} />

      <main style={{ flex: 1, maxWidth: 1200, width: "100%", margin: "0 auto", padding: "20px 16px" }}>

        {/* Page title + date selector */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
              Today&apos;s Football Predictions
            </h1>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              Predictions are locked without a subscription, but you can enjoy the selection of free tips.
            </p>
          </div>
          <DateSelector currentD={d} onSelectD={(newD) => { setD(newD); setSelectedCountry("all"); }} />
        </div>

        {/* ── Two-column layout: country sidebar + matches ── */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

          {/* Country Sidebar */}
          <div
            className="country-sidebar"
            style={{
              width: 200,
              flexShrink: 0,
              background: "#0d1220",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8,
              overflow: "hidden",
              maxHeight: "calc(100vh - 160px)",
              overflowY: "auto",
              position: "sticky",
              top: 74,
            }}
          >
            {/* All Countries */}
            <button
              onClick={() => setSelectedCountry("all")}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                fontSize: 12,
                fontWeight: selectedCountry === "all" ? 700 : 500,
                color: selectedCountry === "all" ? "#fff" : "#94a3b8",
                background: selectedCountry === "all" ? "rgba(16,185,129,0.08)" : "transparent",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span>All Countries</span>
              <span style={{
                fontSize: 11, fontWeight: 700, minWidth: 24, textAlign: "right",
                color: selectedCountry === "all" ? "#10b981" : "#475569",
              }}>
                {matches.length}
              </span>
            </button>

            {countries.map((country) => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: selectedCountry === country ? 700 : 400,
                  color: selectedCountry === country ? "#fff" : "#94a3b8",
                  background: selectedCountry === country ? "rgba(16,185,129,0.08)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
                  {country}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600, minWidth: 20, textAlign: "right", flexShrink: 0,
                  color: selectedCountry === country ? "#10b981" : "#475569",
                }}>
                  {countryCounts[country] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Matches Feed */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Search bar above matches */}
            <div style={{ marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Search teams, leagues, countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 14px",
                  background: "#0d1220",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#e2e8f0",
                  outline: "none",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(16,185,129,0.35)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
              />
            </div>

            {/* ── Exact NerdyTips Stat Cards Banner ── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}>
              {[
                { key: "all", label: "PREDICTED", value: matches.length,},
                { key: "upcoming", label: "UPCOMING", value: statCounts.upcoming },
                { key: "live", label: "LIVE", value: statCounts.live},
                { key: "won", label: "WON MATCHES", value: statCounts.won},
              ].map(({ key, label, value,}) => {
                const isActive = activeFilter === key || (key === "all" && activeFilter === "predicted");
                return (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key as any)}
                    style={{
                      background: isActive ? "#151930" : "#0f1325",
                      border: isActive ? "1.5px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: "16px 20px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 8,
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow: isActive ? "0 0 20px rgba(99,102,241,0.18)" : "none",
                      transition: "all 0.15s ease",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#8a94b8", letterSpacing: "0.08em" }}>
                        {label}
                      </span>
                     
                    </div>
                    <span style={{ fontSize: 30, fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
                      {loading ? "–" : value}
                    </span>
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <RefreshCw style={{ width: 28, height: 28, color: "#10b981", animation: "spin 1s linear infinite" }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Loading Football Predictions...</p>
              </div>
            ) : leagueGroups.length === 0 ? (
              <div style={{
                padding: "60px 24px", background: "#0d1220", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
              }}>
                <ShieldAlert style={{ width: 36, height: 36, color: "#334155" }} />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>No matches found</h3>
                <p style={{ fontSize: 12, color: "#64748b" }}>No matches match your current filter selection.</p>
                <button
                  onClick={() => { setSearchTerm(""); setSelectedCountry("all"); }}
                  style={{
                    marginTop: 6, padding: "7px 18px", background: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
                    fontSize: 12, fontWeight: 700, color: "#e2e8f0", cursor: "pointer",
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {leagueGroups.map((group, idx) => (
                  <LeagueGroupCard
                    key={`${group.country}_${group.leagueName}_${idx}`}
                    leagueName={group.leagueName}
                    country={group.country}
                    flagUrl={group.flagUrl}
                    matches={group.matches}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#0a0e18", padding: "24px 20px", marginTop: 40 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 6 }}>NERDYTIPS</p>
            <p style={{ fontSize: 11, color: "#64748b", maxWidth: 260, lineHeight: 1.6 }}>
              Get the best football predictions powered by AI! Analyzes 160+ leagues to deliver accurate tips and insights.
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>
              © 2026 · AI Football Predictions · Powered by NT Apex AI
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes liveDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.4)} }
        @media (max-width: 767px) {
          .country-sidebar { display: none; }
        }
      `}</style>
    </div>
  );
}
