"use client";

import React, { useState, useMemo } from "react";
import { MatchData } from "@/lib/types";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import MatchFilterModal, { FilterState, DEFAULT_FILTERS } from "@/components/MatchFilterModal";
import { RefreshCw, RotateCcw } from "lucide-react";

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

  // Collect all available leagues
  const availableLeagues = useMemo(() => {
    const map = new Map<string, { name: string; country: string; count: number }>();
    initialGroups.forEach((g) => {
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
  }, [initialGroups]);

  // Flatten and filter all matches
  const filteredGroups = useMemo(() => {
    return initialGroups
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
            const r = m.predictions?.bestTip?.rating || (numericConf > 0 ? numericConf / 10 : 7.5);
            if (r < filters.minRating) return false;
          }

          // Category filter
          if (filters.category !== "all") {
            const numericConf = parseInt(m.confidence?.replace("%", "") || "0", 10);
            const bestRating = m.predictions?.bestTip?.rating || (numericConf > 0 ? numericConf / 10 : 7.5);
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
