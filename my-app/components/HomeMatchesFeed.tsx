"use client";

import React, { useState, useMemo } from "react";
import { MatchData } from "@/lib/types";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import MatchFilterModal, { FilterState, DEFAULT_FILTERS } from "@/components/MatchFilterModal";
import { RefreshCw, RotateCcw } from "lucide-react";
import { toCachedLogoUrl } from "@/lib/logo-utils";

interface LeagueGroupItem {
  leagueName: string;
  country: string;
  flagUrl: string | null;
  matches: MatchData[];
}

interface HomeMatchesFeedProps {
  initialGroups: LeagueGroupItem[];
  totalMatches: number;
}

export default function HomeMatchesFeed({ initialGroups, totalMatches }: HomeMatchesFeedProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [groups, setGroups] = useState<LeagueGroupItem[]>(initialGroups);

  // Sync feed on client mount and when auth state changes (e.g. login/logout)
  React.useEffect(() => {
    async function syncFeed() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`/api/fixtures?d=0&_t=${Date.now()}`, {
          headers,
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.groups)) {
          const mapped = data.groups.map((g: any) => ({
            leagueName: g.league.name,
            country: g.country.name,
            flagUrl: g.country.flag || null,
            matches: (g.fixtures || []).map((f: any) => {
              const p1x2 = f.predictions?.find((p: any) => p.market === "1X2" || p.market === "DOUBLE_CHANCE");
              const pGoals = f.predictions?.find((p: any) => p.market === "OVER_UNDER");
              const pBtts = f.predictions?.find((p: any) => p.market === "BTTS");
              const pBest = f.predictions && f.predictions.length > 0
                ? [...f.predictions].sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0))[0]
                : null;

              const isGoalsBest = Boolean(pBest && pBest.market === "OVER_UNDER");
              const isBttsBest = Boolean(pBest && pBest.market === "BTTS");
              const is1x2Best = Boolean(pBest ? (!isGoalsBest && !isBttsBest) : true);
              const bestMarket = isGoalsBest ? "goals" : isBttsBest ? "btts" : "pickScore";
              const bestMarketLabel = isGoalsBest ? "O/U Goals" : isBttsBest ? "BTTS" : "1X2 Winner";

              return {
                id: f.id,
                url: `/match/${f.id}`,
                leagueName: g.league.name,
                country: g.country.name,
                flagUrl: g.country.flag || null,
                homeTeam: f.homeTeam.name,
                awayTeam: f.awayTeam.name,
                homeLogo: toCachedLogoUrl(f.homeTeam?.logo || f.homeLogo),
                awayLogo: toCachedLogoUrl(f.awayTeam?.logo || f.awayLogo),
                kickTime: f.kickTime || (f.kickoffTime?.includes("T") ? new Date(f.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : f.kickoffTime) || "00:00",
                status: f.status === "LIVE" ? "live" : f.status === "FINISHED" ? "won" : "upcoming",
                homeScore: f.homeScore !== null && f.homeScore !== undefined ? String(f.homeScore) : null,
                awayScore: f.awayScore !== null && f.awayScore !== undefined ? String(f.awayScore) : null,
                elapsed: f.elapsed,
                isLive: f.status === "LIVE",
                odds: {
                  home: f.odds?.home ? String(f.odds.home) : "1.75",
                  draw: f.odds?.draw ? String(f.odds.draw) : "3.50",
                  away: f.odds?.away ? String(f.odds.away) : "4.20",
                },
                rating: f.rating || null,
                predictions: {
                  pickScore: {
                    pick: p1x2?.isLocked ? null : (p1x2?.selection || null),
                    odd: p1x2?.isLocked ? null : (p1x2?.odd ? String(p1x2.odd) : null),
                    isLocked: Boolean(p1x2?.isLocked),
                    market: "1X2",
                    marketLabel: "1X2 Winner",
                    confidence: p1x2?.confidence || null,
                    rating: p1x2?.rating ?? (p1x2?.confidence ? Number((p1x2.confidence / 10).toFixed(1)) : null),
                    isBest: is1x2Best,
                  },
                  goals: {
                    pick: pGoals?.isLocked ? null : (pGoals?.selection || null),
                    odd: pGoals?.isLocked ? null : (pGoals?.odd ? String(pGoals.odd) : null),
                    isLocked: Boolean(pGoals?.isLocked),
                    market: "OVER_UNDER",
                    marketLabel: "O/U Goals",
                    confidence: pGoals?.confidence || null,
                    rating: pGoals?.confidence ? Number((pGoals.confidence / 10).toFixed(1)) : null,
                    isBest: isGoalsBest,
                  },
                  btts: {
                    pick: pBtts?.isLocked ? null : (pBtts?.selection || null),
                    odd: pBtts?.isLocked ? null : (pBtts?.odd ? String(pBtts.odd) : null),
                    isLocked: Boolean(pBtts?.isLocked),
                    market: "BTTS",
                    marketLabel: "Both Teams Score",
                    confidence: pBtts?.confidence || null,
                    rating: pBtts?.confidence ? Number((pBtts.confidence / 10).toFixed(1)) : null,
                    isBest: isBttsBest,
                  },
                  bestTip: {
                    pick: pBest?.isLocked ? null : (pBest?.selection || p1x2?.selection || null),
                    odd: pBest?.isLocked ? null : (pBest?.odd ? String(pBest.odd) : p1x2?.odd ? String(p1x2.odd) : null),
                    isLocked: Boolean(pBest?.isLocked),
                    market: pBest?.market || "1X2",
                    marketLabel: bestMarketLabel,
                    confidence: pBest?.confidence || null,
                    rating: pBest?.confidence ? Number((pBest.confidence / 10).toFixed(1)) : 8.5,
                    isBest: true,
                  },
                  bestMarket,
                },
              };
            }),
          }));
          setGroups(mapped);
        }
      } catch {
        // Fallback
      }
    }

    syncFeed();
    const onAuth = () => syncFeed();
    window.addEventListener("jt_auth_change", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("jt_auth_change", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, []);

  // Collect all available leagues
  const availableLeagues = useMemo(() => {
    const map = new Map<string, { name: string; country: string; count: number }>();
    groups.forEach((g) => {
      const key = `${g.country || "Int"}_${g.leagueName}`;
      if (map.has(key)) {
        map.get(key)!.count += g.matches.length;
      } else {
        map.set(key, {
          name: g.leagueName,
          country: g.country,
          count: g.matches.length,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [groups]);

  // Flatten and filter all matches
  const filteredGroups = useMemo(() => {
    return groups
      .map((group) => {
        // League filter
        if (filters.selectedLeagues.length > 0 && !filters.selectedLeagues.includes(group.leagueName)) {
          return null;
        }

        const matchingFixtures = group.matches.filter((m) => {
          // Search filter
          if (filters.searchTerm.trim()) {
            const q = filters.searchTerm.toLowerCase();
            const hit =
              m.homeTeam.toLowerCase().includes(q) ||
              m.awayTeam.toLowerCase().includes(q) ||
              group.leagueName.toLowerCase().includes(q) ||
              group.country.toLowerCase().includes(q);
            if (!hit) return false;
          }

          // Market filter
          if (filters.market !== "all") {
            if (filters.market === "1x2" && !m.predictions?.pickScore?.pick) return false;
            if (filters.market === "over15" && (!m.predictions?.goals?.pick || !m.predictions.goals.pick.includes("Over"))) return false;
            if (filters.market === "over25" && (!m.predictions?.goals?.pick || !m.predictions.goals.pick.includes("Over 2.5"))) return false;
            if (filters.market === "under25" && (!m.predictions?.goals?.pick || !m.predictions.goals.pick.includes("Under"))) return false;
            if (filters.market === "btts" && (!m.predictions?.btts?.pick || m.predictions.btts.pick !== "Yes")) return false;
            if (filters.market === "double_chance" && (!m.predictions?.pickScore?.pick || !["1X", "X2", "12"].includes(m.predictions.pickScore.pick))) return false;
          }

          // Rating filter
          if (filters.minRating > 0) {
            const numericConf = parseInt(m.confidence?.replace("%", "") || "0", 10);
            const r = typeof m.rating === "number" ? m.rating : (m.predictions?.bestTip?.rating || (numericConf > 0 ? numericConf / 10 : 7.5));
            if (r < filters.minRating) return false;
          }

          // Category filter
          if (filters.category !== "all") {
            const numericConf = parseInt(m.confidence?.replace("%", "") || "0", 10);
            const bestRating = typeof m.rating === "number" ? m.rating : (m.predictions?.bestTip?.rating || (numericConf > 0 ? numericConf / 10 : 7.5));
            const bestOdd = parseFloat(m.predictions?.bestTip?.odd || "1.75");

            if (filters.category === "top_tips" && bestRating < 8.2) return false;
            if (filters.category === "safe_picks" && (bestRating < 8.0 || bestOdd > 1.85)) return false;
            if (filters.category === "value_bets" && bestOdd < 2.0) return false;
            if (filters.category === "high_scoring" && (!m.predictions?.goals?.pick || !m.predictions.goals.pick.includes("Over"))) return false;
            if (filters.category === "live" && (!m.isLive && m.status !== "live")) return false;
            if (filters.category === "won" && m.status !== "won") return false;
          }

          return true;
        });

        if (matchingFixtures.length === 0) return null;

        return {
          ...group,
          matches: matchingFixtures,
        };
      })
      .filter(Boolean) as LeagueGroupItem[];
  }, [initialGroups, filters]);

  const filteredMatchesCount = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.matches.length, 0);
  }, [filteredGroups]);

  return (
    <div>
      {/* ── Dynamic Filter Bar & Modal ── */}
      <MatchFilterModal
        filters={filters}
        onFilterChange={setFilters}
        availableLeagues={availableLeagues}
        totalMatchesCount={totalMatches}
        filteredCount={filteredMatchesCount}
      />

      {/* ── League Groups Feed ── */}
      {filteredGroups.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredGroups.map((group, idx) => (
            <LeagueGroupCard
              key={`${group.country || "Int"}_${group.leagueName}_${idx}`}
              leagueName={group.leagueName}
              country={group.country}
              flagUrl={group.flagUrl}
              matches={group.matches}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "#141132",
            border: "1px solid rgba(167, 159, 255, 0.12)",
            borderRadius: 14,
          }}
        >
          <p style={{ color: "#ffffff", fontSize: "16px", fontWeight: 800, margin: "0 0 8px" }}>
            No matches match the selected filters
          </p>
          <p style={{ color: "#a79fff", fontSize: "13px", margin: "0 0 16px" }}>
            Try broadening your rating threshold or choosing &quot;All Markets&quot;.
          </p>
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              cursor: "pointer",
              background: "rgba(139, 127, 245, 0.2)",
              color: "#ffffff",
              border: "1px solid #8b7ff5",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <RotateCcw size={14} />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
