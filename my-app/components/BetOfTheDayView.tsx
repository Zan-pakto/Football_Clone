"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  Sparkles,
  X,
  Layers,
  Clock,
  TrendingUp,
  Info,
  Lock,
  CheckCircle2,
  Copy,
  Share2,
  ChevronRight,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { getCountryFlagUrl, normalizeCountryName } from "@/lib/flags";

export interface BotdMatch {
  id: string;
  href: string;
  kickoff: string;
  status: "UPCOMING" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED" | "WON" | "LOST";
  country: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  odds: {
    home: number | null;
    draw: number | null;
    away: number | null;
  };
  bestTip: string;
  tipOdds: number;
  confidence: string;
  confidenceValue: number;
  rating: number;
  pickScore?: {
    pick: string | null;
    odd: number | null;
    rating: number | null;
  };
  goals?: {
    pick: string | null;
    odd: number | null;
    rating: number | null;
  };
  btts?: {
    pick: string | null;
    odd: number | null;
    rating: number | null;
  };
  score?: string;
  homeScore?: number;
  awayScore?: number;
  isPremium?: boolean;
  isLocked?: boolean;
  predictions?: {
    pickScore?: { pick: string | null; odd: number | null; rating: number | null };
    goals?: { pick: string | null; odd: number | null; rating: number | null };
    btts?: { pick: string | null; odd: number | null; rating: number | null };
    bestTip?: { pick: string | null; odd: number | null; rating: number | null };
  };
}

export interface BotdStats {
  bankers: {
    count: number;
    upcoming: number;
    successRate: string;
  };
  slip: {
    count: number;
    upcoming: number;
    totalOdds: number;
  };
}

interface BetOfTheDayViewProps {
  initialDay?: string; // "0", "-1", "1", "yesterday", "tomorrow", etc.
}

// Generate the 7 date rail buttons relative to today
function getDateRailItems() {
  const now = new Date();
  const items = [];
  const offsetLabels: Record<number, string> = {
    [-3]: "3-days-ago",
    [-2]: "2-days-ago",
    [-1]: "yesterday",
    [0]: "today",
    [1]: "tomorrow",
    [2]: "day-after-tomorrow",
    [3]: "in-3-days",
  };

  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    const month = d.toLocaleString("en-US", { month: "short" });
    const dayNum = d.getDate();

    let displayLabel = `${month} ${dayNum}`;
    if (offset === -1) displayLabel = "Yesterday";
    else if (offset === 0) displayLabel = "Today";
    else if (offset === 1) displayLabel = "Tomorrow";

    const path = offset === 0 ? "/bet-of-the-day" : `/bet-of-the-day/${offsetLabels[offset]}`;

    items.push({
      offset: String(offset),
      slug: offsetLabels[offset],
      label: displayLabel,
      fullDateStr: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
      path,
    });
  }
  return items;
}

