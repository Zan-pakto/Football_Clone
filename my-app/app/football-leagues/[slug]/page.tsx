"use client";

import { useEffect, useState, use } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ArrowLeft, Sparkles, Calendar, Trophy, Flame, Snowflake, Shield, RefreshCw } from "lucide-react";
import MatchRow from "@/components/MatchRow";
import { MatchData } from "@/lib/types";
import "@/app/leagues/leagues.css";

interface LeagueDetailsData {
  league: {
    id: string;
    name: string;
    country: string;
    slug: string;
    logo: string | null;
    teamsCount: number;
  };
  kpis: {
    predictedMatches: number;
    predictabilityRate: string;
    over25Rate: string;
    bttsRate: string;
  };
  statistics: {
    homeWinsPct: number;
    drawsPct: number;
    awayWinsPct: number;
    over15Pct: number;
    over25Pct: number;
    over35Pct: number;
    bttsPct: number;
  };
  trends: {
    hotTeam: { name: string; logo: string | null; wins?: number } | null;
    coldTeam: { name: string; logo: string | null; losses?: number } | null;
    constantTeam: { name: string; logo: string | null } | null;
  };
  upcomingMatches: MatchData[];
  recentMatches: MatchData[];
  standings: Array<{
    rank: number;
    name: string;
    logo: string | null;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    points: number;
    form: ("W" | "D" | "L")[];
  }>;
}

