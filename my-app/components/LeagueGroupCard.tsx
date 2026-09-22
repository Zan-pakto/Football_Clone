"use client";

import { useState } from "react";
import { MatchData } from "@/lib/types";
import MatchRow from "./MatchRow";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import CountryFlag from "@/components/CountryFlag";

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
        overflow: "hidden",
        marginBottom: "16px",
        background: "#141132",
        border: "1px solid rgba(167, 159, 255, 0.12)",
        borderRadius: "14px",
        boxShadow: "0 8px 24px -8px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* ── League Header (Exact NerdyTips Style) ── */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "11px 18px",
          background: "#1b183d",
          borderBottom: isOpen ? "1px solid rgba(167, 159, 255, 0.1)" : "none",
          cursor: "pointer",
          userSelect: "none",
          transition: "background 0.15s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          {/* Country flag icon */}
          <CountryFlag country={country} flagUrl={flagUrl} size={16} />

          {/* League title + Country subtitle */}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span
              style={{
                fontSize: "13.5px",
                fontWeight: 800,
                color: "#FFFFFF",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.2,
              }}
            >
              {leagueName}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "#7874a4",
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {country}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {/* Match count badge */}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              color: "#a79fff",
              background: "rgba(124, 108, 245, 0.15)",
              border: "1px solid rgba(124, 108, 245, 0.3)",
              padding: "2px 8px",
              borderRadius: "999px",
            }}
          >
            {matches.length}
          </span>
          {isOpen
            ? <ChevronUp style={{ width: 14, height: 14, color: "#7874a4" }} />
            : <ChevronDown style={{ width: 14, height: 14, color: "#7874a4" }} />
          }
        </div>
      </div>

      {/* ── Table / Match Cards Feed ── */}
      {isOpen && (
        <div className="lg-table-scroll-container">
          <div className="lg-table-content">
            {/* Column headers (Desktop only, matching MatchRow grid) */}
            <div
              className="lg-col-headers"
              style={{
                display: "grid",
                gridTemplateColumns: "56px minmax(190px, 1.4fr) 138px 66px 66px 58px 76px 56px",
                padding: "8px 18px",
                background: "#141132",
                borderBottom: "1px solid rgba(167, 159, 255, 0.08)",
                fontSize: "10px",
                fontWeight: 800,
                color: "#7874a4",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div style={{ textAlign: "center" }}>HOUR</div>
              <div style={{ paddingLeft: "6px" }}>MATCHES</div>
              <div style={{ textAlign: "center" }}>
                <span>1 &nbsp;·&nbsp; X &nbsp;·&nbsp; 2</span>
              </div>
              <div style={{ textAlign: "center" }}>1X2</div>
              <div style={{ textAlign: "center" }}>O/U</div>
              <div style={{ textAlign: "center" }}>BTTS</div>
              <div style={{ textAlign: "center", color: "#ffb020" }}>★ BEST TIP</div>
              <div style={{ textAlign: "center" }}>RATING</div>
            </div>

            {/* Match rows */}
            <div>
              {matches.map((match) => (
                <div key={match.id}>
                  <MatchRow match={match} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .lg-col-headers { display: none !important; }
        .lg-table-scroll-container { width: 100%; overflow-x: visible; }
        .lg-table-content { width: 100%; }
        @media (min-width: 768px) {
          .lg-col-headers { display: grid !important; }
          .lg-table-scroll-container { overflow-x: auto !important; }
          .lg-table-content { min-width: 840px !important; }
        }
      `}</style>
    </div>
  );
}
