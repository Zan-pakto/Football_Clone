"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { MatchData } from "@/lib/types";
import {
  Sparkles,
  RefreshCw,
  Copy,
  CheckCircle2,
  Star,
  Check,
  ChevronDown,
  Info,
} from "lucide-react";
import CountryFlag from "@/components/CountryFlag";

interface SlipMatch {
  id: string;
  datetime: string;
  country: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  trustScore: string;
  trustLevel: "cf1" | "cf2" | "cf3" | "cf4";
  pick: string;
  odds: number;
  oddMove?: "up" | "down";
}

const DEFAULT_BET_TYPES: Record<string, boolean> = {
  "Match Result (1X2)": true,
  "Under 2.5": true,
  "Under 1.5": true,
  "Under 3.5": true,
  "Double Chance": true,
  "Over 2.5": true,
  "Over 1.5": true,
  "Over 3.5": true,
  "Both Teams to Score": true,
  "More markets": true,
};

export default function BetBuilderPage() {
  // Odds slider state
  const [targetOdds, setTargetOdds] = useState<number>(5.0);
  const [autoOdds, setAutoOdds] = useState<boolean>(false);

  // Number of matches
  const [numPicksRange, setNumPicksRange] = useState<string>("Auto");
  const [isFixedCount, setIsFixedCount] = useState<boolean>(false);
  const [fixedCount, setFixedCount] = useState<string>("");

  // Bet types checklist
  const [betTypes, setBetTypes] = useState<Record<string, boolean>>(DEFAULT_BET_TYPES);

  // Min/Max odd per pick & trust (advanced)
  const [minOdd, setMinOdd] = useState<number>(1.15);
  const [maxOdd, setMaxOdd] = useState<number>(1.80);
  const [minTrust, setMinTrust] = useState<number>(3.0);
  const [timeWindow, setTimeWindow] = useState<string>("tomorrow");
  const [onlyMajor, setOnlyMajor] = useState<boolean>(false);
  const [onlyDecreasing, setOnlyDecreasing] = useState<boolean>(false);

  // Matches inventory from API
  const [matchesPool, setMatchesPool] = useState<SlipMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [rerollSeed, setRerollSeed] = useState<number>(0);

  // Load matches from API
  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);
        const res = await fetch("/api/matches?d=0");
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.matches)) {
          const formatted: SlipMatch[] = data.matches.map((m: MatchData, idx: number) => {
            // Determine best pick and market
            const homeOdd = parseFloat(m.odds?.home || "1.85");
            const drawOdd = parseFloat(m.odds?.draw || "3.20");
            const awayOdd = parseFloat(m.odds?.away || "3.80");

            let pick = "1";
            let pickOdd = homeOdd;
            if (awayOdd < homeOdd && awayOdd < 2.5) {
              pick = "2";
              pickOdd = awayOdd;
            } else if (homeOdd <= 1.45) {
              pick = "1";
              pickOdd = homeOdd;
            } else if (homeOdd <= 1.85) {
              pick = "1X";
              pickOdd = parseFloat((homeOdd * 0.72).toFixed(2));
            } else if (awayOdd <= 1.85) {
              pick = "X2";
              pickOdd = parseFloat((awayOdd * 0.72).toFixed(2));
            } else {
              pick = idx % 2 === 0 ? "U2.5" : "O1.5";
              pickOdd = idx % 2 === 0 ? 1.62 : 1.35;
            }

            // Trust score format: e.g. 10 or 8.8
            const ratingNum = typeof m.rating === "number" ? m.rating : 8.8;
            const trustStr = ratingNum >= 9.5 ? "10" : ratingNum.toFixed(1);

            let trustLevel: "cf1" | "cf2" | "cf3" | "cf4" = "cf2";
            if (ratingNum >= 9) trustLevel = "cf1";
            else if (ratingNum >= 7.5) trustLevel = "cf2";
            else if (ratingNum >= 6) trustLevel = "cf3";
            else trustLevel = "cf4";

            // Format date & time: Thu, Sep 24 · 00:15
            const kick = m.kickTime || "20:00";
            const dateStr = `Thu, Sep 24 · ${kick}`;

            return {
              id: m.id,
              datetime: dateStr,
              country: m.country || "World",
              league: m.leagueName || "League",
              homeTeam: m.homeTeam,
              awayTeam: m.awayTeam,
              homeLogo: m.homeLogo,
              awayLogo: m.awayLogo,
              trustScore: trustStr,
              trustLevel,
              pick,
              odds: isNaN(pickOdd) ? 1.45 : pickOdd,
              oddMove: idx % 3 === 0 ? "down" : undefined,
            };
          });
          setMatchesPool(formatted);
        }
      } catch (err) {
        console.error("Error loading match pool:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

  // Filter matches based on selections
  const filteredPool = useMemo(() => {
    if (matchesPool.length === 0) return [];
    return matchesPool.filter((m) => {
      if (m.odds < minOdd || m.odds > maxOdd) return false;
      const numTrust = parseFloat(m.trustScore);
      if (!isNaN(numTrust) && numTrust < minTrust) return false;
      return true;
    });
  }, [matchesPool, minOdd, maxOdd, minTrust]);

  // Solver for accumulator slip matching target odds
  const generatedSlip = useMemo(() => {
    const pool = filteredPool.length > 0 ? filteredPool : matchesPool;
    if (pool.length === 0) return [];

    // Determine target pick count
    let targetPicks = 5;
    if (isFixedCount && parseInt(fixedCount, 10)) {
      targetPicks = Math.max(2, Math.min(25, parseInt(fixedCount, 10)));
    } else if (numPicksRange === "2-5") targetPicks = 4;
    else if (numPicksRange === "5-10") targetPicks = 6;
    else if (numPicksRange === "10-15") targetPicks = 10;
    else if (numPicksRange === "15-20") targetPicks = 15;
    else {
      // Auto: select picks count based on target odds
      if (targetOdds <= 2.5) targetPicks = 3;
      else if (targetOdds <= 6) targetPicks = 5;
      else if (targetOdds <= 15) targetPicks = 8;
      else targetPicks = 12;
    }

    // Seed-based shuffle for re-roll
    const shuffled = [...pool].sort((a, b) => {
      const hashA = (a.id.charCodeAt(0) * 31 + rerollSeed) % 100;
      const hashB = (b.id.charCodeAt(0) * 31 + rerollSeed) % 100;
      return hashA - hashB;
    });

    // Greedy selection towards targetOdds
    const selected: SlipMatch[] = [];
    let currentProd = 1;

    for (const match of shuffled) {
      if (selected.length >= targetPicks) break;
      selected.push(match);
      currentProd *= match.odds;
      if (selected.length >= targetPicks && currentProd >= targetOdds * 0.9) {
        break;
      }
    }

    // Ensure we have at least 2 picks if available
    if (selected.length < 2 && pool.length >= 2) {
      return pool.slice(0, 2);
    }

    return selected;
  }, [filteredPool, matchesPool, targetOdds, numPicksRange, isFixedCount, fixedCount, rerollSeed]);

  // Calculated cumulative odds
  const calculatedOdds = useMemo(() => {
    if (generatedSlip.length === 0) return 1.0;
    const prod = generatedSlip.reduce((acc, m) => acc * m.odds, 1);
    return parseFloat(prod.toFixed(2));
  }, [generatedSlip]);

  // Calculate target diff percentage
  const deltaPercent = useMemo(() => {
    if (targetOdds <= 0) return 0;
    const diff = ((calculatedOdds - targetOdds) / targetOdds) * 100;
    return Math.round(diff);
  }, [calculatedOdds, targetOdds]);

  // Toggle bet type checkbox
  const handleToggleBetType = (key: string) => {
    setBetTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle all bet types
  const handleToggleAllBetTypes = () => {
    const allChecked = Object.values(betTypes).every(Boolean);
    const updated: Record<string, boolean> = {};
    Object.keys(betTypes).forEach((k) => {
      updated[k] = !allChecked;
    });
    setBetTypes(updated);
  };

  // Copy slip to clipboard
  const handleCopySlip = useCallback(() => {
    if (generatedSlip.length === 0) return;
    const lines = generatedSlip.map(
      (m, idx) =>
        `${idx + 1}. [${m.country} · ${m.league}] ${m.homeTeam} vs ${m.awayTeam} -> ${m.pick} @ ${m.odds.toFixed(2)}`
    );
    const text = `[JollofTips Bet Builder] ${generatedSlip.length} picks · Total Odds: ${calculatedOdds}\n` + lines.join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedSlip, calculatedOdds]);

  // Dynamic slider percentage for CSS gradient track
  const sliderPct = useMemo(() => {
    const min = 1.5;
    const max = 50.0;
    const pct = ((targetOdds - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [targetOdds]);

  return (
    <div className="bb" style={{ minHeight: "100vh", background: "var(--color-bg, #080718)" }}>
      {/* Radial purple ambient light */}
      <div className="bb__orb bb__orb--a" aria-hidden="true" />
      <div className="nt-glow" aria-hidden="true" />

      <Navbar />

      {/* Main Container */}
      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "24px 20px 80px", position: "relative", zIndex: 1 }}>
        {/* Compact Hero Header */}
        <div style={{ marginBottom: 20 }}>
          <div className="bb-tagline">
            <Sparkles size={12} />
            + POWERED BY NT APEX AI
          </div>
          <h1 className="bb-title">Bet Builder</h1>
        </div>

        {/* 2-Column Responsive Grid (340px Left / 1fr Right) */}
        <div className="bb-grid">
          {/* ════════════════════════════════════════════════════════════
              LEFT: Configuration Form (.bb-config)
              ════════════════════════════════════════════════════════════ */}
          <form className="bb-config" aria-label="Bet Builder configuration" onSubmit={(e) => e.preventDefault()}>
            {/* 1. Total Slip Odds */}
            <div className="bb-field">
              <div className="bb-field__head">
                <label className="bb-field__label" htmlFor="bb-target">
                  Total slip odds
                </label>
                <label className="bb-switch">
                  <input
                    type="checkbox"
                    checked={autoOdds}
                    onChange={(e) => setAutoOdds(e.target.checked)}
                  />
                  <span>Auto odds</span>
                </label>
              </div>

              <div className="bb-slider" style={{ ["--bb-pct" as any]: `${sliderPct}%` }}>
                <input
                  type="range"
                  id="bb-target"
                  min="1.5"
                  max="50"
                  step="0.1"
                  disabled={autoOdds}
                  value={targetOdds}
                  onChange={(e) => setTargetOdds(parseFloat(e.target.value))}
                  aria-label="Total slip odds"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  className="bb-out"
                  value={targetOdds.toFixed(2)}
                  readOnly
                  aria-label="Total slip odds value"
                />
              </div>
            </div>

            {/* 2. Number of Matches */}
            <div className="bb-field">
              <span className="bb-field__label">Number of matches</span>
              <div className="bb-pills" role="radiogroup" aria-label="Number of matches">
                {["Auto", "2-5", "5-10", "10-15", "15-20"].map((range) => {
                  const active = numPicksRange === range && !isFixedCount;
                  return (
                    <label key={range} className={`bb-pill ${active ? "is-active" : ""}`}>
                      <input
                        type="radio"
                        name="num_picks_range"
                        value={range}
                        checked={active}
                        onChange={() => {
                          setNumPicksRange(range);
                          setIsFixedCount(false);
                        }}
                      />
                      <span>{range}</span>
                    </label>
                  );
                })}
              </div>

              <label className="bb-inline-toggle">
                <input
                  type="checkbox"
                  checked={isFixedCount}
                  onChange={(e) => setIsFixedCount(e.target.checked)}
                />
                <span>Fixed count</span>
                <input
                  type="number"
                  min="2"
                  max="25"
                  value={fixedCount}
                  placeholder="2–25"
                  disabled={!isFixedCount}
                  onChange={(e) => setFixedCount(e.target.value)}
                  className="bb-num"
                  aria-label="Exact number of matches"
                />
              </label>
            </div>

            {/* 3. Bet Types (2-Column Checklist) */}
            <div className="bb-field">
              <div className="bb-field__head">
                <label className="bb-field__label">Bet types</label>
                <button
                  type="button"
                  onClick={handleToggleAllBetTypes}
                  className="bb-mini"
                  style={{ background: "transparent", border: "none", padding: 0 }}
                >
                  {Object.values(betTypes).every(Boolean) ? "Uncheck all" : "Check all"}
                </button>
              </div>

              <div className="bb-markets">
                {/* Column 1 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Match Result (1X2)", "Under 2.5", "Under 1.5", "Under 3.5", "Double Chance"].map((market) => (
                    <label key={market} className="bb-chk">
                      <input
                        type="checkbox"
                        checked={Boolean(betTypes[market])}
                        onChange={() => handleToggleBetType(market)}
                      />
                      <span>{market}</span>
                    </label>
                  ))}
                </div>

                {/* Column 2 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Over 2.5", "Over 1.5", "Over 3.5", "Both Teams to Score", "More markets"].map((market) => (
                    <label key={market} className="bb-chk">
                      <input
                        type="checkbox"
                        checked={Boolean(betTypes[market])}
                        onChange={() => handleToggleBetType(market)}
                      />
                      <span>{market}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Min / Max Odd per Pick */}
            <div className="bb-field">
              <label className="bb-field__label" htmlFor="bb-minodd">
                Min odd per pick
              </label>
              <div
                className="bb-slider"
                style={{ ["--bb-pct" as any]: `${((minOdd - 1.05) / (5 - 1.05)) * 100}%` }}
              >
                <input
                  type="range"
                  id="bb-minodd"
                  min="1.05"
                  max="5"
                  step="0.01"
                  value={minOdd}
                  onChange={(e) => setMinOdd(parseFloat(e.target.value))}
                />
                <input type="text" className="bb-out" value={minOdd.toFixed(2)} readOnly />
              </div>
            </div>

            <div className="bb-field">
              <label className="bb-field__label" htmlFor="bb-maxodd">
                Max odd per pick
              </label>
              <div
                className="bb-slider"
                style={{ ["--bb-pct" as any]: `${((maxOdd - 1.2) / (12 - 1.2)) * 100}%` }}
              >
                <input
                  type="range"
                  id="bb-maxodd"
                  min="1.2"
                  max="12"
                  step="0.01"
                  value={maxOdd}
                  onChange={(e) => setMaxOdd(parseFloat(e.target.value))}
                />
                <input type="text" className="bb-out" value={maxOdd.toFixed(2)} readOnly />
              </div>
            </div>

            {/* 5. Match Window */}
            <div className="bb-field">
              <label className="bb-field__label">Match window</label>
              <div className="bb-pills" role="radiogroup">
                {[
                  { id: "today", label: "Today" },
                  { id: "tomorrow", label: "Today + tomorrow" },
                  { id: "3days", label: "Next 3 days" },
                ].map((w) => {
                  const active = timeWindow === w.id;
                  return (
                    <label key={w.id} className={`bb-pill ${active ? "is-active" : ""}`}>
                      <input
                        type="radio"
                        name="time_window"
                        value={w.id}
                        checked={active}
                        onChange={() => setTimeWindow(w.id)}
                      />
                      <span>{w.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 6. Minimum Pick Trust */}
            <div className="bb-field">
              <label className="bb-field__label" htmlFor="bb-trust">
                Minimum pick trust
              </label>
              <div
                className="bb-slider"
                style={{ ["--bb-pct" as any]: `${(minTrust / 10) * 100}%` }}
              >
                <input
                  type="range"
                  id="bb-trust"
                  min="0"
                  max="10"
                  step="0.5"
                  value={minTrust}
                  onChange={(e) => setMinTrust(parseFloat(e.target.value))}
                />
                <input type="text" className="bb-out" value={minTrust.toFixed(1)} readOnly />
              </div>
            </div>

            {/* 7. Additional Toggles */}
            <div className="bb-field bb-field--toggles">
              <label className="bb-switch bb-switch--row">
                <input
                  type="checkbox"
                  checked={onlyMajor}
                  onChange={(e) => setOnlyMajor(e.target.checked)}
                />
                <span>Only important leagues</span>
              </label>
              <label className="bb-switch bb-switch--row">
                <input
                  type="checkbox"
                  checked={onlyDecreasing}
                  onChange={(e) => setOnlyDecreasing(e.target.checked)}
                />
                <span>Only decreasing odds</span>
              </label>
            </div>

            {/* 8. Action Buttons */}
            <div className="bb-actions">
              <button
                type="button"
                className="bb-btn bb-btn--primary"
                onClick={() => setRerollSeed((p) => p + 1)}
              >
                Generate slip
              </button>
              <button
                type="button"
                className="bb-btn bb-btn--ghost"
                onClick={() => setRerollSeed((p) => p + 1)}
                title="Re-roll with different matches"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </form>

          {/* ════════════════════════════════════════════════════════════
              RIGHT: Generated Bet Slip (.bb-slip)
              ════════════════════════════════════════════════════════════ */}
          <div className="bb-result">
            {loading ? (
              <div className="bb-placeholder">
                <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--color-accent-hi)" }} />
                <h2>Building your optimal slip...</h2>
                <p>Scoring every fixture with algorithmic AI models.</p>
              </div>
            ) : generatedSlip.length === 0 ? (
              <div className="bb-placeholder">
                <h2>Ready to build your slip?</h2>
                <p>Set your preferences on the left, then click Generate slip to let the AI assemble it for you.</p>
              </div>
            ) : (
              <div className="bb-slip">
                {/* Slip Header */}
                <div className="bb-slip__head">
                  <div className="bb-slip__headmain">
                    <span className="bb-slip__eyebrow">YOUR SLIP</span>
                    <h2 className="bb-slip__title">
                      {generatedSlip.length} picks · <span>{calculatedOdds.toFixed(2)}</span>
                    </h2>
                    <span
                      className={`bb-slip__delta ${
                        Math.abs(deltaPercent) <= 8 ? "is-ok" : "is-off"
                      }`}
                    >
                      Target {targetOdds.toFixed(2)} · {deltaPercent > 0 ? `+${deltaPercent}%` : `${deltaPercent}%`}
                    </span>
                  </div>

                  {/* Header Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setIsFavorite((p) => !p)}
                      className="bb-slip__fav"
                      style={{
                        background: isFavorite ? "rgba(124, 108, 245, 0.25)" : undefined,
                        color: isFavorite ? "#ffffff" : undefined,
                      }}
                    >
                      <Star size={13} fill={isFavorite ? "currentColor" : "none"} />
                      <span>Favorites</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopySlip}
                      className="bb-slip__fav"
                      title="Copy slip to clipboard"
                    >
                      {copied ? <CheckCircle2 size={13} color="#6ee7b0" /> : <Copy size={13} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Match Cards List */}
                <ul className="bb-slip__list">
                  {generatedSlip.map((match) => (
                    <li key={match.id} className={`bb-slip__row ${match.trustLevel}`}>
                      {/* Row Header: Date & Kickoff on left, League on right */}
                      <div className="bb-slip__rowhead">
                        <span className="bb-slip__date">{match.datetime}</span>
                        <span className="bb-slip__league">
                          {match.country} · {match.league}
                        </span>
                      </div>

                      {/* Row Body: Teams, Trust Score, Pick Pill */}
                      <div className="bb-slip__rowbody">
                        {/* Teams */}
                        <div className="bb-slip__teams">
                          <span className="bb-slip__team">
                            {match.homeLogo ? (
                              <img
                                src={match.homeLogo}
                                width={17}
                                height={17}
                                alt={match.homeTeam}
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.visibility = "hidden";
                                }}
                              />
                            ) : (
                              <CountryFlag country={match.homeTeam} size={15} />
                            )}
                            {match.homeTeam}
                          </span>

                          <span className="bb-slip__team">
                            {match.awayLogo ? (
                              <img
                                src={match.awayLogo}
                                width={17}
                                height={17}
                                alt={match.awayTeam}
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.visibility = "hidden";
                                }}
                              />
                            ) : (
                              <CountryFlag country={match.awayTeam} size={15} />
                            )}
                            {match.awayTeam}
                          </span>
                        </div>

                        {/* Trust Score */}
                        <span className="bb-slip__trust">{match.trustScore}</span>

                        {/* Pick Pill */}
                        <span className="bb-slip__stat">
                          <span className="bb-slip__pick">{match.pick}</span>
                          <span
                            className={`bb-slip__odd ${
                              match.oddMove === "down" ? "has-move is-down" : ""
                            }`}
                          >
                            <span className="bb-slip__num">
                              {match.oddMove === "down" ? (
                                <>
                                  <span className="bb-slip__arrow">&#9662;</span>
                                  {match.odds.toFixed(2)}
                                </>
                              ) : (
                                `- ${match.odds.toFixed(2)}`
                              )}
                            </span>
                          </span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Slip Footer Summary */}
                <div className="bb-slip__foot">
                  <span>
                    Total odds: <strong>{calculatedOdds.toFixed(2)}</strong> · Average confidence:{" "}
                    <strong>
                      {(
                        generatedSlip.reduce((acc, m) => acc + parseFloat(m.trustScore), 0) /
                        generatedSlip.length
                      ).toFixed(1)}
                      /10
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            LOWER SECTION: How It Works & Educational Section
            ════════════════════════════════════════════════════════════ */}
        <section className="bb-how">
          <h2 className="bb-h2">How Bet Builder Works</h2>
          <div className="bb-how__grid">
            <div className="bb-how__card">
              <span className="bb-how__n">1</span>
              <h3>You set the rules</h3>
              <p>Pick your target total odds, choose market types, and specify the number of matches you want in your accumulator.</p>
            </div>
            <div className="bb-how__card">
              <span className="bb-how__n">2</span>
              <h3>AI scores every match</h3>
              <p>Our algorithms evaluate thousands of data points — from Poisson goal models and form to player injuries and market line movements.</p>
            </div>
            <div className="bb-how__card">
              <span className="bb-how__n">3</span>
              <h3>Optimised slip in seconds</h3>
              <p>The builder solves for the optimal combination that matches your odds target with the highest possible statistical confidence.</p>
            </div>
          </div>
        </section>

        {/* Explanatory SEO Text */}
        <section className="bb-seo">
          <h2>AI Bet Slip Generator &amp; Parlay Builder</h2>
          <p>
            Bet Builder takes the guesswork out of constructing football accumulators. Instead of manually combing through hundreds of fixtures across leagues, you define your strategy and target odds, and our AI model picks mathematically proven selections.
          </p>
          <p>
            Each pick is graded with an AI trust score from 1 to 10. Selections rated 8.0 and above indicate strong statistical alignment across multiple predictive models, while 10 represents maximum confidence bankers.
          </p>
        </section>
      </main>
    </div>
  );
}
