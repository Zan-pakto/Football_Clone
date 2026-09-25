"use client";

import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import CountryFlag from "@/components/CountryFlag";
import TeamLogo from "@/components/TeamLogo";
import { Search, Sparkles, RefreshCw } from "lucide-react";
import "@/app/leagues/leagues.css";

interface PopularLeague {
  id: string;
  name: string;
  country: string;
  slug: string;
  logo: string;
  fixturesCount: number;
}

interface CountryLeagueItem {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  fixturesCount: number;
}

interface CountryGroup {
  country: string;
  flagUrl: string | null;
  count: number;
  leagues: CountryLeagueItem[];
}

export default function FootballLeaguesPage() {
  const [popularLeagues, setPopularLeagues] = useState<PopularLeague[]>([]);
  const [countries, setCountries] = useState<CountryGroup[]>([]);
  const [totalLeagues, setTotalLeagues] = useState(0);
  const [totalCountries, setTotalCountries] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadLeagues() {
      try {
        setLoading(true);
        const res = await fetch("/api/leagues");
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          setPopularLeagues(data.popularLeagues || []);
          setCountries(data.countries || []);
          setTotalLeagues(data.totalLeagues || 0);
          setTotalCountries(data.totalCountries || 0);
        }
      } catch (err) {
        console.error("Failed to load football leagues:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLeagues();
  }, []);

  // Real-time search filter
  const filteredPopular = useMemo(() => {
    if (!search.trim()) return popularLeagues;
    const q = search.toLowerCase();
    return popularLeagues.filter(
      (l) => l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q)
    );
  }, [popularLeagues, search]);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return countries;
    const q = search.toLowerCase();
    return countries
      .map((c) => {
        const countryMatches = c.country.toLowerCase().includes(q);
        const matchedLeagues = c.leagues.filter((l) => l.name.toLowerCase().includes(q));
        if (countryMatches) {
          return c;
        }
        if (matchedLeagues.length > 0) {
          return {
            ...c,
            leagues: matchedLeagues,
          };
        }
        return null;
      })
      .filter((c): c is CountryGroup => c !== null);
  }, [countries, search]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--background, #0a081d)" }}>
      <Navbar />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 20px 80px" }}>
        {/* ── Breadcrumb ── */}
        <nav className="nt-bc" aria-label="Breadcrumb">
          <Link href="/">Football Predictions</Link>
          <span style={{ opacity: 0.4 }}>/</span>
          <span className="current" aria-current="page">Leagues</span>
        </nav>

        {/* ── Hero Card ── */}
        <header className="lgs-head">
          <span className="tm-hero__orb tm-hero__orb--a"></span>
          <span className="tm-hero__orb tm-hero__orb--b"></span>
          <span className="tm-hero__ring"></span>
          <div style={{ position: "relative", zIndex: 2 }}>
            <span className="tm-hero__tag">
              <Sparkles size={12} style={{ color: "#a79fff" }} />
              Powered by NT Apex AI
            </span>
            <h1 className="lgs-head__title">Leagues &amp; Competitions</h1>
            <p className="lgs-head__lead">
              Our <Link href="/">AI football predictions</Link> cover hundreds of leagues around the world.
              Pick any country or competition below to see its latest tips and results.
            </p>
            <p className="lgs-head__meta">
              <b>{totalLeagues || 300}</b> leagues · <b>{totalCountries || 85}</b> countries
            </p>

            <div className="lgs-search">
              <Search size={18} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or competition"
                aria-label="Search country or competition"
                autoComplete="off"
              />
            </div>
          </div>
        </header>

        {loading ? (
          <div
            style={{
              padding: "80px 20px",
              textAlign: "center",
              marginTop: 32,
              background: "#141132",
              borderRadius: 16,
              border: "1px solid rgba(167, 159, 255, 0.1)",
            }}
          >
            <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: "#7c6cf5" }} />
            <p style={{ fontSize: 14, color: "#9fa1c7" }}>Loading leagues from database...</p>
          </div>
        ) : (
          <>
            {/* ── Popular Leagues Section ── */}
            {filteredPopular.length > 0 && (
              <section style={{ marginTop: 28 }}>
                <h2 className="lgs-h2">
                  <span className="lgs-h2__ic">★</span>Popular Leagues
                </h2>
                <div className="lgs-pop">
                  {filteredPopular.map((league) => (
                    <Link
                      key={league.id || league.slug}
                      href={`/football-leagues/${league.slug}`}
                      className="lgs-pop__card"
                    >
                      <TeamLogo src={league.logo} name={league.name} size={38} className="lgs-pop__img" />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span className="lgs-pop__name">{league.name}</span>
                        <div style={{ fontSize: 11, color: "#7874a4", marginTop: 2 }}>
                          {league.country}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── All Countries Accordion Section ── */}
            <section style={{ marginTop: 32 }}>
              <h2 className="lgs-h2">
                <span className="lgs-h2__ic">▦</span>All Countries
              </h2>

              {filteredCountries.length === 0 ? (
                <div
                  style={{
                    padding: "48px 20px",
                    textAlign: "center",
                    background: "#141132",
                    borderRadius: 14,
                    border: "1px solid rgba(167, 159, 255, 0.1)",
                  }}
                >
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", marginBottom: 6 }}>
                    No leagues found matching &quot;{search}&quot;
                  </p>
                  <p style={{ fontSize: 13, color: "#7874a4" }}>
                    Try searching for another country or competition name.
                  </p>
                </div>
              ) : (
                <div className="lgs-countries">
                  {filteredCountries.map((c) => {
                    const isSearchActive = search.trim().length > 0;
                    return (
                      <details
                        key={c.country}
                        className="lgs-country"
                        open={isSearchActive}
                      >
                        <summary className="lgs-country__sum">
                          <CountryFlag country={c.country} flagUrl={c.flagUrl} size={16} />
                          <span className="lgs-country__name">{c.country}</span>
                          <span className="lgs-country__count">{c.leagues.length}</span>
                          <svg
                            className="lgs-country__chev"
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </summary>

                        <div className="lgs-country__list">
                          {c.leagues.map((l) => (
                            <Link
                              key={l.id || l.slug}
                              href={`/football-leagues/${l.slug}`}
                              className="lgs-league"
                            >
                              <TeamLogo src={l.logo && !l.logo.startsWith("/flags/") ? l.logo : null} name={l.name} size={22} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                {l.name}
                              </span>
                              {l.fixturesCount > 0 && (
                                <span style={{ fontSize: 10, color: "#7874a4", marginLeft: "auto" }}>
                                  {l.fixturesCount} tips
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
