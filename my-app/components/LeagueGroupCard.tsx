"use client";

import { useState } from "react";
import { MatchData } from "@/lib/types";
import MatchRow from "./MatchRow";
import { ChevronDown, ChevronUp, Shield, Trophy, Zap, Sparkles } from "lucide-react";

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
      background: "linear-gradient(180deg, #151a3a 0%, #111530 100%)",
      border: "1px solid rgba(168, 85, 247, 0.22)",
      borderRadius: "14px",
      overflow: "hidden",
      marginBottom: "20px",
      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
    }}>
      {/* ── League Header Bar ── */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "13px 20px",
          background: "linear-gradient(135deg, rgba(28, 34, 76, 0.98) 0%, rgba(20, 25, 58, 0.98) 100%)",
          borderBottom: isOpen ? "1px solid rgba(168, 85, 247, 0.2)" : "none",
          cursor: "pointer",
          userSelect: "none",
          transition: "background 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: "8px",
            background: "linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)",
            border: "1px solid rgba(168, 85, 247, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 12px rgba(168, 85, 247, 0.25)",
          }}>
            <Trophy style={{ width: 14, height: 14, color: "#c084fc" }} />
          </div>
          <span style={{
            fontSize: "15px",
            fontWeight: 900,
            color: "#ffffff",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "-0.01em",
          }}>
            {leagueName}
          </span>
          <span style={{
            fontSize: "11px",
            color: "#e0e7ff",
            fontWeight: 700,
            background: "rgba(168, 85, 247, 0.18)",
            border: "1px solid rgba(168, 85, 247, 0.35)",
            padding: "2px 9px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}>
            {country}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <span style={{
            fontSize: "11px",
            fontWeight: 800,
            color: "#ffffff",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.4)",
            padding: "3px 11px",
            borderRadius: "999px",
            boxShadow: "0 0 12px rgba(99, 102, 241, 0.2)",
          }}>
            {matches.length} {matches.length === 1 ? "Match" : "Matches"}
          </span>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: "6px",
            background: "rgba(255, 255, 255, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {isOpen
              ? <ChevronUp style={{ width: 15, height: 15, color: "#c7d2fe" }} />
              : <ChevronDown style={{ width: 15, height: 15, color: "#c7d2fe" }} />
            }
          </div>
        </div>
      </div>

      {/* ── Table Scroll Container ── */}
      {isOpen && (
        <div style={{ width: "100%", overflowX: "auto" }}>
          <div style={{ minWidth: 860 }}>
            {/* ── Desktop Column Headers ── */}
            <div
              className="lg-col-headers"
              style={{
                display: "grid",
                gridTemplateColumns: "60px minmax(200px, 1.3fr) 140px 88px 92px 76px 110px 76px",
                padding: "10px 18px",
                background: "rgba(6, 8, 22, 0.95)",
                borderBottom: "1px solid rgba(99, 102, 241, 0.12)",
                fontSize: "10px",
                fontWeight: 900,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                alignItems: "center",
              }}
            >
              <div style={{ textAlign: "center" }}>TIME</div>
              <div style={{ paddingLeft: "10px" }}>MATCH FIXTURE</div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "10px", color: "#818cf8", fontWeight: 800, letterSpacing: "0.05em" }}>
                  1 &nbsp;&bull;&nbsp; X &nbsp;&bull;&nbsp; 2
                </span>
              </div>
              <div style={{ textAlign: "center" }}>1X2 TIP</div>
              <div style={{ textAlign: "center" }}>GOALS</div>
              <div style={{ textAlign: "center" }}>BTTS</div>
              <div style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                <Sparkles style={{ width: 11, height: 11, color: "#a855f7" }} />
                <span style={{ color: "#c084fc" }}>BEST AI TIP</span>
              </div>
              <div style={{ textAlign: "center" }}>CONFIDENCE</div>
            </div>

            {/* ── Match Rows List ── */}
            <div>
              {matches.map((match, idx) => (
                <div
                  key={match.id}
                  style={{ borderTop: idx > 0 ? "1px solid rgba(255, 255, 255, 0.04)" : "none" }}
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
