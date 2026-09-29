"use client";

import { useEffect } from "react";
import { X, HelpCircle, ShieldCheck, Sparkles, BookOpen } from "lucide-react";

interface BettingTipsExplainedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
        zIndex: 99999,
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
          background: "rgba(6, 4, 18, 0.78)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          animation: "bteFadeIn 0.2s ease-out",
        }}
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bte-title"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 680,
          maxHeight: "88vh",
          background: "var(--surface, #120f2d)",
          border: "1px solid rgba(124, 108, 245, 0.35)",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), 0 0 35px rgba(124, 108, 245, 0.2)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "bteScaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 100000,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid rgba(167, 159, 255, 0.12)",
            background: "linear-gradient(180deg, rgba(124, 108, 245, 0.08) 0%, transparent 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(124, 108, 245, 0.18)",
                border: "1px solid rgba(124, 108, 245, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#a79fff",
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <h2 id="bte-title" style={{ fontSize: 17, fontWeight: 800, color: "#FFFFFF", margin: 0, letterSpacing: "-0.01em" }}>
                Betting Tips Explained
              </h2>
              <p style={{ fontSize: 12, color: "var(--text-secondary, #9d98ca)", margin: 0, marginTop: 2 }}>
                Complete reference glossary for AI mathematical tips and betting markets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#a79fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {/* Section 1: 1X2 Match Result */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#a79fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Match Result (1X2)
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
              {[
                { sym: "1", title: "Home Team Wins", desc: "Home team secures victory in 90 minutes." },
                { sym: "X", title: "Draw (Tie)", desc: "Match ends with equal score in regular time." },
                { sym: "2", title: "Away Team Wins", desc: "Away team secures victory in 90 minutes." },
                { sym: "H1", title: "Home Handicap (-1)", desc: "Home team wins by at least 2 clear goals." },
                { sym: "H2", title: "Away Handicap (-1)", desc: "Away team wins by at least 2 clear goals." },
              ].map((item) => (
                <div key={item.sym} style={cardStyle}>
                  <span style={badgeStyle}>{item.sym}</span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#FFFFFF" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#8a85b9", marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Double Chance */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#a79fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Double Chance
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
              {[
                { sym: "1X", title: "Home Win or Draw", desc: "Home team wins OR match ends in a draw." },
                { sym: "X2", title: "Draw or Away Win", desc: "Away team wins OR match ends in a draw." },
                { sym: "12", title: "Home or Away Win", desc: "Either team wins. Bet loses only if a draw occurs." },
              ].map((item) => (
                <div key={item.sym} style={cardStyle}>
                  <span style={{ ...badgeStyle, color: "#2fd08a", borderColor: "rgba(47, 208, 138, 0.35)", background: "rgba(47, 208, 138, 0.12)" }}>
                    {item.sym}
                  </span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#FFFFFF" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#8a85b9", marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Both Teams To Score (BTTS) */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#a79fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Both Teams To Score (BTTS)
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
              {[
                { sym: "Yes", title: "BTTS Yes (GG)", desc: "Both teams score at least 1 goal (e.g. 1-1, 2-1, 1-2)." },
                { sym: "No", title: "BTTS No (NG)", desc: "At least one team fails to score (e.g. 1-0, 0-0, 0-2)." },
              ].map((item) => (
                <div key={item.sym} style={cardStyle}>
                  <span style={{ ...badgeStyle, color: "#ffb020", borderColor: "rgba(255, 176, 32, 0.35)", background: "rgba(255, 176, 32, 0.12)" }}>
                    {item.sym}
                  </span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#FFFFFF" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#8a85b9", marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Total Goals (Over / Under) */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#a79fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Total Goals (Over / Under)
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
              {[
                { sym: "O1.5", title: "Over 1.5 Goals", desc: "2 or more total goals scored in regular time." },
                { sym: "O2.5", title: "Over 2.5 Goals", desc: "3 or more total goals scored in regular time." },
                { sym: "O3.5", title: "Over 3.5 Goals", desc: "4 or more total goals scored in regular time." },
                { sym: "U1.5", title: "Under 1.5 Goals", desc: "Maximum 1 total goal scored (0-0 or 1-0)." },
                { sym: "U2.5", title: "Under 2.5 Goals", desc: "Maximum 2 total goals scored (e.g. 0-0, 1-0, 1-1, 2-0)." },
                { sym: "U3.5", title: "Under 3.5 Goals", desc: "Maximum 3 total goals scored in regular time." },
              ].map((item) => (
                <div key={item.sym} style={cardStyle}>
                  <span style={{ ...badgeStyle, color: item.sym.startsWith("O") ? "#00d2ff" : "#ff5d78", borderColor: item.sym.startsWith("O") ? "rgba(0, 210, 255, 0.35)" : "rgba(255, 93, 120, 0.35)", background: item.sym.startsWith("O") ? "rgba(0, 210, 255, 0.12)" : "rgba(255, 93, 120, 0.12)" }}>
                    {item.sym}
                  </span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#FFFFFF" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#8a85b9", marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Team Goals */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#a79fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Team Goals
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 8 }}>
              {[
                { sym: "HS", title: "Home Team Scores", desc: "Home team scores at least 1 goal in the match." },
                { sym: "AS", title: "Away Team Scores", desc: "Away team scores at least 1 goal in the match." },
                { sym: "HS2+", title: "Home Scores 2+ Goals", desc: "Home team scores 2 or more goals." },
                { sym: "AS2+", title: "Away Scores 2+ Goals", desc: "Away team scores 2 or more goals." },
              ].map((item) => (
                <div key={item.sym} style={cardStyle}>
                  <span style={{ ...badgeStyle, color: "#9c88ff", borderColor: "rgba(156, 136, 255, 0.35)", background: "rgba(156, 136, 255, 0.12)" }}>
                    {item.sym}
                  </span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#FFFFFF" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#8a85b9", marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: AI Trust Rating & Confidence */}
          <div
            style={{
              padding: "16px 18px",
              borderRadius: 14,
              background: "linear-gradient(135deg, rgba(124, 108, 245, 0.15) 0%, rgba(20, 16, 55, 0.7) 100%)",
              border: "1px solid rgba(124, 108, 245, 0.35)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={16} color="#ffb020" />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF" }}>
                AI Trust Rating & Confidence Scale
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#b3ade2", lineHeight: 1.6, margin: 0 }}>
              Predictions are generated by our quantitative model evaluating over 700 leagues worldwide.
              A rating of <strong>8.0 to 10.0</strong> represents highest statistical trust and positive expected value (+EV).
              The <strong>★ BEST TIP</strong> badge designates the highest confidence market choice for each fixture.
            </p>
          </div>
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
      `}</style>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 10,
  background: "rgba(25, 21, 60, 0.65)",
  border: "1px solid rgba(167, 159, 255, 0.1)",
};

const badgeStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono, monospace)",
  fontSize: 12,
  fontWeight: 800,
  color: "#a79fff",
  background: "rgba(124, 108, 245, 0.15)",
  border: "1px solid rgba(124, 108, 245, 0.35)",
  padding: "3px 8px",
  borderRadius: 6,
  flexShrink: 0,
  minWidth: 34,
  textAlign: "center",
};
