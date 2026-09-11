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
    ? "var(--accent-green)"
    : isOverallWon
    ? "var(--accent-green)"
    : isOverallLost
    ? "var(--accent-red)"
    : "var(--border-color)";

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
      className="match-row-item block text-inherit no-underline transition-all duration-200"
      style={{
        position: "relative",
        background: isLive
          ? "var(--accent-green-bg)"
          : "var(--bg-card)",
        borderLeft: isLive ? "2px solid var(--accent-green)" : isOverallWon ? "2px solid var(--accent-green)" : isOverallLost ? "2px solid var(--accent-red)" : "2px solid transparent",
        borderBottom: "none",
      }}
    >
      {/* ── Desktop Row Grid ── */}
      <div
        className="match-desktop tabular-nums"
        style={{
          display: "grid",
          gridTemplateColumns: "64px minmax(200px, 1.3fr) 140px 88px 92px 76px 110px 76px",
          alignItems: "center",
          padding: "10px 18px",
          minHeight: 62,
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
              color: "var(--accent-green)",
              background: "var(--accent-green-bg)",
              border: "1px solid var(--accent-green-border)",
              padding: "2px 7px",
              borderRadius: 6,
            }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              {match.elapsed || "LIVE"}
            </div>
          ) : (
            <div style={{
              fontSize: 10,
              fontWeight: 700,
              color: isFinished ? "var(--text-dim)" : "var(--text-secondary)",
              background: "var(--surface-raised)",
              border: "1px solid var(--border-color)",
              padding: "3px 8px",
              borderRadius: 5,
              letterSpacing: "0.04em",
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
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-color)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  fontWeight: 700,
                  color: "var(--text-dim)"
                }}>
                  {match.homeTeam.charAt(0)}
                </div>
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {match.homeTeam}
              </span>
            </div>
            {hasScores && (
              <span style={{
                fontSize: 13,
                fontWeight: 900,
                color: isLive ? "var(--accent-green)" : "var(--text-primary)",
                flexShrink: 0,
                padding: "1px 6px",
                borderRadius: 4,
                background: isLive ? "var(--accent-green-bg)" : "var(--surface-raised)",
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
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-color)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  fontWeight: 700,
                  color: "var(--text-dim)"
                }}>
                  {match.awayTeam.charAt(0)}
                </div>
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {match.awayTeam}
              </span>
            </div>
            {hasScores && (
              <span style={{
                fontSize: 13,
                fontWeight: 900,
                color: isLive ? "var(--accent-green)" : "var(--text-primary)",
                flexShrink: 0,
                padding: "1px 6px",
                borderRadius: 4,
                background: isLive ? "var(--accent-green-bg)" : "var(--surface-raised)",
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
                background: "var(--odds-box-bg)",
                border: "1px solid var(--border-color)",
                borderRadius: 6,
                padding: "3px 4px",
              }}
            >
              <span style={{ fontSize: 8, fontWeight: 700, color: "var(--text-dim)", letterSpacing: "0.06em", lineHeight: 1 }}>
                {item.label}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.1 }}>
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
              gap: 3,
            }}>
              <span style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "-0.01em",
                color: parseFloat(match.confidence) >= 75 || parseFloat(match.confidence) >= 7.5
                  ? "var(--accent-green)"
                  : parseFloat(match.confidence) >= 60 || parseFloat(match.confidence) >= 6.0
                  ? "var(--gold)"
                  : "var(--text-secondary)",
              }}>
                {match.confidence}
              </span>
              <div style={{
                width: 36,
                height: 3,
                borderRadius: 999,
                background: "var(--border-color)",
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${Math.min(100, parseFloat(match.confidence) * (parseFloat(match.confidence) <= 10 ? 10 : 1))}%`,
                  height: "100%",
                  background: parseFloat(match.confidence) >= 75 || parseFloat(match.confidence) >= 7.5
                    ? "var(--accent-green)"
                    : "var(--gold)",
                  borderRadius: 999,
                }} />
              </div>
            </div>
          ) : (
            <span style={{ fontSize: 11, color: "var(--text-dim)" }}>–</span>
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
              color: "var(--accent-green)",
              background: "var(--accent-green-bg)",
              border: "1px solid var(--accent-green-border)",
              padding: "2px 8px",
              borderRadius: 6,
            }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              LIVE {match.elapsed || ""}
            </span>
          ) : (
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--text-secondary)",
              background: "var(--surface-raised)",
              padding: "2px 8px",
              borderRadius: 5,
            }}>
              {match.elapsed || match.kickTime || "FT"}
            </span>
          )}

          {match.confidence && (
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--gold)",
              background: "var(--gold-bg)",
              border: "1px solid var(--gold-border)",
              padding: "2px 8px",
              borderRadius: 5,
            }}>
              {match.confidence} Conf
            </span>
          )}
        </div>

        {/* Teams & Scores */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{match.homeTeam}</span>
            {hasScores && <span style={{ fontSize: 14, fontWeight: 900, color: "var(--text-primary)" }}>{match.homeScore}</span>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{match.awayTeam}</span>
            {hasScores && <span style={{ fontSize: 14, fontWeight: 900, color: "var(--text-primary)" }}>{match.awayScore}</span>}
          </div>
        </div>

        {/* Best Tip Pill */}
        {match.predictions?.bestTip?.pick && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-dim)" }}>Best Algorithmic Tip</span>
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              padding: "3px 10px",
              borderRadius: 6,
              background: "var(--gold-bg)",
              border: "1px solid var(--gold-border)",
              color: "var(--gold)",
            }}>
              {cleanPickLabel(match.predictions.bestTip.pick)} @ {match.predictions.bestTip.odd || "–"}
            </span>
          </div>
        )}
      </div>

      <style>{`
        .match-row-item:hover {
          background: var(--bg-card-hover) !important;
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

/* ── Prediction Cell Component ── */
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
          color: "var(--text-dim)",
          background: "var(--surface-raised)",
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
    ? "var(--accent-green-bg)"
    : isRed
    ? "var(--accent-red-bg)"
    : isFeatured
    ? "var(--gold-bg)"
    : "var(--odds-box-bg)";

  const cardBorder = isGreen
    ? "1px solid var(--accent-green-border)"
    : isRed
    ? "1px solid var(--accent-red-border)"
    : isFeatured
    ? "1px solid var(--gold-border)"
    : "1px solid var(--border-color)";

  const pickColor = isGreen
    ? "var(--accent-green)"
    : isRed
    ? "var(--accent-red)"
    : isFeatured
    ? "var(--gold)"
    : "var(--text-primary)";

  const oddColor = isGreen
    ? "var(--accent-green)"
    : isRed
    ? "var(--accent-red)"
    : isFeatured
    ? "var(--gold-dim)"
    : "var(--text-secondary)";

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
        transition: "transform 0.15s ease",
      }}>
        {/* Pick Label */}
        <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "center" }}>
          {isGreen && <Check style={{ width: 10, height: 10, color: "var(--accent-green)", strokeWidth: 3 }} />}
          {isRed && <X style={{ width: 10, height: 10, color: "var(--accent-red)", strokeWidth: 3 }} />}
          <span style={{
            fontSize: 11,
            fontWeight: 800,
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
            fontWeight: 700,
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