export default function SingleLeaguePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [data, setData] = useState<LeagueDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"predictions" | "standings">("predictions");

  useEffect(() => {
    async function fetchLeagueDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/leagues/${encodeURIComponent(slug)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load league details:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeagueDetails();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--background, #0a081d)" }}>
        <Navbar />
        <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 20px" }}>
          <div
            style={{
              padding: "100px 20px",
              textAlign: "center",
              background: "#141132",
              borderRadius: 20,
              border: "1px solid rgba(167, 159, 255, 0.1)",
            }}
          >
            <RefreshCw size={32} className="animate-spin" style={{ margin: "0 auto 16px", color: "#7c6cf5" }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>
              Loading League Predictions &amp; Telemetry
            </h2>
            <p style={{ fontSize: 13, color: "#9fa1c7" }}>
              Fetching match records and algorithm calculations from database...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--background, #0a081d)" }}>
        <Navbar />
        <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 20px" }}>
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              background: "#141132",
              borderRadius: 20,
              border: "1px solid rgba(167, 159, 255, 0.1)",
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>
              League Not Found
            </h2>
            <p style={{ fontSize: 13, color: "#7874a4", marginBottom: 20 }}>
              Could not find matches or data for this league in the database.
            </p>
            <Link
              href="/football-leagues"
              className="btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 10,
                background: "var(--accent-indigo, #7c6cf5)",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <ArrowLeft size={16} /> Back to All Leagues
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { league, kpis, statistics, trends, upcomingMatches, recentMatches, standings } = data;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background, #0a081d)" }}>
      <Navbar />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 20px 80px" }}>
        {/* ── Breadcrumb ── */}
        <nav className="nt-bc" aria-label="Breadcrumb">
          <Link href="/">Football Predictions</Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <Link href="/football-leagues">Leagues</Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <span className="current" aria-current="page">{league.name}</span>
        </nav>

        {/* ── Hero Card ── */}
        <div className="tm-hero">
          <span className="tm-hero__orb tm-hero__orb--a"></span>
          <span className="tm-hero__orb tm-hero__orb--b"></span>
          <span className="tm-hero__ring"></span>

          <Link href="/football-leagues" className="tm-hero__back" aria-label="Back to leagues">
            <ArrowLeft size={18} />
          </Link>

          <div className="tm-hero__inner">
            <div className="tm-hero__id">
              {league.logo ? (
                <img
                  src={league.logo}
                  alt={league.name}
                  width={84}
                  height={84}
                  className="tm-hero__crest"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="tm-hero__crest"
                style={{
                  display: league.logo ? "none" : "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(124, 108, 245, 0.16)",
                  color: "#a79fff",
                  fontWeight: 900,
                  fontSize: 28,
                }}
              >
                <Trophy size={42} />
              </div>

              <div style={{ minWidth: 0 }}>
                <span className="tm-hero__tag">
                  <Sparkles size={12} style={{ color: "#a79fff" }} />
                  Powered by NT Apex AI
                </span>
                <h1 className="tm-hero__name">
                  {league.name} - {league.country} <span>Predictions</span>
                </h1>
                <p className="tm-hero__lead">
                  On this page you can view {league.name} analysis and predictions. Statistical data, team form,
                  and recent match history are taken into account, and predictions are automatically generated by AI
                  with an accuracy of over {kpis.predictabilityRate || "68%"}.
                </p>
                <div className="tm-hero__badges">
                  <span className="tm-chip">
                    <Shield size={13} style={{ color: "#a79fff" }} />
                    {league.teamsCount || 20} Teams
                  </span>
                  <span className="tm-chip">
                    {league.country}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 KPIs */}
            <div className="tm-hero__kpis">
              <div className="tm-kpi">
                <div className="tm-kpi__v">{kpis.predictedMatches}</div>
                <div className="tm-kpi__l">Predicted Matches</div>
              </div>
              <div className="tm-kpi">
                <div className="tm-kpi__v tm-kpi__v--accent">{kpis.predictabilityRate}</div>
                <div className="tm-kpi__l">Predictability Rate</div>
              </div>
              <div className="tm-kpi">
                <div className="tm-kpi__v">{kpis.over25Rate}</div>
                <div className="tm-kpi__l">Over 2.5</div>
              </div>
              <div className="tm-kpi">
                <div className="tm-kpi__v">{kpis.bttsRate}</div>
                <div className="tm-kpi__l">BTTS</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Outcomes & Statistics Section ── */}
        <section className="lgp-outcomes">
          <div style={{ marginBottom: 12 }}>
            <span className="lgp-eyebrow">STATISTICS</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }} className="stats-layout-grid">
            {/* Split Bar & Legend */}
            <div className="lgp-card">
              <div className="lgp-split__bar">
                <span
                  className="lgp-split__seg lgp-split__seg--h"
                  style={{ width: `${statistics.homeWinsPct}%` }}
                >
                  {statistics.homeWinsPct}%
                </span>
                <span
                  className="lgp-split__seg lgp-split__seg--d"
                  style={{ width: `${statistics.drawsPct}%` }}
                >
                  {statistics.drawsPct}%
                </span>
                <span
                  className="lgp-split__seg lgp-split__seg--a"
                  style={{ width: `${statistics.awayWinsPct}%` }}
                >
                  {statistics.awayWinsPct}%
                </span>
              </div>

              <div className="lgp-split__legend">
                <span>
                  <i className="lgp-dot lgp-dot--h"></i> Home Wins <b>{statistics.homeWinsPct}%</b>
                </span>
                <span>
                  <i className="lgp-dot lgp-dot--d"></i> Draws <b>{statistics.drawsPct}%</b>
                </span>
                <span>
                  <i className="lgp-dot lgp-dot--a"></i> Away Wins <b>{statistics.awayWinsPct}%</b>
                </span>
              </div>
            </div>

            {/* 4 Rate Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 10,
              }}
              className="rates-grid"
            >
              <div className="tm-rate tm-rate--hi">
                <div className="tm-rate__val">{statistics.over15Pct}%</div>
                <div className="tm-rate__bar"><span style={{ width: `${statistics.over15Pct}%` }}></span></div>
                <div className="tm-rate__l">Over 1.5</div>
              </div>
              <div className="tm-rate tm-rate--md">
                <div className="tm-rate__val">{statistics.over25Pct}%</div>
                <div className="tm-rate__bar"><span style={{ width: `${statistics.over25Pct}%` }}></span></div>
                <div className="tm-rate__l">Over 2.5</div>
              </div>
              <div className="tm-rate tm-rate--lo">
                <div className="tm-rate__val">{statistics.over35Pct}%</div>
                <div className="tm-rate__bar"><span style={{ width: `${statistics.over35Pct}%` }}></span></div>
                <div className="tm-rate__l">Over 3.5</div>
              </div>
              <div className="tm-rate tm-rate--md">
                <div className="tm-rate__val">{statistics.bttsPct}%</div>
                <div className="tm-rate__bar"><span style={{ width: `${statistics.bttsPct}%` }}></span></div>
                <div className="tm-rate__l">BTTS</div>
              </div>
            </div>

            {/* 3 Trends Cards (Hot Team, Cold Team, Constant) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
              }}
              className="trends-grid"
            >
              {trends.hotTeam && (
                <div className="lgp-trend lgp-trend--hot">
                  <div className="lgp-trend__body">
                    <span className="lgp-trend__l" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Flame size={13} /> Hot Team
                    </span>
                    <span className="lgp-trend__team">
                      {trends.hotTeam.logo && (
                        <img src={trends.hotTeam.logo} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      )}
                      {trends.hotTeam.name}
                    </span>
                  </div>
                </div>
              )}

              {trends.coldTeam && (
                <div className="lgp-trend lgp-trend--cold">
                  <div className="lgp-trend__body">
                    <span className="lgp-trend__l" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Snowflake size={13} /> Cold Team
                    </span>
                    <span className="lgp-trend__team">
                      {trends.coldTeam.logo && (
                        <img src={trends.coldTeam.logo} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      )}
                      {trends.coldTeam.name}
                    </span>
                  </div>
                </div>
              )}

              {trends.constantTeam && (
                <div className="lgp-trend lgp-trend--const">
                  <div className="lgp-trend__body">
                    <span className="lgp-trend__l">Constant</span>
                    <span className="lgp-trend__team">
                      {trends.constantTeam.logo && (
                        <img src={trends.constantTeam.logo} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      )}
                      {trends.constantTeam.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Sub Navigation Tabs ── */}
        <div className="md-subnav" role="tablist">
          <button
            type="button"
            className={`md-subnav__link ${activeTab === "predictions" ? "is-active" : ""}`}
            onClick={() => setActiveTab("predictions")}
          >
            Match Predictions
          </button>
          <button
            type="button"
            className={`md-subnav__link ${activeTab === "standings" ? "is-active" : ""}`}
            onClick={() => setActiveTab("standings")}
          >
            Standings
          </button>
        </div>

        {/* ── Tab Content: Match Predictions ── */}
        {activeTab === "predictions" && (
          <div>
            {/* Upcoming Matches */}
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", marginBottom: 12 }}>
              Upcoming Matches
            </h2>

            {upcomingMatches.length === 0 ? (
              <div className="tm-empty mb-4" style={{ marginBottom: 28 }}>
                <span className="tm-empty__ic">
                  <Calendar size={24} />
                </span>
                <div className="tm-empty__t">No upcoming matches</div>
              </div>
            ) : (
              <div
                style={{
                  background: "#141132",
                  border: "1px solid rgba(167, 159, 255, 0.12)",
                  borderRadius: 14,
                  overflow: "hidden",
                  marginBottom: 28,
                }}
              >
                {/* Desktop Table Header matching MatchRow columns */}
                <div
                  className="tb-thead desktop-only"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px minmax(190px, 1.4fr) 138px 66px 66px 58px 76px 56px",
                    padding: "9px 18px",
                    background: "#1b183d",
                    borderBottom: "1px solid rgba(167, 159, 255, 0.08)",
                    fontSize: "10.5px",
                    fontWeight: 800,
                    color: "#7874a4",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div style={{ textAlign: "center" }}>Hour</div>
                  <div style={{ paddingLeft: "6px" }}>Matches</div>
                  <div style={{ textAlign: "center" }}>1 · X · 2</div>
                  <div style={{ textAlign: "center" }}>1X2</div>
                  <div style={{ textAlign: "center" }}>O/U</div>
                  <div style={{ textAlign: "center" }}>BTTS</div>
                  <div style={{ textAlign: "center", color: "#ffb020" }}>★ Best Tip</div>
                  <div style={{ textAlign: "center" }}>Rating</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {upcomingMatches.map((match) => (
                    <MatchRow key={match.id} match={match} />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Matches */}
            <h2
              style={{
                fontSize: 13,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#7c78aa",
                margin: "24px 0 12px",
              }}
            >
              Recent Matches
            </h2>

            {recentMatches.length === 0 ? (
              <div className="tm-empty">
                <span className="tm-empty__ic">
                  <Trophy size={24} />
                </span>
                <div className="tm-empty__t">No past match results available</div>
              </div>
            ) : (
              <div
                style={{
                  background: "#141132",
                  border: "1px solid rgba(167, 159, 255, 0.12)",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                {/* Desktop Table Header matching MatchRow columns */}
                <div
                  className="tb-thead desktop-only"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px minmax(190px, 1.4fr) 138px 66px 66px 58px 76px 56px",
                    padding: "9px 18px",
                    background: "#1b183d",
                    borderBottom: "1px solid rgba(167, 159, 255, 0.08)",
                    fontSize: "10.5px",
                    fontWeight: 800,
                    color: "#7874a4",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div style={{ textAlign: "center" }}>Status</div>
                  <div style={{ paddingLeft: "6px" }}>Matches</div>
                  <div style={{ textAlign: "center" }}>1 · X · 2</div>
                  <div style={{ textAlign: "center" }}>1X2</div>
                  <div style={{ textAlign: "center" }}>O/U</div>
                  <div style={{ textAlign: "center" }}>BTTS</div>
                  <div style={{ textAlign: "center", color: "#ffb020" }}>★ Best Tip</div>
                  <div style={{ textAlign: "center" }}>Rating</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {recentMatches.map((match) => (
                    <MatchRow key={match.id} match={match} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab Content: Standings ── */}
        {activeTab === "standings" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", marginBottom: 14 }}>
              {league.name} Standings
            </h2>

            {standings.length === 0 ? (
              <div className="tm-empty">
                <span className="tm-empty__ic">
                  <Trophy size={24} />
                </span>
                <div className="tm-empty__t">No standings table available for this league yet</div>
              </div>
            ) : (
              <div className="st-table-wrap">
                <table className="st-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>#</th>
                      <th>Team</th>
                      <th style={{ textAlign: "center" }}>P</th>
                      <th style={{ textAlign: "center" }}>W</th>
                      <th style={{ textAlign: "center" }}>D</th>
                      <th style={{ textAlign: "center" }}>L</th>
                      <th style={{ textAlign: "center" }}>GF</th>
                      <th style={{ textAlign: "center" }}>GA</th>
                      <th style={{ textAlign: "center" }}>GD</th>
                      <th style={{ textAlign: "center" }}>Pts</th>
                      <th>Form</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team) => (
                      <tr key={team.name}>
                        <td className="st-rank">{team.rank}</td>
                        <td>
                          <div className="st-team">
                            {team.logo && (
                              <img
                                src={team.logo}
                                alt=""
                                onError={(e) => { e.currentTarget.style.display = "none"; }}
                              />
                            )}
                            <span>{team.name}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>{team.played}</td>
                        <td style={{ textAlign: "center", color: "#34c77b" }}>{team.won}</td>
                        <td style={{ textAlign: "center", color: "#a79fff" }}>{team.drawn}</td>
                        <td style={{ textAlign: "center", color: "#e74c3c" }}>{team.lost}</td>
                        <td style={{ textAlign: "center" }}>{team.goalsFor}</td>
                        <td style={{ textAlign: "center" }}>{team.goalsAgainst}</td>
                        <td style={{ textAlign: "center" }}>
                          {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                        </td>
                        <td style={{ textAlign: "center" }} className="st-pts">{team.points}</td>
                        <td>
                          <div className="st-form">
                            {team.form.map((res, i) => (
                              <span
                                key={i}
                                className={`st-form-dot ${
                                  res === "W"
                                    ? "st-form-dot--w"
                                    : res === "D"
                                    ? "st-form-dot--d"
                                    : "st-form-dot--l"
                                }`}
                              >
                                {res}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .rates-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .trends-grid {
            grid-template-columns: 1fr !important;
          }
          .desktop-only {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
