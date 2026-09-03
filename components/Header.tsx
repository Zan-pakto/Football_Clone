"use client";

import { RefreshCw, Zap, ShieldCheck, Database, Clock } from "lucide-react";

interface HeaderProps {
  liveCount: number;
  totalCount: number;
  lastSync: string | null;
  onRefresh: () => void;
  isSyncing: boolean;
}

export default function Header({
  liveCount,
  totalCount,
  lastSync,
  onRefresh,
  isSyncing,
}: HeaderProps) {
  const formattedSyncTime = lastSync
    ? new Date(lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <header className="sticky top-0 z-50 glass-header px-4 lg:px-8 py-3 flex items-center justify-between border-b border-slate-800/80 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Zap className="w-6 h-6 text-slate-950 font-black" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
            FootyIntel <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">AI ENGINE</span>
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block font-medium">
            PostgreSQL Persistence & Dynamic Source Scraper
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Live Indicator */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs shadow-inner">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-medium">
            <strong className="text-emerald-400 font-bold">{liveCount}</strong> Live
          </span>
        </div>

        {/* Total Matches & DB Status badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300 shadow-inner">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span><strong className="text-white">{totalCount}</strong> Saved in DB</span>
        </div>

        {/* Sync Info */}
        {formattedSyncTime && (
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 font-medium bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Synced {formattedSyncTime}</span>
          </div>
        )}

        {/* Sync / Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-lg transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Scraping..." : "Sync Source"}</span>
        </button>
      </div>
    </header>
  );
}
