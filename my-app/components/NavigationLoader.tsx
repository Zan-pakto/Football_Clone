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
        background: isLight ? "rgba(244, 246, 250, 0.94)" : "rgba(6, 6, 12, 0.94)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
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
          height: 2.5,
          background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
          overflow: "hidden",
          zIndex: 1000000,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: isLight
              ? "linear-gradient(90deg, #92670e, #b48214, #d4af37, #b48214)"
              : "linear-gradient(90deg, #9a7c36, #c9a84c, #f3db98, #c9a84c)",
            boxShadow: isLight
              ? "0 0 12px rgba(180,130,20,0.5)"
              : "0 0 12px rgba(201,168,76,0.8)",
            transition: "width 0.18s ease-out",
          }}
        />
      </div>

      {/* Central Luxury Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          padding: "38px 46px",
          background: isLight ? "rgba(255, 255, 255, 0.98)" : "rgba(13, 14, 22, 0.98)",
          border: isLight
            ? "1px solid rgba(180, 130, 20, 0.35)"
            : "1px solid rgba(201, 168, 76, 0.28)",
          borderRadius: 20,
          boxShadow: isLight
            ? "0 28px 70px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(180, 130, 20, 0.15)"
            : "0 28px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(201,168,76,0.12)",
          textAlign: "center",
          maxWidth: 380,
          margin: "0 20px",
        }}
      >
        {/* Gold emblem */}
        <div style={{ position: "relative", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              position: "absolute",
              inset: -5,
              borderRadius: "50%",
              border: "1.5px solid transparent",
              borderTopColor: isLight ? "#b48214" : "#c9a84c",
              borderRightColor: isLight ? "rgba(180,130,20,0.25)" : "rgba(201,168,76,0.35)",
              animation: "spinSlow 1.4s linear infinite",
            }}
          />
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: isLight ? "rgba(180, 130, 20, 0.08)" : "rgba(201, 168, 76, 0.12)",
              border: isLight ? "1.5px solid rgba(180, 130, 20, 0.3)" : "1.5px solid rgba(201, 168, 76, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontFamily: "var(--font-display)", color: isLight ? "#b48214" : "#c9a84c", fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>
              JT
            </span>
          </div>
        </div>

        {/* Brand text */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: isLight ? "#0f172a" : "#ffffff", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            JOLLOF<span style={{ color: isLight ? "#b48214" : "#c9a84c" }}>TIPS</span>
          </div>
          <p style={{ fontSize: 12, fontWeight: 500, color: isLight ? "#475569" : "#cbd5e1", margin: 0, lineHeight: 1.5, minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                background: isLight ? "#b48214" : "#c9a84c",
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
