"use client";

import React, { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Filter, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function HowItWorks() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section 
      id="how-it-works" 
      className="scroll-mt-20"
      style={{
        position: "relative",
        padding: "80px 16px 100px",
        background: "radial-gradient(ellipse at 50% 30%, rgba(99, 102, 241, 0.08) 0%, rgba(15, 18, 38, 0.6) 50%, transparent 80%)",
        overflow: "hidden",
      }}
    >
      {/* Anchor alias for navbar /#story links */}
      <span id="story" style={{ position: "absolute", top: -80, left: 0 }} />

      {/* Embedded High-Performance CSS Animations for moving arrows and signals */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flowDashLeftToRight {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes moveParticleHorizontal {
          0% {
            transform: translateX(0px);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateX(65px);
            opacity: 0;
          }
        }

        @keyframes moveArrowThroughFunnel {
          0% {
            transform: translateX(-18px);
            opacity: 0;
          }
          30% {
            opacity: 0.9;
          }
          70% {
            opacity: 0.9;
          }
          100% {
            transform: translateX(38px);
            opacity: 0;
          }
        }

        @keyframes pulseGlowRing {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }

        @keyframes neuralNodePulse1 {
          0%, 100% { fill: #6366f1; r: 4; }
          25% { fill: #a5b4fc; r: 5.5; }
        }

        @keyframes neuralNodePulse2 {
          0%, 100% { fill: #818cf8; r: 4.5; }
          50% { fill: #c084fc; r: 6.5; }
        }

        @keyframes neuralNodePulse3 {
          0%, 100% { fill: #818cf8; r: 5; }
          75% { fill: #34d399; r: 7; }
        }

        @keyframes outputSuccessPulse {
          0%, 100% {
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 22px rgba(16, 185, 129, 0.85);
            transform: scale(1.08);
          }
        }

        @keyframes arrowBounceRight {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(4px);
          }
        }

        .animated-stream-line {
          stroke-dasharray: 4, 4;
          animation: flowDashLeftToRight 0.9s linear infinite;
        }

        .animated-stream-line-delayed {
          stroke-dasharray: 4, 4;
          animation: flowDashLeftToRight 1.2s linear infinite;
        }

        .animated-synapse {
          stroke-dasharray: 3, 3;
          animation: flowDashLeftToRight 0.8s linear infinite;
        }

        .animated-synapse-fast {
          stroke-dasharray: 3, 3;
          animation: flowDashLeftToRight 0.55s linear infinite;
        }
      `}} />

      {/* Decorative top ambient glow */}
      <div 
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "350px",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.05) 45%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }} 
      />

      <div style={{ maxWidth: 1320, margin: "0 auto", position: "relative", zIndex: 2 }}>
        
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: 54 }}>
          <div 
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#818cf8",
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
              padding: "6px 16px",
              borderRadius: 999,
              marginBottom: 16,
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.15)",
            }}
          >
            <Sparkles style={{ width: 14, height: 14, color: "#818cf8" }} />
            <span>BEHIND THE AI PREDICTIONS</span>
          </div>

          <h2 
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              margin: "0 0 16px",
            }}
          >
            How Our AI Football Predictions Work
          </h2>

          <p 
            style={{
              color: "#94a3b8",
              fontSize: "clamp(14px, 1.6vw, 16px)",
              maxWidth: 720,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Our multi-tiered algorithmic pipeline processes millions of live data points across 120+ leagues to generate unbiased, high-probability betting insights.
          </p>
        </div>

        {/* 3 Step Process Cards */}
        <div 
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 24,
            marginBottom: 48,
          }}
        >

          {/* ──────── STEP 01: Data Collection and Integration ──────── */}
          <div
            onMouseEnter={() => setHoveredCard(1)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: "linear-gradient(180deg, rgba(21, 26, 56, 0.85) 0%, rgba(14, 17, 39, 0.95) 100%)",
              border: hoveredCard === 1 
                ? "1px solid rgba(139, 92, 246, 0.55)" 
                : "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: 18,
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              boxShadow: hoveredCard === 1 
                ? "0 16px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.2)" 
                : "0 10px 30px rgba(0, 0, 0, 0.4)",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: hoveredCard === 1 ? "translateY(-4px)" : "translateY(0)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Step Pill */}
            <div style={{ marginBottom: 20 }}>
              <span 
                style={{
                  display: "inline-block",
                  padding: "5px 12px",
                  borderRadius: 6,
                  background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  boxShadow: "0 2px 10px rgba(112, 101, 240, 0.35)",
                }}
              >
                STEP 01
              </span>
            </div>

            {/* Diagram Illustration Container with Moving Flow Arrows */}
            <div 
              style={{
                width: "100%",
                height: 180,
                background: "linear-gradient(180deg, rgba(16, 20, 48, 0.9) 0%, rgba(10, 13, 34, 0.95) 100%)",
                borderRadius: 12,
                border: "1px solid rgba(99, 102, 241, 0.18)",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                padding: "16px",
              }}
            >
              {/* Tech background grid */}
              <div 
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: "radial-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 0)",
                  backgroundSize: "16px 16px",
                  opacity: 0.5,
                }} 
              />

              {/* Vector Diagram: Moving Streams into chip */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 300, position: "relative", zIndex: 2 }}>
                
                {/* Left: 4 Data Blocks */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 72 }}>
                  {/* Item 01 */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 8px",
                    background: "rgba(30, 37, 78, 0.85)",
                    border: "1px solid rgba(99, 102, 241, 0.35)",
                    borderRadius: 6,
                  }}>
                    <BarChart3 style={{ width: 12, height: 12, color: "#818cf8" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8" }}>01</span>
                  </div>

                  {/* Item 02 */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 8px",
                    background: "rgba(30, 37, 78, 0.85)",
                    border: "1px solid rgba(99, 102, 241, 0.35)",
                    borderRadius: 6,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: "#a5b4fc" }}>xG</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8" }}>02</span>
                  </div>

                  {/* Item 03 */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 8px",
                    background: "rgba(30, 37, 78, 0.85)",
                    border: "1px solid rgba(99, 102, 241, 0.35)",
                    borderRadius: 6,
                  }}>
                    <Target style={{ width: 12, height: 12, color: "#818cf8" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8" }}>03</span>
                  </div>

                  {/* Item 04 */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "4px 8px",
                    background: "rgba(30, 37, 78, 0.85)",
                    border: "1px solid rgba(99, 102, 241, 0.35)",
                    borderRadius: 6,
                  }}>
                    <TrendingUp style={{ width: 12, height: 12, color: "#818cf8" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8" }}>04</span>
                  </div>
                </div>

                {/* Center: Animated Connecting Flow Lines with Moving Arrowheads */}
                <div style={{ flex: 1, height: 90, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "0 6px" }}>
                  <svg width="100%" height="90" viewBox="0 0 90 90" fill="none" style={{ overflow: "visible" }}>
                    <defs>
                      <marker id="arrowhead-purple" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                        <polygon points="0 0, 6 3, 0 6" fill="#818cf8" />
                      </marker>
                      <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#a855f7" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="1" />
                      </linearGradient>
                    </defs>

                    {/* Flow Path 1 */}
                    <path 
                      d="M 0 18 C 35 18, 50 45, 88 45" 
                      stroke="url(#streamGrad)" 
                      strokeWidth="2" 
                      className="animated-stream-line"
                      markerEnd="url(#arrowhead-purple)"
                    />
                    
                    {/* Flow Path 2 */}
                    <path 
                      d="M 0 36 C 35 36, 50 45, 88 45" 
                      stroke="url(#streamGrad)" 
                      strokeWidth="2" 
                      className="animated-stream-line-delayed"
                      markerEnd="url(#arrowhead-purple)"
                    />

                    {/* Flow Path 3 */}
                    <path 
                      d="M 0 54 C 35 54, 50 45, 88 45" 
                      stroke="url(#streamGrad)" 
                      strokeWidth="2" 
                      className="animated-stream-line"
                      markerEnd="url(#arrowhead-purple)"
                    />

                    {/* Flow Path 4 */}
                    <path 
                      d="M 0 72 C 35 72, 50 45, 88 45" 
                      stroke="url(#streamGrad)" 
                      strokeWidth="2" 
                      className="animated-stream-line-delayed"
                      markerEnd="url(#arrowhead-purple)"
                    />

                    {/* Moving Signal Pulse Particles */}
                    <circle cx="15" cy="18" r="2.5" fill="#ffffff">
                      <animate attributeName="cx" values="0;85" dur="1.4s" repeatCount="indefinite" />
                      <animate attributeName="cy" values="18;45" dur="1.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0;1;1;0" dur="1.4s" repeatCount="indefinite" />
                    </circle>

                    <circle cx="15" cy="36" r="2.5" fill="#c084fc">
                      <animate attributeName="cx" values="0;85" dur="1.1s" repeatCount="indefinite" begin="0.3s" />
                      <animate attributeName="cy" values="36;45" dur="1.1s" repeatCount="indefinite" begin="0.3s" />
                      <animate attributeName="opacity" values="0;1;1;0" dur="1.1s" repeatCount="indefinite" begin="0.3s" />
                    </circle>

                    <circle cx="15" cy="54" r="2.5" fill="#ffffff">
                      <animate attributeName="cx" values="0;85" dur="1.3s" repeatCount="indefinite" begin="0.6s" />
                      <animate attributeName="cy" values="54;45" dur="1.3s" repeatCount="indefinite" begin="0.6s" />
                      <animate attributeName="opacity" values="0;1;1;0" dur="1.3s" repeatCount="indefinite" begin="0.6s" />
                    </circle>

                    <circle cx="15" cy="72" r="2.5" fill="#a5b4fc">
                      <animate attributeName="cx" values="0;85" dur="1.5s" repeatCount="indefinite" begin="0.2s" />
                      <animate attributeName="cy" values="72;45" dur="1.5s" repeatCount="indefinite" begin="0.2s" />
                      <animate attributeName="opacity" values="0;1;1;0" dur="1.5s" repeatCount="indefinite" begin="0.2s" />
                    </circle>
                  </svg>
                </div>

                {/* Right: AI Microprocessor Chip */}
                <div 
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 12,
                    background: "linear-gradient(135deg, rgba(30, 37, 85, 0.95) 0%, rgba(20, 25, 60, 0.98) 100%)",
                    border: "1.5px solid #818cf8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 18px rgba(129, 140, 248, 0.4)",
                    position: "relative",
                  }}
                >
                  {/* Pin accents on sides */}
                  <div style={{ position: "absolute", top: -4, left: "25%", width: 6, height: 4, background: "#818cf8", borderRadius: 1 }} />
                  <div style={{ position: "absolute", top: -4, left: "60%", width: 6, height: 4, background: "#818cf8", borderRadius: 1 }} />
                  <div style={{ position: "absolute", bottom: -4, left: "25%", width: 6, height: 4, background: "#818cf8", borderRadius: 1 }} />
                  <div style={{ position: "absolute", bottom: -4, left: "60%", width: 6, height: 4, background: "#818cf8", borderRadius: 1 }} />
                  <div style={{ position: "absolute", right: -4, top: "25%", width: 4, height: 6, background: "#818cf8", borderRadius: 1 }} />
                  <div style={{ position: "absolute", right: -4, top: "60%", width: 4, height: 6, background: "#818cf8", borderRadius: 1 }} />
                  <div style={{ position: "absolute", left: -4, top: "40%", width: 4, height: 8, background: "#818cf8", borderRadius: 1 }} />

                  {/* Inner reticle target with pulsing glow */}
                  <div 
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      border: "1.5px dashed rgba(165, 180, 252, 0.8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      animation: "pulseGlowRing 2s ease-in-out infinite",
                    }}
                  >
                    <div 
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: "#818cf8",
                        boxShadow: "0 0 12px #818cf8",
                      }} 
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Title */}
            <h3 
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: 12,
                letterSpacing: "-0.01em",
              }}
            >
              Data Collection and Integration
            </h3>

            {/* Description */}
            <p 
              style={{
                fontSize: 13,
                lineHeight: 1.65,
                color: "#94a3b8",
                margin: "0 0 14px",
                flex: 1,
              }}
            >
              Our software collects verified football data from official and licensed sports data providers through secure APIs. This information covers every aspect of the game — from match statistics, xG (expected goals), and ball possession to player transfers, team form, and news updates.
            </p>

            <p 
              style={{
                fontSize: 13,
                lineHeight: 1.65,
                color: "#64748b",
                margin: 0,
              }}
            >
              All this data is stored in our scalable big data platform, purpose-built for advanced AI football analysis. Our platform is engineered to handle millions of data points simultaneously.
            </p>
          </div>


          {/* ──────── STEP 02: Data Normalization and Validation ──────── */}
          <div
            onMouseEnter={() => setHoveredCard(2)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: "linear-gradient(180deg, rgba(21, 26, 56, 0.85) 0%, rgba(14, 17, 39, 0.95) 100%)",
              border: hoveredCard === 2 
                ? "1px solid rgba(139, 92, 246, 0.55)" 
                : "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: 18,
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              boxShadow: hoveredCard === 2 
                ? "0 16px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.2)" 
                : "0 10px 30px rgba(0, 0, 0, 0.4)",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: hoveredCard === 2 ? "translateY(-4px)" : "translateY(0)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Step Pill */}
            <div style={{ marginBottom: 20 }}>
              <span 
                style={{
                  display: "inline-block",
                  padding: "5px 12px",
                  borderRadius: 6,
                  background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  boxShadow: "0 2px 10px rgba(112, 101, 240, 0.35)",
                }}
              >
                STEP 02
              </span>
            </div>

            {/* Diagram Illustration Container with Moving Arrows through Funnel */}
            <div 
              style={{
                width: "100%",
                height: 180,
                background: "linear-gradient(180deg, rgba(16, 20, 48, 0.9) 0%, rgba(10, 13, 34, 0.95) 100%)",
                borderRadius: 12,
                border: "1px solid rgba(99, 102, 241, 0.18)",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                padding: "16px",
              }}
            >
              {/* Tech background grid */}
              <div 
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: "radial-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 0)",
                  backgroundSize: "16px 16px",
                  opacity: 0.5,
                }} 
              />

              {/* Vector Diagram: Raw list -> Moving Arrows -> Filter funnel -> Normalized clean output */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 300, position: "relative", zIndex: 2 }}>
                
                {/* Left: Raw noise lines with red crosses */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 64 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 44, height: 6, background: "rgba(148, 163, 184, 0.3)", borderRadius: 4 }} />
                    <span style={{ fontSize: 10, color: "#f87171", fontWeight: 800 }}>×</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 34, height: 6, background: "rgba(148, 163, 184, 0.3)", borderRadius: 4 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 48, height: 6, background: "rgba(148, 163, 184, 0.3)", borderRadius: 4 }} />
                    <span style={{ fontSize: 10, color: "#f87171", fontWeight: 800 }}>×</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 30, height: 6, background: "rgba(148, 163, 184, 0.3)", borderRadius: 4 }} />
                  </div>
                </div>

                {/* Animated Flow Track with Moving Chevron Arrows leading into the funnel */}
                <div style={{ position: "relative", width: 28, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ overflow: "visible" }}>
                    <path d="M 0 12 L 16 12 M 10 6 L 16 12 L 10 18" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "moveArrowThroughFunnel 1.2s ease-in-out infinite" }} />
                  </svg>
                </div>

                {/* Middle: Funnel / Filter Icon with pulsing aura */}
                <div 
                  style={{
                    width: 54,
                    height: 74,
                    borderRadius: 8,
                    background: "rgba(30, 37, 85, 0.8)",
                    border: "1px solid rgba(129, 140, 248, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 16px rgba(99, 102, 241, 0.3)",
                    position: "relative",
                  }}
                >
                  <Filter style={{ width: 24, height: 24, color: "#818cf8" }} />
                </div>

                {/* Animated Flow Track with Moving Green Arrows leaving the funnel */}
                <div style={{ position: "relative", width: 28, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ overflow: "visible" }}>
                    <path d="M 0 12 L 16 12 M 10 6 L 16 12 L 10 18" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "moveArrowThroughFunnel 1.2s ease-in-out infinite 0.6s" }} />
                  </svg>
                </div>

                {/* Right: Clean structured output bars with glowing green checkmark */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, width: 70, position: "relative" }}>
                  
                  {/* Top-right floating verified green badge with pulse animation */}
                  <div 
                    style={{
                      position: "absolute",
                      top: -18,
                      right: 0,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "rgba(16, 185, 129, 0.2)",
                      border: "1.5px solid #10b981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      animation: "outputSuccessPulse 2s infinite ease-in-out",
                    }}
                  >
                    <CheckCircle2 style={{ width: 14, height: 14, color: "#34d399" }} />
                  </div>

                  <div style={{ width: 56, height: 7, background: "linear-gradient(90deg, #818cf8, #a5b4fc)", borderRadius: 4, boxShadow: "0 0 6px rgba(129,140,248,0.4)" }} />
                  <div style={{ width: 44, height: 7, background: "linear-gradient(90deg, #818cf8, #a5b4fc)", borderRadius: 4, boxShadow: "0 0 6px rgba(129,140,248,0.4)" }} />
                  <div style={{ width: 50, height: 7, background: "linear-gradient(90deg, #818cf8, #a5b4fc)", borderRadius: 4, boxShadow: "0 0 6px rgba(129,140,248,0.4)" }} />
                  <div style={{ width: 36, height: 7, background: "linear-gradient(90deg, #818cf8, #a5b4fc)", borderRadius: 4, boxShadow: "0 0 6px rgba(129,140,248,0.4)" }} />
                </div>

              </div>
            </div>

            {/* Title */}
            <h3 
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: 12,
                letterSpacing: "-0.01em",
              }}
            >
              Data Normalization and Validation
            </h3>

            {/* Description */}
            <p 
              style={{
                fontSize: 13,
                lineHeight: 1.65,
                color: "#94a3b8",
                margin: "0 0 14px",
                flex: 1,
              }}
            >
              Once collected, the data must be normalized to ensure quality and consistency. Machine learning models, including our proprietary ones, require standardized and validated inputs. Every dataset is therefore cleaned, structured, and cross-checked before entering the prediction pipeline.
            </p>

            <p 
              style={{
                fontSize: 13,
                lineHeight: 1.65,
                color: "#64748b",
                margin: 0,
              }}
            >
              By dedicating significant resources to this thorough process, we eliminate inconsistencies, statistical anomalies, and random noise — ensuring every prediction is grounded in fact.
            </p>
          </div>


          {/* ──────── STEP 03: Predictive Intelligence with JT Apex ──────── */}
          <div
            onMouseEnter={() => setHoveredCard(3)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: "linear-gradient(180deg, rgba(21, 26, 56, 0.85) 0%, rgba(14, 17, 39, 0.95) 100%)",
              border: hoveredCard === 3 
                ? "1px solid rgba(139, 92, 246, 0.55)" 
                : "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: 18,
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              boxShadow: hoveredCard === 3 
                ? "0 16px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(139, 92, 246, 0.2)" 
                : "0 10px 30px rgba(0, 0, 0, 0.4)",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: hoveredCard === 3 ? "translateY(-4px)" : "translateY(0)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Step Pill */}
            <div style={{ marginBottom: 20 }}>
              <span 
                style={{
                  display: "inline-block",
                  padding: "5px 12px",
                  borderRadius: 6,
                  background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  boxShadow: "0 2px 10px rgba(112, 101, 240, 0.35)",
                }}
              >
                STEP 03
              </span>
            </div>

            {/* Diagram Illustration Container with Animated Synaptic Pulse Flows */}
            <div 
              style={{
                width: "100%",
                height: 180,
                background: "linear-gradient(180deg, rgba(16, 20, 48, 0.9) 0%, rgba(10, 13, 34, 0.95) 100%)",
                borderRadius: 12,
                border: "1px solid rgba(99, 102, 241, 0.18)",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                padding: "16px",
              }}
            >
              {/* Tech background grid */}
              <div 
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: "radial-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 0)",
                  backgroundSize: "16px 16px",
                  opacity: 0.5,
                }} 
              />

              {/* Vector Diagram: Neural network connected graph with moving pulses */}
              <div style={{ width: "100%", maxWidth: 280, height: 120, position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                
                <svg width="100%" height="100%" viewBox="0 0 240 100" fill="none">
                  {/* Synapse Lines with Flow Animations */}
                  {/* Layer 1 -> Layer 2 */}
                  <line x1="30" y1="25" x2="90" y2="15" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" className="animated-synapse" />
                  <line x1="30" y1="25" x2="90" y2="45" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" className="animated-synapse" />
                  <line x1="30" y1="25" x2="90" y2="75" stroke="rgba(129, 140, 248, 0.25)" strokeWidth="1" />

                  <line x1="30" y1="50" x2="90" y2="15" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" />
                  <line x1="30" y1="50" x2="90" y2="45" stroke="#a855f7" strokeWidth="2" className="animated-synapse-fast" />
                  <line x1="30" y1="50" x2="90" y2="75" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" className="animated-synapse" />

                  <line x1="30" y1="75" x2="90" y2="15" stroke="rgba(129, 140, 248, 0.25)" strokeWidth="1" />
                  <line x1="30" y1="75" x2="90" y2="45" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" className="animated-synapse" />
                  <line x1="30" y1="75" x2="90" y2="75" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" className="animated-synapse" />

                  {/* Layer 2 -> Layer 3 */}
                  <line x1="90" y1="15" x2="150" y2="30" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" className="animated-synapse" />
                  <line x1="90" y1="15" x2="150" y2="65" stroke="rgba(129, 140, 248, 0.25)" strokeWidth="1" />

                  <line x1="90" y1="45" x2="150" y2="30" stroke="#a855f7" strokeWidth="2" className="animated-synapse-fast" />
                  <line x1="90" y1="45" x2="150" y2="65" stroke="#a855f7" strokeWidth="2" className="animated-synapse-fast" />

                  <line x1="90" y1="75" x2="150" y2="30" stroke="rgba(129, 140, 248, 0.25)" strokeWidth="1" />
                  <line x1="90" y1="75" x2="150" y2="65" stroke="rgba(129, 140, 248, 0.4)" strokeWidth="1" className="animated-synapse" />

                  {/* Layer 3 -> Output Node with glowing green pulses */}
                  <line x1="150" y1="30" x2="205" y2="48" stroke="#10b981" strokeWidth="2" className="animated-synapse-fast" />
                  <line x1="150" y1="65" x2="205" y2="48" stroke="#10b981" strokeWidth="2" className="animated-synapse-fast" />

                  {/* Moving Spark Particles along the primary predictive path */}
                  <circle cx="30" cy="50" r="3" fill="#ffffff">
                    <animate attributeName="cx" values="30;90;150;205" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="cy" values="50;45;30;48" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;1;0" dur="1.2s" repeatCount="indefinite" />
                  </circle>

                  <circle cx="30" cy="50" r="3" fill="#34d399">
                    <animate attributeName="cx" values="30;90;150;205" dur="1.2s" repeatCount="indefinite" begin="0.6s" />
                    <animate attributeName="cy" values="50;45;65;48" dur="1.2s" repeatCount="indefinite" begin="0.6s" />
                    <animate attributeName="opacity" values="0;1;1;0" dur="1.2s" repeatCount="indefinite" begin="0.6s" />
                  </circle>

                  {/* Layer 1 Nodes with pulse animation */}
                  <circle cx="30" cy="25" r="4" style={{ animation: "neuralNodePulse1 1.6s infinite" }} />
                  <circle cx="30" cy="50" r="4" style={{ animation: "neuralNodePulse1 1.6s infinite 0.2s" }} />
                  <circle cx="30" cy="75" r="4" style={{ animation: "neuralNodePulse1 1.6s infinite 0.4s" }} />

                  {/* Layer 2 Nodes with pulse animation */}
                  <circle cx="90" cy="15" r="5" style={{ animation: "neuralNodePulse2 1.6s infinite 0.4s" }} />
                  <circle cx="90" cy="45" r="6" fill="#8b5cf6" stroke="#c084fc" strokeWidth="1.5" style={{ animation: "neuralNodePulse2 1.6s infinite 0.6s" }} />
                  <circle cx="90" cy="75" r="5" style={{ animation: "neuralNodePulse2 1.6s infinite 0.8s" }} />

                  {/* Layer 3 Nodes with pulse animation */}
                  <circle cx="150" cy="30" r="5.5" style={{ animation: "neuralNodePulse3 1.6s infinite 0.8s" }} />
                  <circle cx="150" cy="65" r="5.5" style={{ animation: "neuralNodePulse3 1.6s infinite 1.0s" }} />

                  {/* Output Node Badge (Verified Checkmark) */}
                  <circle cx="205" cy="48" r="14" fill="#0f291e" stroke="#10b981" strokeWidth="2" />
                </svg>

                {/* Actual SVG Check Icon inside Output Node with Pulse */}
                <div 
                  style={{ 
                    position: "absolute", 
                    right: 28, 
                    top: "50%", 
                    transform: "translateY(-50%)", 
                    pointerEvents: "none",
                    animation: "outputSuccessPulse 1.8s infinite ease-in-out",
                  }}
                >
                  <CheckCircle2 style={{ width: 18, height: 18, color: "#34d399" }} />
                </div>

              </div>
            </div>

            {/* Title */}
            <h3 
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: 12,
                letterSpacing: "-0.01em",
              }}
            >
              Predictive Intelligence with JT Apex
            </h3>

            {/* Description */}
            <p 
              style={{
                fontSize: 13,
                lineHeight: 1.65,
                color: "#94a3b8",
                margin: "0 0 14px",
                flex: 1,
              }}
            >
              At this stage, our proprietary model, <strong style={{ color: "#ffffff", fontWeight: 700 }}>JT Apex</strong>, takes over. Developed by our AI engineering team, JT Apex combines deep neural networks with pattern recognition to interpret complex football dynamics.
            </p>

            <p 
              style={{
                fontSize: 13,
                lineHeight: 1.65,
                color: "#64748b",
                margin: 0,
              }}
            >
              It processes dozens of contextual variables — such as match history, weather conditions, injuries, transfers, and xG trends — to produce objective, data-driven predictions verified and settled against live match results.
            </p>
          </div>

        </div>

        {/* Bottom Highlights & Metrics Ribbon */}
        <div 
          style={{
            background: "linear-gradient(135deg, rgba(17, 22, 54, 0.7) 0%, rgba(12, 16, 40, 0.8) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: 14,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div 
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "rgba(139, 92, 246, 0.15)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheck style={{ width: 20, height: 20, color: "#a78bfa" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#ffffff", marginBottom: 2 }}>
                Transparent, Verified Performance Track Record
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                Every single prediction is timestamped on-chain and settled against official match records.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/progress"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 18px",
                borderRadius: 8,
                background: "rgba(99, 102, 241, 0.12)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                color: "#c7d2fe",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <span>View Settlement History</span>
              <ArrowRight style={{ width: 14, height: 14, animation: "arrowBounceRight 1.5s infinite" }} />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
