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
      background: "#0c1020",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 12,
    }}>
      {/* League Header — exact NerdyTips style */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px",
          background: "#13172e",
          borderBottom: isOpen ? "1px solid rgba(255,255,255,0.06)" : "none",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          {flagUrl ? (
            <img
              src={flagUrl}
              alt={country}
              style={{ width: 22, height: 16, objectFit: "cover", borderRadius: 3, border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}
              onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
            />
          ) : (
            <Globe style={{ width: 16, height: 16, color: "#64748b", flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {leagueName}
          </span>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
            • {country}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#94a3b8",
            background: "#1c223d", border: "1px solid rgba(255,255,255,0.1)",
            padding: "2px 9px", borderRadius: 999,
          }}>
            {matches.length}
          </span>
          {isOpen
            ? <ChevronUp style={{ width: 16, height: 16, color: "#94a3b8" }} />
            : <ChevronDown style={{ width: 16, height: 16, color: "#94a3b8" }} />
          }
        </div>
      </div>

      {/* Column Headers — exact NerdyTips columns */}
      {isOpen && (
        <div
          className="lg-col-headers"
          style={{
            display: "grid",
            gridTemplateColumns: "52px 1fr 145px 65px 65px 65px 85px 65px",
            padding: "8px 14px",
            background: "#090d1b",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontSize: 10, fontWeight: 800, color: "#64748b",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}
        >
          <div style={{ textAlign: "center" }}>HOUR</div>
          <div style={{ paddingLeft: 6 }}>MATCHES</div>
          <div style={{ textAlign: "center" }}>
            <span style={{ display: "block", fontSize: 9, color: "#475569" }}>1 &nbsp;&nbsp; X &nbsp;&nbsp; 2</span>
          </div>
          <div style={{ textAlign: "center" }}>1X2</div>
          <div style={{ textAlign: "center" }}>O/U</div>
          <div style={{ textAlign: "center" }}>BTTS</div>
          <div style={{ textAlign: "center" }}>BEST TIP</div>
          <div style={{ textAlign: "center" }}>CONFIDENCE</div>
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
        .lg-col-headers { display: none !important; }
        @media (min-width: 768px) { .lg-col-headers { display: grid !important; } }
      `}</style>
    </div>
  );
}
