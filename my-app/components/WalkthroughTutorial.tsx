"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  TrendingUp,
  Ticket,
  Crown,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

interface Step {
  title: string;
  badge: string;
  badgeColor: string;
  icon: any;
  iconColor: string;
  description: string;
  bullets: string[];
  ctaLabel?: string;
  ctaHref?: string;
}

const TUTORIAL_STEPS: Step[] = [
  {
    title: "AI Football Predictions",
    badge: "STEP 1 of 5",
    badgeColor: "#8b7ff5",
    icon: Sparkles,
    iconColor: "#8b7ff5",
    description:
      "Explore algorithmic match forecasts across 700+ football leagues worldwide. Every fixture is scored with deep predictive models.",
    bullets: [
      "1X2 Winner, Over/Under Goals, and BTTS (Both Teams To Score) markets.",
      "Clear confidence rating on every pick (e.g. 8.5/10) showing predictive reliability.",
      "Hover over any prediction pill to view exact model trust percentage and bookmaker odds.",
    ],
    ctaLabel: "View All Matches",
    ctaHref: "/all-matches",
  },
  {
    title: "Smart AI Bet Builder",
    badge: "STEP 2 of 5",
    badgeColor: "#10b981",
    icon: Zap,
    iconColor: "#10b981",
    description:
      "Generate custom accumulator slips in seconds tailored to your desired odds and risk profile.",
    bullets: [
      "Set your target odds (1.5x up to 50x) and number of matches (2 to 10 picks).",
      "Filter by minimum trust score and decreasing odds movements.",
      "All selections are pre-validated to universal markets for 100% bookmaker compatibility.",
    ],
    ctaLabel: "Try Bet Builder",
    ctaHref: "/bet-builder",
  },
  {
    title: "Compounding Rollovers",
    badge: "STEP 3 of 5",
    badgeColor: "#f59e0b",
    icon: TrendingUp,
    iconColor: "#f59e0b",
    description:
      "Join disciplined compounding challenges curated by expert handicappers and automated AI strategies.",
    bullets: [
      "Turn ₦500 into ₦25,000+ by re-investing winnings over 5 to 7 low-risk steps.",
      "Each step includes admin staking instructions, expert notes, and slip screenshots.",
      "Track live progress and previous rollover winning streaks transparently.",
    ],
    ctaLabel: "View Rollovers",
    ctaHref: "/rollovers",
  },
  {
    title: "1-Click Betting Codes",
    badge: "STEP 4 of 5",
    badgeColor: "#38bdf8",
    icon: Ticket,
    iconColor: "#38bdf8",
    description:
      "Easily transfer your generated bet slips directly into SportyBet and Bet9ja without manually selecting games.",
    bullets: [
      "Tap 'Get Betting Code' on any slip to receive bookmaker-specific codes.",
      "1-Click 'Copy All Selections' lets you paste all match picks into bookmaker search with zero errors.",
      "Direct deep-link buttons open your bookmaker with the match ticket ready to place.",
    ],
    ctaLabel: "Generate Bet Codes",
    ctaHref: "/bet-builder",
  },
  {
    title: "VIP Pro Quantitative Edge",
    badge: "STEP 5 of 5",
    badgeColor: "#ffd700",
    icon: Crown,
    iconColor: "#ffd700",
    description:
      "Unlock high-value mathematical models designed for serious sports investors.",
    bullets: [
      "Poisson +EV Edge: Uncovers mathematical mispricings where model probability exceeds bookmaker odds.",
      "Monte Carlo Acca: Runs 10,000 simulations per accumulator to calculate true survivability.",
      "Unrestricted access to all locked PRO matches and high-confidence Banker picks.",
    ],
    ctaLabel: "Explore VIP Pro",
    ctaHref: "/pricing",
  },
];

export default function WalkthroughTutorial({
  forceOpen = false,
  onClose,
}: {
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }
    const hasSeen = localStorage.getItem("jt_walkthrough_seen");
    if (!hasSeen) {
      // Auto open for first-time visitors after short delay
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const handleClose = () => {
    localStorage.setItem("jt_walkthrough_seen", "true");
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(8, 6, 24, 0.85)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          background: "#161334",
          border: "1px solid rgba(139, 127, 245, 0.35)",
          borderRadius: 20,
          boxShadow: "0 25px 70px rgba(0, 0, 0, 0.75), 0 0 35px rgba(124, 108, 245, 0.2)",
          overflow: "hidden",
          position: "relative",
          animation: "scaleUp 0.25s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Progress Bar */}
        <div style={{ height: 4, background: "rgba(255, 255, 255, 0.08)", width: "100%" }}>
          <div
            style={{
              height: "100%",
              width: `${((currentStepIndex + 1) / TUTORIAL_STEPS.length) * 100}%`,
              background: "linear-gradient(90deg, #7c6cf5, #2fd08a)",
              transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>

        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 12px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 20,
              background: `${currentStep.badgeColor}22`,
              border: `1px solid ${currentStep.badgeColor}44`,
              color: currentStep.badgeColor,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            <HelpCircle size={13} />
            <span>{currentStep.badge}</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              cursor: "pointer",
            }}
            title="Skip tutorial"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "0 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: `${currentStep.iconColor}22`,
                border: `1px solid ${currentStep.iconColor}55`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: currentStep.iconColor,
                flexShrink: 0,
              }}
            >
              <StepIcon size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", margin: 0 }}>
                {currentStep.title}
              </h2>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: "3px 0 0" }}>
                Platform Guide & Tutorial
              </p>
            </div>
          </div>

          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#e2e8f0", marginBottom: 16 }}>
            {currentStep.description}
          </p>

          {/* Bullet Points */}
          <div
            style={{
              background: "rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 20,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {currentStep.bullets.map((bullet, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <CheckCircle2 size={16} color="#2fd08a" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 13, lineHeight: 1.5, color: "#cbd5e1" }}>
                  {bullet}
                </span>
              </div>
            ))}
          </div>

          {/* Navigation Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingTop: 8,
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Dots */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {TUTORIAL_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  style={{
                    width: idx === currentStepIndex ? 22 : 7,
                    height: 7,
                    borderRadius: 4,
                    background: idx === currentStepIndex ? "#7c6cf5" : "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  title={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#cbd5e1",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                style={{
                  padding: "9px 18px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #7c6cf5 0%, #6353e8 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 4px 14px rgba(124, 108, 245, 0.35)",
                }}
              >
                <span>{currentStepIndex === TUTORIAL_STEPS.length - 1 ? "Got It!" : "Next"}</span>
                {currentStepIndex < TUTORIAL_STEPS.length - 1 && <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

