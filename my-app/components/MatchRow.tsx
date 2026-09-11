"use client";

import { MatchData } from "@/lib/types";
import { Check, X, Shield, Sparkles, Flame, Target } from "lucide-react";

interface MatchRowProps {
  match: MatchData;
}

/**
 * Clean & format raw verbose picks (e.g. "1 (Arsenal Win)" -> "1", "Over 2.5 Goals" -> "Over 2.5")
 */
export function cleanPickLabel(rawPick: string | null | undefined): string | null {
  if (!rawPick) return null;
  const p = rawPick.trim();

  // 1X2 patterns: "1 (Arsenal Win)" -> "1", "1X (Liverpool or Draw)" -> "1X", "12 (No Draw)" -> "12"
  const doubleChanceMatch = p.match(/^(1X|X2|12)\b/i);
  if (doubleChanceMatch) return doubleChanceMatch[1].toUpperCase();

  const singleMatch = p.match(/^(1|X|2)\b/i);
  if (singleMatch && (p.length === 1 || p.includes("(") || p.toLowerCase().includes("win"))) {
    return singleMatch[1].toUpperCase();
  }

  // Goals: "Over 2.5 Goals" -> "Over 2.5", "Under 2.5" -> "Under 2.5"
  const overUnderMatch = p.match(/^(Over|Under|O|U|\+|\-)\s*([0-9.]+)/i);
  if (overUnderMatch) {
    const type = overUnderMatch[1].toLowerCase().startsWith("o") || overUnderMatch[1] === "+" ? "Over" : "Under";
    return `${type} ${overUnderMatch[2]}`;
  }

  // BTTS
  if (/^(Yes|GG|Both Teams To Score|BTTS Yes)$/i.test(p)) return "Yes";
  if (/^(No|NG|BTTS No|No BTTS)$/i.test(p)) return "No";

  // Score format e.g. "2-1", "1:0"
  const scoreMatch = p.match(/^(\d+)[:\-]\s*(\d+)$/);
  if (scoreMatch) return `${scoreMatch[1]}-${scoreMatch[2]}`;

  // Fallback trimmed if short
  return p.length > 10 ? p.substring(0, 9) + "…" : p;
}

/**
 * Determine if a specific prediction won based on final scores
 */
export function checkPredictionWon(
  pickText: string | null | undefined,
  homeScoreStr: string | null | undefined,
  awayScoreStr: string | null | undefined
): boolean | null {
  if (!pickText || homeScoreStr === null || homeScoreStr === undefined || awayScoreStr === null || awayScoreStr === undefined) {
    return null;
  }
  const h = parseInt(homeScoreStr, 10);
  const a = parseInt(awayScoreStr, 10);
  if (isNaN(h) || isNaN(a)) return null;

  const pick = pickText.trim();

  // Combined conditions
  if (pick.includes("&") || pick.toLowerCase().includes(" and ")) {
    const parts = pick.split(/&| and /i).map((p) => p.trim());
    const results = parts.map((part) => checkSinglePredictionWon(part, h, a));
    if (results.some((r) => r === false)) return false;
    if (results.every((r) => r === true)) return true;
    return null;
  }

  return checkSinglePredictionWon(pick, h, a);
}

function checkSinglePredictionWon(pick: string, h: number, a: number): boolean | null {
  const p = pick.trim();

  // Exact Score
  const scoreMatch = p.match(/^(\d+)[:\-]\s*(\d+)$/);
  if (scoreMatch) {
    return h === parseInt(scoreMatch[1], 10) && a === parseInt(scoreMatch[2], 10);
  }

  // 1X2 & Double Chance
  if (/^1\b/i.test(p) && !p.startsWith("1X") && !p.startsWith("12")) return h > a;
  if (/^X\b/i.test(p) && !p.startsWith("X2")) return h === a;
  if (/^2\b/i.test(p)) return h < a;
  if (/^1X/i.test(p)) return h >= a;
  if (/^X2/i.test(p)) return a >= h;
  if (/^12/i.test(p)) return h !== a;

  // Goals Over / Under
  const overMatch = p.match(/^(?:O|Over|\+)\s*([0-9.]+)/i);
  if (overMatch) {
    const line = parseFloat(overMatch[1]);
    return (h + a) > line;
  }

  const underMatch = p.match(/^(?:U|Under|\-)\s*([0-9.]+)/i);
  if (underMatch) {
    const line = parseFloat(underMatch[1]);
    return (h + a) < line;
  }

  // BTTS
  if (/^(Yes|GG|Both Teams To Score|BTTS Yes)$/i.test(p)) return h > 0 && a > 0;
  if (/^(No|NG|BTTS No|No BTTS)$/i.test(p)) return h === 0 || a === 0;

  return null;
}

