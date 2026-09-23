"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { Trophy, Check, X, Info, Sparkles, LogIn, RefreshCw, Award } from "lucide-react";
import Link from "next/link";
import CountryFlag from "@/components/CountryFlag";

interface HitAndWinMatch {
  index: number;
  id: string;
  time: string;
  dayLabel?: string;
  homeTeam: {
    name: string;
    logo?: string | null;
  };
  awayTeam: {
    name: string;
    logo?: string | null;
  };
  odds: {
    "1": string;
    "X": string;
    "2": string;
  };
  status?: string;
  finalScore?: string | null;
  outcome?: "1" | "X" | "2" | null;
}

interface SlipPick {
  matchId: string;
  index: number;
  homeTeam: string;
  awayTeam: string;
  time: string;
  pick: "1" | "X" | "2";
  odd: string;
  status: "PENDING" | "WON" | "LOST";
  score?: string | null;
}

interface HitAndWinSlip {
  id: string;
  userId: string;
  slipNumber: number;
  createdAt: string;
  status: "PENDING" | "WON" | "LOST";
  correctCount: number;
  totalMatches: number;
  picks: SlipPick[];
}

export default function HitAndWinPage() {
  const [activeTab, setActiveTab] = useState<"today" | "slips">("today");
  const [matches, setMatches] = useState<HitAndWinMatch[]>([]);
  const [picks, setPicks] = useState<Record<string, "1" | "X" | "2">>({});
  const [rulesOpen, setRulesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSlip, setSubmittedSlip] = useState<HitAndWinSlip | null>(null);
  const [userTier, setUserTier] = useState<"free" | "premium">("free");
  const [allowedSlips, setAllowedSlips] = useState(1);
  const [usedSlipsToday, setUsedSlipsToday] = useState(0);
  const [slips, setSlips] = useState<HitAndWinSlip[]>([]);
  const [user, setUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [expandedSlipId, setExpandedSlipId] = useState<string | null>(null);

  // Fetch Hit & Win data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch("/api/hitandwin", { headers });
      if (!res.ok) return;

      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.matches) && data.matches.length > 0) {
          setMatches(data.matches);
        }
        setUserTier(data.userTier || "free");
        setAllowedSlips(data.allowedSlips || 1);
        setUsedSlipsToday(data.usedSlipsToday || 0);
        setSlips(data.slips || []);
        setUser(data.user || null);
        if (data.slips && data.slips.length > 0) {
          setSubmittedSlip(data.slips[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load Hit&Win data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle pick selection
  const handleSelectPick = (matchId: string, pickVal: "1" | "X" | "2") => {
    setPicks((prev) => {
      const next = { ...prev };
      if (next[matchId] === pickVal) {
        delete next[matchId];
      } else {
        next[matchId] = pickVal;
      }
      return next;
    });
    setErrorMsg(null);
  };

  const handleReset = () => {
    setPicks({});
    setErrorMsg(null);
  };

  const pickedCount = Object.keys(picks).length;
  const isComplete = pickedCount === 10;
  const progressRatio = Math.min(1, pickedCount / 10);

  // Submit Slip
  const handleSubmit = async () => {
    if (!isComplete) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
    if (!token) {
      setLoginPromptOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await fetch("/api/hitandwin/slip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ picks }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedSlip(data.slip);
        setUsedSlipsToday(data.usedSlipsToday);
        setSlips((prev) => [data.slip, ...prev]);
        handleReset();
      } else {
        setErrorMsg(data.error || "Failed to submit prediction slip");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-ink)", color: "var(--color-heading)" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 18px 80px" }}>
        
        {/* ══════════════════════════════════════════════════════════
            1. HERO SECTION (Exact NerdyTips Design)
            ══════════════════════════════════════════════════════════ */}
        <section className="hw-hero">
          <div className="hw-hero__orb hw-hero__orb--a" />
          <div className="hw-hero__orb hw-hero__orb--b" />
          <div className="hw-hero__ring" />

          <div className="hw-hero__inner">
            {/* Left Content */}
            <div style={{ maxWidth: 580 }}>
              <div className="hw-eyebrow">
                <Sparkles size={13} />
                <span>HIT AND WIN</span>
              </div>

              <h1 className="hw-hero__title">
                Win a Lifetime Subscription
              </h1>

              <p className="hw-hero__lead">
                JollofTips provides a selection of 10 matches on the Hit&amp;Win section. Create an account and place your predictions. If you predict 10/10, you win a lifetime subscription.
              </p>

              {/* 3-Step Flow Diagram */}
              <ol className="hw-flow">
                <li className="hw-flow__step">
                  <span className="hw-flow__n">1</span>
                  <span className="hw-flow__t">Place your predictions</span>
                </li>
                <li className="hw-flow__step">
                  <span className="hw-flow__n">2</span>
                  <span className="hw-flow__t">Hit 10/10 matches</span>
                </li>
                <li className="hw-flow__step hw-flow__step--prize">
                  <span className="hw-flow__n">
                    <Trophy size={16} />
                  </span>
                  <span className="hw-flow__t">Win a Lifetime Subscription</span>
                </li>
              </ol>

              {/* Today Slips Allowance Chips */}
              <div className="hw-allow">
                <span className="hw-allow__lbl">TODAY · SLIPS</span>
                <ul className="hw-allow__list">
                  <li className={`hw-allow__t ${userTier === "free" ? "is-you" : ""}`}>
                    <span>Free</span> <b>1</b>
                  </li>
                  <li className="hw-allow__t">
                    <span>Basic</span> <b>2</b>
                  </li>
                  <li className="hw-allow__t">
                    <span>Standard</span> <b>3</b>
                  </li>
                  <li className={`hw-allow__t ${userTier === "premium" ? "is-you" : ""}`}>
                    <span>PRO</span> <b>4</b>
                  </li>
                  <li className="hw-allow__t">
                    <span>Club Member</span> <b>4</b>
                  </li>
                </ul>
              </div>

              {/* View Rules Action */}
              <div className="hw-meta">
                <button
                  type="button"
                  className="hw-chip--btn"
                  onClick={() => setRulesOpen(true)}
                >
                  <Info size={14} />
                  <span>View rules</span>
                </button>
              </div>
            </div>

            {/* Right Glowing Prize Badge */}
            <div className="hw-prize">
              <div className="hw-prize__ring" />
              <div className="hw-prize__ic">
                <Trophy size={46} />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            2. SEGMENTED SWITCHER (Today vs Slips)
            ══════════════════════════════════════════════════════════ */}
        <div className="hw-seg" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "today"}
            className={`hw-seg__btn ${activeTab === "today" ? "is-active" : ""}`}
            onClick={() => setActiveTab("today")}
          >
            Today
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "slips"}
            className={`hw-seg__btn ${activeTab === "slips" ? "is-active" : ""}`}
            onClick={() => setActiveTab("slips")}
          >
            Slips {slips.length > 0 ? `(${slips.length})` : ""}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
            3. TAB CONTENT
            ══════════════════════════════════════════════════════════ */}
        {activeTab === "today" ? (
          <div className="hw-layout">
            
            {/* ── LEFT: 10 MATCH CARDS BOARD ── */}
            <div className="hw-board">
              {/* Table Header */}
              <div className="hw-board__head">
                <span className="h-no">#</span>
                <span className="h-time">HOUR</span>
                <span className="h-match">MATCHES</span>
                <span className="h-picks">
                  <span>1</span>
                  <span>X</span>
                  <span>2</span>
                </span>
              </div>

              {/* Match Rows */}
              {loading ? (
                <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--color-muted)" }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px", color: "var(--color-accent-hi)" }} />
                  <p style={{ fontSize: 13.5 }}>Loading Hit&amp;Win featured matches...</p>
                </div>
              ) : matches.length === 0 ? (
                <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--color-muted)" }}>
                  <p style={{ fontSize: 14, color: "var(--color-heading)", fontWeight: 700 }}>No active Hit&amp;Win matches at this moment.</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>Check back shortly for today&apos;s new coupon!</p>
                </div>
              ) : (
                matches.map((m) => {
                  const currentPick = picks[m.id];
                  return (
                    <div key={m.id} className="hw-match">
                      {/* Match Number */}
                      <span className="hw-match__no">{m.index}</span>

                      {/* Match Time + Optional Day */}
                      <div className="hw-match__time">
                        {m.time}
                        {m.dayLabel && <span className="hw-match__day">{m.dayLabel}</span>}
                      </div>

                      {/* Home & Away Teams */}
                      <div className="hw-match__teams">
                        <div className="hw-team">
                          {m.homeTeam.logo ? (
                            <img src={m.homeTeam.logo} alt={m.homeTeam.name} loading="lazy" />
                          ) : (
                            <CountryFlag country={m.homeTeam.name} size={18} />
                          )}
                          <span>{m.homeTeam.name}</span>
                        </div>
                        <div className="hw-team">
                          {m.awayTeam.logo ? (
                            <img src={m.awayTeam.logo} alt={m.awayTeam.name} loading="lazy" />
                          ) : (
                            <CountryFlag country={m.awayTeam.name} size={18} />
                          )}
                          <span>{m.awayTeam.name}</span>
                        </div>
                      </div>

                      {/* 1 / X / 2 Pick Radio Capsules */}
                      <div className="hw-picks" role="radiogroup">
                        {(["1", "X", "2"] as const).map((pickKey) => {
                          const isSelected = currentPick === pickKey;
                          const oddVal = m.odds[pickKey] || "--";
                          return (
                            <div
                              key={pickKey}
                              role="radio"
                              aria-checked={isSelected}
                              className={`hw-pick ${isSelected ? "is-picked" : ""}`}
                              onClick={() => handleSelectPick(m.id, pickKey)}
                            >
                              <span className="hw-pick__k">{pickKey}</span>
                              <span className="hw-pick__o">{oddVal}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── RIGHT: STICKY SLIP BUILDER ── */}
            <aside className="hw-aside">
              <div className="hw-slipcard">
                {/* Header with counter */}
                <div className="hw-slipcard__head">
                  <h2 className="hw-slipcard__title">Slips · Today</h2>
                  <span className="hw-countpill">
                    <b>{pickedCount}</b>/10
                  </span>
                </div>

                <div className="hw-slipcard__body">
                  {/* Animated Progress Bar */}
                  <div className="hw-progress">
                    <span
                      className="hw-progress__fill"
                      style={{ width: `${progressRatio * 100}%` }}
                    />
                  </div>

                  <p className="hw-slipcard__hint">
                    Place your predictions · 1 / X / 2
                  </p>

                  {/* Error Notification */}
                  {errorMsg && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "rgba(251, 113, 133, 0.12)",
                        border: "1px solid rgba(251, 113, 133, 0.3)",
                        color: "var(--color-lost)",
                        fontSize: 12,
                        lineHeight: 1.4,
                      }}
                    >
                      {errorMsg}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="hw-slipcard__btns">
                    <button
                      type="button"
                      className="hw-btn hw-btn--ghost"
                      onClick={handleReset}
                      disabled={pickedCount === 0 || submitting}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className="hw-btn hw-btn--primary"
                      onClick={handleSubmit}
                      disabled={!isComplete || submitting}
                    >
                      {submitting ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit</span>
                      )}
                    </button>
                  </div>

                  {/* Submission Success State */}
                  {submittedSlip && (
                    <div className="hw-done">
                      <span className="hw-done__ic">
                        <Check size={18} strokeWidth={2.8} />
                      </span>
                      <b className="hw-done__t">Slip placed successfully!</b>
                      <p className="hw-done__d">
                        {usedSlipsToday} of {allowedSlips} slips used today
                      </p>
                      <p className="hw-done__next">
                        Check your picks anytime in the{" "}
                        <button
                          type="button"
                          onClick={() => setActiveTab("slips")}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--color-lavender)",
                            fontWeight: 700,
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          Slips tab
                        </button>
                      </p>
                    </div>
                  )}

                  {/* Legal Terms Disclaimer */}
                  <p className="hw-agree">
                    By submitting your slip, you agree to our{" "}
                    <Link href="/terms">Terms and Conditions</Link>.
                  </p>

                  {/* Prize Info Card */}
                  <div className="hw-slipcard__prize">
                    <Trophy />
                    <div>
                      <b>Win a Lifetime Subscription</b>
                      <span>Hit 10/10 matches</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════
              4. SLIPS TAB PANEL
              ══════════════════════════════════════════════════════════ */
          <div>
            {!user ? (
              <div className="hw-empty">
                <p style={{ marginBottom: 4, fontWeight: 700, fontSize: 16, color: "var(--color-heading)" }}>
                  To access slips please login first.
                </p>
                <p style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 18 }}>
                  Create an account or sign in to verify your submitted slips and track results.
                </p>
                <Link href="/login" className="hw-empty__cta">
                  <LogIn size={15} style={{ marginRight: 8, display: "inline-block" }} />
                  Log In
                </Link>
              </div>
            ) : slips.length === 0 ? (
              <div className="hw-empty">
                <Award size={36} style={{ margin: "0 auto 12px", color: "var(--color-accent-hi)", opacity: 0.8 }} />
                <p style={{ fontWeight: 700, fontSize: 16, color: "var(--color-heading)", marginBottom: 4 }}>
                  You haven&apos;t placed any slips yet.
                </p>
                <p style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 18 }}>
                  Predict today&apos;s 10 matches to participate and win a Lifetime Subscription!
                </p>
                <button
                  type="button"
                  className="hw-empty__cta"
                  onClick={() => setActiveTab("today")}
                >
                  Place Today&apos;s Predictions
                </button>
              </div>
            ) : (
              <div className="hw-slips">
                {slips.map((slip) => {
                  const isExpanded = expandedSlipId === slip.id;
                  const isWon = slip.status === "WON";
                  const isLost = slip.status === "LOST";

                  return (
                    <div
                      key={slip.id}
                      className={`hw-slip ${isWon ? "is-w" : isLost ? "is-l" : ""}`}
                    >
                      <div
                        className="hw-slip__head"
                        onClick={() => setExpandedSlipId(isExpanded ? null : slip.id)}
                      >
                        <span className="hw-slip__id">
                          Slip #{slip.slipNumber || 1}
                        </span>
                        <span className="hw-slip__date">
                          {new Date(slip.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>

                        {/* 10 Outcome Status Dots */}
                        <div className="hw-dots">
                          {slip.picks.map((p, pIdx) => (
                            <span
                              key={pIdx}
                              className={`hw-dot ${
                                p.status === "WON" ? "is-w" : p.status === "LOST" ? "is-l" : ""
                              }`}
                            />
                          ))}
                        </div>

                        {/* Hits Counter */}
                        <span className="hw-slip__hits">
                          {slip.correctCount}
                          <small>/10</small>
                        </span>

                        {/* Badge */}
                        <span
                          className="hw-badge"
                          style={{
                            background: isWon
                              ? "rgba(47, 208, 138, 0.2)"
                              : isLost
                              ? "rgba(251, 113, 133, 0.2)"
                              : "rgba(224, 167, 95, 0.2)",
                            color: isWon
                              ? "var(--color-won)"
                              : isLost
                              ? "var(--color-lost)"
                              : "var(--color-draw)",
                            border: `1px solid ${
                              isWon
                                ? "rgba(47, 208, 138, 0.4)"
                                : isLost
                                ? "rgba(251, 113, 133, 0.4)"
                                : "rgba(224, 167, 95, 0.4)"
                            }`,
                          }}
                        >
                          {slip.status}
                        </span>
                      </div>

                      {/* Expandable Match Details */}
                      {isExpanded && (
                        <div
                          style={{
                            padding: "12px 18px 16px",
                            borderTop: "1px solid rgba(167, 159, 255, 0.1)",
                            background: "rgba(0, 0, 0, 0.2)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          {slip.picks.map((p, pIdx) => (
                            <div
                              key={pIdx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontSize: 12.5,
                                padding: "6px 0",
                                borderBottom:
                                  pIdx === slip.picks.length - 1
                                    ? "none"
                                    : "1px solid rgba(167, 159, 255, 0.06)",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ color: "var(--color-muted)", fontSize: 11, width: 16 }}>
                                  #{p.index}
                                </span>
                                <span style={{ fontWeight: 600, color: "var(--color-heading)" }}>
                                  {p.homeTeam} vs {p.awayTeam}
                                </span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: 6,
                                    background: "rgba(124, 108, 245, 0.2)",
                                    color: "#fff",
                                    fontWeight: 800,
                                    fontSize: 11,
                                    fontFamily: "var(--font-mono)",
                                  }}
                                >
                                  Pick: {p.pick} ({p.odd})
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color:
                                      p.status === "WON"
                                        ? "var(--color-won)"
                                        : p.status === "LOST"
                                        ? "var(--color-lost)"
                                        : "var(--color-muted)",
                                  }}
                                >
                                  {p.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════════
          5. HIT & WIN RULES MODAL (Exact NerdyTips Specification)
          ══════════════════════════════════════════════════════════ */}
      {rulesOpen && (
        <div className="hw-modal" style={{ display: "flex" }}>
          <div
            className="hw-modal__backdrop"
            onClick={() => setRulesOpen(false)}
          />
          <div className="hw-modal__card" role="dialog" aria-modal="true">
            <button
              type="button"
              className="hw-modal__close"
              onClick={() => setRulesOpen(false)}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="hw-modal__ic">
              <Trophy size={26} />
            </div>

            <h2 className="hw-modal__title">Hit&amp;Win Rules</h2>

            <ol className="hw-rules">
              <li>Create an account and log in.</li>
              <li>Each day, you will find a selection of 10 matches.</li>
              <li>Predict every match with 1, X or 2.</li>
              <li>After you have selected the tips for all 10 matches, click the &apos;Submit&apos; button.</li>
              <li>Your slip has been generated and can be verified in the &apos;Slips&apos; section.</li>
              <li>You can submit one slip every day (PRO accounts get up to 4 slips daily).</li>
              <li>If you predicted right all 10 matches from the slip, you win a Lifetime Subscription.</li>
              <li>Good luck!</li>
            </ol>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          6. LOGIN PROMPT MODAL (When Unauthenticated User Submits)
          ══════════════════════════════════════════════════════════ */}
      {loginPromptOpen && (
        <div className="hw-modal" style={{ display: "flex" }}>
          <div
            className="hw-modal__backdrop"
            onClick={() => setLoginPromptOpen(false)}
          />
          <div className="hw-modal__card" role="dialog" aria-modal="true" style={{ maxWidth: 400 }}>
            <button
              type="button"
              className="hw-modal__close"
              onClick={() => setLoginPromptOpen(false)}
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div
              className="hw-modal__ic"
              style={{
                color: "var(--color-accent-hi)",
                background: "rgba(124, 108, 245, 0.16)",
                borderColor: "rgba(124, 108, 245, 0.4)",
              }}
            >
              <LogIn size={24} />
            </div>

            <h2 className="hw-modal__title" style={{ fontSize: 19 }}>
              Log in to Save Your Slip
            </h2>

            <p style={{ fontSize: 13, color: "var(--color-body)", lineHeight: 1.5, marginBottom: 20 }}>
              You need an active account so we can timestamp your 10 picks and grant you the Lifetime Subscription when you hit 10/10!
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="hw-btn hw-btn--ghost"
                onClick={() => setLoginPromptOpen(false)}
              >
                Cancel
              </button>
              <Link
                href="/login?redirect=/hitandwin"
                className="hw-btn hw-btn--primary"
                style={{ textDecoration: "none" }}
              >
                Log In / Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
