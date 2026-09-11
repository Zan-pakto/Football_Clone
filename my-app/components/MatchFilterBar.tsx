"use client";

import { Search, Globe, Filter } from "lucide-react";

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
      <div style={{
        width: 190,
        flexShrink: 0,
        background: "rgba(20, 25, 56, 0.92)",
        border: "1px solid rgba(168, 85, 247, 0.24)",
        borderRadius: 12,
        overflow: "hidden",
        maxHeight: "calc(100vh - 180px)",
        overflowY: "auto",
        position: "sticky",
        top: 74,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4), 0 0 16px rgba(139, 92, 246, 0.08)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 14px",
          background: "linear-gradient(135deg, rgba(28, 34, 76, 0.98) 0%, rgba(20, 25, 58, 0.98) 100%)",
          borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
          fontSize: 11,
          fontWeight: 800,
          color: "#c084fc",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}>
          <Globe style={{ width: 13, height: 13 }} />
          <span>Regions</span>
        </div>

        {/* All Countries */}
        <button
          onClick={() => onCountryChange("all")}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "9px 14px",
            fontSize: 12,
            fontWeight: selectedCountry === "all" ? 800 : 500,
            color: selectedCountry === "all" ? "#ffffff" : "#94a3b8",
            background: selectedCountry === "all" ? "rgba(99, 102, 241, 0.15)" : "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            transition: "background 0.12s",
          }}
        >
          <span>All Regions</span>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: selectedCountry === "all" ? "#34d399" : "#64748b",
            background: selectedCountry === "all" ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.05)",
            padding: "1px 6px",
            borderRadius: 4,
          }}>
            {totalCount}
          </span>
        </button>

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
              fontWeight: selectedCountry === country ? 800 : 400,
              color: selectedCountry === country ? "#ffffff" : "#94a3b8",
              background: selectedCountry === country ? "rgba(99, 102, 241, 0.15)" : "transparent",
              border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.12s",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 115 }}>{country}</span>
            {countryCounts[country] !== undefined && (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: selectedCountry === country ? "#34d399" : "#64748b",
                flexShrink: 0,
                background: selectedCountry === country ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.04)",
                padding: "1px 6px",
                borderRadius: 4,
              }}>
                {countryCounts[country]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Main Content Toolbar ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
          {/* Search Box with Search icon */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: "rgba(12, 15, 36, 0.9)",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: 8,
            width: 260,
          }}>
            <Search style={{ width: 14, height: 14, color: "#818cf8" }} />
            <input
              type="text"
              placeholder="Search teams, leagues..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 12,
                color: "#f8fafc",
                outline: "none",
                width: "100%",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
