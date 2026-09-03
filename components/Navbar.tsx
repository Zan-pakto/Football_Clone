"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";

interface NavbarProps {
  liveCount?: number;
  onSync?: () => void;
  isSyncing?: boolean;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/all-matches", label: "All Matches" },
  { href: "/leagues", label: "Leagues" },
];

export default function Navbar({ liveCount = 0, onSync, isSyncing = false }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "#0d1220",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 1px 12px rgba(0,0,0,0.4)",
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 58,
      }}>
        {/* Brand */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{
            fontSize: 18,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.5px",
          }}>
            NERDYTIPS
          </span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#fff" : "#94a3b8",
                  textDecoration: "none",
                  borderBottom: isActive ? "2px solid #10b981" : "2px solid transparent",
                  transition: "all 0.15s",
                  height: 58,
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right: Live pill + Sync */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {liveCount > 0 && (
            <Link
              href="/live"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 700, color: "#10b981",
                background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                padding: "5px 11px", borderRadius: 999, textDecoration: "none",
              }}
            >
              <span style={{ position: "relative", display: "flex", width: 7, height: 7 }}>
                <span style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "#10b981", opacity: 0.75,
                  animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite",
                }} />
                <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} />
              </span>
              LIVE {liveCount}
            </Link>
          )}

          {onSync && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "transparent", color: "#64748b",
                border: "1px solid rgba(255,255,255,0.1)",
                fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 6,
                cursor: isSyncing ? "not-allowed" : "pointer",
                opacity: isSyncing ? 0.6 : 1,
                transition: "all 0.15s",
              }}
            >
              <RefreshCw style={{ width: 12, height: 12, animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
              {isSyncing ? "Syncing..." : "Sync"}
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
