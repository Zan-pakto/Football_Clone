"use client";

import { MatchData } from "@/lib/scraper/types";

interface MatchRowProps {
  match: MatchData;
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

  // If pick contains multiple combined conditions split by '&' or 'and'
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

  // Exact Score e.g. "2-1", "1:0", "3-0"
  const scoreMatch = p.match(/^(\d+)[:\-]\s*(\d+)$/);
  if (scoreMatch) {
    return h === parseInt(scoreMatch[1], 10) && a === parseInt(scoreMatch[2], 10);
  }

  // 1X2 & Double Chance
  if (p === "1") return h > a;
  if (p === "X" || p === "x") return h === a;
  if (p === "2") return h < a;
  if (p === "1X" || p === "1/X" || p === "1x") return h >= a;
  if (p === "X2" || p === "X/2" || p === "x2") return a >= h;
  if (p === "12" || p === "1/2") return h !== a;

  // Goals Over / Under (handles "Over 1.5", "O 1.5", "+1.5", "O1.5", "Over 2.5 Goals")
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

  // BTTS / GG / NG
  if (/^(Yes|GG|Both Teams To Score|BTTS Yes)$/i.test(p)) return h > 0 && a > 0;
  if (/^(No|NG|BTTS No|No BTTS|Both Teams Not To Score)$/i.test(p)) return h === 0 || a === 0;