export default function BetOfTheDayView({ initialDay = "0" }: BetOfTheDayViewProps) {
  const router = useRouter();

  // Normalize initial day alias
  const normalizedInitial = useMemo(() => {
    const s = initialDay.toLowerCase().trim();
    if (s === "yesterday" || s === "-1") return "-1";
    if (s === "today" || s === "0") return "0";
    if (s === "tomorrow" || s === "1") return "1";
    if (s === "2-days-ago" || s === "-2") return "-2";
    if (s === "3-days-ago" || s === "-3") return "-3";
    if (s === "day-after-tomorrow" || s === "2") return "2";
    if (s === "in-3-days" || s === "3") return "3";
    return s || "0";
  }, [initialDay]);

  const [selectedDay, setSelectedDay] = useState<string>(normalizedInitial);
  const [activeTab, setActiveTab] = useState<"bankers" | "slip">("bankers");
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "won">("all");
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [stake, setStake] = useState<number>(50);
  const [copied, setCopied] = useState<boolean>(false);

  // Data state
  const [loading, setLoading] = useState<boolean>(true);
  const [userTier, setUserTier] = useState<"free" | "premium">("free");
  const [stats, setStats] = useState<BotdStats>({
    bankers: { count: 0, upcoming: 0, successRate: "0%" },
    slip: { count: 0, upcoming: 0, totalOdds: 1.0 },
  });
  const [bankers, setBankers] = useState<BotdMatch[]>([]);
  const [slip, setSlip] = useState<BotdMatch[]>([]);

  // Live in-play scores map: id -> { status, elapsed, gh, ga }
  const [liveScores, setLiveScores] = useState<Record<string, any>>({});

  const dateRail = useMemo(() => getDateRailItems(), []);

  const activeDateItem = useMemo(() => {
    return dateRail.find((item) => item.offset === selectedDay) || dateRail[3];
  }, [dateRail, selectedDay]);

  // Fetch Bet of the Day data
  const fetchBotdData = useCallback(async (day: string) => {
    try {
      setLoading(true);
      const tz = -new Date().getTimezoneOffset();
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/bet-of-the-day?d=${day}&tz=${tz}`, {
        headers,
        credentials: "include",
      });

      if (!res.ok) return;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("json")) return;

      const data = await res.json();
      if (data.success) {
        setUserTier(data.userTier || "free");
        if (data.stats) setStats(data.stats);
        if (Array.isArray(data.bankers)) setBankers(data.bankers);
        if (Array.isArray(data.slip)) setSlip(data.slip);
      }
    } catch (err) {
      console.error("Failed to fetch Bet of the Day:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBotdData(selectedDay);
  }, [selectedDay, fetchBotdData]);

  // Live polling for in-play scores
  useEffect(() => {
    const allMatches = [...bankers, ...slip];
    const matchIds = allMatches.map((m) => m.id).filter(Boolean);
    if (matchIds.length === 0) return;

    let isMounted = true;
    async function pollLiveScores() {
      try {
        const res = await fetch(`/api/bet-of-the-day/live?ids=${matchIds.slice(0, 20).join(",")}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && data.matches) {
          setLiveScores(data.matches);
        }
      } catch {
        // quiet error
      }
    }

    // Run first poll after 5 seconds, then every 30 seconds
    const initialTimer = setTimeout(pollLiveScores, 5000);
    const interval = setInterval(pollLiveScores, 30000);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [bankers, slip]);

  const handleDateChange = (targetOffset: string, targetPath: string) => {
    setSelectedDay(targetOffset);
    router.push(targetPath);
  };

  // Current match list based on active tab
  const currentList = useMemo(() => {
    const base = activeTab === "bankers" ? bankers : slip;
    if (activeFilter === "all") return base;
    if (activeFilter === "upcoming") {
      return base.filter((m) => m.status === "UPCOMING");
    }
    if (activeFilter === "won") {
      return base.filter((m) => m.status === "WON" || m.status === "FINISHED");
    }
    return base;
  }, [activeTab, activeFilter, bankers, slip]);

  // Handle accumulator slip copy
  const handleCopySlip = () => {
    if (slip.length === 0) return;
    const text = slip
      .map(
        (m, i) =>
          `${i + 1}. ${m.homeTeam} vs ${m.awayTeam} -> Tip: ${m.bestTip || m.predictions?.bestTip?.pick || "1"} @ ${m.tipOdds || m.predictions?.bestTip?.odd || "1.50"}`
      )
      .join("\n");
    navigator.clipboard.writeText(
      `🔥 NerdyTips Slip of the Day (Total Odds: ${stats.slip.totalOdds})\n\n${text}\n\nVia JollofTips NT Apex AI`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const potentialReturn = (stake * (stats.slip.totalOdds || 1)).toFixed(2);

  return (
    <div style={{ background: "#0a081d", minHeight: "100vh", color: "#d4cde3" }}>
      <Navbar />

      {/* ══════════════════════════════════════════════════════════════
          1. HORIZONTAL DATE RAIL (IDENTICAL TO NERDYTIPS DATERAIL)
          ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          borderTop: "1px solid rgba(167, 159, 255, 0.1)",
          borderBottom: "1px solid rgba(167, 159, 255, 0.1)",
          background: "rgba(8, 7, 30, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          position: "sticky",
          top: 60,
          zIndex: 30,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflowX: "auto",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {dateRail.map((item) => {
            const isActive = selectedDay === item.offset;
            return (
              <Link
                key={item.offset}
                href={item.path}
                onClick={() => setSelectedDay(item.offset)}
                style={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  padding: "8px 18px",
                  borderRadius: 999,
                  fontSize: 13.5,
                  fontWeight: isActive ? 700 : 600,
                  textDecoration: "none",
                  display: "inline-block",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  background: isActive
                    ? "linear-gradient(90deg, #8b7ff5 0%, #6a5cf0 100%)"
                    : "transparent",
                  color: isActive ? "#ffffff" : "rgba(212, 205, 227, 0.7)",
                  boxShadow: isActive ? "0 4px 16px rgba(124, 108, 245, 0.35)" : "none",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px 60px" }}>
        {/* ══════════════════════════════════════════════════════════════
            2. SUBSCRIPTION NOTICE BANNER (NERDYTIPS SUB-NOTICE)
            ══════════════════════════════════════════════════════════════ */}
        {!bannerDismissed && userTier !== "premium" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(124, 108, 245, 0.12) 0%, rgba(27, 24, 61, 0.5) 100%)",
              border: "1px solid rgba(167, 159, 255, 0.18)",
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 18 }}>🚀</span>
            <p style={{ margin: 0, fontSize: 13, color: "#d4cde3", flex: 1, lineHeight: 1.4 }}>
              Predictions are locked without a subscription, but you can enjoy the selection of free tips.{" "}
              <Link href="/pricing" style={{ color: "#a79fff", fontWeight: 700, textDecoration: "underline" }}>
                Unlock VIP Access &rarr;
              </Link>
            </p>
            <button
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss notice"
              style={{
                background: "transparent",
                border: "none",
                color: "#7874a4",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            3. HERO SECTION (NERDYTIPS BOTD HERO)
            ══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: "relative",
            padding: "28px 24px",
            borderRadius: 16,
            background: "linear-gradient(160deg, rgba(124, 108, 245, 0.08) 0%, rgba(14, 12, 38, 0.8) 100%)",
            border: "1px solid rgba(167, 159, 255, 0.12)",
            marginBottom: 24,
            overflow: "hidden",
          }}
        >
          {/* Subtle Ambient Glowing Orbs */}
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124, 108, 245, 0.22) 0%, transparent 70%)",
              filter: "blur(30px)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 999,
                background: "rgba(124, 108, 245, 0.18)",
                border: "1px solid rgba(124, 108, 245, 0.35)",
                color: "#a79fff",
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              <Sparkles size={13} color="#a79fff" />
              <span>Powered by NT Apex AI</span>
            </div>

            <h1
              style={{
                margin: "0 0 8px",
                fontSize: "clamp(22px, 3vw, 32px)",
                fontWeight: 900,
                color: "#f1eff8",
                letterSpacing: "-0.02em",
              }}
            >
              {activeDateItem.label === "Today"
                ? "Bet of the Day & Slip of the Day"
                : `${activeDateItem.label}'s Bet of the Day & Slip`}
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "#7874a4",
                maxWidth: 760,
                lineHeight: 1.5,
              }}
            >
              {activeDateItem.label === "Today"
                ? "Today's Bet of the Day and Slip of the Day from NerdyTips – AI-selected football bankers rated above 9/10 confidence, plus a ready-made accumulator."
                : `AI-selected football bankers rated above 9/10 confidence for ${activeDateItem.fullDateStr}, alongside ready-made accumulator selections.`}
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            4. STAT FILTER BOARD (3 INTERACTIVE STAT BUTTON CARDS)
            ══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {/* Card 1: Bankers / Slip */}
          <button
            onClick={() => setActiveFilter("all")}
            style={{
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column-reverse",
              justifyContent: "center",
              gap: 2,
              padding: "12px 16px",
              minHeight: 68,
              borderRadius: 14,
              border:
                activeFilter === "all"
                  ? "1px solid #7c6cf5"
                  : "1px solid rgba(167, 159, 255, 0.12)",
              background:
                activeFilter === "all"
                  ? "linear-gradient(160deg, rgba(124, 108, 245, 0.2), rgba(27, 24, 61, 0.6))"
                  : "linear-gradient(160deg, rgba(167, 159, 255, 0.05), rgba(27, 24, 61, 0.3))",
              textAlign: "start",
              cursor: "pointer",
              transition: "all 0.18s ease",
            }}
          >
            <b style={{ fontSize: 24, fontWeight: 800, color: "#f1eff8", lineHeight: 1.1 }}>
              {loading ? "-" : activeTab === "bankers" ? stats.bankers.count : stats.slip.count}
            </b>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: activeFilter === "all" ? "#a79fff" : "#7874a4",
              }}
            >
              {activeTab === "bankers" ? "Bankers" : "Slip Selections"}
            </span>
          </button>

          {/* Card 2: Upcoming */}
          <button
            onClick={() => setActiveFilter("upcoming")}
            style={{
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column-reverse",
              justifyContent: "center",
              gap: 2,
              padding: "12px 16px",
              minHeight: 68,
              borderRadius: 14,
              border:
                activeFilter === "upcoming"
                  ? "1px solid #7c6cf5"
                  : "1px solid rgba(167, 159, 255, 0.12)",
              background:
                activeFilter === "upcoming"
                  ? "linear-gradient(160deg, rgba(124, 108, 245, 0.2), rgba(27, 24, 61, 0.6))"
                  : "linear-gradient(160deg, rgba(167, 159, 255, 0.05), rgba(27, 24, 61, 0.3))",
              textAlign: "start",
              cursor: "pointer",
              transition: "all 0.18s ease",
            }}
          >
            <b style={{ fontSize: 24, fontWeight: 800, color: "#f1eff8", lineHeight: 1.1 }}>
              {loading ? "-" : activeTab === "bankers" ? stats.bankers.upcoming : stats.slip.upcoming}
            </b>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: activeFilter === "upcoming" ? "#a79fff" : "#7874a4",
              }}
            >
              Upcoming
            </span>
          </button>

          {/* Card 3: Success or Total Odds */}
          <button
            onClick={() => setActiveFilter("won")}
            style={{
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column-reverse",
              justifyContent: "center",
              gap: 2,
              padding: "12px 16px",
              minHeight: 68,
              borderRadius: 14,
              border:
                activeFilter === "won"
                  ? "1px solid #2fd08a"
                  : "1px solid rgba(47, 208, 138, 0.2)",
              background:
                activeFilter === "won"
                  ? "linear-gradient(160deg, rgba(47, 208, 138, 0.22), rgba(27, 24, 61, 0.6))"
                  : "linear-gradient(160deg, rgba(47, 208, 138, 0.08), rgba(27, 24, 61, 0.3))",
              textAlign: "start",
              cursor: "pointer",
              transition: "all 0.18s ease",
            }}
          >
            <b style={{ fontSize: 24, fontWeight: 800, color: "#2fd08a", lineHeight: 1.1 }}>
              {loading
                ? "-"
                : activeTab === "bankers"
                ? stats.bankers.successRate
                : stats.slip.totalOdds.toFixed(2)}
            </b>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: activeFilter === "won" ? "#2fd08a" : "#7874a4",
              }}
            >
              {activeTab === "bankers" ? "Success Rate" : "Total Odds"}
            </span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            5. TABS BAR: BANKERS vs SLIP OF THE DAY + INFO MODAL TRIGGER
            ══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: 4,
              borderRadius: 12,
              background: "#141132",
              border: "1px solid rgba(167, 159, 255, 0.12)",
              gap: 4,
            }}
          >
            <button
              onClick={() => setActiveTab("bankers")}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: activeTab === "bankers" ? "#7c6cf5" : "transparent",
                color: activeTab === "bankers" ? "#ffffff" : "#7874a4",
              }}
            >
              Bankers
            </button>
            <button
              onClick={() => setActiveTab("slip")}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: activeTab === "slip" ? "#7c6cf5" : "transparent",
                color: activeTab === "slip" ? "#ffffff" : "#7874a4",
              }}
            >
              Slip of the Day
            </button>
          </div>

          <button
            onClick={() => setShowInfoModal(true)}
            aria-label="Betting Tips Explained"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#141132",
              border: "1px solid rgba(167, 159, 255, 0.15)",
              color: "#a79fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            <Info size={16} />
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            6. ACCUMULATOR ACTION BAR (SHOWN WHEN SLIP TAB IS ACTIVE)
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === "slip" && slip.length > 0 && (
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 14,
              background: "linear-gradient(135deg, rgba(27, 24, 61, 0.95) 0%, rgba(20, 17, 50, 0.95) 100%)",
              border: "1px solid rgba(124, 108, 245, 0.35)",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#7874a4", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Ready-Made Accumulator
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: "#2fd08a" }}>
                  {stats.slip.totalOdds.toFixed(2)}
                </span>
                <span style={{ fontSize: 12, color: "#a79fff" }}>
                  Combined Odds ({slip.length} matches)
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#0e0c26", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(167, 159, 255, 0.15)" }}>
                <span style={{ fontSize: 12, color: "#7874a4", fontWeight: 700 }}>Stake: $</span>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={stake}
                  onChange={(e) => setStake(Math.max(1, Number(e.target.value) || 1))}
                  style={{
                    width: 54,
                    background: "transparent",
                    border: "none",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 800,
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: 12, color: "#2fd08a", fontWeight: 700, marginLeft: 6 }}>
                  &rarr; Return: ${potentialReturn}
                </span>
              </div>

              <button
                onClick={handleCopySlip}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 8,
                  background: copied ? "#2fd08a" : "#7c6cf5",
                  border: "none",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                <span>{copied ? "Copied Slip!" : "Copy Slip"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            7. MATCH LIST / TABLE (IDENTICAL NERDYTIPS STRUCTURE)
            ══════════════════════════════════════════════════════════════ */}
        <div
          style={{
            overflow: "hidden",
            borderRadius: 16,
            border: "1px solid rgba(167, 159, 255, 0.12)",
            background: "linear-gradient(to bottom, rgba(27, 24, 61, 0.45) 0%, rgba(8, 7, 30, 0.6) 100%)",
          }}
        >
          {/* Desktop Table Header */}
          <div
            className="botd-table-header-desktop"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              background: "rgba(20, 17, 50, 0.7)",
              borderBottom: "1px solid rgba(167, 159, 255, 0.1)",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#7874a4",
            }}
          >
            <div style={{ width: 68 }}>Hour</div>
            <div style={{ flex: 1, minWidth: 200 }}>Matches</div>
            <div style={{ display: "flex", gap: 8, width: 140, justifyContent: "center" }}>
              <span style={{ width: 42, textAlign: "center" }}>1</span>
              <span style={{ width: 42, textAlign: "center" }}>X</span>
              <span style={{ width: 42, textAlign: "center" }}>2</span>
            </div>
            <div style={{ display: "flex", gap: 6, width: 190, justifyContent: "center" }}>
              <span style={{ width: 60, textAlign: "center" }}>1X2</span>
              <span style={{ width: 60, textAlign: "center" }}>O/U</span>
              <span style={{ width: 54, textAlign: "center" }}>BTTS</span>
            </div>
            <div style={{ display: "flex", gap: 8, width: 150, justifyContent: "flex-end" }}>
              <span style={{ width: 70, textAlign: "center" }}>Best Tip</span>
              <span style={{ width: 60, textAlign: "center" }}>Trust</span>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#7874a4" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: "3px solid rgba(124, 108, 245, 0.2)",
                  borderTopColor: "#7c6cf5",
                  borderRadius: "50%",
                  margin: "0 auto 12px",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <p style={{ fontSize: 13, margin: 0 }}>Analyzing algorithmic banker picks...</p>
            </div>
          ) : currentList.length === 0 ? (
            /* Empty State matching NerdyTips */
            <div style={{ padding: "56px 24px", textAlign: "center" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(124, 108, 245, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  color: "#8b7ff5",
                }}
              >
                <Layers size={24} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#f1eff8", margin: 0 }}>
                {activeTab === "bankers"
                  ? "Until now, there are no bankers for this day."
                  : "No accumulator matches available for this day."}
              </p>
              <p style={{ fontSize: 13, color: "#7874a4", margin: "6px 0 0" }}>
                Check back soon or explore our full predictions in All Matches.
              </p>
            </div>
          ) : (
            /* Match Rows */
            <div>
              {currentList.map((match, idx) => {
                const live = liveScores[match.id];
                const isLiveNow = live && (live.status === "1st Half" || live.status === "2nd Half" || live.status === "Halftime" || match.status === "LIVE");
                const homeScore = live?.gh !== undefined ? live.gh : match.homeScore;
                const awayScore = live?.ga !== undefined ? live.ga : match.awayScore;
                const flagUrl = getCountryFlagUrl(match.country);

                // Prediction picks (respecting lock state for free users)
                const pickScore = match.predictions?.pickScore?.pick || match.pickScore?.pick || "1";
                const pickGoals = match.predictions?.goals?.pick || match.goals?.pick || "Over 2.5";
                const pickBtts = match.predictions?.btts?.pick || match.btts?.pick || "Yes";
                const bestTip = match.predictions?.bestTip?.pick || match.bestTip || "1";
                const bestOdd = match.predictions?.bestTip?.odd || match.tipOdds || match.odds.home || 1.8;
                const ratingVal = match.rating ? match.rating.toFixed(1) : "8.5";

                return (
                  <div
                    key={match.id || idx}
                    style={{
                      borderBottom: "1px solid rgba(167, 159, 255, 0.08)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(124, 108, 245, 0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Desktop & Tablet Row */}
                    <div
                      className="botd-row-desktop"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "14px 16px",
                        gap: 12,
                      }}
                    >
                      {/* 1. Time / Live Status */}
                      <div style={{ width: 68, flexShrink: 0 }}>
                        {isLiveNow ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "rgba(255, 93, 120, 0.2)",
                              color: "#ff5d78",
                              fontSize: 11,
                              fontWeight: 800,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#ff5d78",
                                animation: "pulse 1s infinite",
                              }}
                            />
                            {live?.elapsed ? `${live.elapsed}'` : "LIVE"}
                          </span>
                        ) : match.status === "FINISHED" || match.status === "WON" || match.status === "LOST" ? (
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#7874a4" }}>FT</span>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#f1eff8" }}>
                            {match.kickoff || "18:00"}
                          </span>
                        )}
                      </div>

                      {/* 2. Teams & League Info */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          {flagUrl && (
                            <img
                              src={flagUrl}
                              alt={match.country}
                              width={16}
                              height={11}
                              style={{ borderRadius: 2, objectFit: "cover" }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                          <span style={{ fontSize: 11, color: "#7874a4", fontWeight: 600 }}>
                            {normalizeCountryName(match.country)} · {match.league}
                          </span>
                        </div>

                        {/* Home Team */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#f1eff8" }}>
                            {match.homeTeam}
                          </span>
                          {homeScore !== undefined && (
                            <span style={{ fontSize: 14, fontWeight: 900, color: "#ffffff", marginLeft: 8 }}>
                              {homeScore}
                            </span>
                          )}
                        </div>

                        {/* Away Team */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#f1eff8" }}>
                            {match.awayTeam}
                          </span>
                          {awayScore !== undefined && (
                            <span style={{ fontSize: 14, fontWeight: 900, color: "#ffffff", marginLeft: 8 }}>
                              {awayScore}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 3. Odds 1 X 2 */}
                      <div style={{ display: "flex", gap: 8, width: 140, justifyContent: "center", flexShrink: 0 }}>
                        <div
                          style={{
                            width: 42,
                            padding: "6px 0",
                            borderRadius: 6,
                            background: "#141132",
                            border: "1px solid rgba(167, 159, 255, 0.1)",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#d4cde3",
                            textAlign: "center",
                          }}
                        >
                          {match.odds.home ? match.odds.home.toFixed(2) : "-"}
                        </div>
                        <div
                          style={{
                            width: 42,
                            padding: "6px 0",
                            borderRadius: 6,
                            background: "#141132",
                            border: "1px solid rgba(167, 159, 255, 0.1)",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#d4cde3",
                            textAlign: "center",
                          }}
                        >
                          {match.odds.draw ? match.odds.draw.toFixed(2) : "-"}
                        </div>
                        <div
                          style={{
                            width: 42,
                            padding: "6px 0",
                            borderRadius: 6,
                            background: "#141132",
                            border: "1px solid rgba(167, 159, 255, 0.1)",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#d4cde3",
                            textAlign: "center",
                          }}
                        >
                          {match.odds.away ? match.odds.away.toFixed(2) : "-"}
                        </div>
                      </div>

                      {/* 4. Pick Markets: 1X2, O/U, BTTS */}
                      <div style={{ display: "flex", gap: 6, width: 190, justifyContent: "center", flexShrink: 0 }}>
                        {match.isLocked ? (
                          <div
                            style={{
                              width: "100%",
                              height: 38,
                              borderRadius: 8,
                              background: "rgba(20, 17, 50, 0.5)",
                              border: "1px dashed rgba(167, 159, 255, 0.2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              color: "#7874a4",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            <Lock size={12} color="#ffb020" />
                            <span>Locked for Free Users</span>
                          </div>
                        ) : (
                          <>
                            {/* 1X2 */}
                            <div className="tb-mcell" style={{ width: 60 }}>
                              <span style={{ fontSize: 11.5, fontWeight: 800, color: "#f1eff8" }}>
                                {pickScore}
                              </span>
                            </div>
                            {/* O/U */}
                            <div className="tb-mcell" style={{ width: 60 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: "#f1eff8" }}>
                                {pickGoals}
                              </span>
                            </div>
                            {/* BTTS */}
                            <div className="tb-mcell" style={{ width: 54 }}>
                              <span style={{ fontSize: 11.5, fontWeight: 800, color: "#f1eff8" }}>
                                {pickBtts}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* 5. Best Tip & Trust Rating */}
                      <div style={{ display: "flex", gap: 8, width: 150, justifyContent: "flex-end", alignItems: "center", flexShrink: 0 }}>
                        {match.isLocked ? (
                          <Link
                            href="/pricing"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "6px 12px",
                              borderRadius: 8,
                              background: "rgba(255, 176, 32, 0.15)",
                              border: "1px solid rgba(255, 176, 32, 0.4)",
                              color: "#ffb020",
                              fontSize: 11,
                              fontWeight: 800,
                              textDecoration: "none",
                            }}
                          >
                            <Lock size={12} />
                            <span>Unlock</span>
                          </Link>
                        ) : (
                          <>
                            {/* Best Tip Pill */}
                            <div
                              style={{
                                width: 72,
                                height: 38,
                                borderRadius: 8,
                                background: "rgba(124, 108, 245, 0.18)",
                                border: "1px solid rgba(124, 108, 245, 0.5)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <span style={{ fontSize: 11.5, fontWeight: 900, color: "#a79fff" }}>
                                {bestTip}
                              </span>
                              <span style={{ fontSize: 9.5, fontWeight: 700, color: "#7874a4" }}>
                                @{bestOdd}
                              </span>
                            </div>

                            {/* True Rating */}
                            <div
                              style={{
                                width: 52,
                                height: 38,
                                borderRadius: 8,
                                background:
                                  Number(ratingVal) >= 9.0
                                    ? "linear-gradient(135deg, rgba(47, 208, 138, 0.25) 0%, rgba(16, 185, 129, 0.25) 100%)"
                                    : "rgba(124, 108, 245, 0.15)",
                                border:
                                  Number(ratingVal) >= 9.0
                                    ? "1px solid rgba(47, 208, 138, 0.6)"
                                    : "1px solid rgba(124, 108, 245, 0.4)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: Number(ratingVal) >= 9.0 ? "#2fd08a" : "#8b7ff5",
                                fontSize: 14,
                                fontWeight: 900,
                              }}
                            >
                              {ratingVal}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile Row */}
                    <div
                      className="botd-row-mobile"
                      style={{
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          {isLiveNow ? (
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#ff5d78" }}>
                              ● {live?.elapsed ? `${live.elapsed}'` : "LIVE"}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#7874a4" }}>
                              {match.kickoff}
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: "#7874a4" }}>·</span>
                          <span style={{ fontSize: 11, color: "#7874a4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {match.league}
                          </span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#f1eff8" }}>{match.homeTeam}</span>
                          {homeScore !== undefined && <b style={{ fontSize: 13, color: "#fff" }}>{homeScore}</b>}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#f1eff8" }}>{match.awayTeam}</span>
                          {awayScore !== undefined && <b style={{ fontSize: 13, color: "#fff" }}>{awayScore}</b>}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {match.isLocked ? (
                          <Link
                            href="/pricing"
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              background: "rgba(255, 176, 32, 0.15)",
                              border: "1px solid rgba(255, 176, 32, 0.4)",
                              color: "#ffb020",
                              fontSize: 11,
                              fontWeight: 800,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Lock size={11} />
                            <span>VIP</span>
                          </Link>
                        ) : (
                          <>
                            <div
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: "rgba(124, 108, 245, 0.2)",
                                border: "1px solid rgba(124, 108, 245, 0.4)",
                                color: "#a79fff",
                                fontSize: 11.5,
                                fontWeight: 800,
                                textAlign: "center",
                              }}
                            >
                              {bestTip}
                            </div>
                            <div
                              style={{
                                padding: "4px 7px",
                                borderRadius: 6,
                                background: Number(ratingVal) >= 9.0 ? "rgba(47, 208, 138, 0.2)" : "rgba(124, 108, 245, 0.15)",
                                color: Number(ratingVal) >= 9.0 ? "#2fd08a" : "#8b7ff5",
                                fontSize: 12,
                                fontWeight: 900,
                              }}
                            >
                              {ratingVal}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            8. SEO / EDUCATIONAL FOOTER ARTICLE (AUTHENTIC NERDYTIPS TEXT)
            ══════════════════════════════════════════════════════════════ */}
        <section
          style={{
            marginTop: 48,
            paddingTop: 32,
            borderTop: "1px solid rgba(167, 159, 255, 0.12)",
            color: "#7874a4",
            fontSize: 13.5,
            lineHeight: 1.7,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#f1eff8", marginBottom: 12 }}>
            Bet of the Day & Slip of the Day – AI Football Bankers
          </h2>
          <p style={{ margin: "0 0 16px" }}>
            The <strong>Bet of the Day</strong> is our single highest-confidence football tip generated by AI for each fixture slate, and the <strong>Slip of the Day</strong> bundles together our top algorithmic picks into a curated accumulator slip. Every call originates from matches our NT Apex AI model rates above the strict 9/10 trust threshold – derived from team form, expected goals (xG), head-to-head records, and dynamic line movement.
          </p>
          <p style={{ margin: "0 0 16px" }}>
            Our model cross-references over 700 international leagues with historical outcome databases to uncover asymmetric betting value. Whether you are building single banker bets or multi-leg accumulator slips, every pick on this page provides deep mathematical justification.
          </p>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════════
          9. TIPS EXPLANATION MODAL (INFO "i" BUTTON DIALOG)
          ══════════════════════════════════════════════════════════════ */}
      {showInfoModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(10, 8, 29, 0.8)",
            backdropFilter: "blur(6px)",
            padding: 16,
          }}
          onClick={() => setShowInfoModal(false)}
        >
          <div
            style={{
              maxWidth: 480,
              width: "100%",
              background: "#141132",
              border: "1px solid rgba(167, 159, 255, 0.2)",
              borderRadius: 16,
              padding: 24,
              color: "#f1eff8",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Betting Tips Explained</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                style={{ background: "transparent", border: "none", color: "#7874a4", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: 13, color: "#d4cde3", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <b style={{ color: "#a79fff" }}>1. Bankers:</b> The single highest-probability prediction identified by our AI algorithms (confidence $\ge 9.0/10$).
              </div>
              <div>
                <b style={{ color: "#a79fff" }}>2. Slip of the Day:</b> A ready-to-play accumulator combining our best daily picks into an optimal risk-to-reward ticket.
              </div>
              <div>
                <b style={{ color: "#a79fff" }}>3. Trust Rating:</b> Algorithmic rating on a scale from 1 to 10 based on machine learning probability models and market line inefficiencies.
              </div>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="btn-primary"
              style={{ width: "100%", marginTop: 20, height: 42, fontSize: 13 }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Responsive Row Switching CSS */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
        .botd-row-desktop {
          display: flex !important;
        }
        .botd-row-mobile {
          display: none !important;
        }
        .botd-table-header-desktop {
          display: flex !important;
        }
        @media (max-width: 860px) {
          .botd-row-desktop {
            display: none !important;
          }
          .botd-row-mobile {
            display: flex !important;
          }
          .botd-table-header-desktop {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
