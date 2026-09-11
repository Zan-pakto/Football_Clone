import { Trophy } from "lucide-react";

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
        background: "rgba(9, 9, 15, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Top gold progress bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg, transparent 0%, #c9a84c 40%, #e2c475 60%, #c9a84c 80%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "goldSlide 1.6s ease-in-out infinite",
        }}
      />

      {/* Central card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          padding: "40px 48px",
          background: "rgba(15, 15, 26, 0.96)",
          border: "1px solid rgba(201, 168, 76, 0.18)",
          borderRadius: 18,
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,168,76,0.05)",
          textAlign: "center",
          maxWidth: 360,
          margin: "0 20px",
        }}
      >
        {/* Brand emblem */}
        <div
          style={{
            position: "relative",
            width: 60,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Rotating gold ring */}
          <div
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              border: "1.5px solid transparent",
              borderTopColor: "#c9a84c",
              borderRightColor: "rgba(201,168,76,0.3)",
              animation: "spinSlow 1.4s linear infinite",
            }}
          />
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#c9a84c",
                fontWeight: 800,
                fontSize: 20,
                letterSpacing: "-1px",
              }}
            >
              JT
            </span>
          </div>
        </div>

        {/* Brand text */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Trophy style={{ width: 13, height: 13, color: "#c9a84c" }} />
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#f5f3ee",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              JOLLOF<span style={{ color: "#c9a84c" }}>TIPS</span>
            </span>
          </div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: "#484858",
              margin: 0,
              lineHeight: 1.5,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Loading match intelligence...
          </p>
        </div>

        {/* Gold dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[0, 0.2, 0.4].map((delay) => (
            <div
              key={delay}
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#c9a84c",
                animation: `pulseDot 1.2s ease-in-out ${delay}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes goldSlide {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
