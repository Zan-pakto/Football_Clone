"use client";

import { MatchData } from "@/lib/types";
import { Check, X, Shield, Sparkles, Flame, Target, Lock, Radio } from "lucide-react";
import Link from "next/link";

interface MatchRowProps {
  match: MatchData;
}

/**
 * Format raw verbose picks (e.g. "1 (Arsenal Win)" -> "1", "Over 2.5 Goals" -> "O2.5", "Under 3.5" -> "U3.5")
 */
export function cleanPickLabel(rawPick: string | null | undefined): string | null {
  if (!rawPick) return null;
  const p = rawPick.trim();

  // 1X2 patterns
  const doubleChanceMatch = p.match(/^(1X|X2|12)\b/i);
  if (doubleChanceMatch) return doubleChanceMatch[1].toUpperCase();

  const singleMatch = p.match(/^(1|X|2)\b/i);
  if (singleMatch && (p.length === 1 || p.includes("(") || p.toLowerCase().includes("win"))) {
    return singleMatch[1].toUpperCase();
  }

  // Goals: "Over 2.5 Goals" -> "O2.5", "Under 3.5" -> "U3.5"
  const overUnderMatch = p.match(/^(?:Over|O|\+)\s*([0-9.]+)/i);
  if (overUnderMatch) return `O${overUnderMatch[1]}`;

  const underMatch = p.match(/^(?:Under|U|\-)\s*([0-9.]+)/i);
  if (underMatch) return `U${underMatch[1]}`;

  // BTTS
  if (/^(Yes|GG|Both Teams To Score|BTTS Yes)$/i.test(p)) return "Yes";
  if (/^(No|NG|BTTS No|No BTTS)$/i.test(p)) return "No";

  // Score format e.g. "2-1", "1:0"
  const scoreMatch = p.match(/^(\d+)[:\-]\s*(\d+)$/);
  if (scoreMatch) return `${scoreMatch[1]}-${scoreMatch[2]}`;

  return p.length > 8 ? p.substring(0, 7) + "…" : p;
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

  const scoreMatch = p.match(/^(\d+)[:\-]\s*(\d+)$/);
  if (scoreMatch) {
    return h === parseInt(scoreMatch[1], 10) && a === parseInt(scoreMatch[2], 10);
  }

  if (/^1\b/i.test(p) && !p.startsWith("1X") && !p.startsWith("12")) return h > a;
  if (/^X\b/i.test(p) && !p.startsWith("X2")) return h === a;
  if (/^2\b/i.test(p)) return h < a;
  if (/^1X/i.test(p)) return h >= a;
  if (/^X2/i.test(p)) return a >= h;
  if (/^12/i.test(p)) return h !== a;

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

  if (/^(Yes|GG|Both Teams To Score|BTTS Yes)$/i.test(p)) return h > 0 && a > 0;
  if (/^(No|NG|BTTS No|No BTTS)$/i.test(p)) return h === 0 || a === 0;

  return null;
}

