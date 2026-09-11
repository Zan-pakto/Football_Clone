import { Sparkles } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(6, 8, 20, 0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      {/* Top Rainbow Progress Bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "linear-gradient(90deg, #f97316 0%, #a855f7 50%, #38bdf8 100%)",
          boxShadow: "0 0 16px rgba(168, 85, 247, 0.9), 0 0 8px rgba(56, 189, 248, 0.8)",
          animation: "shimmer 1.5s infinite linear",
        }}
      />

      {/* Central Glass Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          padding: "36px 44px",
          background: "linear-gradient(135deg, rgba(20, 25, 58, 0.95) 0%, rgba(12, 16, 40, 0.98) 100%)",
          border: "1px solid rgba(168, 85, 247, 0.35)",
          borderRadius: 22,
          boxShadow: "0 24px 60px rgba(0,0,0,0.8), 0 0 35px rgba(139, 92, 246, 0.25)",
          textAlign: "center",
          maxWidth: 420,
          margin: "0 20px",
        }}
      >
        {/* Animated Brand Emblem */}
        <div style={{ position: "relative", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              position: "absolute",
              inset: -8,
              borderRadius: "50%",
              background: "conic-gradient(from 0deg, #f97316, #a855f7, #38bdf8, #f97316)",
              animation: "spinSlow 1.8s linear infinite",
              filter: "blur(6px)",
              opacity: 0.7,
            }}
          />
          <div
            style={{
              position: "relative",
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(249, 115, 22, 0.5)",
              transform: "skew(-4deg)",
            }}
          >
            <span
              style={{
                color: "#ffffff",
                fontWeight: 900,
                fontSize: 22,
                fontStyle: "italic",
                transform: "skew(4deg)",
                letterSpacing: "-1px",
              }}
            >
              JT
            </span>
          </div>
        </div>

        {/* Brand Text & Status */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
            <Sparkles style={{ width: 15, height: 15, color: "#c084fc" }} />
            <span style={{ fontSize: 16, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.01em" }}>
              Jollof<span style={{ color: "#a855f7" }}>Tips</span> AI
            </span>
          </div>
          <p
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "#94a3b8",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Loading match intelligence & predictions...
          </p>
        </div>

        {/* Pulse Loading Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316" }} />
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#a855f7" }} />
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#38bdf8" }} />
        </div>
      </div>
    </div>
  );
}
