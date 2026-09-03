"use client";

import { MatchData } from "@/lib/scraper/types";
import Link from "next/link";

interface MatchRowProps {
  match: MatchData;
}

export default function MatchRow({ match }: MatchRowProps) {
  const isFinished = match.status === "won" || match.status === "fin" || match.elapsed === "FT";
  const isLive = match.isLive || match.status === "live" || match.status === "In Progress";
  const hasScores = match.homeScore !== null && match.awayScore !== null;
  const isPredictionWon = match.status === "won";

  const href = match.url
    ? match.url.startsWith("http")
      ? match.url
      : `https://nerdytips.com${match.url}`
    : "#";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        background: isLive ? "rgba(16,185,129,0.03)" : "transparent",
        borderLeft: isLive ? "2px solid #10b981" : "2px solid transparent",
        transition: "background 0.12s",
      }}
      className="match-row-link"
    >
      {/* ── Desktop Row ── */}
      <div
        className="match-desktop"
        style={{
          display: "grid",
          gridTemplateColumns: "68px 1fr 130px 240px 110px 56px 130px",
          alignItems: "center",
          padding: "9px 16px",
          minHeight: 54,
          gap: 0,
        }}
      >
        {/* Time / Status */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {isLive ? (
            <>
              <span
                className="live-pulse"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  fontSize: 9, fontWeight: 900, color: "#10b981",
                  background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
                  padding: "2px 6px", borderRadius: 999,
                }}
              >
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981" }} />
                LIVE
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#6ee7b7" }}>
                {match.elapsed || match.kickTime || ""}
              </span>
            </>
          ) : isFinished ? (
            <span style={{
              fontSize: 10, fontWeight: 800, color: "#94a3b8",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              padding: "3px 7px", borderRadius: 5,
            }}>
              {match.elapsed || "FT"}
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>
              {match.kickTime || "–"}
            </span>
          )}
        </div>

        {/* Teams + Scores */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingRight: 10, paddingLeft: 4 }}>
          {/* Home */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {match.homeLogo ? (
                <img
                  src={match.homeLogo}
                  alt={match.homeTeam}
                  style={{ width: 14, height: 14, objectFit: "contain", flexShrink: 0, borderRadius: "50%" }}
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
              ) : (
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#1e2d44", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: "#64748b" }}>
                  {match.homeTeam.charAt(0)}
                </span>
              )}
              <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {match.homeTeam}
              </span>
            </div>
            {hasScores && (
              <span style={{ fontSize: 13, fontWeight: 900, color: isLive ? "#6ee7b7" : "#fff", flexShrink: 0 }}>
                {match.homeScore}
              </span>
            )}
          </div>
          {/* Away */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {match.awayLogo ? (
                <img
                  src={match.awayLogo}
                  alt={match.awayTeam}
                  style={{ width: 14, height: 14, objectFit: "contain", flexShrink: 0, borderRadius: "50%" }}
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
              ) : (
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#1e2d44", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: "#64748b" }}>
                  {match.awayTeam.charAt(0)}
                </span>
              )}
              <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {match.awayTeam}
              </span>
            </div>
            {hasScores && (
              <span style={{ fontSize: 13, fontWeight: 900, color: isLive ? "#6ee7b7" : "#fff", flexShrink: 0 }}>
                {match.awayScore}
              </span>
            )}
          </div>
        </div>

        {/* 1X2 Odds */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 3, padding: "0 8px",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
        }}>
          {[match.odds.home, match.odds.draw, match.odds.away].map((odd, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#c8d8f0",
                background: "rgba(255,255,255,0.04)", padding: "3px 5px",
                borderRadius: 5, display: "inline-block", minWidth: 30,
              }}>
                {odd || "–"}
              </span>
            </div>
          ))}
        </div>

        {/* AI Predictions: 1X2 / Goals / BTTS */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 4, padding: "0 8px",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
        }}>
          <PredCell pick={match.predictions.pickScore.pick} odd={match.predictions.pickScore.odd} color="#e2e8f0" />
          <PredCell pick={match.predictions.goals.pick} odd={match.predictions.goals.odd} color="#e2e8f0" />
          <PredCell pick={match.predictions.btts.pick} odd={match.predictions.btts.odd} color="#e2e8f0" />
        </div>

        {/* Best Tip */}
        <div style={{
          display: "flex", justifyContent: "center", padding: "0 6px",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
        }}>
          {match.predictions.bestTip.pick ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
            }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#e2e8f0" }}>
                {match.predictions.bestTip.pick}
              </span>
              {match.predictions.bestTip.odd && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>
                  ▾{match.predictions.bestTip.odd}
                </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "#334155" }}>–</span>
          )}
        </div>

        {/* Trust */}
        <div style={{ display: "flex", justifyContent: "center", padding: "0 4px" }}>
          {match.confidence ? (
            <span style={{ fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>
              {match.confidence}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "#334155" }}>–</span>
          )}
        </div>

        {/* Confirmed Best Tip (with checkmark if won) */}
        <div style={{
          display: "flex", justifyContent: "flex-end", padding: "0 0 0 6px",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
        }}>
          {match.predictions.bestTip.pick ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: isPredictionWon ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
              border: isPredictionWon ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(255,255,255,0.07)",
              borderRadius: 6, padding: "4px 8px",
            }}>
              {isPredictionWon && (
                <span style={{ color: "#10b981", fontSize: 10, fontWeight: 900 }}>✓</span>
              )}
              <span style={{ fontSize: 11, fontWeight: 800, color: isPredictionWon ? "#6ee7b7" : "#94a3b8" }}>
                {match.predictions.bestTip.pick}
              </span>
              {match.predictions.bestTip.odd && (
                <span style={{ fontSize: 10, fontWeight: 700, color: isPredictionWon ? "#10b981" : "#475569" }}>
                  ▾{match.predictions.bestTip.odd}
                </span>
              )}
              {match.confidence && (
                <span style={{ fontSize: 10, fontWeight: 800, color: isPredictionWon ? "#10b981" : "#64748b" }}>
                  {match.confidence}
                </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "#334155" }}>–</span>
          )}
        </div>
      </div>

      {/* ── Mobile Card ── */}
      <div className="match-mobile" style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
        {/* Top: time + confidence */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {isLive ? (
            <span className="live-pulse" style={{
              fontSize: 10, fontWeight: 900, color: "#10b981",
              background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
              padding: "2px 7px", borderRadius: 999,
            }}>
              LIVE {match.elapsed || ""}
            </span>
          ) : isFinished ? (
            <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4 }}>
              {match.elapsed || "FT"}
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>{match.kickTime || "VS"}</span>
          )}
          {match.confidence && (
            <span style={{ fontSize: 11, fontWeight: 800, color: "#e2e8f0" }}>
              {match.confidence}
            </span>
          )}
        </div>

        {/* Teams */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
            <span>{match.homeTeam}</span>
            {hasScores && <span style={{ color: isLive ? "#6ee7b7" : "#fff" }}>{match.homeScore}</span>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
            <span>{match.awayTeam}</span>
            {hasScores && <span style={{ color: isLive ? "#6ee7b7" : "#fff" }}>{match.awayScore}</span>}
          </div>
        </div>

        {/* Best Tip + Odds row */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {[match.odds.home, match.odds.draw, match.odds.away].map((odd, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", background: "rgba(255,255,255,0.04)", padding: "2px 6px", borderRadius: 4 }}>
              {odd || "–"}
            </span>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: isPredictionWon ? "#6ee7b7" : "#94a3b8" }}>
            {isPredictionWon && "✓ "}
            {match.predictions.bestTip.pick || ""}
            {match.predictions.bestTip.odd ? ` ▾${match.predictions.bestTip.odd}` : ""}
          </span>
        </div>
      </div>

      <style>{`
        .match-row-link:hover { background: rgba(255,255,255,0.02) !important; }
        .match-desktop { display: none; }
        .match-mobile { display: flex; }
        @media (min-width: 1024px) {
          .match-desktop { display: grid; }
          .match-mobile { display: none; }
        }
      `}</style>
    </a>
  );
}

/* ── Pred Cell ── */
function PredCell({ pick, odd, color }: { pick: string | null | undefined; odd: string | null | undefined; color: string }) {
  if (!pick) {
    return (
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 11, color: "#334155" }}>–</span>
      </div>
    );
  }
  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <span style={{ fontSize: 11, fontWeight: 800, color }}>{pick}</span>
      {odd && <span style={{ fontSize: 9, color: "#64748b", fontWeight: 600 }}>▾{odd}</span>}
    </div>
  );
}
