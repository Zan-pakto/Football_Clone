"use client";

import { MatchData } from "@/lib/scraper/types";

interface MatchRowProps {
  match: MatchData;
}

export default function MatchRow({ match }: MatchRowProps) {
  const isFinished = match.status === "won" || match.status === "fin" || match.elapsed === "FT";
  const isLive = match.isLive || match.status === "live" || match.status === "In Progress";
  const hasScores = match.homeScore !== null && match.awayScore !== null;

  const rowBg = isLive ? "rgba(16,185,129,0.04)" : "transparent";
  const liveBorder = isLive ? "3px solid #10b981" : "3px solid transparent";

  return (
    <div style={{
      background: rowBg,
      borderLeft: liveBorder,
      transition: "background 0.15s",
    }}>
      {/* ── Desktop Row ── */}
      <div className="match-desktop" style={{
        display: "grid",
        gridTemplateColumns: "72px 1fr 148px 220px 108px 64px",
        alignItems: "center",
        padding: "10px 18px",
        minHeight: 58,
      }}>

        {/* Time / Status */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          {isLive ? (
            <>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 9, fontWeight: 900, color: "#10b981",
                background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
                padding: "2px 7px", borderRadius: 999,
              }} className="live-pulse">
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
                LIVE
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#6ee7b7" }}>
                {match.elapsed || match.kickTime || "LIVE"}
              </span>
            </>
          ) : isFinished ? (
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#64748b",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              padding: "3px 8px", borderRadius: 6,
            }}>
              {match.elapsed || "FT"}
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>
              {match.kickTime || "VS"}
            </span>
          )}
        </div>

        {/* Teams */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingRight: 12 }}>
          <TeamLine
            logo={match.homeLogo}
            name={match.homeTeam}
            score={hasScores ? match.homeScore : null}
            isLive={isLive}
          />
          <TeamLine
            logo={match.awayLogo}
            name={match.awayTeam}
            score={hasScores ? match.awayScore : null}
            isLive={isLive}
          />
        </div>

        {/* 1X2 Odds */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 4, padding: "0 8px",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}>
          {[match.odds.home, match.odds.draw, match.odds.away].map((odd, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "center" }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#cbd5e1",
                background: "rgba(255,255,255,0.04)", padding: "4px 6px", borderRadius: 6,
                minWidth: 32, textAlign: "center",
              }}>
                {odd || "–"}
              </span>
            </div>
          ))}
        </div>

        {/* AI Predictions: 1X2 / Goals / BTTS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, padding: "0 8px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          <PredCell pick={match.predictions.pickScore.pick} odd={match.predictions.pickScore.odd} color="#10b981" />
          <PredCell pick={match.predictions.goals.pick} odd={match.predictions.goals.odd} color="#38bdf8" />
          <PredCell pick={match.predictions.btts.pick} odd={match.predictions.btts.odd} color="#c084fc" />
        </div>

        {/* Best Tip */}
        <div style={{ display: "flex", justifyContent: "center", padding: "0 6px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
          {match.predictions.bestTip.pick ? (
            <div style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(20,184,166,0.08))",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 9, padding: "5px 8px",
              display: "flex", flexDirection: "column", alignItems: "center",
              minWidth: 70,
            }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#6ee7b7" }}>{match.predictions.bestTip.pick}</span>
              <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700 }}>@{match.predictions.bestTip.odd || ""}</span>
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "#334155" }}>–</span>
          )}
        </div>

        {/* Trust / Confidence */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          {match.confidence ? (
            <span style={{
              fontSize: 12, fontWeight: 900, color: "#f59e0b",
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
              padding: "3px 8px", borderRadius: 7,
            }}>
              {match.confidence}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "#334155" }}>–</span>
          )}
        </div>
      </div>

      {/* ── Mobile Card ── */}
      <div className="match-mobile" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Top row: time + trust */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {isLive ? (
            <span style={{
              fontSize: 10, fontWeight: 900, color: "#10b981",
              background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
              padding: "2px 8px", borderRadius: 999,
            }} className="live-pulse">
              LIVE {match.elapsed || ""}
            </span>
          ) : isFinished ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>FT</span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{match.kickTime || "VS"}</span>
          )}
          {match.confidence && (
            <span style={{
              fontSize: 11, fontWeight: 800, color: "#f59e0b",
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
              padding: "2px 8px", borderRadius: 6,
            }}>
              Trust {match.confidence}
            </span>
          )}
        </div>

        {/* Teams */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
            <span>{match.homeTeam}</span>
            {hasScores && <span style={{ color: isLive ? "#6ee7b7" : "#f1f5f9" }}>{match.homeScore}</span>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
            <span>{match.awayTeam}</span>
            {hasScores && <span style={{ color: isLive ? "#6ee7b7" : "#f1f5f9" }}>{match.awayScore}</span>}
          </div>
        </div>

        {/* Best Pick */}
        {match.predictions.bestTip.pick && (
          <div style={{
            marginTop: 2, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>Best Pick</span>
            <span style={{
              fontSize: 12, fontWeight: 800, color: "#6ee7b7",
              background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
              padding: "3px 10px", borderRadius: 8,
            }}>
              {match.predictions.bestTip.pick} @{match.predictions.bestTip.odd}
            </span>
          </div>
        )}
      </div>

      <style>{`
        .match-desktop { display: none; }
        .match-mobile { display: flex; }
        @media (min-width: 1024px) {
          .match-desktop { display: grid; }
          .match-mobile { display: none; }
        }
      `}</style>
    </div>
  );
}

/* ── Helper components ── */

function TeamLine({ logo, name, score, isLive }: { logo: string | null; name: string; score: string | null | undefined; isLive: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
        {logo ? (
          <img src={logo} alt={name} style={{ width: 16, height: 16, objectFit: "contain", borderRadius: "50%", flexShrink: 0 }}
            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
        ) : (
          <div style={{
            width: 16, height: 16, borderRadius: "50%", background: "#1e293b",
            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 8, fontWeight: 800, color: "#64748b",
          }}>
            {name.charAt(0)}
          </div>
        )}
        <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </span>
      </div>
      {score !== null && score !== undefined && (
        <span style={{
          fontSize: 12, fontWeight: 900,
          color: isLive ? "#6ee7b7" : "#e2e8f0",
          background: isLive ? "rgba(16,185,129,0.12)" : "transparent",
          padding: isLive ? "1px 6px" : "0", borderRadius: 5,
        }}>
          {score}
        </span>
      )}
    </div>
  );
}

function PredCell({ pick, odd, color }: { pick: string | null | undefined; odd: string | null | undefined; color: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 8, padding: "5px 4px",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: 38,
    }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: pick ? color : "#334155" }}>{pick || "–"}</span>
      {odd && <span style={{ fontSize: 9, color: "#475569", fontWeight: 600, marginTop: 1 }}>@{odd}</span>}
    </div>
  );
}
