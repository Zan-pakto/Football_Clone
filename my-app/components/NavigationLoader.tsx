"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "./ThemeProvider";

const LOADING_TIPS = [
  "Analyzing match odds & Poisson probabilities...",
  "Calibrating quantitative prediction engine...",
  "Syncing live match statistics and form records...",
  "Running head-to-head algorithm models...",
  "Loading high-confidence tips...",
];

function NavigationLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [isNavigating, setIsNavigating] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);

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
        setTipIndex(Math.floor(Math.random() * LOADING_TIPS.length));
        setProgress(15);
        setIsNavigating(true);
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 85) { clearInterval(interval); return 85; }
            return prev + Math.floor(Math.random() * 20) + 10;
          });
        }, 120);
        setTimeout(() => { clearInterval(interval); setIsNavigating(false); setProgress(0); }, 6000);
      } catch { /* ignore */ }
    };
    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
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
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        transition: "opacity 0.25s ease-out",
        opacity: isNavigating ? 1 : 0,
      }}
    >
      {/* Gold progress bar */}
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
            background: "var(--gold-gradient)",
            boxShadow: "0 0 12px var(--gold-glow)",
            transition: "width 0.18s ease-out",
          }}
        />
      </div>

      {/* Central Unified Luxury Card */}
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
        {/* Gold emblem */}
        <div style={{ position: "relative", width: 54, height: 54, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
            <span style={{ fontFamily: "var(--font-display)", color: "var(--gold)", fontWeight: 800, fontSize: 17, letterSpacing: "-0.5px" }}>
              JT
            </span>
          </div>
        </div>

        {/* Brand text */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            JOLLOF<span style={{ color: "var(--gold)" }}>TIPS</span>
          </div>
          <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5, minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {LOADING_TIPS[tipIndex]}
          </p>
        </div>

        {/* Gold dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[0, 0.18, 0.36].map((delay, i) => (
            <div
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "var(--gold)",
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
