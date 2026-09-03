"use client";

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
      {/* ── Country Sidebar (NerdyTips style) ── */}
      <div style={{
        width: 180,
        flexShrink: 0,
        background: "#0d1220",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8,
        overflow: "hidden",
        maxHeight: "calc(100vh - 180px)",
        overflowY: "auto",
        position: "sticky",
        top: 74,
      }}>
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
            fontWeight: selectedCountry === "all" ? 700 : 500,
            color: selectedCountry === "all" ? "#fff" : "#94a3b8",
            background: selectedCountry === "all" ? "rgba(255,255,255,0.06)" : "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            transition: "background 0.1s",
          }}
        >
          <span>All Countries</span>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: selectedCountry === "all" ? "#10b981" : "#475569",
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
              fontWeight: selectedCountry === country ? 700 : 400,
              color: selectedCountry === country ? "#fff" : "#94a3b8",
              background: selectedCountry === country ? "rgba(255,255,255,0.06)" : "transparent",
              border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.1s",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>{country}</span>
            {countryCounts[country] !== undefined && (
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: selectedCountry === country ? "#10b981" : "#475569",
                flexShrink: 0,
              }}>
                {countryCounts[country]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Main Content (right of sidebar) ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Top toolbar: tabs + search */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search teams, leagues..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              padding: "7px 12px",
              background: "#0d1220",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              fontSize: 12,
              color: "#e2e8f0",
              outline: "none",
              width: 220,
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(16,185,129,0.35)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
          />
        </div>
      </div>
    </div>
  );
}
