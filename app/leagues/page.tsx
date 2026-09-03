"use client";

import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { MatchData } from "@/lib/scraper/types";
import { Trophy, Globe, Search, ArrowRight, ShieldCheck } from "lucide-react";

export default function LeaguesPage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/matches?d=0")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.matches)) {
          setMatches(data.matches);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const leaguesByCountry = useMemo(() => {
    const map: Record<string, { country: string; flagUrl: string | null; leagues: Record<string, number> }> = {};

    matches.forEach((m) => {
      const c = m.country || "Other";
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

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.country.toLowerCase().includes(q) ||
          Object.keys(item.leagues).some((l) => l.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => a.country.localeCompare(b.country));
  }, [matches, search]);

  const liveCount = useMemo(
    () => matches.filter((m) => m.isLive || m.status === "live" || m.status === "In Progress").length,
    [matches]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d14] text-slate-100">
      <Navbar liveCount={liveCount} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" /> Football Leagues & Countries
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore coverage across international football competitions and domestic leagues
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leagues or countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#121722] border border-slate-800 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Leagues Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading leagues directory...</div>
        ) : leaguesByCountry.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">No leagues match your search query.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaguesByCountry.map((item) => (
              <div
                key={item.country}
                className="bg-[#121722] border border-slate-800 hover:border-slate-700 p-5 rounded-2xl shadow-lg transition-all space-y-3"
              >
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  {item.flagUrl ? (
                    <img
                      src={item.flagUrl}
                      alt={item.country}
                      className="w-6 h-4 object-cover rounded-sm border border-slate-700/50"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Globe className="w-5 h-5 text-emerald-400" />
                  )}
                  <h3 className="text-base font-bold text-slate-100">{item.country}</h3>
                </div>

                <div className="space-y-2">
                  {Object.entries(item.leagues).map(([leagueName, count]) => (
                    <Link
                      key={leagueName}
                      href={`/all-matches?q=${encodeURIComponent(leagueName)}`}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#182030] hover:bg-[#1e283d] transition-all text-xs group"
                    >
                      <span className="font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors truncate">
                        {leagueName}
                      </span>
                      <span className="font-bold text-slate-400 group-hover:text-white bg-slate-800 px-2 py-0.5 rounded-full text-[10px]">
                        {count} {count === 1 ? "match" : "matches"}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#070a10] py-6 px-4 text-center text-xs text-slate-500">
        <p>FootyIntel AI • Global Football Leagues Directory</p>
      </footer>
    </div>
  );
}
