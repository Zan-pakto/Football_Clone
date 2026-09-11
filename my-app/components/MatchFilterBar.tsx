"use client";

import { Search, Globe } from "lucide-react";

interface MatchFilterBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchTerm: string;
  onSearchChange: (q: string) => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  countries: string[];
  countryCounts?: Record<string, number>;
  totalCount?: number;
}

export default function MatchFilterBar({
  activeTab, onTabChange,
  searchTerm, onSearchChange,
  selectedCountry, onCountryChange,
  countries,
  countryCounts = {},
  totalCount = 0,
}: MatchFilterBarProps) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      {/* ── Country Sidebar ── */}
      <div
        style={{
          width: 188,
          flexShrink: 0,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          maxHeight: "calc(100vh - 180px)",
          overflowY: "auto",
          position: "sticky",
          top: 74,
          boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 14px",
            background: "var(--surface-raised)",
            borderBottom: "1px solid var(--border)",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--text-gold)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "var(--font-sans)",
          }}
        >
          <Globe style={{ width: 12, height: 12 }} />
          <span>Regions</span>
        </div>

        {/* All button */}
        <button
          onClick={() => onCountryChange("all")}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "9px 14px",
            fontSize: 12,
            fontWeight: selectedCountry === "all" ? 600 : 400,
            color: selectedCountry === "all" ? "var(--text-primary)" : "var(--text-secondary)",
            background: selectedCountry === "all" ? "var(--gold-bg)" : "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            borderBottom: "1px solid var(--border-subtle)",
            borderLeft: selectedCountry === "all" ? "2px solid var(--gold)" : "2px solid transparent",
            transition: "all 0.12s",
            fontFamily: "var(--font-sans)",
          }}
        >
          <span>All Regions</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: selectedCountry === "all" ? "var(--text-gold)" : "var(--text-dim)",
              background: selectedCountry === "all" ? "var(--gold-bg)" : "var(--surface-overlay)",
              padding: "1px 6px",
              borderRadius: 4,
              fontFamily: "var(--font-mono)",
            }}
          >
            {totalCount}
          </span>
        </button>

        {/* Country list */}
        {countries.map((country) => (
          <button
            key={country}
            onClick={() => onCountryChange(country)}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: selectedCountry === country ? 600 : 400,
              color: selectedCountry === country ? "var(--text-primary)" : "var(--text-secondary)",
              background: selectedCountry === country ? "var(--gold-bg)" : "transparent",
              border: "none",
              borderBottom: "1px solid var(--border-subtle)",
              borderLeft: selectedCountry === country ? "2px solid var(--gold)" : "2px solid transparent",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.12s",
              fontFamily: "var(--font-sans)",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 115 }}>
              {country}
            </span>
            {countryCounts[country] !== undefined && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: selectedCountry === country ? "var(--text-gold)" : "var(--text-dim)",
                  flexShrink: 0,
                  background: selectedCountry === country ? "var(--gold-bg)" : "var(--surface-overlay)",
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {countryCounts[country]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Main toolbar ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
          {/* Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              width: 260,
            }}
          >
            <Search style={{ width: 13, height: 13, color: "var(--text-dim)" }} />
            <input
              type="text"
              placeholder="Search teams, leagues..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 12,
                color: "var(--text-primary)",
                outline: "none",
                width: "100%",
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
