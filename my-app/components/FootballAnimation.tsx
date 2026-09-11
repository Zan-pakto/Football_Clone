"use client";

import { useEffect, useRef, useState } from "react";
import { Zap, Target, Flame, Trophy, ShieldCheck, Activity, ChevronRight, Sparkles } from "lucide-react";

export default function FootballAnimation() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pitchStageRef = useRef<HTMLDivElement | null>(null);

  // Mouse Parallax Interaction (Direct DOM update - 0 React re-renders!)
  useEffect(() => {
    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        if (pitchStageRef.current) {
          const { innerWidth, innerHeight } = window;
          const x = (e.clientX / innerWidth - 0.5) * 16;
          const y = (e.clientY / innerHeight - 0.5) * 16;
          pitchStageRef.current.style.transform = `rotateX(${62 - y * 0.3}deg) rotateZ(${-14 + x * 0.3}deg) translateZ(0)`;
        }
        rafId = null;
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Canvas-based Cyber Laser & Ambient Holographic Wave Particles (Optimized)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    let isVisible = true;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 900);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 440);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize, { passive: true });

    // Pause rendering loop when off-screen to keep 60-120fps smooth scrolling
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animId) {
          render();
        }
      },
      { threshold: 0.05 }
    );
    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    // Light pulses traveling along tactical trajectories
    interface TacticalPulse {
      progress: number;
      speed: number;
      startX: number;
      startY: number;
      cpX: number;
      cpY: number;
      endX: number;
      endY: number;
      color: string;
    }

    const pulses: TacticalPulse[] = [
      { progress: 0, speed: 0.008, startX: width * 0.25, startY: height * 0.7, cpX: width * 0.4, cpY: height * 0.35, endX: width * 0.5, endY: height * 0.45, color: "#38bdf8" },
      { progress: 0.35, speed: 0.006, startX: width * 0.5, startY: height * 0.45, cpX: width * 0.65, cpY: height * 0.3, endX: width * 0.78, endY: height * 0.65, color: "#818cf8" },
      { progress: 0.7, speed: 0.007, startX: width * 0.3, startY: height * 0.55, cpX: width * 0.5, cpY: height * 0.2, endX: width * 0.7, endY: height * 0.5, color: "#34d399" },
    ];

    // Ambient floating energy particles
    const sparks = Array.from({ length: 24 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 0.8,
      speedY: -(Math.random() * 0.35 + 0.1),
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.5 ? "#6366f1" : "#06b6d4",
    }));

    const render = () => {
      if (!isVisible) {
        animId = 0;
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Draw floating ambient energy sparks (high performance without shadowBlur)
      sparks.forEach((s) => {
        s.y += s.speedY;
        s.x += s.speedX;
        if (s.y < 0) s.y = height;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.opacity;
        ctx.fill();
      });

      // 2. Animate Tactical Passing Laser Curves
      pulses.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        // Draw curved tactical trajectory line
        ctx.beginPath();
        ctx.moveTo(p.startX, p.startY);
        ctx.quadraticCurveTo(p.cpX, p.cpY, p.endX, p.endY);
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Calculate current position along Bezier curve
        const t = p.progress;
        const curX = (1 - t) * (1 - t) * p.startX + 2 * (1 - t) * t * p.cpX + t * t * p.endX;
        const curY = (1 - t) * (1 - t) * p.startY + 2 * (1 - t) * t * p.cpY + t * t * p.endY;

        // Draw traveling glowing energy comet head
        ctx.beginPath();
        ctx.arc(curX, curY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.95;
        ctx.fill();

        // Glow ring around comet head
        ctx.beginPath();
        ctx.arc(curX, curY, 8, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.35;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "1060px",
        height: "440px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        perspective: "1200px",
        willChange: "transform, opacity",
      }}
    >
      {/* Background Canvas (Passing Lasers & Floating Neural Sparks) */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* ── 3D Isometric Holographic Tactical Pitch Stage ── */}
      <div
        ref={pitchStageRef}
        style={{
          position: "relative",
          width: "580px",
          height: "360px",
          transform: `rotateX(62deg) rotateZ(-14deg) translateZ(0)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.12s ease-out",
          zIndex: 2,
          willChange: "transform",
        }}
      >
        {/* Holographic Pitch Floor Grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "24px",
            border: "1.5px solid rgba(99, 102, 241, 0.4)",
            background: "linear-gradient(135deg, rgba(16, 22, 58, 0.75) 0%, rgba(10, 14, 38, 0.85) 100%)",
            boxShadow: "0 0 50px rgba(99, 102, 241, 0.25), inset 0 0 40px rgba(14, 165, 233, 0.15)",
            backdropFilter: "blur(8px)",
            overflow: "hidden",
          }}
        >
          {/* Tactical Pitch Lines */}
          <div style={{ position: "absolute", inset: "16px", border: "1.5px solid rgba(99, 102, 241, 0.35)", borderRadius: "12px" }}>
            {/* Center Line */}
            <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: "1.5px", background: "rgba(99, 102, 241, 0.4)" }} />
            
            {/* Center Circle */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              border: "1.5px solid rgba(99, 102, 241, 0.4)",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.2)",
            }}>
              {/* Radar Sweep Ring */}
              <div style={{
                position: "absolute",
                inset: "-8px",
                borderRadius: "50%",
                border: "1px dashed rgba(56, 189, 248, 0.45)",
                animation: "radarSpin 10s linear infinite",
              }} />
            </div>

            {/* Left Penalty Area */}
            <div style={{ position: "absolute", left: 0, top: "25%", bottom: "25%", width: "85px", border: "1.5px solid rgba(99, 102, 241, 0.35)", borderLeft: "none" }} />
            {/* Right Penalty Area */}
            <div style={{ position: "absolute", right: 0, top: "25%", bottom: "25%", width: "85px", border: "1.5px solid rgba(99, 102, 241, 0.35)", borderRight: "none" }} />
          </div>

          {/* Tactical Heatmap Intensity Glow in Center */}
          <div style={{
            position: "absolute",
            top: "40%",
            left: "45%",
            width: "160px",
            height: "100px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(249, 115, 22, 0.3) 0%, rgba(239, 68, 68, 0.15) 45%, transparent 70%)",
            filter: "blur(18px)",
          }} />
        </div>

        {/* ── 3D Floating Cyber Football (Center Stage) ── */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) translateZ(70px) rotateX(-62deg) rotateZ(14deg)`,
            transformStyle: "preserve-3d",
            animation: "floatBall3D 4s ease-in-out infinite",
          }}
        >
          {/* Orbital Neon Ring */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            border: "1.5px dashed rgba(56, 189, 248, 0.5)",
            boxShadow: "0 0 25px rgba(56, 189, 248, 0.25)",
            animation: "radarSpin 16s linear infinite",
          }} />

          {/* Glowing Shadow underneath Ball on Pitch */}
          <div style={{
            position: "absolute",
            top: "120px",
            left: "50%",
            transform: "translateX(-50%) rotateX(65deg)",
            width: "100px",
            height: "40px",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(0, 0, 0, 0.85) 0%, rgba(99, 102, 241, 0.3) 50%, transparent 80%)",
            filter: "blur(8px)",
          }} />

          {/* Vector Cyber Football */}
          <svg
            viewBox="0 0 200 200"
            style={{
              width: "120px",
              height: "120px",
              filter: "drop-shadow(0 15px 30px rgba(99, 102, 241, 0.5)) drop-shadow(0 0 20px rgba(56, 189, 248, 0.35))",
            }}
          >
            <defs>
              <radialGradient id="cyberBallGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#e0e7ff" />
                <stop offset="70%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </radialGradient>
              <radialGradient id="cyberPatchGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#312e81" />
                <stop offset="100%" stopColor="#0f172a" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="url(#cyberBallGrad)" />
            {/* Pentagon Center */}
            <polygon points="100,68 126,86 116,116 84,116 74,86" fill="url(#cyberPatchGrad)" stroke="#6366f1" strokeWidth="2.5" />
            {/* Top Seams */}
            <line x1="100" y1="68" x2="100" y2="28" stroke="#6366f1" strokeWidth="2" />
            <polygon points="100,28 124,14 146,30 135,52 100,42" fill="url(#cyberPatchGrad)" stroke="#818cf8" strokeWidth="1.5" />
            <polygon points="100,28 76,14 54,30 65,52 100,42" fill="url(#cyberPatchGrad)" stroke="#818cf8" strokeWidth="1.5" />
            {/* Right Seams */}
            <line x1="126" y1="86" x2="162" y2="80" stroke="#6366f1" strokeWidth="2" />
            <polygon points="162,80 182,100 174,126 148,122 144,98" fill="url(#cyberPatchGrad)" stroke="#818cf8" strokeWidth="1.5" />
            {/* Bottom Seams */}
            <line x1="116" y1="116" x2="135" y2="152" stroke="#6366f1" strokeWidth="2" />
            <polygon points="135,152 100,172 65,152 74,130 126,130" fill="url(#cyberPatchGrad)" stroke="#818cf8" strokeWidth="1.5" />
            <line x1="84" y1="116" x2="65" y2="152" stroke="#6366f1" strokeWidth="2" />
            {/* Left Seams */}
            <line x1="74" y1="86" x2="38" y2="80" stroke="#6366f1" strokeWidth="2" />
            <polygon points="38,80 18,100 26,126 52,122 56,98" fill="url(#cyberPatchGrad)" stroke="#818cf8" strokeWidth="1.5" />
            {/* Specular Glint */}
            <path d="M 40,50 A 70,70 0 0,1 140,30" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* ── Floating AI Hologram Intelligence Widgets ── */}

      {/* Top Floating Badge: Real-Time Engine Active */}
      <div style={{
        position: "absolute",
        top: "2px",
        zIndex: 5,
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "5px 14px",
        borderRadius: "999px",
        background: "rgba(12, 16, 40, 0.85)",
        border: "1px solid rgba(99, 102, 241, 0.35)",
        boxShadow: "0 0 20px rgba(99, 102, 241, 0.2)",
        backdropFilter: "blur(12px)",
        animation: "floatSoft 5s ease-in-out infinite",
      }}>
        <span style={{ position: "relative", display: "flex", width: "8px", height: "8px" }}>
          <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#34d399", opacity: 0.75, animation: "ping 1.4s infinite" }} />
          <span style={{ position: "relative", width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
        </span>
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#cbd5e1", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          AI Tactical Simulation Engine Active
        </span>
      </div>

      {/* Left Glassmorphism Card: Win Probability Model */}
      <div
        className="floating-card-hide"
        style={{
          position: "absolute",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 5,
          background: "linear-gradient(135deg, rgba(16, 22, 54, 0.92) 0%, rgba(10, 14, 38, 0.97) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.4)",
          borderRadius: "16px",
          padding: "14px 16px",
          width: "220px",
          boxShadow: "0 15px 35px rgba(0,0,0,0.6), 0 0 25px rgba(99, 102, 241, 0.25)",
          backdropFilter: "blur(14px)",
          animation: "floatCardLeft 6s ease-in-out infinite",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "4px" }}>
            <Activity style={{ width: "12px", height: "12px", color: "#38bdf8" }} />
            Match Consensus
          </span>
          <span style={{ fontSize: "11px", fontWeight: 900, color: "#34d399", background: "rgba(52, 211, 153, 0.15)", padding: "2px 7px", borderRadius: "6px" }}>
            89.4%
          </span>
        </div>
        <div style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff", marginBottom: "6px" }}>
          Arsenal vs Chelsea
        </div>
        {/* Probability Bar */}
        <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "999px", overflow: "hidden", display: "flex" }}>
          <div style={{ width: "68%", background: "linear-gradient(90deg, #6366f1, #38bdf8)" }} />
          <div style={{ width: "20%", background: "#475569" }} />
          <div style={{ width: "12%", background: "#f43f5e" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", marginTop: "4px", fontWeight: 700 }}>
          <span>1: 68%</span>
          <span>X: 20%</span>
          <span>2: 12%</span>
        </div>
      </div>

      {/* Right Glassmorphism Card: High xG Radar */}
      <div
        className="floating-card-hide"
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 5,
          background: "linear-gradient(135deg, rgba(16, 22, 54, 0.92) 0%, rgba(10, 14, 38, 0.97) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.4)",
          borderRadius: "16px",
          padding: "14px 16px",
          width: "220px",
          boxShadow: "0 15px 35px rgba(0,0,0,0.6), 0 0 25px rgba(56, 189, 248, 0.25)",
          backdropFilter: "blur(14px)",
          animation: "floatCardRight 7s ease-in-out infinite 0.5s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#7dd3fc", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "4px" }}>
            <Target style={{ width: "12px", height: "12px", color: "#38bdf8" }} />
            Goal Matrix
          </span>
          <span style={{ fontSize: "11px", fontWeight: 900, color: "#38bdf8", background: "rgba(56, 189, 248, 0.15)", padding: "2px 7px", borderRadius: "6px" }}>
            xG 2.85
          </span>
        </div>
        <div style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff", marginBottom: "4px" }}>
          Over 2.5 Goals Tip
        </div>
        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
          High Statistical Algorithm Consensus
        </div>
      </div>

      {/* Bottom Center Mini Chip: Verified Win Rate */}
      <div
        style={{
          position: "absolute",
          bottom: "6px",
          zIndex: 5,
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 16px",
          borderRadius: "999px",
          background: "rgba(12, 16, 40, 0.9)",
          border: "1px solid rgba(249, 115, 22, 0.35)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.5), 0 0 20px rgba(249, 115, 22, 0.2)",
          backdropFilter: "blur(12px)",
          animation: "floatSoft 6s ease-in-out infinite 1s",
        }}
      >
        <Trophy style={{ width: "14px", height: "14px", color: "#f59e0b" }} />
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#fef3c7" }}>
          Verified 85.8% Track Record
        </span>
      </div>

      {/* Keyframe Animations */}
      <style>{`
        @keyframes floatBall3D {
          0%, 100% { transform: translate(-50%, -50%) translateZ(75px) rotateX(-62deg) rotateZ(14deg); }
          50% { transform: translate(-50%, -50%) translateZ(95px) rotateX(-62deg) rotateZ(18deg); }
        }
        @keyframes radarSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes floatSoft {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes floatCardLeft {
          0%, 100% { transform: translateY(-50%) translateX(0px); }
          50% { transform: translateY(calc(-50% - 8px)) translateX(3px); }
        }
        @keyframes floatCardRight {
          0%, 100% { transform: translateY(-50%) translateX(0px); }
          50% { transform: translateY(calc(-50% - 8px)) translateX(-3px); }
        }
        @media (max-width: 980px) {
          .floating-card-hide { display: none !important; }
        }
      `}</style>
    </div>
  );
}