  // Handicaps (H1, H2, AH 1, AH 2, 1 (-0.5), 2 (+0.5))
  if (/^(H1|AH1|AH 1|1 \(-0\.5\))$/i.test(p)) return h > a;
  if (/^(H2|AH2|AH 2|2 \(-0\.5\))$/i.test(p)) return h < a;

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
    ? "#10b981"
    : isOverallWon
    ? "#10b981"
    : isOverallLost
    ? "#ef4444"
    : "transparent";

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
        background: isLive ? "rgba(16,185,129,0.03)" : "rgba(13, 17, 34, 0.4)",
        borderLeft: `3px solid ${accentColor}`,
        transition: "background 0.12s",
      }}
      className="match-row-link"
    >
      {/* ── Desktop Row (Exact NerdyTips Grid) ── */}
      <div
        className="match-desktop"
        style={{
          gridTemplateColumns: "52px 1fr 145px 65px 65px 65px 85px 65px",
          alignItems: "center",
          padding: "10px 14px",
          minHeight: 56,
          gap: 0,
        }}
      >
        {/* HOUR / STATUS */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {isLive ? (
            <span
              className="live-pulse"
              style={{
                fontSize: 10, fontWeight: 900, color: "#10b981",
                background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
                padding: "2px 6px", borderRadius: 4,
              }}
            >
              {match.elapsed || "LIVE"}
            </span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 800, color: isFinished ? "#94a3b8" : "#cbd5e1" }}>
              {isFinished ? match.elapsed || "FT" : match.kickTime || "–"}
            </span>
          )}
        </div>

        {/* MATCHES (Teams + Logos + Scores) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingRight: 10, paddingLeft: 6 }}>
          {/* Home Team */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {match.homeLogo ? (
                <img
                  src={match.homeLogo}
                  alt={match.homeTeam}
                  style={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0, borderRadius: "50%" }}
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
              ) : (
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#1e2d44", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#64748b" }}>
                  {match.homeTeam.charAt(0)}
                </span>
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {match.homeTeam}
              </span>
            </div>
            {hasScores && (
              <span style={{ fontSize: 14, fontWeight: 900, color: isLive ? "#34d399" : "#ffffff", flexShrink: 0, paddingLeft: 8 }}>
                {match.homeScore}
              </span>
            )}
          </div>
          {/* Away Team */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {match.awayLogo ? (
                <img
                  src={match.awayLogo}
                  alt={match.awayTeam}
                  style={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0, borderRadius: "50%" }}
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
              ) : (
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#1e2d44", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#64748b" }}>
                  {match.awayTeam.charAt(0)}
                </span>
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {match.awayTeam}
              </span>
            </div>
            {hasScores && (
              <span style={{ fontSize: 14, fontWeight: 900, color: isLive ? "#34d399" : "#ffffff", flexShrink: 0, paddingLeft: 8 }}>
                {match.awayScore}
              </span>
            )}
          </div>
        </div>

        {/* 1 X 2 ODDS */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 4, padding: "0 6px",
        }}>
          {[match.odds.home, match.odds.draw, match.odds.away].map((odd, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#818cf8",
                background: "#161b33", border: "1px solid rgba(99,102,241,0.2)",
                padding: "3px 6px", borderRadius: 6, display: "inline-block", minWidth: 36,
              }}>
                <span style={{ fontSize: 9, opacity: 0.6, marginRight: 2 }}>-</span>
                {odd || "–"}
              </span>
            </div>
          ))}
        </div>

        {/* 1X2 PREDICTION */}
        <PredCell
          pick={match.predictions.pickScore.pick}
          odd={match.predictions.pickScore.odd}
          isWon={checkPredictionWon(match.predictions.pickScore.pick, match.homeScore, match.awayScore)}
          isFinished={isFinished}
        />

        {/* GOALS PREDICTION */}
        <PredCell
          pick={match.predictions.goals.pick}
          odd={match.predictions.goals.odd}
          isWon={checkPredictionWon(match.predictions.goals.pick, match.homeScore, match.awayScore)}
          isFinished={isFinished}
        />

        {/* BTTS PREDICTION */}
        <PredCell
          pick={match.predictions.btts.pick}
          odd={match.predictions.btts.odd}
          isWon={checkPredictionWon(match.predictions.btts.pick, match.homeScore, match.awayScore)}
          isFinished={isFinished}
        />

        {/* BEST TIP PREDICTION */}
        <PredCell
          pick={match.predictions.bestTip.pick}
          odd={match.predictions.bestTip.odd}
          isWon={bestTipWon}
          isFinished={isFinished}
        />

        {/* CONFIDENCE SCORE */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {match.confidence ? (
            <span style={{
              fontSize: 13,
              fontWeight: 900,
              color: parseFloat(match.confidence) >= 7.0
                ? "#10b981"
                : parseFloat(match.confidence) >= 6.0
                ? "#fbbf24"
                : "#a855f7",
            }}>
              {match.confidence}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: "#475569" }}>–</span>
          )}
        </div>
      </div>

      {/* ── Mobile Card ── */}
      <div className="match-mobile" style={{ padding: "10px 14px", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {isLive ? (
            <span className="live-pulse" style={{ fontSize: 10, fontWeight: 900, color: "#10b981" }}>
              LIVE {match.elapsed || ""}
            </span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8" }}>{match.elapsed || match.kickTime || "FT"}</span>
          )}
          {match.confidence && (
            <span style={{ fontSize: 12, fontWeight: 900, color: "#10b981" }}>
              Trust {match.confidence}
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#fff" }}>
            <span>{match.homeTeam}</span>
            {hasScores && <span>{match.homeScore}</span>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#fff" }}>
            <span>{match.awayTeam}</span>
            {hasScores && <span>{match.awayScore}</span>}
          </div>
        </div>

        {/* Mobile Predictions Badges */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {match.predictions.bestTip.pick && (
            <span style={{
              fontSize: 10, fontWeight: 800,
              padding: "2px 7px", borderRadius: 4,
              background: bestTipWon ? "#134e3a" : isFinished ? "#4a192c" : "#161b33",
              color: bestTipWon ? "#34d399" : isFinished ? "#f472b6" : "#94a3b8",
            }}>
              Tip: {match.predictions.bestTip.pick} ({match.predictions.bestTip.odd || "–"})
            </span>
          )}
        </div>
      </div>

      <style>{`
        .match-row-link:hover { background: rgba(255,255,255,0.04) !important; }
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

/* ── Exact NerdyTips Prediction Cell Component ── */
function PredCell({
  pick,
  odd,
  isWon,
  isFinished,
}: {
  pick: string | null | undefined;
  odd: string | null | undefined;
  isWon: boolean | null;
  isFinished: boolean;
}) {
  if (!pick) {
    return (
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 11, color: "#334155" }}>–</span>
      </div>
    );
  }

  // Styling rules matching NerdyTips screenshot:
  // If finished & won -> Green title text & Green pill background badge
  // If finished & lost -> Normal grey title text & Dark Red/Pink pill background badge
  // If pending -> Normal white title text & Neutral dark pill background badge
  const isGreen = isFinished && isWon === true;
  const isRed = isFinished && isWon === false;

  const titleColor = isGreen ? "#34d399" : "#ffffff";
  
  const pillBg = isGreen
    ? "#134e3a"
    : isRed
    ? "#4a192c"
    : "#161b33";

  const pillTextColor = isGreen
    ? "#34d399"
    : isRed
    ? "#f472b6"
    : "#94a3b8";

  const pillBorder = isGreen
    ? "1px solid rgba(52,211,153,0.3)"
    : isRed
    ? "1px solid rgba(244,114,182,0.2)"
    : "1px solid rgba(255,255,255,0.08)";

  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      {/* Pick Title */}
      <span style={{ fontSize: 12, fontWeight: 900, color: titleColor }}>
        {pick}
      </span>
      {/* Odd Badge */}
      {odd ? (
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: pillTextColor,
          background: pillBg,
          border: pillBorder,
          padding: "2px 6px",
          borderRadius: 5,
          display: "inline-block",
        }}>
          <span style={{ opacity: 0.6, marginRight: 2 }}>-</span>
          {odd}
        </span>
      ) : (
        <span style={{ fontSize: 10, color: "#475569" }}>–</span>
      )}
    </div>
  );
}
