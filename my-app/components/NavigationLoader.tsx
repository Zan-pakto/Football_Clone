"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Sparkles, Activity } from "lucide-react";

const LOADING_TIPS = [
  "Analyzing match odds & Poisson probabilities...",
  "Calibrating quantitative prediction engine...",
  "Syncing live match statistics and form records...",
  "Running head-to-head algorithm models...",
  "Loading verified high-confidence tips...",
];

function NavigationLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Track route changes to finish loading
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Click listener for all internal navigation links
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore external links, downloads, new tabs, mailto, tel, or purely anchor hash links
      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        href.startsWith("#") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if internal link
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;

        // If it's literally the current full URL including hash, don't trigger loader
        if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
          return;
        }

        // Trigger loading state immediately
        setTipIndex(Math.floor(Math.random() * LOADING_TIPS.length));
        setProgress(15);
        setIsNavigating(true);

        // Increment progress gradually
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 85) {
              clearInterval(interval);
              return 85;
            }
            return prev + Math.floor(Math.random() * 20) + 10;
          });
        }, 120);

        // Safety timeout to avoid getting stuck if navigation cancelled
        setTimeout(() => {
          clearInterval(interval);
          setIsNavigating(false);
          setProgress(0);
        }, 6000);
      } catch {
        // Invalid URL, ignore
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  if (!isNavigating && progress === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        pointerEvents: isNavigating ? "all" : "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(6, 8, 20, 0.78)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        transition: "opacity 0.25s ease-out",
        opacity: isNavigating ? 1 : 0,
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
          background: "rgba(255,255,255,0.05)",
          overflow: "hidden",
          zIndex: 1000000,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, #f97316 0%, #a855f7 50%, #38bdf8 100%)",
            boxShadow: "0 0 16px rgba(168, 85, 247, 0.9), 0 0 8px rgba(56, 189, 248, 0.8)",
            transition: "width 0.18s ease-out",
          }}
        />
      </div>

      {/* Central Glass Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          padding: "36px 44px",
          background: "linear-gradient(135deg, rgba(20, 25, 58, 0.92) 0%, rgba(12, 16, 40, 0.96) 100%)",
          border: "1px solid rgba(168, 85, 247, 0.35)",
          borderRadius: 22,
          boxShadow: "0 24px 60px rgba(0,0,0,0.8), 0 0 35px rgba(139, 92, 246, 0.25)",
          textAlign: "center",
          maxWidth: 420,
          margin: "0 20px",
          animation: "cardPulse 2s ease-in-out infinite alternate",
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
            <Sparkles style={{ width: 15, height: 15, color: "#c084fc", animation: "spinSlow 3s linear infinite" }} />
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
              minHeight: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {LOADING_TIPS[tipIndex]}
          </p>
        </div>

        {/* Pulse Loading Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316", animation: "dotBounce 0.8s ease-in-out infinite 0s" }} />
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#a855f7", animation: "dotBounce 0.8s ease-in-out infinite 0.16s" }} />
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#38bdf8", animation: "dotBounce 0.8s ease-in-out infinite 0.32s" }} />
        </div>
      </div>

      <style>{`
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes cardPulse {
          0% { transform: scale(0.98); }
          100% { transform: scale(1.01); }
        }
      `}</style>
    </div>
  );
}

export default function NavigationLoader() {
  return (
    <Suspense fallback={null}>
      <NavigationLoaderContent />
    </Suspense>
  );
}
