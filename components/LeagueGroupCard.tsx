"use client";

import { useState } from "react";
import { MatchData } from "@/lib/scraper/types";
import MatchRow from "./MatchRow";
import { ChevronDown, ChevronUp, Globe } from "lucide-react";

interface LeagueGroupCardProps {
  leagueName: string;
  country: string;
  flagUrl: string | null;
  matches: MatchData[];
}

export default function LeagueGroupCard({ leagueName, country, flagUrl, matches }: LeagueGroupCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div style={{
      background: "#0f1624",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
    }}>
      {/* League Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 18px",
          background: "#182032",
          borderBottom: isOpen ? "1px solid rgba(255,255,255,0.07)" : "none",
          cursor: "pointer",
          userSelect: "none",
          transition: "background 0.15s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {flagUrl ? (
            <img
              src={flagUrl}
              alt={country}
              style={{ width: 22, height: 15, objectFit: "cover", borderRadius: 3, border: "1px solid rgba(255,255,255,0.12)", flexShrink: 0 }}
              onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
            />
          ) : (
            <Globe style={{ width: 15, height: 15, color: "#10b981", flexShrink: 0 }} />
          )}
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {leagueName}
          </h2>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>• {country}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{
            padding: "2px 10px", borderRadius: 999,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            fontSize: 11, fontWeight: 700, color: "#94a3b8",
          }}>
            {matches.length} {matches.length === 1 ? "match" : "matches"}
          </span>
          {isOpen
            ? <ChevronUp style={{ width: 15, height: 15, color: "#64748b" }} />
            : <ChevronDown style={{ width: 15, height: 15, color: "#64748b" }} />
          }
        </div>
      </div>

      {/* Column Headers (desktop) */}
      {isOpen && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "72px 1fr 148px 220px 108px 64px",
          padding: "7px 18px",
          background: "#0a0d17",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em",
        }} className="lg-only">
          <div style={{ textAlign: "center" }}>Time</div>
          <div style={{ paddingLeft: 8 }}>Match</div>
          <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.05)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>1 &nbsp; X &nbsp; 2</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
            <span>1X2</span><span>Goals</span><span>BTTS</span>
          </div>
          <div style={{ textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.05)" }}>Best Tip</div>
          <div style={{ textAlign: "center" }}>Trust</div>
        </div>
      )}

      {/* Match Rows */}
      {isOpen && (
        <div>
          {matches.map((match, idx) => (
            <div key={match.id} style={{ borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <MatchRow match={match} />
            </div>
          ))}
        </div>
      )}

      <style>{`
        .lg-only { display: none; }
        @media (min-width: 1024px) { .lg-only { display: grid; } }
      `}</style>
    </div>
  );
}
