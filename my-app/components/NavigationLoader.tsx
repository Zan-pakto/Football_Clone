"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const LOADING_TIPS = [
  "Analyzing match odds & Poisson probabilities...",
  "Calibrating quantitative prediction engine...",
  "Syncing live match statistics and form records...",
  "Running head-to-head algorithm models...",
  "Loading high-confidence tips...",
  "Aggregating real-time league intelligence...",
];

const MIN_DISPLAY_MS = 750; // Minimum duration to ensure rich UX and prevent jarring 0.1s flashes

function NavigationLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // When route changes, hold loader for MIN_DISPLAY_MS before dismissing
  useEffect(() => {
    if (isNavigating) {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Finish progress bar
      setProgress(100);

      const timer = setTimeout(() => {
        setIsNavigating(false);
        setTimeout(() => setProgress(0), 300);
      }, remaining + 250);

      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        href.startsWith("#") ||
        e.ctrlKey || e.metaKey || e.shiftKey || e.altKey
      ) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
        
        // Start intentional luxury loading experience
        startTimeRef.current = Date.now();
        setTipIndex(Math.floor(Math.random() * LOADING_TIPS.length));
        setProgress(20);
        setIsNavigating(true);

        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 88) {
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
              return 88;
            }
            return prev + Math.floor(Math.random() * 16) + 8;
          });
        }, 100);

        // Safety fallback if navigation hangs
        setTimeout(() => {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          setIsNavigating(false);
          setProgress(0);
        }, 6000);
      } catch { /* ignore */ }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
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
        background: "var(--surface-overlay)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        transition: "opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: isNavigating ? 1 : 0,
      }}
    >
      {/* Top Emerald Progress Bar */}
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
            width: `${progress}%`,
            background: "var(--accent-emerald-gradient)",
            boxShadow: "0 0 14px var(--accent-emerald-glow)",
            transition: "width 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>

      {/* Central Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          padding: "36px 44px",
          background: "var(--surface)",
          border: "1px solid var(--accent-emerald-border)",
          borderRadius: 22,
          boxShadow: "0 28px 70px rgba(0,0,0,0.4), 0 0 0 1px var(--accent-emerald-border)",
          textAlign: "center",
          width: "100%",
          maxWidth: 380,
          minHeight: 230,
          boxSizing: "border-box",
          margin: "0 20px",
          transform: "none",
        }}
      >
        {/* Animated Emerald Emblem */}
        <div style={{ position: "relative", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              position: "absolute",
              inset: -5,
              borderRadius: "50%",
              border: "1.5px solid transparent",
              borderTopColor: "var(--accent-emerald)",
              borderRightColor: "var(--accent-emerald-border)",
              animation: "spinSlow 1.3s linear infinite",
            }}
          />
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--accent-emerald-bg)",
              border: "1px solid var(--accent-emerald-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px var(--accent-emerald-glow)",
            }}
          >
            <span style={{ fontFamily: "var(--font-display)", color: "var(--accent-emerald)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>
              JT
            </span>
          </div>
        </div>

        {/* Brand Text & Status Tips */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            JOLLOF<span style={{ color: "var(--accent-emerald)" }}>TIPS</span>
          </div>
          <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5, minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {LOADING_TIPS[tipIndex]}
          </p>
        </div>

        {/* Pulsing Emerald Dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[0, 0.18, 0.36].map((delay, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent-emerald)",
                animation: `dotBounce 0.8s ease-in-out ${delay}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes dotBounce { 0%, 100% { transform: translateY(0); opacity: 0.3; } 50% { transform: translateY(-5px); opacity: 1; } }
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
