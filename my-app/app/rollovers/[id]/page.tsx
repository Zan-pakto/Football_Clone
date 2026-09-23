"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  Share2,
  RefreshCw,
  Zap,
  Info,
  Ticket,
  Image as ImageIcon,
  ZoomIn,
  X,
  ExternalLink,
} from "lucide-react";
import { Rollover } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RolloverDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [rollover, setRollover] = useState<Rollover | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedStepCodeId, setCopiedStepCodeId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        const res = await fetch(`/api/rollovers/${resolvedParams.id}`);
        const data = await res.json();
        if (data.success && data.rollover) {
          setRollover(data.rollover);
        }
      } catch (err) {
        console.error("Failed to fetch rollover details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [resolvedParams.id]);

  const handleCopyCode = (code: string, stepId?: string) => {
    navigator.clipboard.writeText(code);
    if (stepId) {
      setCopiedStepCodeId(stepId);
      setTimeout(() => setCopiedStepCodeId(null), 2200);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    }
  };

  const handleCopySlip = () => {
    if (!rollover) return;
    const stepsText = rollover.steps
      .map(
        (s) =>
          `Step ${s.stepNumber}: ${s.match} | Pick: ${s.prediction} (Odds: ${s.odds.toFixed(2)}) [${s.status}]`
      )
      .join("\n");

    const bookingText = rollover.bookingCode ? `\nBooking Code: ${rollover.bookingCode}` : "";
    const instructionsText = rollover.instructions ? `\nInstructions: ${rollover.instructions}` : "";

    const text = `[Jolloftips] ${rollover.name} (${rollover.type} Rollover)${bookingText}${instructionsText}\nStarting Amount: ₦${rollover.startingAmount.toLocaleString()} | Current Amount: ₦${rollover.currentAmount.toLocaleString()}\nPotential Return: ₦${(rollover.potentialReturn || rollover.currentAmount).toLocaleString()}\n\n${stepsText}\n\nPredictions and potential returns are not guaranteed.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--background)" }}>
        <Navbar />
        <div
          style={{
            maxWidth: 1000,
            margin: "80px auto",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            color: "var(--text-secondary)",
          }}
        >
          <RefreshCw size={28} className="animate-spin" color="var(--gold)" />
          <span>Loading rollover details...</span>
        </div>
      </div>
    );
  }

  if (!rollover) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--background)" }}>
        <Navbar />
        <div
          className="luxury-card"
          style={{
            maxWidth: 600,
            margin: "80px auto",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <AlertTriangle size={36} color="var(--gold)" style={{ margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 8px" }}>
            Rollover Plan Not Found
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
            This rollover plan may have concluded or is temporarily unpublished.
          </p>
          <Link href="/rollovers" className="gold-btn" style={{ padding: "10px 20px" }}>
            <ArrowLeft size={16} />
            <span>Return to All Rollovers</span>
          </Link>
        </div>
      </div>
    );
  }

  const wonCount = rollover.steps.filter((s) => s.status === "WON").length;
  const progressPercent = Math.min(100, Math.round((wonCount / rollover.targetSteps) * 100));

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar />

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px 80px" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 20 }}>
          <Link
            href="/rollovers"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Rollover Plans</span>
          </Link>
        </div>

        {/* ── Main Plan Header Card ── */}
        <div
          className="luxury-card"
          style={{
            padding: "28px",
            marginBottom: 28,
            border: "1px solid rgba(124, 108, 245, 0.35)",
            boxShadow: "0 10px 36px rgba(124, 108, 245, 0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h1
                  style={{
                    fontSize: "clamp(22px, 3.5vw, 32px)",
                    fontWeight: 900,
                    color: "var(--text-primary)",
                    margin: 0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {rollover.name}
                </h1>

                {/* Type Badge */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: rollover.type === "AI" ? "rgba(124, 108, 245, 0.22)" : "rgba(47, 208, 138, 0.18)",
                    color: rollover.type === "AI" ? "#8b7ff5" : "#2fd08a",
                    border: rollover.type === "AI" ? "1px solid rgba(124, 108, 245, 0.45)" : "1px solid rgba(47, 208, 138, 0.4)",
                  }}
                >
                  {rollover.type === "AI" ? <Sparkles size={12} /> : <ShieldCheck size={12} />}
                  <span>{rollover.type === "AI" ? "AI Rollover Plan" : "Manual Expert Plan"}</span>
                </span>

                {/* Status Badge */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    background:
                      rollover.status === "ACTIVE"
                        ? "rgba(232, 195, 74, 0.18)"
                        : rollover.status === "COMPLETED"
                        ? "rgba(47, 208, 138, 0.18)"
                        : rollover.status === "LOST"
                        ? "rgba(251, 113, 133, 0.18)"
                        : "rgba(120, 116, 164, 0.18)",
                    color:
                      rollover.status === "ACTIVE"
                        ? "#e8c34a"
                        : rollover.status === "COMPLETED"
                        ? "#2fd08a"
                        : rollover.status === "LOST"
                        ? "#fb7185"
                        : "var(--text-dim)",
                    border:
                      rollover.status === "ACTIVE"
                        ? "1px solid rgba(232, 195, 74, 0.4)"
                        : rollover.status === "COMPLETED"
                        ? "1px solid rgba(47, 208, 138, 0.4)"
                        : rollover.status === "LOST"
                        ? "1px solid rgba(251, 113, 133, 0.4)"
                        : "1px solid var(--border-color)",
                  }}
                >
                  {rollover.status === "ACTIVE" && "🟡 Active"}
                  {rollover.status === "COMPLETED" && "✅ Completed"}
                  {rollover.status === "LOST" && "❌ Lost"}
                  {rollover.status === "CANCELLED" && "⚪ Cancelled"}
                </span>
              </div>

              {rollover.description && (
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, maxWidth: 620 }}>
                  {rollover.description}
                </p>
              )}
            </div>

            <button
              onClick={handleCopySlip}
              className="gold-btn"
              style={{
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? "Copied to Clipboard!" : "Copy Rollover Slip"}</span>
            </button>
          </div>

          {/* Telemetry Metrics */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: "var(--surface-raised)",
                padding: "16px 20px",
                borderRadius: 12,
                border: "1px solid var(--border-color)",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>
                Starting Amount
              </span>
              <div className="num" style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", marginTop: 4 }}>
                ₦{rollover.startingAmount.toLocaleString()}
              </div>
            </div>

            <div
              style={{
                background: "rgba(124, 108, 245, 0.14)",
                padding: "16px 20px",
                borderRadius: 12,
                border: "1px solid rgba(124, 108, 245, 0.35)",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase" }}>
                Current Amount
              </span>
              <div className="num" style={{ fontSize: 24, fontWeight: 900, color: "var(--gold)", marginTop: 4 }}>
                ₦{rollover.currentAmount.toLocaleString()}
              </div>
            </div>

            <div
              style={{
                background: "var(--surface-raised)",
                padding: "16px 20px",
                borderRadius: 12,
                border: "1px solid var(--border-color)",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>
                Target Progress
              </span>
              <div className="num" style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", marginTop: 4 }}>
                {wonCount}/{rollover.targetSteps} Steps
              </div>
            </div>

            <div
              style={{
                background: "var(--surface-raised)",
                padding: "16px 20px",
                borderRadius: 12,
                border: "1px solid var(--border-color)",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2fd08a", textTransform: "uppercase" }}>
                Potential Return
              </span>
              <div className="num" style={{ fontSize: 24, fontWeight: 900, color: "#2fd08a", marginTop: 4 }}>
                ₦{(rollover.potentialReturn || rollover.currentAmount).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
            >
              <span>Progression Track</span>
              <span className="num">{progressPercent}% Achieved</span>
            </div>
            <div
              style={{
                width: "100%",
                height: 10,
                borderRadius: 999,
                background: "var(--surface-raised)",
                overflow: "hidden",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #8b7ff5 0%, #2fd08a 100%)",
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Booked Game Slip, Code & Instructions (If provided) ── */}
        {(rollover.bookingCode || rollover.instructions || rollover.imageUrl) && (
          <div
            className="luxury-card"
            style={{
              padding: "24px 28px",
              marginBottom: 32,
              background: "linear-gradient(145deg, rgba(27, 24, 61, 0.95) 0%, rgba(20, 18, 48, 0.95) 100%)",
              border: "1px solid rgba(232, 195, 74, 0.35)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "rgba(232, 195, 74, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--gold)",
                }}
              >
                <Ticket size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                  Booked Game Ticket & Bet Instructions
                </h2>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  Verified bet slip reference & recommended staking guidelines
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: rollover.imageUrl ? "repeat(auto-fit, minmax(300px, 1fr))" : "1fr", gap: 20 }}>
              {/* Left Column: Booking Code + Instructions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {rollover.bookingCode && (
                  <div
                    style={{
                      padding: "18px 20px",
                      borderRadius: 12,
                      background: "rgba(124, 108, 245, 0.08)",
                      border: "1px dashed rgba(232, 195, 74, 0.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 14,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Booking Code
                      </div>
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 900,
                          color: "var(--gold)",
                          fontFamily: "monospace",
                          letterSpacing: "0.08em",
                          marginTop: 4,
                        }}
                      >
                        {rollover.bookingCode}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                        Load this booking code directly in your betting app
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyCode(rollover.bookingCode!)}
                      className="gold-btn"
                      style={{
                        padding: "8px 18px",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copiedCode ? "Code Copied!" : "Copy Booking Code"}</span>
                    </button>
                  </div>
                )}

                {rollover.instructions && (
                  <div
                    style={{
                      padding: "16px 20px",
                      borderRadius: 12,
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.04em" }}>
                      Staking Instructions & Bookmaker Advice
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, lineHeight: 1.6, whiteSpace: "pre-line" }}>
                      {rollover.instructions}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Ticket Slip Image (If attached) */}
              {rollover.imageUrl && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Booked Game Ticket Slip
                  </div>
                  <div
                    onClick={() => setLightboxImage(rollover.imageUrl!)}
                    style={{
                      position: "relative",
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid rgba(232, 195, 74, 0.4)",
                      background: "#0a0915",
                      cursor: "pointer",
                      maxHeight: 280,
                    }}
                  >
                    <img
                      src={rollover.imageUrl}
                      alt="Booked Game Ticket Slip"
                      style={{
                        width: "100%",
                        height: "100%",
                        maxHeight: 280,
                        objectFit: "cover",
                        display: "block",
                        transition: "transform 0.2s ease",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 10,
                        right: 10,
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "rgba(0, 0, 0, 0.75)",
                        backdropFilter: "blur(6px)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#ffffff",
                        fontSize: 11,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <ZoomIn size={14} />
                      <span>Click to Enlarge Slip</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step-by-Step Progression Timeline ── */}
        <div style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "var(--text-primary)",
              marginBottom: 16,
              letterSpacing: "-0.01em",
            }}
          >
            Step-by-Step Selection Breakdown
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {rollover.steps.map((step) => {
              const isWon = step.status === "WON";
              const isActive = step.status === "ACTIVE";
              const isLost = step.status === "LOST";

              const stakeDisplay = step.stakeAmount || rollover.startingAmount;
              const returnDisplay =
                step.returnAmount || Math.round(stakeDisplay * (step.odds || 1.50));

              return (
                <div
                  key={step.id}
                  className="luxury-card"
                  style={{
                    padding: "18px 22px",
                    background: isActive
                      ? "rgba(124, 108, 245, 0.12)"
                      : isWon
                      ? "rgba(47, 208, 138, 0.05)"
                      : "var(--surface)",
                    border: isActive
                      ? "1px solid rgba(124, 108, 245, 0.45)"
                      : isWon
                      ? "1px solid rgba(47, 208, 138, 0.3)"
                      : "1px solid var(--border-color)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: isActive
                            ? "var(--gold)"
                            : isWon
                            ? "#2fd08a"
                            : isLost
                            ? "#fb7185"
                            : "var(--surface-raised)",
                          color: isActive || isWon || isLost ? "#ffffff" : "var(--text-dim)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 900,
                        }}
                      >
                        {step.stepNumber}
                      </span>

                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)" }}>
                          {step.match}
                        </div>
                        {step.matchDate && (
                          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                            {step.matchDate}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--gold)" }}>
                          {step.prediction}
                        </div>
                        <div className="num" style={{ fontSize: 12, color: "var(--text-dim)" }}>
                          Odds: {step.odds.toFixed(2)}
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 800,
                          background: isWon
                            ? "rgba(47, 208, 138, 0.18)"
                            : isActive
                            ? "rgba(232, 195, 74, 0.18)"
                            : isLost
                            ? "rgba(251, 113, 133, 0.18)"
                            : "rgba(120, 116, 164, 0.18)",
                          color: isWon
                            ? "#2fd08a"
                            : isActive
                            ? "#e8c34a"
                            : isLost
                            ? "#fb7185"
                            : "var(--text-dim)",
                          border: isWon
                            ? "1px solid rgba(47, 208, 138, 0.4)"
                            : isActive
                            ? "1px solid rgba(232, 195, 74, 0.4)"
                            : isLost
                            ? "1px solid rgba(251, 113, 133, 0.4)"
                            : "1px solid var(--border-color)",
                        }}
                      >
                        {isWon && "✅ Won"}
                        {isActive && "🟡 Active Match"}
                        {isLost && "❌ Lost"}
                        {!isWon && !isActive && !isLost && "⏳ Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Progressive Calculation Details */}
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "var(--text-dim)" }}>Step Formula:</span>
                      <span className="num" style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                        ₦{stakeDisplay.toLocaleString()} × {step.odds.toFixed(2)} = ₦{returnDisplay.toLocaleString()}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "var(--text-dim)" }}>Potential Step Return:</span>
                      <span className="num" style={{ fontWeight: 800, color: "#2fd08a" }}>
                        ₦{returnDisplay.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Step-specific Booking Code or Slip if provided */}
                  {(step.bookingCode || step.instructions || step.imageUrl) && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: "rgba(124, 108, 245, 0.08)",
                        border: "1px dashed rgba(232, 195, 74, 0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {step.imageUrl && (
                          <div
                            onClick={() => setLightboxImage(step.imageUrl!)}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 6,
                              overflow: "hidden",
                              cursor: "pointer",
                              border: "1px solid var(--gold)",
                              flexShrink: 0,
                            }}
                            title="Click to zoom step slip"
                          >
                            <img src={step.imageUrl} alt="Step slip" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        )}
                        <div>
                          {step.bookingCode && (
                            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--gold)", fontFamily: "monospace" }}>
                              Step Code: {step.bookingCode}
                            </div>
                          )}
                          {step.instructions && (
                            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                              {step.instructions}
                            </div>
                          )}
                        </div>
                      </div>

                      {step.bookingCode && (
                        <button
                          onClick={() => handleCopyCode(step.bookingCode!, step.id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            background: "rgba(232, 195, 74, 0.15)",
                            border: "1px solid rgba(232, 195, 74, 0.4)",
                            color: "var(--gold)",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {copiedStepCodeId === step.id ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedStepCodeId === step.id ? "Copied" : "Copy Code"}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Disclaimer Banner ── */}
        <div
          style={{
            padding: "16px 20px",
            borderRadius: 12,
            background: "var(--surface-raised)",
            border: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <Info size={18} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
              Responsible Staking Notice
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              Predictions and potential returns are not guaranteed. Staking across consecutive matches carries inherent variance. Bet sensibly and responsibly.
            </p>
          </div>
        </div>

        {/* ── Image Lightbox Modal ── */}
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              background: "rgba(0, 0, 0, 0.88)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative",
                maxWidth: "92vw",
                maxHeight: "90vh",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(232, 195, 74, 0.5)",
                background: "#000000",
              }}
            >
              <button
                onClick={() => setLightboxImage(null)}
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(0, 0, 0, 0.75)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "#ffffff",
                  fontSize: 18,
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                }}
              >
                <X size={18} />
              </button>
              <img
                src={lightboxImage}
                alt="Booked Game Ticket Slip Full View"
                style={{
                  maxWidth: "100%",
                  maxHeight: "85vh",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
