"use client";

import { useEffect, useState } from "react";
import BrandMark from "@/components/BrandMark";

const INITIAL_TIPS = [
  "Calibrating quantitative prediction algorithms...",
  "Analyzing match odds & Poisson probabilities...",
  "Syncing live match statistics and form records...",
  "Loading high-confidence AI football intelligence...",
];

export default function InitialSiteLoader() {
  const [mounted, setMounted] = useState(false);
  const [shouldShow, setShouldShow] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    setMounted(true);

    // If already loaded in this session, don't show the initial splash loader again
    if (typeof window !== "undefined") {
      try {
        const hasLoaded = sessionStorage.getItem("jt_initial_site_loaded");
        if (hasLoaded) {
          setShouldShow(false);
          return;
        }
      } catch {
        // storage disabled fallback
      }
    }

    setTipIndex(Math.floor(Math.random() * INITIAL_TIPS.length));

    // Allow initial load to be appreciated and allow hydration to complete smoothly (~750ms)
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
      try {
        sessionStorage.setItem("jt_initial_site_loaded", "true");
      } catch {
        // ignore
      }
    }, 750);

    const removeTimer = setTimeout(() => {
      setShouldShow(false);
    }, 1100);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Before mounting on client, render the initial loader so there's no flash of unstyled content
  if (!shouldShow) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#080618",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        transition: "opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s ease",
        opacity: isFading ? 0 : 1,
        pointerEvents: isFading ? "none" : "all",
      }}
    >
      {/* Top Gradient Progress Bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "rgba(124, 108, 245, 0.2)",
          overflow: "hidden",
          zIndex: 10000000,
        }}
      >
        <div
          style={{
            height: "100%",
            width: "100%",
            background: "linear-gradient(90deg, #7c6cf5, #2fd08a, #7c6cf5)",
            boxShadow: "0 0 16px rgba(124, 108, 245, 0.8)",
            animation: "loaderProgressSlide 1.3s ease-in-out infinite",
          }}
        />
      </div>

      {/* Central Branded Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          padding: "36px 44px",
          background: "#110e2f",
          border: "1px solid rgba(124, 108, 245, 0.35)",
          borderRadius: 22,
          boxShadow: "0 28px 70px rgba(0,0,0,0.6), 0 0 35px rgba(124, 108, 245, 0.2)",
          textAlign: "center",
          width: "100%",
          maxWidth: 380,
          boxSizing: "border-box",
          margin: "0 20px",
          transform: isFading ? "scale(0.97)" : "scale(1)",
          transition: "transform 0.35s ease",
        }}
      >
        {/* Animated Brand Emblem */}
        <div
          style={{
            position: "relative",
            width: 58,
            height: 58,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Rotating Glowing Ring */}
          <div
            style={{
              position: "absolute",
              inset: -5,
              borderRadius: "50%",
              border: "2px solid transparent",
              borderTopColor: "#7c6cf5",
              borderRightColor: "rgba(47, 208, 138, 0.6)",
              animation: "spinSlow 1.2s linear infinite",
            }}
          />
          <BrandMark width={52} height={48} />
        </div>

        {/* Brand Text & Status Tips */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 16,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            <span>
              JOLLOF<span style={{ color: "#2fd08a" }}>TIPS</span>
            </span>
          </div>
          <p
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: "#a79fff",
              margin: 0,
              lineHeight: 1.5,
              minHeight: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {INITIAL_TIPS[tipIndex]}
          </p>
        </div>

        {/* Pulsing Dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[0, 0.18, 0.36].map((delay, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#2fd08a",
                boxShadow: "0 0 8px rgba(47, 208, 138, 0.6)",
                animation: `dotBounce 0.8s ease-in-out ${delay}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes loaderProgressSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