export default function MatchRow({ match }: MatchRowProps) {
  const isFinished = match.status === "won" || match.status === "lost" || match.status === "fin" || match.elapsed === "FT" || Boolean(match.homeScore && match.awayScore);
  const isLive = match.isLive || match.status === "live" || match.status === "In Progress" || Boolean(match.elapsed && /^\d+['′]/.test(match.elapsed));
  const hasScores = match.homeScore !== null && match.awayScore !== null && match.homeScore !== "" && match.awayScore !== "";

  // Calculate best tip win status
  const bestTipWon = checkPredictionWon(
    match.predictions.bestTip.pick,
    match.homeScore,
    match.awayScore
  );

  const isOverallWon = match.status === "won" || bestTipWon === true;
  const isOverallLost = match.status === "lost" || (isFinished && bestTipWon === false);

  const accentColor = isLive
    ? "#22c55e"
    : isOverallWon
    ? "#22c55e"
    : isOverallLost
    ? "#ef4444"
    : "rgba(201,168,76,0.25)";

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
      className="match-row-item block text-inherit no-underline transition-all duration-150"
      style={{
        position: "relative",
        background: isLive
          ? "linear-gradient(90deg, rgba(34,197,94,0.08) 0%, rgba(15,15,26,0.95) 60%)"
          : "rgba(15,15,26,0.95)",
        borderLeft: `2px solid ${accentColor}`,
        borderBottom: "none",
      }}
    >
      {/* ── Desktop Row Grid ── */}
      <div
        className="match-desktop"
        style={{
          display: "grid",
          gridTemplateColumns: "60px minmax(200px, 1.3fr) 140px 88px 92px 76px 110px 76px",
          alignItems: "center",
          padding: "10px 18px",
          minHeight: 60,
          gap: 0,
        }}
      >
        {/* TIME / STATUS */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {isLive ? (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 900,
              color: "#34d399",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              padding: "2px 7px",
              borderRadius: 6,
              boxShadow: "0 0 10px rgba(16, 185, 129, 0.2)",
            }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {match.elapsed || "LIVE"}
            </div>
          ) : (
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              color: isFinished ? "#2a2a3d" : "#8a8a9a",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "3px 8px",
              borderRadius: 5,
              letterSpacing: "0.04em",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {isFinished ? match.elapsed || "FT" : match.kickTime || "–"}
            </div>
          )}
        </div>

        {/* MATCH FIXTURE (Teams + Crests + Scores) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingRight: 16, paddingLeft: 10 }}>
          {/* Home Team */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {match.homeLogo ? (
                <img
                  src={match.homeLogo}
                  alt={match.homeTeam}
                  style={{ width: 17, height: 17, objectFit: "contain", flexShrink: 0, borderRadius: "50%" }}
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
              ) : (
                <div style={{
                  width: 17,
                  height: 17,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  fontWeight: 700,
                  color: "#484858"
                }}>
                  {match.homeTeam.charAt(0)}
                </div>
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {match.homeTeam}
              </span>
            </div>
            {hasScores && (
              <span style={{
                fontSize: 13,
                fontWeight: 900,
                color: isLive ? "#34d399" : "#ffffff",
                flexShrink: 0,
                padding: "1px 6px",
                borderRadius: 4,
                background: isLive ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.08)",
                minWidth: 20,
                textAlign: "center",
              }}>
                {match.homeScore}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {match.awayLogo ? (
                <img
                  src={match.awayLogo}
                  alt={match.awayTeam}
                  style={{ width: 17, height: 17, objectFit: "contain", flexShrink: 0, borderRadius: "50%" }}
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
              ) : (
                <div style={{
                  width: 17,
                  height: 17,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  fontWeight: 700,
                  color: "#484858"
                }}>
                  {match.awayTeam.charAt(0)}
                </div>
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {match.awayTeam}
              </span>
            </div>
            {hasScores && (
              <span style={{
                fontSize: 13,
                fontWeight: 900,
                color: isLive ? "#34d399" : "#ffffff",
                flexShrink: 0,
                padding: "1px 6px",
                borderRadius: 4,
                background: isLive ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.08)",
                minWidth: 20,
                textAlign: "center",
              }}>
                {match.awayScore}
              </span>
            )}
          </div>
        </div>

        {/* 1 X 2 ODDS CHIPS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 4,
          padding: "0 6px",
        }}>
          {[
            { label: "1", val: match.odds.home },
            { label: "X", val: match.odds.draw },
            { label: "2", val: match.odds.away }
          ].map((item, i) => (
            <div
              key={i}
              style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(9,9,15,0.8)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 5,
              padding: "3px 4px",
              transition: "border-color 0.15s ease",
            }}
          >
            <span style={{ fontSize: 8, fontWeight: 700, color: "#484858", letterSpacing: "0.06em", lineHeight: 1 }}>
              {item.label}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#8a8a9a", marginTop: 2, lineHeight: 1.1, fontFamily: "'JetBrains Mono', monospace" }}>
              {item.val || "–"}
            </span>
            </div>
          ))}
        </div>

        {/* 1X2 PREDICTION */}
        <PredCell
          rawPick={match.predictions.pickScore.pick}
          odd={match.predictions.pickScore.odd}
          isWon={checkPredictionWon(match.predictions.pickScore.pick, match.homeScore, match.awayScore)}
          isFinished={isFinished}
        />

        {/* GOALS PREDICTION */}
        <PredCell
          rawPick={match.predictions.goals.pick}
          odd={match.predictions.goals.odd}
          isWon={checkPredictionWon(match.predictions.goals.pick, match.homeScore, match.awayScore)}
          isFinished={isFinished}
        />

        {/* BTTS PREDICTION */}
        <PredCell
          rawPick={match.predictions.btts.pick}
          odd={match.predictions.btts.odd}
          isWon={checkPredictionWon(match.predictions.btts.pick, match.homeScore, match.awayScore)}
          isFinished={isFinished}
        />

        {/* BEST AI TIP */}
        <PredCell
          rawPick={match.predictions.bestTip.pick}
          odd={match.predictions.bestTip.odd}
          isWon={bestTipWon}
          isFinished={isFinished}
          isFeatured={true}
        />

        {/* CONFIDENCE SCORE */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {match.confidence ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}>
              <span style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "-0.01em",
                color: parseFloat(match.confidence) >= 75 || parseFloat(match.confidence) >= 7.5
                  ? "#22c55e"
                  : parseFloat(match.confidence) >= 60 || parseFloat(match.confidence) >= 6.0
                  ? "#c9a84c"
                  : "#8a8a9a",
              }}>
                {match.confidence}
              </span>
              <div style={{
                width: 34,
                height: 3,
                borderRadius: 999,
                background: "rgba(255, 255, 255, 0.1)",
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${Math.min(100, parseFloat(match.confidence) * (parseFloat(match.confidence) <= 10 ? 10 : 1))}%`,
                  height: "100%",
                  background: parseFloat(match.confidence) >= 75 || parseFloat(match.confidence) >= 7.5
                    ? "#22c55e"
                    : "#c9a84c",
                  borderRadius: 999,
                }} />
              </div>
            </div>
          ) : (
            <span style={{ fontSize: 11, color: "#475569" }}>–</span>
          )}
        </div>
      </div>

      {/* ── Mobile Responsive Card ── */}
      <div className="match-mobile" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Status + Confidence */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {isLive ? (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 900,
              color: "#34d399",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              padding: "2px 8px",
              borderRadius: 6,
            }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE {match.elapsed || ""}
            </span>
          ) : (
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#94a3b8",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "2px 8px",
              borderRadius: 5,
            }}>
              {match.elapsed || match.kickTime || "FT"}
            </span>
          )}

          {match.confidence && (
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#c9a84c",
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.2)",
              padding: "2px 8px",
              borderRadius: 5,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {match.confidence}
            </span>
          )}
        </div>

        {/* Fixtures & Scores */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "rgba(9,9,15,0.6)", padding: "8px 12px", borderRadius: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {match.homeLogo ? (
                <img src={match.homeLogo} alt={match.homeTeam} style={{ width: 16, height: 16, borderRadius: "50%" }} onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
              ) : (
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#484858" }}>{match.homeTeam.charAt(0)}</span>
              )}
              <span>{match.homeTeam}</span>
            </div>
            {hasScores && <span style={{ fontWeight: 900, color: isLive ? "#34d399" : "#fff" }}>{match.homeScore}</span>}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {match.awayLogo ? (
                <img src={match.awayLogo} alt={match.awayTeam} style={{ width: 16, height: 16, borderRadius: "50%" }} onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
              ) : (
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#484858" }}>{match.awayTeam.charAt(0)}</span>
              )}
              <span>{match.awayTeam}</span>
            </div>
            {hasScores && <span style={{ fontWeight: 900, color: isLive ? "#34d399" : "#fff" }}>{match.awayScore}</span>}
          </div>
        </div>

        {/* Mobile Predictions Badges */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {match.predictions.bestTip.pick && (
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 5,
              background: bestTipWon ? "rgba(34,197,94,0.1)" : isFinished ? "rgba(239,68,68,0.1)" : "rgba(201,168,76,0.08)",
              color: bestTipWon ? "#22c55e" : isFinished ? "#ef4444" : "#c9a84c",
              border: `1px solid ${bestTipWon ? "rgba(34,197,94,0.25)" : isFinished ? "rgba(239,68,68,0.25)" : "rgba(201,168,76,0.2)"}`,
              fontFamily: "'Inter', sans-serif",
            }}>
              Top Pick: {cleanPickLabel(match.predictions.bestTip.pick)} @ {match.predictions.bestTip.odd || "–"}
            </span>
          )}
        </div>
      </div>

      <style>{`
        .match-row-item:hover {
          background: rgba(20,20,32,0.98) !important;
        }
        .match-desktop { display: none !important; }
        .match-mobile { display: flex !important; }
        @media (min-width: 768px) {
          .match-desktop { display: grid !important; }
          .match-mobile { display: none !important; }
        }
      `}</style>
    </a>
  );
}

/* ── Refined Prediction Cell Component with Zero Truncation / Overlap ── */
function PredCell({
  rawPick,
  odd,
  isWon,
  isFinished,
  isFeatured = false,
}: {
  rawPick: string | null | undefined;
  odd: string | null | undefined;
  isWon: boolean | null;
  isFinished: boolean;
  isFeatured?: boolean;
}) {
  const cleanPick = cleanPickLabel(rawPick);

  if (!cleanPick) {
    return (
      <div style={{ textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 38 }}>
        <span style={{
          fontSize: 11,
          color: "#475569",
          background: "rgba(255, 255, 255, 0.03)",
          padding: "2px 8px",
          borderRadius: 4,
        }}>
          –
        </span>
      </div>
    );
  }

  const isGreen = isFinished && isWon === true;
  const isRed = isFinished && isWon === false;

  const cardBg = isGreen
    ? "rgba(34,197,94,0.1)"
    : isRed
    ? "rgba(239,68,68,0.1)"
    : isFeatured
    ? "rgba(201,168,76,0.08)"
    : "rgba(9,9,15,0.8)";

  const cardBorder = isGreen
    ? "1px solid rgba(34,197,94,0.25)"
    : isRed
    ? "1px solid rgba(239,68,68,0.25)"
    : isFeatured
    ? "1px solid rgba(201,168,76,0.28)"
    : "1px solid rgba(255,255,255,0.07)";

  const pickColor = isGreen
    ? "#22c55e"
    : isRed
    ? "#ef4444"
    : isFeatured
    ? "#c9a84c"
    : "#f5f3ee";

  const oddColor = isGreen
    ? "#22c55e"
    : isRed
    ? "#ef4444"
    : isFeatured
    ? "#9a7c36"
    : "#8a8a9a";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 4px",
      minWidth: 0,
      width: "100%",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: cardBg,
        border: cardBorder,
        borderRadius: 8,
        padding: "3px 6px",
        width: "100%",
        maxWidth: isFeatured ? 96 : 76,
        boxShadow: isFeatured ? "0 0 16px rgba(201,168,76,0.12)" : "none",
        transition: "transform 0.15s ease",
      }}>
        {/* Pick Label */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "center" }}>
          {isGreen && <Check style={{ width: 10, height: 10, color: "#34d399", strokeWidth: 3 }} />}
          {isRed && <X style={{ width: 10, height: 10, color: "#f43f5e", strokeWidth: 3 }} />}
          <span style={{
            fontSize: 11,
            fontWeight: 900,
            color: pickColor,
            letterSpacing: "-0.01em",
            whiteSpace: "nowrap",
            lineHeight: 1.2,
          }}>
            {cleanPick}
          </span>
        </div>

        {/* Odd Number */}
        {odd && (
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            color: oddColor,
            lineHeight: 1,
            marginTop: 2,
          }}>
            {odd}
          </span>
        )}
      </div>
    </div>
  );
}
