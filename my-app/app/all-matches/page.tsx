"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import DateSelector from "@/components/DateSelector";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import { checkPredictionWon } from "@/components/MatchRow";
import { MatchData } from "@/lib/types";
import {
  RefreshCw,
  Search,
  Globe,
  ChevronDown,
  ArrowUpDown,
  Lock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function AllMatchesPage() {
  const [d, setD] = useState("0");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "predicted" | "upcoming" | "live" | "won">("predicted");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [sortField, setSortField] = useState<"default" | "time" | "rating">("default");
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
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
    return { predicted: predicted || matches.length, upcoming: upcoming || Math.max(0, matches.length - 20), live, won };
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
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)" }}>
      <Navbar liveCount={statCounts.live} />

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "20px 20px 80px" }}>
        {/* ── 1. Top Centered Date Selector ── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <DateSelector currentD={d} onSelectD={(newD) => { setD(newD); setSelectedCountry("all"); }} />
        </div>

        {/* ── 2. Two-Column Dashboard Layout (Left Sidebar + Right Content) ── */}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* ════ LEFT SIDEBAR: COUNTRIES ════ */}
          <div
            className="country-sidebar"
            style={{
              width: 210,
              flexShrink: 0,
              background: "var(--surface)",
              border: "1px solid var(--border-color)",
              borderRadius: 14,
              overflow: "hidden",
              position: "sticky",
              top: 80,
              maxHeight: "calc(100vh - 100px)",
              overflowY: "auto",
            }}
          >
            {/* Sidebar Title */}
            <div
              style={{
                padding: "12px 16px 8px",
                fontSize: 10.5,
                fontWeight: 800,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              COUNTRIES
            </div>

            {/* All Countries (Highlighted / Active Pill) */}
            <div style={{ padding: "0 8px 6px" }}>
              <button
                onClick={() => setSelectedCountry("all")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: selectedCountry === "all" ? 700 : 500,
                  color: selectedCountry === "all" ? "#FFFFFF" : "var(--text-secondary)",
                  background: selectedCountry === "all" ? "var(--accent-indigo)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: selectedCountry === "all" ? "0 4px 14px var(--accent-indigo-glow)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Globe size={14} />
                  <span>All Countries</span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: selectedCountry === "all" ? "#FFFFFF" : "var(--text-dim)",
                  }}
                >
                  {matches.length}
                </span>
              </button>
            </div>

            {/* Country List Rows */}
            <div style={{ padding: "0 8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
              {countries.map((country) => {
                const isSelected = selectedCountry === country;
                return (
                  <button
                    key={country}
                    onClick={() => setSelectedCountry(country)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? "#FFFFFF" : "var(--text-secondary)",
                      background: isSelected ? "var(--surface-raised)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "var(--surface-raised)";
                        e.currentTarget.style.color = "#FFFFFF";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
                      {country}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)" }}>
                      {countryCounts[country] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ════ RIGHT MAIN COLUMN ════ */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* ── 3. Top 4 Stat Filter Cards (Exact NerdyTips Design) ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
              className="stat-cards-grid"
            >
              {/* PREDICTED */}
              <button
                onClick={() => setActiveFilter("predicted")}
                style={{
                  padding: "16px 20px",
                  borderRadius: 14,
                  background: activeFilter === "predicted" ? "var(--surface-raised)" : "var(--surface)",
                  border: activeFilter === "predicted" ? "1px solid var(--accent-indigo)" : "1px solid var(--border-color)",
                  boxShadow: activeFilter === "predicted" ? "0 0 20px rgba(85, 88, 230, 0.28)" : "none",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  PREDICTED
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
                  {statCounts.predicted}
                </div>
              </button>

              {/* UPCOMING */}
              <button
                onClick={() => setActiveFilter("upcoming")}
                style={{
                  padding: "16px 20px",
                  borderRadius: 14,
                  background: activeFilter === "upcoming" ? "var(--surface-raised)" : "var(--surface)",
                  border: activeFilter === "upcoming" ? "1px solid var(--accent-indigo)" : "1px solid var(--border-color)",
                  boxShadow: activeFilter === "upcoming" ? "0 0 20px rgba(85, 88, 230, 0.28)" : "none",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  UPCOMING
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
                  {statCounts.upcoming}
                </div>
              </button>

              {/* LIVE */}
              <button
                onClick={() => setActiveFilter("live")}
                style={{
                  padding: "16px 20px",
                  borderRadius: 14,
                  background: activeFilter === "live" ? "var(--surface-raised)" : "var(--surface)",
                  border: activeFilter === "live" ? "1px solid var(--accent-indigo)" : "1px solid var(--border-color)",
                  boxShadow: activeFilter === "live" ? "0 0 20px rgba(85, 88, 230, 0.28)" : "none",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  LIVE
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
                  {statCounts.live}
                </div>
              </button>

              {/* WON MATCHES */}
              <button
                onClick={() => setActiveFilter("won")}
                style={{
                  padding: "16px 20px",
                  borderRadius: 14,
                  background: activeFilter === "won" ? "var(--surface-raised)" : "var(--surface)",
                  border: activeFilter === "won" ? "1px solid var(--accent-indigo)" : "1px solid var(--border-color)",
                  boxShadow: activeFilter === "won" ? "0 0 20px rgba(85, 88, 230, 0.28)" : "none",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  WON MATCHES
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
                  {statCounts.won}
                </div>
              </button>
            </div>

            {/* ── 4. Dropdown Filter / Search Toolbar (Exact NerdyTips Row) ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Default Sort */}
                <button
                  onClick={() => setSortField(sortField === "default" ? "rating" : "default")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 10,
                    background: "var(--surface)",
                    border: "1px solid var(--border-color)",
                    color: "#FFFFFF",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <ArrowUpDown size={13} color="var(--text-dim)" />
                  <span>{sortField === "rating" ? "Confidence Rating" : "Default"}</span>
                  <ChevronDown size={13} color="var(--text-dim)" />
                </button>

                {/* Descending Sort */}
                <button
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 10,
                    background: "var(--surface)",
                    border: "1px solid var(--border-color)",
                    color: "#FFFFFF",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <ArrowUpDown size={13} color="var(--text-dim)" />
                  <span>{sortOrder === "desc" ? "Descending" : "Ascending"}</span>
                  <ChevronDown size={13} color="var(--text-dim)" />
                </button>
              </div>

              {/* Search Bar */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 14px",
                  borderRadius: 10,
                  background: "var(--surface)",
                  border: "1px solid var(--border-color)",
                  width: "100%",
                  maxWidth: 240,
                }}
              >
                <Search size={14} color="var(--text-dim)" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "#FFFFFF",
                    fontSize: 12.5,
                    width: "100%",
                  }}
                />
              </div>
            </div>

            {/* ── 5. League Groups Feed ── */}
            {loading ? (
              <div
                style={{
                  padding: "60px 20px",
                  textAlign: "center",
                  background: "var(--surface)",
                  borderRadius: 14,
                  border: "1px solid var(--border-color)",
                }}
              >
                <RefreshCw size={26} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--accent-indigo)" }} />
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Loading algorithmic match telemetry...</p>
              </div>
            ) : groupedByLeague.length === 0 ? (
              <div
                style={{
                  padding: "60px 20px",
                  textAlign: "center",
                  background: "var(--surface)",
                  borderRadius: 14,
                  border: "1px solid var(--border-color)",
                }}
              >
                <p style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", marginBottom: 6 }}>No matches found for this filter</p>
                <p style={{ fontSize: 12.5, color: "var(--text-dim)" }}>Try clearing the search or choosing another date.</p>
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
        .country-sidebar { display: none !important; }
        @media (min-width: 960px) {
          .country-sidebar { display: block !important; }
        }
        @media (max-width: 768px) {
          .stat-cards-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