export default function MatchRow({ match }: MatchRowProps) {
  const isLive = match.isLive || match.status === "live";
  const isFinished = match.status === "won" || match.status === "lost" || match.status === "FINISHED";
  const isLocked = match.isLocked;

  const hasScores = match.homeScore !== null && match.homeScore !== undefined &&
                    match.awayScore !== null && match.awayScore !== undefined;

  // Stacked time (e.g. 18 on top, 15 on bottom)
  const formatStackedTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return { top: "--", bottom: "--" };
    if (timeStr.includes(":")) {
      const [hh, mm] = timeStr.split(":");
      return { top: hh, bottom: mm };
    }
    return { top: timeStr, bottom: "" };
  };

  const stackedTime = formatStackedTime(match.kickTime);

  // Confidence Rating
  const numericConfidence = (() => {
    if (!match.confidence) return "7.5";
    const clean = match.confidence.replace("%", "").trim();
    const val = parseFloat(clean);
    if (isNaN(val)) return "7.5";
    if (val > 10) return (val / 10).toFixed(1);
    return val.toFixed(1);
  })();

  const numConfVal = parseFloat(numericConfidence);
  const ratingColor = numConfVal >= 7.5 ? "#2fd08a" : numConfVal >= 6.0 ? "#8b7ff5" : "#e0a75f";

  // Check winning status for each prediction pill
  const p1x2Clean = cleanPickLabel(match.predictions.pickScore.pick);
  const pGoalsClean = cleanPickLabel(match.predictions.goals.pick);
  const pBttsClean = cleanPickLabel(match.predictions.btts.pick);
  const pBestClean = cleanPickLabel(match.predictions.bestTip.pick);

  const is1x2Won = hasScores && isFinished ? checkPredictionWon(p1x2Clean, match.homeScore, match.awayScore) : null;
  const isGoalsWon = hasScores && isFinished ? checkPredictionWon(pGoalsClean, match.homeScore, match.awayScore) : null;
  const isBttsWon = hasScores && isFinished ? checkPredictionWon(pBttsClean, match.homeScore, match.awayScore) : null;
  const isBestWon = hasScores && isFinished ? checkPredictionWon(pBestClean, match.homeScore, match.awayScore) : null;

  // 1X2 odds favorite calculation
  const oddsHome = parseFloat(match.odds.home || "0");
  const oddsDraw = parseFloat(match.odds.draw || "0");
  const oddsAway = parseFloat(match.odds.away || "0");
  const minOdd = Math.min(...[oddsHome, oddsDraw, oddsAway].filter((o) => o > 1.0));

  const href = isLocked
    ? "/pricing"
    : match.url
    ? match.url.startsWith("http")
      ? match.url
      : match.url.startsWith("/match/")
      ? match.url
      : `https://nerdytips.com${match.url}`
    : "#";

  return (
    <Link
      href={href}
      className="nt-row-link block text-inherit no-underline"
      style={{
        position: "relative",
        background: isLive ? "rgba(255, 93, 120, 0.04)" : "#100d28",
        borderBottom: "1px solid rgba(167, 159, 255, 0.08)",
        transition: "background 0.15s ease",
      }}
    >
      {/* Finished match win indicator accent line on the left edge */}
      {isFinished && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: isBestWon === true ? "#2fd08a" : isBestWon === false ? "#fb7185" : "rgba(167, 159, 255, 0.2)",
          }}
        />
      )}

      {/* ── Desktop Row Grid (Exact NerdyTips Table Structure) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "56px minmax(190px, 1.4fr) 138px 66px 66px 58px 76px 56px",
          alignItems: "center",
          padding: "10px 18px",
          minHeight: 56,
          gap: 6,
        }}
      >
        {/* 1. STACKED TIME / LIVE STATUS */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {isLive ? (
            <div
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                fontSize: 10.5,
                fontWeight: 900,
                color: "#ff5d78",
                lineHeight: 1.15,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#ff5d78",
                  boxShadow: "0 0 8px #ff5d78",
                  display: "inline-block",
                  marginBottom: 3,
                }}
              />
              <span>{match.elapsed || "LIVE"}</span>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1.15,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF", fontFamily: "var(--font-mono)" }}>
                {isFinished ? "FT" : stackedTime.top}
              </span>
              {!isFinished && stackedTime.bottom && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#7874a4", fontFamily: "var(--font-mono)" }}>
                  {stackedTime.bottom}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 2. MATCH FIXTURE (Home / Away with Logos and Scores) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingLeft: 6, paddingRight: 10, minWidth: 0 }}>
          {/* Home Team */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {match.homeLogo ? (
                <img
                  src={match.homeLogo}
                  alt=""
                  style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
              ) : (
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#1b183d",
                    border: "1px solid rgba(167, 159, 255, 0.2)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    fontWeight: 800,
                    color: "#a79fff",
                  }}
                >
                  {match.homeTeam.charAt(0)}
                </div>
              )}
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {match.homeTeam}
              </span>
            </div>
            {hasScores && (
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 900,
                  color: isLive ? "#2fd08a" : "#FFFFFF",
                  fontFamily: "var(--font-mono)",
                  flexShrink: 0,
                }}
              >
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
                  alt=""
                  style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }}
                  onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                />
              ) : (
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#1b183d",
                    border: "1px solid rgba(167, 159, 255, 0.2)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    fontWeight: 800,
                    color: "#a79fff",
                  }}
                >
                  {match.awayTeam.charAt(0)}
                </div>
              )}
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {match.awayTeam}
              </span>
            </div>
            {hasScores && (
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 900,
                  color: isLive ? "#2fd08a" : "#FFFFFF",
                  fontFamily: "var(--font-mono)",
                  flexShrink: 0,
                }}
              >
                {match.awayScore}
              </span>
            )}
          </div>
        </div>

        {/* 3. 1 X 2 ODDS PILLS */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Home Odd */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              height: 32,
              borderRadius: 7,
              background: oddsHome === minOdd ? "rgba(124, 108, 245, 0.2)" : "rgba(27, 24, 61, 0.6)",
              border: oddsHome === minOdd ? "1px solid rgba(124, 108, 245, 0.45)" : "1px solid rgba(167, 159, 255, 0.1)",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: oddsHome === minOdd ? "#ffffff" : "#a79fff",
            }}
          >
            {oddsHome === minOdd && <span style={{ color: "#2fd08a", fontSize: 9 }}>▴</span>}
            <span>{match.odds.home || "1.80"}</span>
          </div>

          {/* Draw Odd */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              height: 32,
              borderRadius: 7,
              background: oddsDraw === minOdd ? "rgba(124, 108, 245, 0.2)" : "rgba(27, 24, 61, 0.6)",
              border: oddsDraw === minOdd ? "1px solid rgba(124, 108, 245, 0.45)" : "1px solid rgba(167, 159, 255, 0.1)",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: oddsDraw === minOdd ? "#ffffff" : "#a79fff",
            }}
          >
            <span>{match.odds.draw || "3.50"}</span>
          </div>

          {/* Away Odd */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              height: 32,
              borderRadius: 7,
              background: oddsAway === minOdd ? "rgba(124, 108, 245, 0.2)" : "rgba(27, 24, 61, 0.6)",
              border: oddsAway === minOdd ? "1px solid rgba(124, 108, 245, 0.45)" : "1px solid rgba(167, 159, 255, 0.1)",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: oddsAway === minOdd ? "#ffffff" : "#a79fff",
            }}
          >
            {oddsAway === minOdd && <span style={{ color: "#2fd08a", fontSize: 9 }}>▴</span>}
            <span>{match.odds.away || "4.20"}</span>
          </div>
        </div>

        {/* 4. 1X2 TIP PILL */}
        <NerdyTipPill
          pick={p1x2Clean}
          odd={match.predictions.pickScore.odd}
          isWon={is1x2Won}
          isLocked={match.predictions.pickScore.isLocked || isLocked}
        />

        {/* 5. GOALS TIP PILL */}
        <NerdyTipPill
          pick={pGoalsClean}
          odd={match.predictions.goals.odd}
          isWon={isGoalsWon}
          isLocked={match.predictions.goals.isLocked || isLocked}
        />

        {/* 6. BTTS TIP PILL */}
        <NerdyTipPill
          pick={pBttsClean}
          odd={match.predictions.btts.odd}
          isWon={isBttsWon}
          isLocked={match.predictions.btts.isLocked || isLocked}
        />

        {/* 7. BEST TIP PILL (Prominent Star Capsule) */}
        <NerdyTipPill
          pick={pBestClean}
          odd={match.predictions.bestTip.odd}
          isBest={true}
          isWon={isBestWon}
          isLocked={match.predictions.bestTip.isLocked || isLocked}
        />

        {/* 8. CONFIDENCE RATING */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {isLocked ? (
            <span style={{ fontSize: 11, fontWeight: 800, color: "#8b7ff5", display: "flex", alignItems: "center", gap: 3 }}>
              <Lock size={10} /> VIP
            </span>
          ) : (
            <span
              style={{
                fontSize: 14.5,
                fontWeight: 800,
                color: ratingColor,
                fontFamily: "var(--font-mono)",
                letterSpacing: "-0.02em",
              }}
            >
              {numericConfidence}
            </span>
          )}
        </div>
      </div>

      <style>{`
        .nt-row-link:hover {
          background: #19153a !important;
        }
      `}</style>
    </Link>
  );
}

