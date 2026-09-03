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
}

const tabs = [
  { id: "all", label: "All Matches" },
  { id: "live", label: "🔴 Live Now" },
  { id: "upcoming", label: "Upcoming" },
  { id: "finished", label: "Finished / Won" },
];

export default function MatchFilterBar({
  activeTab, onTabChange,
  searchTerm, onSearchChange,
  selectedCountry, onCountryChange,
  countries,
}: MatchFilterBarProps) {
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between",
      background: "#111827", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "12px 16px",
      marginBottom: 20,
    }}>
      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto" }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: "6px 14px", borderRadius: 9,
                fontSize: 12, fontWeight: isActive ? 800 : 600,
                color: isActive ? "#000" : "#64748b",
                background: isActive ? "#10b981" : "rgba(255,255,255,0.04)",
                border: isActive ? "none" : "1px solid rgba(255,255,255,0.07)",
                cursor: "pointer", whiteSpace: "nowrap",
                boxShadow: isActive ? "0 2px 8px rgba(16,185,129,0.3)" : "none",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search + Country */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Country Select */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "#0f1624", border: "1px solid rgba(255,255,255,0.08)",
          padding: "6px 12px", borderRadius: 9,
        }}>
          <Globe style={{ width: 13, height: 13, color: "#64748b", flexShrink: 0 }} />
          <select
            value={selectedCountry}
            onChange={(e) => onCountryChange(e.target.value)}
            style={{
              background: "transparent", border: "none", outline: "none",
              fontSize: 12, color: "#e2e8f0", cursor: "pointer", maxWidth: 120,
            }}
          >
            <option value="all" style={{ background: "#111827" }}>All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c} style={{ background: "#111827" }}>{c}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div style={{ position: "relative", minWidth: 180 }}>
          <Search style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            width: 13, height: 13, color: "#64748b",
          }} />
          <input
            type="text"
            placeholder="Search teams, leagues..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%", padding: "7px 12px 7px 30px",
              background: "#0f1624", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 9, fontSize: 12, color: "#e2e8f0", outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(16,185,129,0.4)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
          />
        </div>
      </div>
    </div>
  );
}
