"use client";

import { useEffect, useRef } from "react";
import { Zap, Target, Flame, Trophy, ShieldCheck, Activity, ChevronRight, Sparkles } from "lucide-react";

export default function FootballAnimation() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pitchStageRef = useRef<HTMLDivElement | null>(null);

  // Mouse Parallax Interaction
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

  // Canvas-based Gold & Emerald Laser Particles
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
      { progress: 0, speed: 0.008, startX: width * 0.25, startY: height * 0.7, cpX: width * 0.4, cpY: height * 0.35, endX: width * 0.5, endY: height * 0.45, color: "#d4af37" },
      { progress: 0.35, speed: 0.006, startX: width * 0.5, startY: height * 0.45, cpX: width * 0.65, cpY: height * 0.3, endX: width * 0.78, endY: height * 0.65, color: "#f3d97b" },
      { progress: 0.7, speed: 0.007, startX: width * 0.3, startY: height * 0.55, cpX: width * 0.5, cpY: height * 0.2, endX: width * 0.7, endY: height * 0.5, color: "#10b981" },
    ];

    const sparks = Array.from({ length: 24 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 0.8,
      speedY: -(Math.random() * 0.35 + 0.1),
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.5 ? "#d4af37" : "#10b981",
    }));

    const render = () => {
      if (!isVisible) {
        animId = 0;
        return;
      }
      ctx.clearRect(0, 0, width, height);

      // Draw sparks
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

      // Draw Tactical Pulses
      pulses.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const t = p.progress;
        const cx = (1 - t) * (1 - t) * p.startX + 2 * (1 - t) * t * p.cpX + t * t * p.endX;
        const cy = (1 - t) * (1 - t) * p.startY + 2 * (1 - t) * t * p.cpY + t * t * p.endY;

        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.9;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 960,
        height: 380,
        margin: "0 auto",
        perspective: 1000,
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* 3D Pitch Stage */}
      <div
        ref={pitchStageRef}
        style={{
          position: "absolute",
          width: 600,
          height: 340,
          left: "50%",
          top: "50%",
          marginLeft: -300,
          marginTop: -170,
          transform: "rotateX(62deg) rotateZ(-14deg) translateZ(0)",
          transformStyle: "preserve-3d",
          background: "linear-gradient(135deg, rgba(20, 20, 32, 0.9) 0%, rgba(10, 10, 18, 0.95) 100%)",
          border: "2px solid var(--gold-border)",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px var(--gold-glow)",
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* Pitch Lines */}
        <div
          style={{
            position: "absolute",
            inset: 12,
            border: "1px solid rgba(212, 175, 55, 0.25)",
            borderRadius: 14,
          }}
        >
          {/* Halfway Line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "50%",
              width: 1,
              background: "rgba(212, 175, 55, 0.25)",
            }}
          />
          {/* Center Circle */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 90,
              height: 90,
              marginLeft: -45,
              marginTop: -45,
              border: "1px solid rgba(212, 175, 55, 0.25)",
              borderRadius: "50%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
