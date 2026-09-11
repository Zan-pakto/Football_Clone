"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { MatchData } from "@/lib/types";
import { Trophy, Globe, Search, ArrowRight, Layers, ChevronRight, RefreshCw } from "lucide-react";

export default function LeaguesPage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/matches?d=0");
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        setMatches(data.matches);
      }
    } catch (err) {
      console.error("Failed to load leagues data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const leaguesByCountry = useMemo(() => {
    const map: Record<string, { country: string; flagUrl: string | null; leagues: Record<string, number> }> = {};

    matches.forEach((m) => {
      const c = m.country || "International";
      if (!map[c]) {
        map[c] = {
          country: c,
          flagUrl: m.flagUrl,
          leagues: {},
        };
      }
      map[c].leagues[m.leagueName] = (map[c].leagues[m.leagueName] || 0) + 1;
    });

    return Object.values(map);
  }, [matches]);

  const totalCountries = leaguesByCountry.length;
  const totalLeagues = useMemo(() => {
    return leaguesByCountry.reduce((acc, c) => acc + Object.keys(c.leagues).length, 0);
  }, [leaguesByCountry]);

  const filteredLeagues = useMemo(() => {
    return leaguesByCountry.filter((item) => {
      if (selectedRegion !== "all") {
        if (selectedRegion === "top5") {
          const top5 = ["England", "Spain", "Germany", "Italy", "France"];
          if (!top5.includes(item.country)) return false;
        } else if (item.country.toLowerCase() !== selectedRegion.toLowerCase()) {
          return false;
        }
      }
      if (search) {
        const q = search.toLowerCase();
        const inCountry = item.country.toLowerCase().includes(q);
        const inLeagues = Object.keys(item.leagues).some((l) => l.toLowerCase().includes(q));
        return inCountry || inLeagues;
      }
      return true;
    });
  }, [leaguesByCountry, selectedRegion, search]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar />

      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "28px 20px 80px" }}>
        
        {/* ── Top Hero Card ── */}
        <div
          className="luxury-card"
          style={{
            padding: "28px 32px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "var(--gold-bg)",
                border: "1px solid var(--gold-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold)",
                flexShrink: 0,
              }}
            >
              <Trophy size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Football Leagues & Competitions
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                Explore algorithmic coverage across 160+ international leagues, cups, and continental tournaments.
              </p>
            </div>
          </div>

          {/* 3 Metric Pills */}
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ textAlign: "center", padding: "8px 16px", borderRadius: 10, background: "var(--surface-raised)", border: "1px solid var(--border-color)" }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase" }}>Countries</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>{totalCountries}</p>
            </div>
            <div style={{ textAlign: "center", padding: "8px 16px", borderRadius: 10, background: "var(--surface-raised)", border: "1px solid var(--border-color)" }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase" }}>Leagues</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>{totalLeagues}</p>
            </div>
            <div style={{ textAlign: "center", padding: "8px 16px", borderRadius: 10, background: "var(--surface-raised)", border: "1px solid var(--border-color)" }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "var(--accent-green)", textTransform: "uppercase" }}>Matches Today</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: "var(--accent-green)", margin: 0 }}>{matches.length}</p>
            </div>
          </div>
        </div>

        {/* ── Filter Bar & Search ── */}
        <div
          className="luxury-card"
          style={{
            padding: "12px 18px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {/* Region Pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All Countries" },
              { id: "top5", label: "Top 5 Leagues" },
              { id: "England", label: "England" },
              { id: "Spain", label: "Spain" },
              { id: "Germany", label: "Germany" },
              { id: "Italy", label: "Italy" },
              { id: "France", label: "France" },
            ].map((reg) => {
              const isSel = selectedRegion === reg.id;
              return (
                <button
                  key={reg.id}
                  onClick={() => setSelectedRegion(reg.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: isSel ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                    background: isSel ? "var(--gold)" : "transparent",
                    color: isSel ? "var(--gold-btn-text)" : "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {reg.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 8,
              background: "var(--surface-raised)",
              border: "1px solid var(--border-color)",
              width: 240,
            }}
          >
            <Search size={14} color="var(--gold)" />
            <input
              type="text"
              placeholder="Search league or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 12,
                color: "var(--text-primary)",
              }}
            />
          </div>
        </div>

        {/* ── Leagues 3-Column Grid ── */}
        {loading ? (
          <div className="luxury-card" style={{ padding: 60, textAlign: "center" }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--gold)" }} />
            <p style={{ color: "var(--text-secondary)" }}>Loading league directory...</p>
          </div>
        ) : filteredLeagues.length === 0 ? (
          <div className="luxury-card" style={{ padding: 60, textAlign: "center" }}>
            <p style={{ color: "var(--text-secondary)" }}>No leagues found matching your query.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: 16,
            }}
          >
            {filteredLeagues.map((item) => {
              const countryTotalMatches = Object.values(item.leagues).reduce((a, b) => a + b, 0);

              return (
                <div
                  key={item.country}
                  className="luxury-card"
                  style={{
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  {/* Card Header: Country Name + Count Badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid var(--border-color)",
                      paddingBottom: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: "var(--surface-raised)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--gold)",
                        }}
                      >
                        <Globe size={16} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                        {item.country}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "var(--surface-raised)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      {countryTotalMatches} {countryTotalMatches === 1 ? "match" : "matches"}
                    </span>
                  </div>

                  {/* Sub Leagues List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {Object.entries(item.leagues).map(([lName, mCount]) => (
                      <Link
                        key={lName}
                        href={`/all-matches`}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "var(--surface-raised)",
                          border: "1px solid var(--border-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          color: "var(--text-secondary)",
                          fontSize: 12,
                          fontWeight: 600,
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--gold)";
                          e.currentTarget.style.borderColor = "var(--gold-border)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--text-secondary)";
                          e.currentTarget.style.borderColor = "var(--border-subtle)";
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)" }} />
                          {lName}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)" }}>
                            {mCount}
                          </span>
                          <ChevronRight size={14} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
