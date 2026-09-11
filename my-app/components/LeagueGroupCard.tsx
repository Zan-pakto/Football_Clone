"use client";

import { useState } from "react";
import { MatchData } from "@/lib/types";
import MatchRow from "./MatchRow";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";

interface LeagueGroupCardProps {
  leagueName: string;
  country: string;
  flagUrl: string | null;
  matches: MatchData[];
}

export default function LeagueGroupCard({ leagueName, country, flagUrl, matches }: LeagueGroupCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      style={{
        background: "#0f0f1a",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "12px",
        overflow: "hidden",
        marginBottom: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        transition: "border-color 0.2s ease",
      }}
    >
      {/* ── League Header ── */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          background: "rgba(20,20,32,0.98)",
          borderBottom: isOpen ? "1px solid rgba(255,255,255,0.05)" : "none",
          cursor: "pointer",
          userSelect: "none",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(25,25,38,0.98)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(20,20,32,0.98)"; }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          {/* League icon */}
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "7px",
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {flagUrl ? (
              <img
                src={flagUrl}
                alt={country}
                style={{ width: 14, height: 14, objectFit: "contain" }}
              />
            ) : (
              <Trophy style={{ width: 12, height: 12, color: "#c9a84c" }} />
            )}
          </div>

          {/* League name */}
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#f5f3ee",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {leagueName}
          </span>

          {/* Country badge */}
          <span
            style={{
              fontSize: "10px",
              color: "#484858",
              fontWeight: 500,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "2px 8px",
              borderRadius: "5px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {country}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {/* Match count */}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "#c9a84c",
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.2)",
              padding: "2px 10px",
              borderRadius: "999px",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {matches.length}
          </span>
          {isOpen
            ? <ChevronUp style={{ width: 14, height: 14, color: "#484858" }} />
            : <ChevronDown style={{ width: 14, height: 14, color: "#484858" }} />
          }
        </div>
      </div>

      {/* ── Table ── */}
      {isOpen && (
        <div style={{ width: "100%", overflowX: "auto" }}>
          <div style={{ minWidth: 860 }}>
            {/* Column headers */}
            <div
              className="lg-col-headers"
              style={{
                display: "grid",
                gridTemplateColumns: "60px minmax(200px, 1.3fr) 140px 88px 92px 76px 110px 76px",
                padding: "8px 18px",
                background: "rgba(9,9,15,0.9)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                fontSize: "9px",
                fontWeight: 700,
                color: "#2a2a3d",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                alignItems: "center",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <div style={{ textAlign: "center" }}>TIME</div>
              <div style={{ paddingLeft: "10px" }}>MATCH FIXTURE</div>
              <div style={{ textAlign: "center" }}>
                <span style={{ color: "#484858", fontWeight: 700 }}>
                  1 &nbsp;·&nbsp; X &nbsp;·&nbsp; 2
                </span>
              </div>
              <div style={{ textAlign: "center" }}>1X2 TIP</div>
              <div style={{ textAlign: "center" }}>GOALS</div>
              <div style={{ textAlign: "center" }}>BTTS</div>
              <div style={{ textAlign: "center", color: "#c9a84c" }}>BEST TIP</div>
              <div style={{ textAlign: "center" }}>CONFIDENCE</div>
            </div>

            {/* Match rows */}
            <div>
              {matches.map((match, idx) => (
                <div
                  key={match.id}
                  style={{ borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}
                >
                  <MatchRow match={match} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .lg-col-headers { display: none !important; }
        @media (min-width: 768px) { .lg-col-headers { display: grid !important; } }
      `}</style>
    </div>
  );
}
