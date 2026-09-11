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
          background: "rgba(15,15,26,0.97)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10,
          overflow: "hidden",
          maxHeight: "calc(100vh - 180px)",
          overflowY: "auto",
          position: "sticky",
          top: 74,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 14px",
            background: "rgba(9,9,15,0.9)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            fontSize: 10,
            fontWeight: 700,
            color: "#c9a84c",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: "'Inter', sans-serif",
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
            color: selectedCountry === "all" ? "#f5f3ee" : "#484858",
            background: selectedCountry === "all" ? "rgba(201,168,76,0.08)" : "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
            borderLeft: selectedCountry === "all" ? "2px solid #c9a84c" : "2px solid transparent",
            transition: "all 0.12s",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <span>All Regions</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: selectedCountry === "all" ? "#c9a84c" : "#2a2a3d",
              background: selectedCountry === "all" ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)",
              padding: "1px 6px",
              borderRadius: 4,
              fontFamily: "'JetBrains Mono', monospace",
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
              color: selectedCountry === country ? "#f5f3ee" : "#484858",
              background: selectedCountry === country ? "rgba(201,168,76,0.06)" : "transparent",
              border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.02)",
              borderLeft: selectedCountry === country ? "2px solid #c9a84c" : "2px solid transparent",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.12s",
              fontFamily: "'Inter', sans-serif",
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
                  color: selectedCountry === country ? "#c9a84c" : "#2a2a3d",
                  flexShrink: 0,
                  background: selectedCountry === country ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.03)",
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontFamily: "'JetBrains Mono', monospace",
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
              background: "rgba(15,15,26,0.95)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8,
              width: 260,
            }}
          >
            <Search style={{ width: 13, height: 13, color: "#484858" }} />
            <input
              type="text"
              placeholder="Search teams, leagues..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 12,
                color: "#f5f3ee",
                outline: "none",
                width: "100%",
                fontFamily: "'Inter', sans-serif",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
