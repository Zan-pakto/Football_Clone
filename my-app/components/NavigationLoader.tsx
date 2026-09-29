"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // When route changes, complete the top progress bar quickly and dismiss
  useEffect(() => {
    if (isNavigating) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Finish progress bar smoothly
      setProgress(100);

      const timer = setTimeout(() => {
        setIsNavigating(false);
        setTimeout(() => setProgress(0), 200);
      }, 150);

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

        // Start sleek non-blocking top progress bar
        setProgress(25);
        setIsNavigating(true);

        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
              return 90;
            }
            return prev + Math.floor(Math.random() * 12) + 6;
          });
        }, 80);

        // Safety fallback if navigation hangs
        setTimeout(() => {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          setIsNavigating(false);
          setProgress(0);
        }, 5000);
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
        top: 0,
        left: 0,
        right: 0,
        height: 2.5,
        background: "transparent",
        pointerEvents: "none",
        zIndex: 9999999,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #7c6cf5, #2fd08a, #00d2ff)",
          boxShadow: "0 0 10px rgba(124, 108, 245, 0.7), 0 0 5px rgba(47, 208, 138, 0.5)",
          transition: isNavigating ? "width 0.2s cubic-bezier(0.16, 1, 0.3, 1)" : "width 0.1s ease-out, opacity 0.2s ease-out",
          opacity: progress === 100 ? 0.8 : 1,
        }}
      />
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
