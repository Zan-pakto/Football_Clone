"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import DateSelector from "@/components/DateSelector";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import { checkPredictionWon } from "@/components/MatchRow";
import { MatchData } from "@/lib/types";
import MatchFilterModal, { FilterState, DEFAULT_FILTERS } from "@/components/MatchFilterModal";
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

// Module-level persistent cache across page navigations (Zero DB calls on page switch)
const clientAllMatchesCache = new Map<
  string,
  {
    matches: MatchData[];
    userTier: "free" | "premium";
    freeTipsLimit: number;
    freeTipsUsed: number;
    cachedAt: number;
  }
>();

export default function AllMatchesPage() {
  const [d, setD] = useState("0");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "predicted" | "upcoming" | "live" | "won">("predicted");
  const [modalFilters, setModalFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [sortField, setSortField] = useState<"default" | "time" | "rating">("default");

  // Instant render from client cache if user already visited
  const initialCache = clientAllMatchesCache.get("0");
  const [matches, setMatches] = useState<MatchData[]>(initialCache ? initialCache.matches : []);
  const [loading, setLoading] = useState(!initialCache);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userTier, setUserTier] = useState<"free" | "premium">(initialCache ? initialCache.userTier : "free");
  const [freeTipsLimit, setFreeTipsLimit] = useState(initialCache ? initialCache.freeTipsLimit : 7);
  const [freeTipsUsed, setFreeTipsUsed] = useState(initialCache ? initialCache.freeTipsUsed : 0);

  const fetchMatches = useCallback(async (dayVal: string, forceSync = false) => {
    // 1. Instant cache hit: render immediately with ZERO network or DB latency
    const cached = clientAllMatchesCache.get(dayVal);
    if (cached && !forceSync) {
      setMatches(cached.matches);
      setUserTier(cached.userTier);
      setFreeTipsLimit(cached.freeTipsLimit);
      setFreeTipsUsed(cached.freeTipsUsed);
      setLoading(false);

      // If cached recently (within 5 mins), return without refetching
      if (Date.now() - cached.cachedAt < 5 * 60 * 1000) {
        return;
      }
    }

    try {
      if (!cached) setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const tz = -new Date().getTimezoneOffset();
      const url = `/api/matches?d=${dayVal}&tz=${tz}${forceSync ? "&sync=true" : ""}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("json")) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        const uTier = data.userTier || "free";
        const fLimit = data.freeTipsLimit || 7;
        const fUsed = typeof data.freeTipsUsed === "number" ? data.freeTipsUsed : 0;

        setUserTier(uTier);
        setFreeTipsLimit(fLimit);
        setFreeTipsUsed(fUsed);

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

        // Store into client memory cache so returning to this page is 100% instant
        clientAllMatchesCache.set(dayVal, {
          matches: data.matches,
          userTier: uTier,
          freeTipsLimit: fLimit,
          freeTipsUsed: fUsed,
          cachedAt: Date.now(),
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
      if (!res.ok) return;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("json")) return;
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
    const isPastDay = parseInt(d, 10) < 0;
    const isFutureDay = parseInt(d, 10) > 0;
    let predicted = 0, upcoming = 0, live = 0, won = 0;

    matches.forEach((m) => {
      const isLiveM = !isPastDay && Boolean(m.isLive || m.status === "live" || m.status === "In Progress" || (m.elapsed && /^\d+['′]/.test(m.elapsed)));
      const hasScores = m.homeScore !== null && m.awayScore !== null && m.homeScore !== "" && m.awayScore !== "";
      const isFin   = isPastDay || m.status === "won" || m.status === "lost" || m.status === "fin" || m.status === "finished" || m.elapsed === "FT" || hasScores;
      const isWon   = !isFutureDay && (m.status === "won" || (isFin && checkPredictionWon(m.predictions?.bestTip?.pick, m.homeScore, m.awayScore) === true));
      const isUp    = isFutureDay || (!isLiveM && !isFin);

      if (m.predictions?.bestTip?.pick || m.confidence) predicted++;
      if (isUp) upcoming++;
      if (isLiveM) live++;
      if (isWon) won++;
    });

    return {
      predicted: predicted || matches.length,
      upcoming: isPastDay ? 0 : (isFutureDay ? matches.length : upcoming),
      live: isPastDay || isFutureDay ? 0 : live,
      won: isFutureDay ? 0 : won,
    };
  }, [matches, d]);

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

  const availableLeagues = useMemo(() => {
    const map = new Map<string, { name: string; country: string; count: number }>();
    matches.forEach((m) => {
      const key = `${m.country || "Int"}_${m.leagueName}`;
      if (!map.has(key)) {
        map.set(key, { name: m.leagueName, country: m.country, count: 0 });
      }
      map.get(key)!.count++;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedCountry !== "all" && (m.country || "International") !== selectedCountry) {
        return false;
      }

      // Modal Leagues Filter
      if (modalFilters.selectedLeagues.length > 0 && !modalFilters.selectedLeagues.includes(m.leagueName)) {
        return false;
      }

      // Search Query
      const q = (modalFilters.searchTerm || searchTerm).toLowerCase().trim();
      if (q) {
        const home = m.homeTeam.toLowerCase();
        const away = m.awayTeam.toLowerCase();
        const league = (m.leagueName || "").toLowerCase();
        const country = (m.country || "").toLowerCase();
        if (!home.includes(q) && !away.includes(q) && !league.includes(q) && !country.includes(q)) {
          return false;
        }
      }

      // Market Filter
      if (modalFilters.market !== "all") {
        if (modalFilters.market === "1x2" && !m.predictions?.pickScore?.pick) return false;
        if (modalFilters.market === "over15" && (!m.predictions?.goals?.pick || !m.predictions.goals.pick.includes("Over"))) return false;
        if (modalFilters.market === "over25" && (!m.predictions?.goals?.pick || !m.predictions.goals.pick.includes("Over 2.5"))) return false;
        if (modalFilters.market === "under25" && (!m.predictions?.goals?.pick || !m.predictions.goals.pick.includes("Under"))) return false;
        if (modalFilters.market === "btts" && (!m.predictions?.btts?.pick || m.predictions.btts.pick !== "Yes")) return false;
        if (modalFilters.market === "double_chance" && (!m.predictions?.pickScore?.pick || !["1X", "X2", "12"].includes(m.predictions.pickScore.pick))) return false;
      }

      // Rating Filter
      if (modalFilters.minRating > 0) {
        const numericConf = parseInt(m.confidence?.replace("%", "") || "0", 10);
        const r = m.predictions?.bestTip?.rating || (numericConf > 0 ? numericConf / 10 : 7.5);
        if (r < modalFilters.minRating) return false;
      }

      // Category Filter (Modal)
      if (modalFilters.category !== "all") {
        const numericConf = parseInt(m.confidence?.replace("%", "") || "0", 10);
        const bestRating = m.predictions?.bestTip?.rating || (numericConf > 0 ? numericConf / 10 : 7.5);
        const bestOdd = parseFloat(m.predictions?.bestTip?.odd || "1.75");

        if (modalFilters.category === "top_tips" && bestRating < 8.2) return false;
        if (modalFilters.category === "safe_picks" && (bestRating < 8.0 || bestOdd > 1.85)) return false;
        if (modalFilters.category === "value_bets" && bestOdd < 2.0) return false;
        if (modalFilters.category === "high_scoring" && (!m.predictions?.goals?.pick || !m.predictions.goals.pick.includes("Over"))) return false;
        if (modalFilters.category === "live" && (!m.isLive && m.status !== "live")) return false;
        if (modalFilters.category === "won" && m.status !== "won") return false;
      }

      // Top Stat Cards Filter
      const isPastDay = parseInt(d, 10) < 0;
      const isFutureDay = parseInt(d, 10) > 0;

      if (activeFilter === "predicted") {
        return Boolean(m.predictions?.bestTip?.pick || m.confidence);
      }
      if (activeFilter === "upcoming") {
        if (isPastDay) return false;
        if (isFutureDay) return true;
        const isLiveM = Boolean(m.isLive || m.status === "live" || m.status === "In Progress" || (m.elapsed && /^\d+['′]/.test(m.elapsed)));
        const hasScores = m.homeScore !== null && m.awayScore !== null && m.homeScore !== "" && m.awayScore !== "";
        const isFin   = m.status === "won" || m.status === "lost" || m.status === "fin" || m.status === "finished" || m.elapsed === "FT" || hasScores;
        return !isLiveM && !isFin;
      }
      if (activeFilter === "live") {
        if (isPastDay || isFutureDay) return false;
        return Boolean(m.isLive || m.status === "live" || m.status === "In Progress" || (m.elapsed && /^\d+['′]/.test(m.elapsed)));
      }
      if (activeFilter === "won") {
        if (isFutureDay) return false;
        const hasScores = m.homeScore !== null && m.awayScore !== null && m.homeScore !== "" && m.awayScore !== "";
        const isFin   = isPastDay || m.status === "won" || m.status === "lost" || m.status === "fin" || m.status === "finished" || m.elapsed === "FT" || hasScores;
        return m.status === "won" || (isFin && checkPredictionWon(m.predictions?.bestTip?.pick, m.homeScore, m.awayScore) === true);
      }
      return true;
    });
  }, [matches, selectedCountry, searchTerm, activeFilter, modalFilters, d]);

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
          <DateSelector
            currentD={d}
            onSelectD={(newD) => {
              setD(newD);
              setSelectedCountry("all");
              const nextIsPast = parseInt(newD, 10) < 0;
              const nextIsFuture = parseInt(newD, 10) > 0;
              if (nextIsPast && (activeFilter === "upcoming" || activeFilter === "live")) {
                setActiveFilter("predicted");
              } else if (nextIsFuture && (activeFilter === "won" || activeFilter === "live")) {
                setActiveFilter("predicted");
              }
            }}
          />
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

            {/* ── 4. NerdyTips Master Filter Toolbar & Modal ── */}
            <MatchFilterModal
              filters={modalFilters}
              onFilterChange={setModalFilters}
              availableLeagues={availableLeagues}
              totalMatchesCount={matches.length}
              filteredCount={filteredMatches.length}
            />

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
              groupedByLeague.map((group, gIdx) => (
                <LeagueGroupCard
                  key={`${group.country || "Int"}_${group.leagueName}_${gIdx}`}
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
