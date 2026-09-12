"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={`theme-toggle-btn ${className}`}
        style={{
          width: 36,
          height: 36,
          borderRadius: "10px",
          border: "1px solid var(--border-color)",
          background: "var(--bg-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          opacity: 0.7,
        }}
      >
        <Moon size={16} color="var(--text-secondary)" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`theme-toggle-btn ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 36,
        padding: showLabel ? "0 12px" : "0 8px",
        borderRadius: "10px",
        border: "1px solid var(--border-color)",
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent-emerald)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-color)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isDark ? "var(--accent-emerald)" : "var(--accent-cyan)",
          transition: "transform 0.3s ease",
        }}
      >
        {isDark ? (
          <Moon size={16} strokeWidth={2.2} />
        ) : (
          <Sun size={16} strokeWidth={2.2} />
        )}
      </div>
      {showLabel && (
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
}
