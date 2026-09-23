"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  Zap,
  Ticket,
  Copy,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { Rollover, RolloverType, RolloverStatus } from "@/lib/types";

export default function RolloversPage() {
  const [activeTypeTab, setActiveTypeTab] = useState<"ALL" | RolloverType>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | RolloverStatus>("ALL");
  const [rollovers, setRollovers] = useState<Rollover[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Fetch published rollovers from API
  const fetchRollovers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rollovers");
      const data = await res.json();
      if (data.success && Array.isArray(data.rollovers)) {
        setRollovers(data.rollovers);
      }
    } catch (err) {
      console.error("Failed to load rollovers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRollovers();
  }, []);

  // Filter rollovers based on active tab and status
  const filteredRollovers = useMemo(() => {
    return rollovers.filter((r) => {
      const matchType = activeTypeTab === "ALL" || r.type === activeTypeTab;
      const matchStatus = selectedStatus === "ALL" || r.status === selectedStatus;
      return matchType && matchStatus;
    });
  }, [rollovers, activeTypeTab, selectedStatus]);

  // Counts for tab badges
  const aiCount = rollovers.filter((r) => r.type === "AI").length;
  const manualCount = rollovers.filter((r) => r.type === "MANUAL").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      <Navbar />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 80px" }}>
        {/* ── Page Header ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              background: "rgba(124, 108, 245, 0.15)",
              border: "1px solid rgba(124, 108, 245, 0.35)",
              color: "#8b7ff5",
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 12,
            }}
          >
            <TrendingUp size={14} />
            <span>Banker Progression Series</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(26px, 4vw, 38px)",
              fontWeight: 900,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
              margin: "0 0 10px",
            }}
          >
            Football <span className="gradient-text">Rollover Plans</span>
          </h1>

          <p
            style={{
              maxWidth: 640,
              margin: "0 auto",
              fontSize: 14,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}
          >
            Compound your initial stake across consecutive high-confidence selections.
            Follow automated AI-engineered strategies or human-curated expert team rollovers.
          </p>
        </div>

        {/* ── Primary Option Tabs (AI Rollover vs Manual Rollover) ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setActiveTypeTab("ALL")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: activeTypeTab === "ALL" ? "linear-gradient(135deg, #8b7ff5 0%, #6a5cf0 100%)" : "rgba(27, 24, 61, 0.7)",
              color: activeTypeTab === "ALL" ? "#ffffff" : "var(--text-secondary)",
              border: activeTypeTab === "ALL" ? "1px solid rgba(167, 159, 255, 0.4)" : "1px solid var(--border-color)",
              boxShadow: activeTypeTab === "ALL" ? "0 4px 20px rgba(124, 108, 245, 0.45)" : "none",
            }}
          >
            <Layers size={16} />
            <span>All Rollovers</span>
            <span
              style={{
                fontSize: 11,
                padding: "2px 7px",
                borderRadius: 999,
                background: "rgba(255, 255, 255, 0.18)",
                color: "#ffffff",
              }}
            >
              {rollovers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTypeTab("AI")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: activeTypeTab === "AI" ? "linear-gradient(135deg, #8b7ff5 0%, #6a5cf0 100%)" : "rgba(27, 24, 61, 0.7)",
              color: activeTypeTab === "AI" ? "#ffffff" : "var(--text-secondary)",
              border: activeTypeTab === "AI" ? "1px solid rgba(167, 159, 255, 0.4)" : "1px solid var(--border-color)",
              boxShadow: activeTypeTab === "AI" ? "0 4px 20px rgba(124, 108, 245, 0.45)" : "none",
            }}
          >
            <Sparkles size={16} />
            <span>1. AI Rollover</span>
            <span
              style={{
                fontSize: 11,
                padding: "2px 7px",
                borderRadius: 999,
                background: "rgba(255, 255, 255, 0.18)",
                color: "#ffffff",
              }}
            >
              {aiCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTypeTab("MANUAL")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: activeTypeTab === "MANUAL" ? "linear-gradient(135deg, #8b7ff5 0%, #6a5cf0 100%)" : "rgba(27, 24, 61, 0.7)",
              color: activeTypeTab === "MANUAL" ? "#ffffff" : "var(--text-secondary)",
              border: activeTypeTab === "MANUAL" ? "1px solid rgba(167, 159, 255, 0.4)" : "1px solid var(--border-color)",
              boxShadow: activeTypeTab === "MANUAL" ? "0 4px 20px rgba(124, 108, 245, 0.45)" : "none",
            }}
          >
            <ShieldCheck size={16} />
            <span>2. Manual Rollover</span>
            <span
              style={{
                fontSize: 11,
                padding: "2px 7px",
                borderRadius: 999,
                background: "rgba(255, 255, 255, 0.18)",
                color: "#ffffff",
              }}
            >
              {manualCount}
            </span>
          </button>
        </div>

        {/* ── Secondary Status Filter Pills ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          {(["ALL", "ACTIVE", "COMPLETED", "LOST"] as const).map((status) => {
            const isSelected = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: isSelected ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                  background: isSelected ? "rgba(124, 108, 245, 0.2)" : "transparent",
                  color: isSelected ? "var(--text-primary)" : "var(--text-dim)",
                  transition: "all 0.15s ease",
                }}
              >
                {status === "ALL" ? "All Statuses" : status}
              </button>
            );
          })}
        </div>

        {/* ── Content Area: Rollover Cards ── */}
        {loading ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "var(--text-secondary)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <RefreshCw size={28} className="animate-spin" color="var(--gold)" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Loading active rollover plans...</span>
          </div>
        ) : filteredRollovers.length === 0 ? (
          <div
            className="luxury-card"
            style={{
              padding: "48px 24px",
              textAlign: "center",
              maxWidth: 540,
              margin: "0 auto",
            }}
          >
            <AlertTriangle size={36} color="var(--gold)" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px" }}>
              No Rollovers Found
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              There are currently no rollovers matching your selected filter. Please adjust the filters or check back shortly.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {filteredRollovers.map((rollover) => {
              const wonStepsCount = rollover.steps.filter((s) => s.status === "WON").length;
              const progressPct = Math.min(100, Math.round((wonStepsCount / rollover.targetSteps) * 100));

              return (
                <div
                  key={rollover.id}
                  className="luxury-card"
                  style={{
                    padding: "24px",
                    overflow: "hidden",
                    border: rollover.status === "ACTIVE"
                      ? "1px solid rgba(124, 108, 245, 0.35)"
                      : "1px solid var(--border-color)",
                    boxShadow: rollover.status === "ACTIVE"
                      ? "0 8px 32px rgba(124, 108, 245, 0.12)"
                      : "none",
                  }}
                >
                  {/* Card Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                      paddingBottom: 16,
                      borderBottom: "1px solid var(--border-color)",
                      marginBottom: 18,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <h2
                          style={{
                            fontSize: 20,
                            fontWeight: 900,
                            color: "var(--text-primary)",
                            margin: 0,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {rollover.name}
                        </h2>

                        {/* Type Badge */}
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 10px",
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
                          <span>{rollover.type === "AI" ? "AI Rollover" : "Manual Rollover"}</span>
                        </span>

                        {/* Status Badge */}
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
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

                        {/* Booking Code Pill (with 1-click copy) */}
                        {rollover.bookingCode && (
                          <div
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigator.clipboard.writeText(rollover.bookingCode!);
                              setCopiedCodeId(rollover.id);
                              setTimeout(() => setCopiedCodeId(null), 2000);
                            }}
                            title="Click to copy booking code"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "3px 10px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 800,
                              fontFamily: "monospace",
                              letterSpacing: "0.04em",
                              background: "rgba(232, 195, 74, 0.15)",
                              color: "var(--gold)",
                              border: "1px solid rgba(232, 195, 74, 0.35)",
                              cursor: "pointer",
                            }}
                          >
                            <Ticket size={12} />
                            <span>{rollover.bookingCode}</span>
                            {copiedCodeId === rollover.id ? <Check size={12} /> : <Copy size={12} />}
                          </div>
                        )}

                        {/* Slip indicator badge */}
                        {rollover.imageUrl && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 800,
                              background: "rgba(124, 108, 245, 0.18)",
                              color: "#a79fff",
                              border: "1px solid rgba(124, 108, 245, 0.35)",
                            }}
                          >
                            <ImageIcon size={11} />
                            <span>Slip Attached</span>
                          </span>
                        )}
                      </div>

                      {rollover.description && (
                        <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "4px 0 0" }}>
                          {rollover.description}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/rollovers/${rollover.id}`}
                      className="gold-btn"
                      style={{
                        padding: "8px 16px",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      <span>View Full Plan</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>

                  {/* Key Financial Telemetry Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 14,
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        background: "var(--surface-raised)",
                        padding: "14px 16px",
                        borderRadius: 10,
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>
                        Starting Amount
                      </span>
                      <div className="num" style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", marginTop: 4 }}>
                        ₦{rollover.startingAmount.toLocaleString()}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(124, 108, 245, 0.12)",
                        padding: "14px 16px",
                        borderRadius: 10,
                        border: "1px solid rgba(124, 108, 245, 0.3)",
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase" }}>
                        Current Amount
                      </span>
                      <div className="num" style={{ fontSize: 20, fontWeight: 900, color: "var(--gold)", marginTop: 4 }}>
                        ₦{rollover.currentAmount.toLocaleString()}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "var(--surface-raised)",
                        padding: "14px 16px",
                        borderRadius: 10,
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>
                        Progress
                      </span>
                      <div className="num" style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", marginTop: 4 }}>
                        {wonStepsCount}/{rollover.targetSteps} Steps
                      </div>
                    </div>

                    <div
                      style={{
                        background: "var(--surface-raised)",
                        padding: "14px 16px",
                        borderRadius: 10,
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#2fd08a", textTransform: "uppercase" }}>
                        Potential Return
                      </span>
                      <div className="num" style={{ fontSize: 20, fontWeight: 900, color: "#2fd08a", marginTop: 4 }}>
                        ₦{(rollover.potentialReturn || rollover.currentAmount).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div style={{ marginBottom: 20 }}>
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
                      <span>Progression Pipeline</span>
                      <span className="num">{progressPct}% Complete</span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: 8,
                        borderRadius: 999,
                        background: "var(--surface-raised)",
                        overflow: "hidden",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      <div
                        style={{
                          width: `${progressPct}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #8b7ff5 0%, #2fd08a 100%)",
                          borderRadius: 999,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Step-by-Step Games List */}
                  <div>
                    <h4
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "var(--text-dim)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        margin: "0 0 12px",
                      }}
                    >
                      Individual Match Selections
                    </h4>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {rollover.steps.map((step, idx) => {
                        const isWon = step.status === "WON";
                        const isActive = step.status === "ACTIVE";
                        const isLost = step.status === "LOST";

                        return (
                          <div
                            key={step.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              borderRadius: 8,
                              background: isActive
                                ? "rgba(124, 108, 245, 0.12)"
                                : isWon
                                ? "rgba(47, 208, 138, 0.06)"
                                : "var(--surface-raised)",
                              border: isActive
                                ? "1px solid rgba(124, 108, 245, 0.4)"
                                : isWon
                                ? "1px solid rgba(47, 208, 138, 0.25)"
                                : "1px solid var(--border-color)",
                              flexWrap: "wrap",
                              gap: 10,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 900,
                                  padding: "3px 8px",
                                  borderRadius: 6,
                                  background: "var(--surface)",
                                  color: "var(--text-dim)",
                                  border: "1px solid var(--border-color)",
                                }}
                              >
                                Step {step.stepNumber}
                              </span>

                              <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
                                  {step.match}
                                </div>
                                {step.matchDate && (
                                  <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                                    {step.matchDate}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>
                                  {step.prediction}
                                </div>
                                <div className="num" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                                  Odds: {step.odds.toFixed(2)}
                                </div>
                              </div>

                              {/* Status Badge */}
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  background: isWon
                                    ? "rgba(47, 208, 138, 0.15)"
                                    : isActive
                                    ? "rgba(232, 195, 74, 0.15)"
                                    : isLost
                                    ? "rgba(251, 113, 133, 0.15)"
                                    : "rgba(120, 116, 164, 0.15)",
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
                                {isActive && "🟡 Active"}
                                {isLost && "❌ Lost"}
                                {!isWon && !isActive && !isLost && "⏳ Pending"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cumulative Progression Calculation Breakdown */}
                  <div
                    style={{
                      marginTop: 18,
                      padding: "12px 16px",
                      borderRadius: 8,
                      background: "rgba(10, 8, 29, 0.7)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Zap size={14} color="var(--gold)" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
                        Calculation Progression:
                      </span>
                      <span className="num" style={{ fontSize: 12, color: "var(--text-primary)" }}>
                        {rollover.steps
                          .filter((s) => s.status === "WON" || s.status === "ACTIVE")
                          .slice(0, 3)
                          .map((s) => `₦${(s.stakeAmount || rollover.startingAmount).toLocaleString()} × ${s.odds.toFixed(2)} = ₦${(s.returnAmount || Math.round((s.stakeAmount || rollover.startingAmount) * s.odds)).toLocaleString()}`)
                          .join(" → ")}
                      </span>
                    </div>

                    <Link
                      href={`/rollovers/${rollover.id}`}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--gold)",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span>Full step history</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Required Legal / Educational Disclaimer ── */}
        <div
          style={{
            marginTop: 40,
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
              Responsible Staking & Rollover Strategy Notice
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              Predictions and potential returns are not guaranteed. Rollovers are high-compounding series designed for entertainment and strategic analysis. Staking should always remain within responsible limits.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
