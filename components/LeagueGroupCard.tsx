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
      background: "#101520",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 8,
      overflow: "hidden",
    }}>
      {/* League Header — matches NerdyTips style */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px",
          background: "#141b2b",
          borderBottom: isOpen ? "1px solid rgba(255,255,255,0.06)" : "none",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {flagUrl ? (
            <img
              src={flagUrl}
              alt={country}
              style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2, border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}
              onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
            />
          ) : (
            <Globe style={{ width: 14, height: 14, color: "#64748b", flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {leagueName}
          </span>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>
            {country}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: "#64748b",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            padding: "1px 8px", borderRadius: 999,
          }}>
            {matches.length}
          </span>
          {isOpen
            ? <ChevronUp style={{ width: 14, height: 14, color: "#475569" }} />
            : <ChevronDown style={{ width: 14, height: 14, color: "#475569" }} />
          }
        </div>
      </div>

      {/* Column Headers — NerdyTips exact columns */}
      {isOpen && (
        <div
          className="lg-col-headers"
          style={{
            display: "grid",
            gridTemplateColumns: "68px 1fr 130px 240px 110px 56px 130px",
            padding: "5px 16px",
            background: "#0d1220",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            fontSize: 10, fontWeight: 700, color: "#475569",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}
        >
          <div style={{ textAlign: "center" }}>Time</div>
          <div style={{ paddingLeft: 4 }}>Match</div>
          <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.05)", paddingLeft: 4 }}>1 &nbsp; X &nbsp; 2</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
            <span>1X2</span><span>Goals</span><span>BTTS</span>
          </div>
          <div style={{ textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>Best Tip</div>
          <div style={{ textAlign: "center" }}>Trust</div>
          <div style={{ textAlign: "right", borderLeft: "1px solid rgba(255,255,255,0.05)", paddingRight: 4 }}>Result</div>
        </div>
      )}

      {/* Match Rows */}
      {isOpen && (
        <div>
          {matches.map((match, idx) => (
            <div
              key={match.id}
              style={{ borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
            >
              <MatchRow match={match} />
            </div>
          ))}
        </div>
      )}

      <style>{`
        .lg-col-headers { display: none; }
        @media (min-width: 1024px) { .lg-col-headers { display: grid; } }
      `}</style>
    </div>
  );
}
