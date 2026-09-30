"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface BettingTipsExplainedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TipItem {
  code: string;
  label: string;
}

interface TipSection {
  title: string;
  items: TipItem[];
}

const TIP_SECTIONS: TipSection[] = [
  {
    title: "MATCH RESULT (1X2)",
    items: [
      { code: "1", label: "Home Team Wins" },
      { code: "X", label: "Draw" },
      { code: "2", label: "Away Team Wins" },
      { code: "H1", label: "Home wins by at least 2 goals" },
      { code: "H2", label: "Away wins by at least 2 goals" },
    ],
  },
  {
    title: "DOUBLE CHANCE",
    items: [
      { code: "1X", label: "Home Team Wins or Draw" },
      { code: "X2", label: "Away Team Wins or Draw" },
    ],
  },
  {
    title: "BOTH TEAMS TO SCORE",
    items: [
      { code: "BTTS", label: "Both Teams Will Score" },
      { code: "No BTTS", label: "At least one team won't score" },
    ],
  },
  {
    title: "TOTAL GOALS",
    items: [
      { code: "O1.5", label: "At least 2 goals scored" },
      { code: "O2.5", label: "At least 3 goals scored" },
      { code: "O3.5", label: "At least 4 goals scored" },
      { code: "U1.5", label: "Maximum 1 total goals" },
      { code: "U2.5", label: "Maximum 2 total goals" },
      { code: "U3.5", label: "Maximum 3 total goals" },
    ],
  },
  {
    title: "TEAM GOALS",
    items: [
      { code: "HS", label: "Home team scores" },
      { code: "AS", label: "Away team scores" },
      { code: "HS2+", label: "Home team will score ≥2 goals" },
      { code: "AS2+", label: "Away team will score ≥2 goals" },
    ],
  },
];

export default function BettingTipsExplainedModal({ isOpen, onClose }: BettingTipsExplainedModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5, 3, 15, 0.78)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          animation: "bteFadeIn 0.18s ease-out",
        }}
      />

      {/* Modal Dialog Box matching provided design */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bte-dialog-title"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 460,
          maxHeight: "88vh",
          background: "#0c0a24",
          border: "1px solid rgba(124, 108, 245, 0.28)",
          borderRadius: 18,
          boxShadow: "0 25px 65px rgba(0, 0, 0, 0.65), 0 0 30px rgba(124, 108, 245, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "bteScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 1000000,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 22px 16px",
            background: "#0c0a24",
            borderBottom: "1px solid rgba(124, 108, 245, 0.12)",
          }}
        >
          <h2
            id="bte-dialog-title"
            style={{
              fontSize: 19,
              fontWeight: 800,
              color: "#ffffff",
              margin: 0,
              letterSpacing: "-0.01em",
              fontFamily: "var(--font-sans, system-ui, sans-serif)",
            }}
          >
            Betting Tips Explained
          </h2>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#9d98ca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#9d98ca";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Glossary Content */}
        <div
          className="bte-scroll"
          style={{
            padding: "18px 22px 26px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {TIP_SECTIONS.map((section) => (
            <div key={section.title}>
              {/* Section Header with Line */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#8b85be",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {section.title}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: "rgba(124, 108, 245, 0.18)",
                  }}
                />
              </div>

              {/* Items in Section */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {section.items.map((item) => (
                  <div
                    key={item.code}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    {/* Badge Pill */}
                    <div
                      style={{
                        width: 72,
                        minWidth: 72,
                        height: 32,
                        borderRadius: 8,
                        background: "#1c183d",
                        border: "1px solid rgba(124, 108, 245, 0.28)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#a5b4fc",
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: "0.02em",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
                        flexShrink: 0,
                      }}
                    >
                      {item.code}
                    </div>

                    {/* Description Text */}
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#d8d4ee",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes bteFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bteScaleUp {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .bte-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .bte-scroll::-webkit-scrollbar-track {
          background: rgba(12, 10, 36, 0.5);
        }
        .bte-scroll::-webkit-scrollbar-thumb {
          background: rgba(124, 108, 245, 0.35);
          border-radius: 999px;
        }
        .bte-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 108, 245, 0.55);
        }
      `}</style>
    </div>
  );
}