/**
 * Authentic NerdyTips 2-line Tip Capsule Component
 */
function NerdyTipPill({
  pick,
  odd,
  isBest = false,
  isWon = null,
  isLocked = false,
}: {
  pick: string | null | undefined;
  odd: string | null | undefined;
  isBest?: boolean;
  isWon?: boolean | null;
  isLocked?: boolean;
}) {
  if (isLocked) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 38,
          background: isBest ? "rgba(124, 108, 245, 0.15)" : "#1b183d",
          border: isBest ? "1px solid rgba(124, 108, 245, 0.35)" : "1px solid rgba(167, 159, 255, 0.1)",
          borderRadius: 8,
          opacity: 0.85,
        }}
      >
        <Lock size={11} color="#8b7ff5" />
      </div>
    );
  }

  if (!pick) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 38,
          background: "#1b183d",
          border: "1px solid rgba(167, 159, 255, 0.08)",
          borderRadius: 8,
          color: "#7874a4",
          fontSize: 11,
        }}
      >
        –
      </div>
    );
  }

  // Determine styling based on won/lost/pending state
  let bg = "#1b183d";
  let border = "1px solid rgba(167, 159, 255, 0.12)";
  let pickColor = "#FFFFFF";
  let oddColor = "#a79fff";
  let shadow = "none";

  if (isWon === true) {
    bg = "rgba(47, 208, 138, 0.18)";
    border = "1px solid rgba(47, 208, 138, 0.55)";
    pickColor = "#2fd08a";
    oddColor = "#2fd08a";
    if (isBest) shadow = "0 0 12px -2px rgba(47, 208, 138, 0.4)";
  } else if (isWon === false) {
    bg = "rgba(251, 113, 133, 0.1)";
    border = "1px solid rgba(251, 113, 133, 0.3)";
    pickColor = "#fb7185";
    oddColor = "#fb7185";
  } else if (isBest) {
    bg = "rgba(124, 108, 245, 0.22)";
    border = "1px solid rgba(124, 108, 245, 0.55)";
    pickColor = "#FFFFFF";
    oddColor = "#8b7ff5";
    shadow = "0 0 14px -2px rgba(124, 108, 245, 0.35)";
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: 38,
        padding: "2px 6px",
        borderRadius: 8,
        background: bg,
        border: border,
        boxShadow: shadow,
        lineHeight: 1.15,
        transition: "all 0.15s ease",
      }}
    >
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 800,
          color: pickColor,
        }}
      >
        {pick}
      </span>
      {odd && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: oddColor,
            fontFamily: "var(--font-mono)",
            display: "flex",
            alignItems: "center",
            gap: 2,
            marginTop: 1,
          }}
        >
          <span style={{ fontSize: 8 }}>{isBest ? "▴" : "▾"}</span> {odd}
        </span>
      )}
    </div>
  );
}
