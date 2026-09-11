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
        background: "var(--surface-overlay)",
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
          height: 3,
          background: "var(--border)",
          overflow: "hidden",
          zIndex: 1000000,
        }}
      >
        <div
          style={{
            height: "100%",
            width: "100%",
            background: "var(--gold-gradient)",
            boxShadow: "0 0 12px var(--gold-glow)",
            animation: "goldSlide 1.6s ease-in-out infinite",
          }}
        />
      </div>

      {/* Central card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          padding: "36px 44px",
          background: "var(--surface)",
          border: "1px solid var(--gold-border)",
          borderRadius: 20,
          boxShadow: "0 24px 60px rgba(0,0,0,0.15), 0 0 0 1px var(--gold-border)",
          textAlign: "center",
          maxWidth: 380,
          margin: "0 20px",
        }}
      >
        {/* Brand emblem */}
        <div
          style={{
            position: "relative",
            width: 54,
            height: 54,
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
              borderTopColor: "var(--gold)",
              borderRightColor: "var(--gold-border)",
              animation: "spinSlow 1.4s linear infinite",
            }}
          />
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "var(--gold-bg)",
              border: "1px solid var(--gold-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--gold)",
                fontWeight: 800,
                fontSize: 17,
                letterSpacing: "-0.5px",
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
            <Trophy style={{ width: 14, height: 14, color: "var(--gold)" }} />
            <span
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontFamily: "var(--font-sans)",
              }}
            >
              JOLLOF<span style={{ color: "var(--gold)" }}>TIPS</span>
            </span>
          </div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-secondary)",
              margin: 0,
              lineHeight: 1.5,
              fontFamily: "var(--font-sans)",
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
                background: "var(--gold)",
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
