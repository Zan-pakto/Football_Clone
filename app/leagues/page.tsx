"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { MatchData } from "@/lib/scraper/types";
import { Trophy, Globe, Search, ArrowRight, ShieldCheck, Zap, Layers, ChevronRight, RefreshCw } from "lucide-react";

export default function LeaguesPage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/sync?d=0", { method: "POST" });
      const data = await res.json();
      if (data.success) await fetchMatches();
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

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

    let list = Object.values(map);

    // Region filter
    if (selectedRegion !== "all") {
      if (selectedRegion === "top5") {
        const top5 = ["england", "spain", "germany", "italy", "france"];
        list = list.filter((item) => top5.includes(item.country.toLowerCase()));
      } else {
        list = list.filter((item) => item.country.toLowerCase() === selectedRegion.toLowerCase());
      }
    }

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.country.toLowerCase().includes(q) ||
          Object.keys(item.leagues).some((l) => l.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => a.country.localeCompare(b.country));
  }, [matches, search, selectedRegion]);

  const liveCount = useMemo(
    () => matches.filter((m) => m.isLive || m.status === "live" || m.status === "In Progress" || (m.elapsed && /^\d+['′]/.test(m.elapsed))).length,
    [matches]
  );

  const totalLeaguesCount = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => set.add(`${m.country}_${m.leagueName}`));
    return set.size;
  }, [matches]);

  const totalCountriesCount = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => { if (m.country) set.add(m.country); });
    return set.size;
  }, [matches]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#060814", color: "#f8fafc" }}>
      <Navbar liveCount={liveCount} onSync={handleSync} isSyncing={isSyncing} />

      <main style={{ flex: 1, maxWidth: 1240, width: "100%", margin: "0 auto", padding: "28px 16px" }}>

        {/* ── Top Header Title & Stats ── */}
        <div style={{
          background: "linear-gradient(135deg, #0c1024 0%, #080b1a 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 24,
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{
                  background: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  padding: 8,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Trophy style={{ width: 20, height: 20, color: "#f59e0b" }} />
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.5px", margin: 0 }}>
                  Football Leagues & Competitions
                </h1>
              </div>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                Explore coverage across 160+ international leagues, cups, and regional football divisions.
              </p>
            </div>

            {/* Stats Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{
                background: "#13172e",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "8px 14px",
                borderRadius: 10,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Countries</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#ffffff" }}>{loading ? "–" : totalCountriesCount}</div>
              </div>
              <div style={{
                background: "#13172e",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "8px 14px",
                borderRadius: 10,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Leagues</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#6366f1" }}>{loading ? "–" : totalLeaguesCount}</div>
              </div>
              <div style={{
                background: "#13172e",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "8px 14px",
                borderRadius: 10,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Matches Today</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#10b981" }}>{loading ? "–" : matches.length}</div>
              </div>
            </div>
          </div>

          {/* ── Search & Quick Region Filter ── */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Quick Filter Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {[
                { id: "all", label: "All Countries" },
                { id: "top5", label: "Top 5 Leagues" },
                { id: "england", label: "England" },
                { id: "spain", label: "Spain" },
                { id: "germany", label: "Germany" },
                { id: "italy", label: "Italy" },
                { id: "france", label: "France" },
              ].map((pill) => {
                const isActive = selectedRegion === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setSelectedRegion(pill.id)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: isActive ? 800 : 600,
                      background: isActive ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" : "#13172e",
                      color: isActive ? "#ffffff" : "#94a3b8",
                      border: isActive ? "1px solid transparent" : "1px solid rgba(255,255,255,0.08)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input Box */}
            <div style={{ position: "relative", minWidth: 260, flex: "0 1 320px" }}>
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search league or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  background: "#080915",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  padding: "8px 12px 8px 36px",
                  color: "#ffffff",
                  fontSize: 13,
                  outline: "none",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#6366f1"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; }}
              />
            </div>
          </div>
        </div>

        {/* ── Leagues Grid ── */}
        {loading ? (
          <div style={{ padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: "#64748b" }}>
            <RefreshCw style={{ width: 32, height: 32, color: "#6366f1", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Loading global leagues catalog...</span>
          </div>
        ) : leaguesByCountry.length === 0 ? (
          <div style={{
            padding: "60px 24px",
            textAlign: "center",
            background: "#0c1022",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
            color: "#64748b",
          }}>
            <Globe style={{ width: 36, height: 36, color: "#334155", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0", marginBottom: 6 }}>No leagues match your criteria</h3>
            <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>Try adjusting your search terms or filter selection.</p>
            <button
              onClick={() => { setSearch(""); setSelectedRegion("all"); }}
              style={{
                padding: "8px 18px",
                background: "#1e293b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                color: "#e2e8f0",
                cursor: "pointer",
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: 16,
          }}>
            {leaguesByCountry.map((item) => {
              const totalMatchesInCountry = Object.values(item.leagues).reduce((a, b) => a + b, 0);
              return (
                <div
                  key={item.country}
                  style={{
                    background: "#0c1022",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "border-color 0.15s ease, transform 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Country Header */}
                  <div style={{
                    padding: "14px 16px",
                    background: "#13172e",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {item.flagUrl ? (
                        <img
                          src={item.flagUrl}
                          alt={item.country}
                          style={{
                            width: 24,
                            height: 17,
                            objectFit: "cover",
                            borderRadius: 3,
                            border: "1px solid rgba(255,255,255,0.15)",
                          }}
                          onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                        />
                      ) : (
                        <div style={{
                          width: 24,
                          height: 17,
                          borderRadius: 3,
                          background: "#1e293b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <Globe style={{ width: 12, height: 12, color: "#64748b" }} />
                        </div>
                      )}
                      <h3 style={{ fontSize: 14, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                        {item.country}
                      </h3>
                    </div>

                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#94a3b8",
                      background: "#1c223d",
                      border: "1px solid rgba(255,255,255,0.08)",
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}>
                      {totalMatchesInCountry} {totalMatchesInCountry === 1 ? "match" : "matches"}
                    </span>
                  </div>

                  {/* Leagues inside Country */}
                  <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    {Object.entries(item.leagues).map(([leagueName, count]) => (
                      <Link
                        key={leagueName}
                        href={`/all-matches?q=${encodeURIComponent(leagueName)}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 12px",
                          borderRadius: 8,
                          background: "#080b18",
                          border: "1px solid rgba(255,255,255,0.04)",
                          textDecoration: "none",
                          transition: "all 0.12s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#151a33";
                          e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#080b18";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#6366f1",
                            flexShrink: 0,
                          }} />
                          <span style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: "#e2e8f0",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {leagueName}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: "#94a3b8",
                            background: "rgba(255,255,255,0.05)",
                            padding: "2px 7px",
                            borderRadius: 6,
                          }}>
                            {count}
                          </span>
                          <ChevronRight style={{ width: 13, height: 13, color: "#64748b" }} />
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

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#050711", padding: "32px 20px 24px", marginTop: 48 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 5,
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 900,
              fontSize: 12,
              fontStyle: "italic",
            }}>
              NT
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "0.5px" }}>
              NERDYTIPS
            </span>
            <span style={{ fontSize: 12, color: "#64748b" }}>• Global Leagues & Cup Tournaments</span>
          </div>

          <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>
            © 2026 NerdyTips • Live AI Football Prediction Directory
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
