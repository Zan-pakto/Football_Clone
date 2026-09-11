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
      className="luxury-card"
      style={{
        overflow: "hidden",
        marginBottom: "16px",
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
          background: "var(--surface-raised)",
          borderBottom: isOpen ? "1px solid var(--border-color)" : "none",
          cursor: "pointer",
          userSelect: "none",
          transition: "background 0.15s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          {/* League icon */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              background: "var(--gold-bg)",
              border: "1px solid var(--gold-border)",
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
              <Trophy style={{ width: 13, height: 13, color: "var(--gold)" }} />
            )}
          </div>

          {/* League name */}
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {leagueName}
          </span>

          {/* Country badge */}
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-dim)",
              fontWeight: 600,
              background: "var(--surface)",
              border: "1px solid var(--border-color)",
              padding: "2px 8px",
              borderRadius: "6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
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
              fontWeight: 800,
              color: "var(--gold)",
              background: "var(--gold-bg)",
              border: "1px solid var(--gold-border)",
              padding: "2px 10px",
              borderRadius: "999px",
            }}
          >
            {matches.length}
          </span>
          {isOpen
            ? <ChevronUp style={{ width: 14, height: 14, color: "var(--text-dim)" }} />
            : <ChevronDown style={{ width: 14, height: 14, color: "var(--text-dim)" }} />
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
                background: "var(--surface)",
                borderBottom: "1px solid var(--border-color)",
                fontSize: "9px",
                fontWeight: 800,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                alignItems: "center",
              }}
            >
              <div style={{ textAlign: "center" }}>TIME</div>
              <div style={{ paddingLeft: "10px" }}>MATCH FIXTURE</div>
              <div style={{ textAlign: "center" }}>
                <span>1 &nbsp;·&nbsp; X &nbsp;·&nbsp; 2</span>
              </div>
              <div style={{ textAlign: "center" }}>1X2 TIP</div>
              <div style={{ textAlign: "center" }}>GOALS</div>
              <div style={{ textAlign: "center" }}>BTTS</div>
              <div style={{ textAlign: "center", color: "var(--gold)" }}>BEST TIP</div>
              <div style={{ textAlign: "center" }}>CONFIDENCE</div>
            </div>

            {/* Match rows */}
            <div>
              {matches.map((match, idx) => (
                <div
                  key={match.id}
                  style={{ borderTop: idx > 0 ? "1px solid var(--border-subtle)" : "none" }}
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
