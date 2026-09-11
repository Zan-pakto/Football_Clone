"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown, Sparkles, Activity } from "lucide-react";
import Link from "next/link";
import FootballAnimation from "./FootballAnimation";

interface HeroLandingProps {
  totalMatches?: number;
}

export default function HeroLanding({ totalMatches = 0 }: HeroLandingProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const visualizerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsRevealed(true);
        window.removeEventListener("scroll", handleScroll);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );

    window.addEventListener("scroll", handleScroll, { passive: true });
    if (visualizerRef.current) {
      observer.observe(visualizerRef.current);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToMatches = () => {
    const el = document.getElementById("matches-feed");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToVisualizer = () => {
    setIsRevealed(true);
    visualizerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "100px 16px 50px",
      overflow: "hidden",
      backgroundColor: "transparent",
    }}>
      {/* ── Background Ethereal Neon Glow ── */}
      <div style={{
        position: "absolute",
        top: "15%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "900px",
        height: "550px",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.22) 0%, rgba(14, 165, 233, 0.14) 40%, rgba(139, 92, 246, 0.06) 60%, transparent 75%)",
        filter: "blur(90px)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* ── Foreground Header Section (Crisp Typography & Buttons) ── */}
      <div style={{
        position: "relative",
        zIndex: 10,
        maxWidth: "760px",
        width: "100%",
        margin: "0 auto",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {/* Futuristic Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "999px",
          background: "rgba(99, 102, 241, 0.12)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          color: "#a5b4fc",
          fontSize: "12px",
          fontWeight: 700,
          marginBottom: "18px",
          letterSpacing: "0.02em",
          backdropFilter: "blur(8px)",
        }}>
          <Sparkles style={{ width: "13px", height: "13px", color: "#38bdf8" }} />
          <span>Next-Gen AI Match Analysis & Predictions</span>
        </div>

        {/* Main Title */}
        <h1 style={{
          color: "#ffffff",
          fontSize: "clamp(34px, 5.5vw, 62px)",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1.12,
          margin: "0 0 18px",
          textShadow: "0 4px 24px rgba(0,0,0,0.6)",
        }}>
          AI Football Predictions
        </h1>

        {/* Subtitle */}
        <p style={{
          color: "#94a3b8",
          fontSize: "clamp(14px, 1.6vw, 17px)",
          fontWeight: 400,
          lineHeight: 1.6,
          maxWidth: "640px",
          margin: "0 auto 28px",
          textShadow: "0 2px 10px rgba(0,0,0,0.5)",
        }}>
          JollofTips generates predictions with its own AI model for every football match played anywhere in the world — plus free daily tips.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}>
          {/* Primary Violet Button (See Free Predictions) */}
          <button
            onClick={scrollToMatches}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "13px 26px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 4px 20px rgba(112, 101, 240, 0.4)",
              cursor: "pointer",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 28px rgba(112, 101, 240, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(112, 101, 240, 0.4)";
            }}
          >
            <span>See Free Predictions</span>
            <ChevronDown style={{ width: "16px", height: "16px" }} />
          </button>

          {/* Secondary Outline Glass Button (All Matches) */}
          <Link
            href="/all-matches"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "13px 26px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.04)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              border: "1px solid rgba(255, 255, 255, 0.14)",
              textDecoration: "none",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
            }}
          >
            <span>All Matches</span>
          </Link>
        </div>

        {/* Scroll cue prompt */}
        <button
          onClick={scrollToVisualizer}
          style={{
            background: "transparent",
            border: "none",
            color: "#64748b",
            fontSize: "12px",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            marginBottom: "16px",
            opacity: isRevealed ? 0.4 : 0.85,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#94a3b8")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
        >
          <Activity style={{ width: "13px", height: "13px", color: "#38bdf8" }} />
          <span>Scroll to explore AI Simulation Model</span>
          <ChevronDown style={{ width: "14px", height: "14px", animation: "bounce 2s infinite" }} />
        </button>
      </div>

      {/* ── Interactive 3D Holographic Visualizer & Floating Cards Stage (Scroll Revealed) ── */}
      <div
        ref={visualizerRef}
        style={{
          position: "relative",
          zIndex: 5,
          width: "100%",
          maxWidth: "1080px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: isRevealed ? 1 : 0,
          transform: isRevealed ? "translateY(0px) scale(1)" : "translateY(40px) scale(0.95)",
          filter: isRevealed ? "blur(0px)" : "blur(8px)",
          transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), filter 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
          pointerEvents: isRevealed ? "auto" : "none",
        }}
      >
        <FootballAnimation />
      </div>

      {/* Bounce Keyframe */}
      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(4px); }
          60% { transform: translateY(2px); }
        }
      `}</style>
    </section>
  );
}


