"use client";

import React, { useState, useMemo } from "react";
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  Search,
  Star,
  Flame,
  ShieldCheck,
  TrendingUp,
  Activity,
} from "lucide-react";
import CountryFlag from "@/components/CountryFlag";
import { normalizeCountryName } from "@/lib/flags";

export interface FilterState {
  market: "all" | "1x2" | "over15" | "over25" | "under25" | "btts" | "double_chance";
  minRating: number; // 0 = all, 6 = 6+, 7 = 7+, 8 = 8+, 9 = 9+
  category: "all" | "top_tips" | "safe_picks" | "value_bets" | "high_scoring" | "live" | "won";
  selectedLeagues: string[]; // empty = all
  searchTerm: string;
  sortBy: "default" | "rating" | "time" | "odds_low" | "odds_high";
}

export const DEFAULT_FILTERS: FilterState = {
  market: "all",
  minRating: 0,
  category: "all",
  selectedLeagues: [],
  searchTerm: "",
  sortBy: "default",
};

interface MatchFilterModalProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableLeagues: Array<{ name: string; country: string; count: number }>;
  totalMatchesCount: number;
  filteredCount: number;
}

export default function MatchFilterModal({
  filters,
  onFilterChange,
  availableLeagues,
  totalMatchesCount,
  filteredCount,
}: MatchFilterModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [leagueSearch, setLeagueSearch] = useState("");

  // Calculate active filter count
  const activeCount = useMemo(() => {
    let count = 0;
    if (filters.market !== "all") count++;
    if (filters.minRating > 0) count++;
    if (filters.category !== "all") count++;
    if (filters.selectedLeagues.length > 0) count++;
    if (filters.searchTerm.trim() !== "") count++;
    return count;
  }, [filters]);

  const filteredLeagueList = useMemo(() => {
    if (!leagueSearch.trim()) return availableLeagues;
    const q = leagueSearch.toLowerCase();
    return availableLeagues.filter(
      (l) => l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q)
    );
  }, [availableLeagues, leagueSearch]);

  const toggleLeague = (name: string) => {
    const next = filters.selectedLeagues.includes(name)
      ? filters.selectedLeagues.filter((l) => l !== name)
      : [...filters.selectedLeagues, name];
    onFilterChange({ ...filters, selectedLeagues: next });
  };

  const resetFilters = () => {
    onFilterChange(DEFAULT_FILTERS);
  };

  return (
    <>
      {/* ── Toolbar Container ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          padding: "12px 16px",
          background: "#141132",
          border: "1px solid rgba(167, 159, 255, 0.12)",
          borderRadius: 14,
          marginBottom: 16,
        }}
      >
        {/* Left: Quick Market Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Markets" },
            { id: "1x2", label: "1X2 Winner" },
            { id: "over25", label: "Over 2.5 Goals" },
            { id: "btts", label: "Both Teams Score" },
          ].map((m) => {
            const isActive = filters.market === m.id && filters.category === "all";
            return (
              <button
                key={m.id}
                onClick={() => onFilterChange({ ...filters, market: m.id as any, category: "all" })}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: isActive ? "1px solid #8b7ff5" : "1px solid rgba(167, 159, 255, 0.1)",
                  background: isActive ? "rgba(139, 127, 245, 0.22)" : "rgba(255, 255, 255, 0.03)",
                  color: isActive ? "#ffffff" : "#a79fff",
                  transition: "all 0.15s ease",
                }}
              >
                {m.label}
              </button>
            );
          })}

          {/* Quick Rating 8+ Button */}
          <button
            onClick={() => onFilterChange({ ...filters, minRating: filters.minRating === 8 ? 0 : 8 })}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              border: filters.minRating === 8 ? "1px solid #ffb020" : "1px solid rgba(167, 159, 255, 0.1)",
              background: filters.minRating === 8 ? "rgba(255, 176, 32, 0.18)" : "rgba(255, 255, 255, 0.03)",
              color: filters.minRating === 8 ? "#ffb020" : "#a79fff",
              transition: "all 0.15s ease",
            }}
          >
            <Star size={12} fill={filters.minRating === 8 ? "#ffb020" : "none"} />
            <span>8.0+ Rating</span>
          </button>

          {/* Quick Top Tips Button */}
          <button
            onClick={() => onFilterChange({ ...filters, category: filters.category === "top_tips" ? "all" : "top_tips" })}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              border: filters.category === "top_tips" ? "1px solid #2fd08a" : "1px solid rgba(167, 159, 255, 0.1)",
              background: filters.category === "top_tips" ? "rgba(47, 208, 138, 0.18)" : "rgba(255, 255, 255, 0.03)",
              color: filters.category === "top_tips" ? "#2fd08a" : "#a79fff",
              transition: "all 0.15s ease",
            }}
          >
            <Flame size={12} />
            <span>Top Tips</span>
          </button>
        </div>

        {/* Right: Search & Main Filter Modal Trigger */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Quick Search */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#1b183d",
              border: "1px solid rgba(167, 159, 255, 0.15)",
              borderRadius: 8,
              padding: "5px 10px",
            }}
          >
            <Search size={13} color="#7874a4" />
            <input
              type="text"
              placeholder="Search team or league..."
              value={filters.searchTerm}
              onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: 12,
                width: 140,
              }}
            />
            {filters.searchTerm && (
              <button
                onClick={() => onFilterChange({ ...filters, searchTerm: "" })}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
              >
                <X size={12} color="#7874a4" />
              </button>
            )}
          </div>

          {/* Master Filter Button (NerdyTips Style) */}
          <button
            onClick={() => setIsOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              cursor: "pointer",
              background: activeCount > 0 ? "linear-gradient(135deg, #8b7ff5 0%, #6a5cf0 100%)" : "#1b183d",
              color: "#ffffff",
              border: activeCount > 0 ? "1px solid #8b7ff5" : "1px solid rgba(167, 159, 255, 0.2)",
              boxShadow: activeCount > 0 ? "0 4px 14px rgba(139, 127, 245, 0.4)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {activeCount > 0 && (
              <span
                style={{
                  background: "#ffffff",
                  color: "#6a5cf0",
                  fontSize: 10,
                  fontWeight: 900,
                  borderRadius: 999,
                  width: 17,
                  height: 17,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {activeCount}
              </span>
            )}
          </button>

          {activeCount > 0 && (
            <button
              onClick={resetFilters}
              title="Reset all filters"
              style={{
                background: "transparent",
                border: "none",
                color: "#7874a4",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Modal / Dialog ── */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(5, 4, 15, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 620,
              maxHeight: "88vh",
              background: "#141132",
              border: "1px solid rgba(167, 159, 255, 0.2)",
              borderRadius: 20,
              boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 24px",
                borderBottom: "1px solid rgba(167, 159, 255, 0.1)",
                background: "#18153f",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SlidersHorizontal size={18} color="#8b7ff5" />
                <h3 style={{ fontSize: 16, fontWeight: 900, color: "#ffffff", margin: 0 }}>
                  Match & Prediction Filters
                </h3>
                {activeCount > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: "rgba(139, 127, 245, 0.2)",
                      color: "#a79fff",
                    }}
                  >
                    {activeCount} active
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#7874a4",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* 1. MARKETS */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: "#a79fff", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 10 }}>
                  Betting Markets
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
                  {[
                    { id: "all", label: "All Markets" },
                    { id: "1x2", label: "1X2 (Match Winner)" },
                    { id: "over15", label: "Over 1.5 Goals" },
                    { id: "over25", label: "Over 2.5 Goals" },
                    { id: "under25", label: "Under 2.5 Goals" },
                    { id: "btts", label: "BTTS (Both Score)" },
                    { id: "double_chance", label: "Double Chance (1X/X2)" },
                  ].map((m) => {
                    const isSelected = filters.market === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => onFilterChange({ ...filters, market: m.id as any })}
                        style={{
                          padding: "9px 12px",
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: isSelected ? "rgba(139, 127, 245, 0.2)" : "#1b183d",
                          color: isSelected ? "#ffffff" : "#a79fff",
                          border: isSelected ? "1px solid #8b7ff5" : "1px solid rgba(167, 159, 255, 0.1)",
                        }}
                      >
                        <span>{m.label}</span>
                        {isSelected && <Check size={13} color="#8b7ff5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. CONFIDENCE RATING */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 800, color: "#a79fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Confidence / Rating Threshold
                  </label>
                  <span style={{ fontSize: 11, fontWeight: 800, color: filters.minRating > 0 ? "#ffb020" : "#7874a4" }}>
                    {filters.minRating > 0 ? `★ ${filters.minRating}.0+ Rating (${filters.minRating * 10}%+ Trust)` : "Any Rating"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {[
                    { val: 0, label: "All" },
                    { val: 6, label: "6.0+" },
                    { val: 7, label: "7.0+" },
                    { val: 8, label: "8.0+" },
                    { val: 9, label: "9.0+" },
                  ].map((r) => {
                    const isSelected = filters.minRating === r.val;
                    return (
                      <button
                        key={r.val}
                        onClick={() => onFilterChange({ ...filters, minRating: r.val })}
                        style={{
                          padding: "8px 6px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          background: isSelected ? "rgba(255, 176, 32, 0.2)" : "#1b183d",
                          color: isSelected ? "#ffb020" : "#a79fff",
                          border: isSelected ? "1px solid #ffb020" : "1px solid rgba(167, 159, 255, 0.1)",
                        }}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. CATEGORIES / TIP TYPES */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 800, color: "#a79fff", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 10 }}>
                  Categories & Game Types
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
                  {[
                    { id: "all", label: "All Matches", icon: Activity },
                    { id: "top_tips", label: "Top Rated Tips", icon: Flame },
                    { id: "safe_picks", label: "Safe Banker Picks", icon: ShieldCheck },
                    { id: "value_bets", label: "High Value Odds (2.0+)", icon: TrendingUp },
                    { id: "high_scoring", label: "Goal Fests (Over 2.5)", icon: Star },
                    { id: "live", label: "Live Matches Only", icon: Activity },
                    { id: "won", label: "Won Matches", icon: Check },
                  ].map((c) => {
                    const isSelected = filters.category === c.id;
                    const Icon = c.icon;
                    return (
                      <button
                        key={c.id}
                        onClick={() => onFilterChange({ ...filters, category: c.id as any })}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: isSelected ? "rgba(47, 208, 138, 0.18)" : "#1b183d",
                          color: isSelected ? "#2fd08a" : "#a79fff",
                          border: isSelected ? "1px solid rgba(47, 208, 138, 0.45)" : "1px solid rgba(167, 159, 255, 0.1)",
                        }}
                      >
                        <Icon size={13} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. LEAGUES & COMPETITIONS */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 800, color: "#a79fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Filter By League ({availableLeagues.length} Available)
                  </label>
                  {filters.selectedLeagues.length > 0 && (
                    <button
                      onClick={() => onFilterChange({ ...filters, selectedLeagues: [] })}
                      style={{ background: "transparent", border: "none", color: "#8b7ff5", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      Clear Leagues ({filters.selectedLeagues.length})
                    </button>
                  )}
                </div>

                {/* League Search */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#1b183d",
                    border: "1px solid rgba(167, 159, 255, 0.15)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    marginBottom: 10,
                  }}
                >
                  <Search size={13} color="#7874a4" />
                  <input
                    type="text"
                    placeholder="Filter league list..."
                    value={leagueSearch}
                    onChange={(e) => setLeagueSearch(e.target.value)}
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#ffffff",
                      fontSize: 12,
                      width: "100%",
                    }}
                  />
                </div>

                <div
                  style={{
                    maxHeight: 140,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    paddingRight: 4,
                  }}
                >
                  {filteredLeagueList.map((lg, idx) => {
                    const isChecked = filters.selectedLeagues.includes(lg.name);
                    return (
                      <div
                        key={`${lg.country || "Int"}_${lg.name}_${idx}`}
                        onClick={() => toggleLeague(lg.name)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          borderRadius: 6,
                          background: isChecked ? "rgba(139, 127, 245, 0.15)" : "rgba(255,255,255,0.02)",
                          border: isChecked ? "1px solid rgba(139, 127, 245, 0.35)" : "1px solid transparent",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 3,
                              border: isChecked ? "1px solid #8b7ff5" : "1px solid #7874a4",
                              background: isChecked ? "#8b7ff5" : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {isChecked && <Check size={10} color="#ffffff" />}
                          </span>
                          <CountryFlag country={lg.country} size={14} />
                          <span style={{ fontSize: 12, fontWeight: isChecked ? 700 : 500, color: isChecked ? "#ffffff" : "#c6c2e8" }}>
                            {lg.name} <small style={{ color: "#7874a4" }}>({normalizeCountryName(lg.country)})</small>
                          </span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#7874a4" }}>
                          {lg.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderTop: "1px solid rgba(167, 159, 255, 0.1)",
                background: "#18153f",
              }}
            >
              <button
                onClick={resetFilters}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "transparent",
                  border: "none",
                  color: "#a79fff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <RotateCcw size={14} />
                <span>Reset All</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: "9px 24px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #8b7ff5 0%, #6a5cf0 100%)",
                  color: "#ffffff",
                  border: "none",
                  boxShadow: "0 4px 16px rgba(124, 108, 245, 0.4)",
                }}
              >
                Show {filteredCount} Matches
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
