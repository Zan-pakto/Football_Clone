"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import DateSelector from "@/components/DateSelector";
import MatchFilterBar from "@/components/MatchFilterBar";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import { MatchData } from "@/lib/scraper/types";
import { RefreshCw, ShieldAlert, Layers } from "lucide-react";

export default function AllMatchesPage() {
  const [d, setD] = useState("0");
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
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
      // data.liveUpdates is the key-indexed Record<id, LiveMatchUpdate> object
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

  const countries = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => { if (m.country) set.add(m.country); });
    return Array.from(set).sort();
  }, [matches]);

  const liveCount = useMemo(
    () => matches.filter((m) => m.isLive || m.status === "live" || m.status === "In Progress").length,
    [matches]
  );

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (activeTab === "live" && !(m.isLive || m.status === "live" || m.status === "In Progress")) return false;
      if (activeTab === "upcoming" && (m.status === "won" || m.status === "fin" || m.isLive)) return false;
      if (activeTab === "finished" && !(m.status === "won" || m.status === "fin" || m.elapsed === "FT")) return false;
      if (selectedCountry !== "all" && m.country.toLowerCase() !== selectedCountry.toLowerCase()) return false;
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
  }, [matches, activeTab, selectedCountry, searchTerm]);

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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0b0f19", color: "#f8fafc" }}>
      <Navbar liveCount={liveCount} onSync={handleManualSync} isSyncing={isSyncing} />

      <main style={{ flex: 1, maxWidth: 1280, width: "100%", margin: "0 auto", padding: "28px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 18 }}>
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, fontWeight: 900, color: "#fff" }}>
              <Layers style={{ width: 22, height: 22, color: "#10b981" }} />
              All Football Predictions
            </h1>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Live odds, AI predictions, 1X2, goals market, and confidence ratings
            </p>
          </div>
          <DateSelector currentD={d} onSelectD={(newD) => setD(newD)} />
        </div>

        {/* Filter Bar */}
        <MatchFilterBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
          countries={countries}
        />

        {/* Match Feed */}
        {loading ? (
          <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <RefreshCw style={{ width: 32, height: 32, color: "#10b981", animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>Scraping &amp; Loading Football Predictions...</p>
          </div>
        ) : leagueGroups.length === 0 ? (
          <div style={{
            padding: "64px 24px", background: "#0f1624", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
          }}>
            <ShieldAlert style={{ width: 40, height: 40, color: "#334155" }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>No matches found</h3>
            <p style={{ fontSize: 13, color: "#64748b" }}>No matches match your current date and filter selection.</p>
            <button
              onClick={() => { setActiveTab("all"); setSearchTerm(""); setSelectedCountry("all"); }}
              style={{
                marginTop: 8, padding: "8px 20px", background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#e2e8f0", cursor: "pointer",
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#070a10", padding: "20px", textAlign: "center", fontSize: 12, color: "#475569" }}>
        FootyIntel AI • Full Predictions Table Directory
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
