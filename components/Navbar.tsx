"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Activity, Trophy, Layers, RefreshCw } from "lucide-react";

interface NavbarProps {
  liveCount?: number;
  onSync?: () => void;
  isSyncing?: boolean;
}

const navLinks = [
  { href: "/", label: "Home", icon: Zap },
  { href: "/all-matches", label: "All Predictions", icon: Layers },
  { href: "/live", label: "Live Matches", icon: Activity },
  { href: "/leagues", label: "Leagues", icon: Trophy },
];

export default function Navbar({ liveCount = 0, onSync, isSyncing = false }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "rgba(11,15,25,0.95)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>

        {/* Brand */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #10b981, #14b8a6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
          }}>
            <Zap style={{ width: 18, height: 18, color: "#000", strokeWidth: 2.5 }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>FootyIntel</span>
              <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 999, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)", fontWeight: 700, letterSpacing: "0.08em" }}>
                AI PREDICTIONS
              </span>
            </div>
            <p style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>Live Data &amp; AI Prediction Engine</p>
          </div>
        </Link>

        {/* Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#111827", padding: "4px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 9,
                  fontSize: 12, fontWeight: isActive ? 700 : 600,
                  color: isActive ? "#10b981" : "#94a3b8",
                  background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                  border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
              >
                <Icon style={{ width: 13, height: 13 }} />
                <span>{link.label}</span>
                {link.href === "/live" && liveCount > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 999,
                    background: "rgba(16,185,129,0.15)", color: "#10b981",
                    border: "1px solid rgba(16,185,129,0.3)",
                  }}>
                    {liveCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Live pill + Sync */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/live"
            style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "#111827", border: "1px solid rgba(255,255,255,0.1)",
              padding: "6px 12px", borderRadius: 10, textDecoration: "none",
              fontSize: 12,
            }}
          >
            <span style={{ position: "relative", display: "flex", width: 8, height: 8 }}>
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "#10b981", opacity: 0.75,
                animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite",
              }} />
              <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
            </span>
            <span style={{ color: "#cbd5e1", fontWeight: 600 }}>LIVE</span>
            <span style={{ color: "#10b981", fontWeight: 800 }}>{liveCount}</span>
          </Link>

          {onSync && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#10b981", color: "#000", fontWeight: 800,
                fontSize: 12, padding: "7px 14px", borderRadius: 10,
                border: "none", cursor: isSyncing ? "not-allowed" : "pointer",
                opacity: isSyncing ? 0.6 : 1,
                boxShadow: "0 2px 10px rgba(16,185,129,0.3)",
                transition: "all 0.15s",
              }}
            >
              <RefreshCw style={{ width: 13, height: 13, animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
              {isSyncing ? "Syncing..." : "Sync Source"}
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </nav>
  );
}
