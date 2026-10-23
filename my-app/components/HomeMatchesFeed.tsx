"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { MatchData } from "@/lib/types";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import MatchFilterModal, { FilterState, DEFAULT_FILTERS } from "@/components/MatchFilterModal";
import { RotateCcw, CheckCircle2, ShieldCheck, Flame, Calendar, RefreshCw, Crown, Lock, ArrowRight } from "lucide-react";
import { toCachedLogoUrl } from "@/lib/logo-utils";
import { decodeHtmlEntities } from "@/lib/utils";
import { cleanPickLabel } from "@/components/MatchRow";
import styles from "./HomeMatchesFeed.module.css";

export interface LeagueGroupItem {
  leagueName: string;
  country: string;
  flagUrl: string | null;
  matches: MatchData[];
}

interface HomeMatchesFeedProps {
  initialTodayGroups: LeagueGroupItem[];
  initialYesterdayGroups?: LeagueGroupItem[];
  totalTodayMatches: number;
  totalYesterdayMatches?: number;
}

function mapApiGroupsToLeagueGroups(apiGroups: any[]): LeagueGroupItem[] {
  return (apiGroups || []).map((g: any) => ({
    leagueName: decodeHtmlEntities(g.league?.name || g.leagueName),
    country: decodeHtmlEntities(g.country?.name || g.country),
    flagUrl: g.country?.flag || g.flagUrl || null,
    matches: (g.fixtures || []).map((f: any) => {
      const p1x2 = f.predictions?.find((p: any) => p.market === "1X2" || p.market === "DOUBLE_CHANCE");
      const pGoals = f.predictions?.find((p: any) => p.market === "OVER_UNDER");
      const pBtts = f.predictions?.find((p: any) => p.market === "BTTS");
      const pBest = f.predictions && f.predictions.length > 0
        ? [...f.predictions].sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0))[0]
        : null;

      const isGoalsBest = Boolean(pBest && pBest.market === "OVER_UNDER");
      const isBttsBest = Boolean(pBest && pBest.market === "BTTS");
      const is1x2Best = Boolean(pBest ? (!isGoalsBest && !isBttsBest) : true);
      const bestMarket = isGoalsBest ? "goals" : isBttsBest ? "btts" : "pickScore";
      const bestMarketLabel = isGoalsBest ? "O/U Goals" : isBttsBest ? "BTTS" : "1X2 Winner";

      const isMatchLocked = Boolean(
        pBest?.isLocked ||
        (f.predictions && f.predictions.length > 0 && f.predictions.every((p: any) => p.isLocked))
      );

      const hasScores = f.homeScore !== null && f.homeScore !== undefined && f.awayScore !== null && f.awayScore !== undefined;

      return {
        id: f.id,
        url: `/match/${f.id}`,
        leagueName: decodeHtmlEntities(g.league?.name || g.leagueName || f.leagueName),
        country: decodeHtmlEntities(g.country?.name || g.country || f.country),
        flagUrl: g.country?.flag || g.flagUrl || null,
        homeTeam: decodeHtmlEntities(f.homeTeam?.name || f.homeTeam),
        awayTeam: decodeHtmlEntities(f.awayTeam?.name || f.awayTeam),
        homeLogo: toCachedLogoUrl(f.homeTeam?.logo || f.homeLogo),
        awayLogo: toCachedLogoUrl(f.awayTeam?.logo || f.awayLogo),
        kickoffUtc: f.kickoffUtc || (f.kickoffTime?.includes("T") ? f.kickoffTime : null) || (f.matchDate && f.kickTime && /^\d{1,2}:\d{2}$/.test(f.kickTime) ? `${f.matchDate}T${f.kickTime.padStart(5, "0")}:00.000Z` : null),
        kickTime: f.kickTime || (f.kickoffTime?.includes("T") ? f.kickoffTime.substring(11, 16) : f.kickoffTime) || "00:00",
        matchDate: f.matchDate || null,
        status: f.status === "LIVE" ? "live" : (f.status === "FINISHED" || hasScores) ? "won" : "upcoming",
        homeScore: f.homeScore !== null && f.homeScore !== undefined ? String(f.homeScore) : null,
        awayScore: f.awayScore !== null && f.awayScore !== undefined ? String(f.awayScore) : null,
        elapsed: f.elapsed,
        isLive: f.status === "LIVE",
        odds: {
          home: f.odds?.home ? String(f.odds.home) : "1.75",
          draw: f.odds?.draw ? String(f.odds.draw) : "3.50",
          away: f.odds?.away ? String(f.odds.away) : "4.20",
        },
        rating: f.rating || null,
        predictions: {
          pickScore: {
            pick: (p1x2?.isLocked || isMatchLocked) ? null : (p1x2?.selection || null),
            odd: (p1x2?.isLocked || isMatchLocked) ? null : (p1x2?.odd ? String(p1x2.odd) : null),
            isLocked: Boolean(p1x2?.isLocked || isMatchLocked),
            market: "1X2",
            marketLabel: "1X2 Winner",
            confidence: p1x2?.confidence || null,
            rating: p1x2?.rating ?? (p1x2?.confidence ? Number((p1x2.confidence / 10).toFixed(1)) : null),
            isBest: is1x2Best,
          },
          goals: {
            pick: (pGoals?.isLocked || isMatchLocked) ? null : (pGoals?.selection || null),
            odd: (pGoals?.isLocked || isMatchLocked) ? null : (pGoals?.odd ? String(pGoals.odd) : null),
            isLocked: Boolean(pGoals?.isLocked || isMatchLocked),
            market: "OVER_UNDER",
            marketLabel: "O/U Goals",
            confidence: pGoals?.confidence || null,
            rating: pGoals?.confidence ? Number((pGoals.confidence / 10).toFixed(1)) : null,
            isBest: isGoalsBest,
          },
          btts: {
            pick: (pBtts?.isLocked || isMatchLocked) ? null : (pBtts?.selection || null),
            odd: (pBtts?.isLocked || isMatchLocked) ? null : (pBtts?.odd ? String(pBtts.odd) : null),
            isLocked: Boolean(pBtts?.isLocked || isMatchLocked),
            market: "BTTS",
            marketLabel: "Both Teams Score",
            confidence: pBtts?.confidence || null,
            rating: pBtts?.confidence ? Number((pBtts.confidence / 10).toFixed(1)) : null,
            isBest: isBttsBest,
          },
          bestTip: {
            pick: (pBest?.isLocked || isMatchLocked) ? null : (pBest?.selection || p1x2?.selection || null),
            odd: (pBest?.isLocked || isMatchLocked) ? null : (pBest?.odd ? String(pBest.odd) : p1x2?.odd ? String(p1x2.odd) : null),
            isLocked: Boolean(pBest?.isLocked || isMatchLocked),
            market: pBest?.market || "1X2",
            marketLabel: bestMarketLabel,
            confidence: pBest?.confidence || null,
            rating: pBest?.confidence ? Number((pBest.confidence / 10).toFixed(1)) : 8.5,
            isBest: true,
          },
          bestMarket,
          isLocked: isMatchLocked,
        },
        isLocked: isMatchLocked,
        confidence: (() => {
          if (isMatchLocked) return null;
          if (f.confidence) return f.confidence;
          const top = f.predictions && f.predictions.length > 0
            ? Math.max(...f.predictions.map((p: any) => p.confidence || 80))
            : 80;
          return `${top}%`;
        })(),
      };
    }),
  }));
}

export default function HomeMatchesFeed({
  initialTodayGroups,
  initialYesterdayGroups = [],
  totalTodayMatches,
  totalYesterdayMatches = 0,
}: HomeMatchesFeedProps) {
  const [activeDay, setActiveDay] = useState<"today" | "yesterday">("today");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const [todayGroups, setTodayGroups] = useState<LeagueGroupItem[]>(initialTodayGroups);
  const [yesterdayGroups, setYesterdayGroups] = useState<LeagueGroupItem[]>(initialYesterdayGroups);
  const [loadingYesterday, setLoadingYesterday] = useState<boolean>(false);

  // Fetch yesterday data if requested and not available
  const loadYesterdayData = useCallback(async () => {
    if (yesterdayGroups.length > 0) return;
    setLoadingYesterday(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/fixtures?d=-1&_t=${Date.now()}`, {
        headers,
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.groups)) {
        setYesterdayGroups(mapApiGroupsToLeagueGroups(data.groups));
      }
    } catch (e) {
      console.error("Failed to load yesterday fixtures:", e);
    } finally {
      setLoadingYesterday(false);
    }
  }, [yesterdayGroups.length]);

  const handleSelectDay = (day: "today" | "yesterday") => {
    setActiveDay(day);
    if (day === "yesterday" && yesterdayGroups.length === 0) {
      loadYesterdayData();
    }
  };

  // Sync today feed on client mount & auth changes
  useEffect(() => {
    async function syncFeed() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`/api/fixtures?d=0&_t=${Date.now()}`, {
          headers,
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.groups)) {
          setTodayGroups(mapApiGroupsToLeagueGroups(data.groups));
        }
      } catch {
        // Fallback
      }
    }

    syncFeed();
    const onAuth = () => syncFeed();
    window.addEventListener("jt_auth_change", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("jt_auth_change", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, []);

  // Check if current logged in user has an active VIP subscription
  const [isVip, setIsVip] = useState<boolean>(false);

  useEffect(() => {
    async function checkSubscription() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
        if (!token) {
          setIsVip(false);
          return;
        }
        const res = await fetch("/api/payments/subscription-status", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          setIsVip(Boolean(data.hasActiveSubscription || data.userTier === "premium" || data.isPremium));
        }
      } catch {
        setIsVip(false);
      }
    }

    checkSubscription();
    const onAuth = () => checkSubscription();
    window.addEventListener("jt_auth_change", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("jt_auth_change", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, []);

  // Active groups depending on selected day tab
  const activeGroups = activeDay === "today" ? todayGroups : yesterdayGroups;
  const activeTotalMatches = activeDay === "today"
    ? (totalTodayMatches || todayGroups.reduce((acc, g) => acc + g.matches.length, 0))
    : (yesterdayGroups.reduce((acc, g) => acc + g.matches.length, 0) || totalYesterdayMatches);

  // Available leagues in current active day
  const availableLeagues = useMemo(() => {
    const map = new Map<string, { name: string; country: string; count: number }>();
    activeGroups.forEach((g) => {
      const key = `${g.country || "Int"}_${g.leagueName}`;
      if (map.has(key)) {
        map.get(key)!.count += g.matches.length;
      } else {
        map.set(key, {
          name: g.leagueName,
          country: g.country,
          count: g.matches.length,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [activeGroups]);

  // Filtered active groups
  const filteredGroups = useMemo(() => {
    return activeGroups
      .map((group) => {
        // League filter
        if (filters.selectedLeagues.length > 0 && !filters.selectedLeagues.includes(group.leagueName)) {
          return null;
        }

        const matchingFixtures = group.matches.filter((m) => {
          // Search filter
          if (filters.searchTerm.trim()) {
            const q = filters.searchTerm.toLowerCase();
            const hit =
              m.homeTeam.toLowerCase().includes(q) ||
              m.awayTeam.toLowerCase().includes(q) ||
              group.leagueName.toLowerCase().includes(q) ||
              group.country.toLowerCase().includes(q);
            if (!hit) return false;
          }

          // Market filter
          if (filters.market !== "all") {
            if (filters.market === "1x2") {
              const p1 = cleanPickLabel(m.predictions?.pickScore?.pick);
              const pBest = cleanPickLabel(m.predictions?.bestTip?.pick);
              const is1x2 =
                ["1", "X", "2", "1X", "X2", "12"].includes(p1 || "") ||
                (m.predictions?.bestTip?.market === "pickScore" && ["1", "X", "2", "1X", "X2", "12"].includes(pBest || "")) ||
                m.predictions?.bestTip?.marketLabel === "1X2 Winner" ||
                Boolean(m.predictions?.pickScore?.pick);
              if (!is1x2) return false;
            }
            if (filters.market === "over15") {
              const gClean = cleanPickLabel(m.predictions?.goals?.pick);
              const btClean = cleanPickLabel(m.predictions?.bestTip?.pick);
              const rawG = m.predictions?.goals?.pick || "";
              const isOver15 =
                gClean === "O1.5" || btClean === "O1.5" ||
                /over\s*1\.5|at\s*least\s*2|\+1\.5|^o1\.5/i.test(rawG) ||
                /over\s*1\.5|at\s*least\s*2|\+1\.5|^o1\.5/i.test(m.predictions?.bestTip?.pick || "");
              if (!isOver15) return false;
            }
            if (filters.market === "over25") {
              const gClean = cleanPickLabel(m.predictions?.goals?.pick);
              const btClean = cleanPickLabel(m.predictions?.bestTip?.pick);
              const rawG = m.predictions?.goals?.pick || "";
              const isOver25 =
                gClean === "O2.5" || btClean === "O2.5" ||
                /over\s*2\.5|at\s*least\s*3|\+2\.5|^o2\.5/i.test(rawG) ||
                /over\s*2\.5|at\s*least\s*3|\+2\.5|^o2\.5/i.test(m.predictions?.bestTip?.pick || "");
              if (!isOver25) return false;
            }
            if (filters.market === "under25") {
              const gClean = cleanPickLabel(m.predictions?.goals?.pick);
              const btClean = cleanPickLabel(m.predictions?.bestTip?.pick);
              const rawG = m.predictions?.goals?.pick || "";
              const isUnder25 =
                gClean === "U2.5" || btClean === "U2.5" ||
                /under\s*2\.5|maximum\s*2|\-2\.5|^u2\.5/i.test(rawG) ||
                /under\s*2\.5|maximum\s*2|\-2\.5|^u2\.5/i.test(m.predictions?.bestTip?.pick || "");
              if (!isUnder25) return false;
            }
            if (filters.market === "btts") {
              const bClean = cleanPickLabel(m.predictions?.btts?.pick);
              const btClean = cleanPickLabel(m.predictions?.bestTip?.pick);
              const rawB = m.predictions?.btts?.pick || "";
              const isBtts =
                bClean === "Yes" || btClean === "Yes" ||
                /^(yes|gg|both\s*teams?\s*(?:to\s*)?score)/i.test(rawB.trim()) ||
                /^(yes|gg|both\s*teams?\s*(?:to\s*)?score)/i.test(m.predictions?.bestTip?.pick || "") ||
                m.predictions?.bestTip?.market === "btts";
              if (!isBtts) return false;
            }
            if (filters.market === "double_chance") {
              const p1 = cleanPickLabel(m.predictions?.pickScore?.pick);
              const btClean = cleanPickLabel(m.predictions?.bestTip?.pick);
              const rawP = m.predictions?.pickScore?.pick || "";
              const isDC =
                ["1X", "X2", "12"].includes(p1 || "") ||
                ["1X", "X2", "12"].includes(btClean || "") ||
                m.predictions?.bestTip?.marketLabel === "Double Chance" ||
                /^(1x|x2|12)\b/i.test(rawP.trim()) ||
                /^(1x|x2|12)\b/i.test(m.predictions?.bestTip?.pick || "");
              if (!isDC) return false;
            }
          }

          // Rating filter
          if (filters.minRating > 0) {
            const numericConf = parseInt(m.confidence?.replace("%", "") || "0", 10);
            const rawR = typeof m.rating === "number" ? m.rating : (m.predictions?.bestTip?.rating || (numericConf > 0 ? numericConf / 10 : 7.5));
            const r = parseFloat(String(rawR));
            if (isNaN(r) || r < filters.minRating) return false;
          }

          // Category filter
          if (filters.category !== "all") {
            const numericConf = parseInt(m.confidence?.replace("%", "") || "0", 10);
            const rawR = typeof m.rating === "number" ? m.rating : (m.predictions?.bestTip?.rating || (numericConf > 0 ? numericConf / 10 : 7.5));
            const bestRating = parseFloat(String(rawR)) || 7.5;
            const rawOdd = parseFloat(String(m.predictions?.bestTip?.odd || "1.75"));
            const bestOdd = isNaN(rawOdd) ? 1.75 : (rawOdd >= 30 ? 1 + rawOdd / 100 : rawOdd);
            const isMatchFree = Boolean(
              (m as any).isFreeTip || (!m.isLocked && !m.predictions?.bestTip?.isLocked && !m.predictions?.isLocked)
            );

            if (filters.category === "free_tips") {
              if (!isMatchFree) return false;
            }
            if (filters.category === "top_tips") {
              const isTop = bestRating >= 8.0 || Boolean(m.predictions?.bestTip?.isBest && bestRating >= 7.6);
              if (!isTop) return false;
            }
            if (filters.category === "safe_picks") {
              if (bestRating < 7.8 || bestOdd > 1.95) return false;
            }
            if (filters.category === "value_bets") {
              if (bestOdd < 1.90) return false;
            }
            if (filters.category === "high_scoring") {
              const gClean = cleanPickLabel(m.predictions?.goals?.pick) || "";
              const rawG = m.predictions?.goals?.pick || "";
              const isOver = gClean.startsWith("O") || /over|at\s*least|\+|^o[0-9]/i.test(rawG);
              if (!isOver) return false;
            }
            if (filters.category === "live") {
              if (!m.isLive && m.status !== "live") return false;
            }
            if (filters.category === "won") {
              if (m.status !== "won") return false;
            }
          }

          return true;
        });

        if (matchingFixtures.length === 0) return null;

        return {
          ...group,
          matches: matchingFixtures,
        };
      })
      .filter(Boolean) as LeagueGroupItem[];
  }, [activeGroups, filters]);

  const filteredMatchesCount = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.matches.length, 0);
  }, [filteredGroups]);

  // Enforce strictly 10 free predictions for landing page free visitors
  const FREE_PREDICTIONS_LIMIT = 10;

  const displayGroups = useMemo(() => {
    // Pro VIP users or visitors viewing previous day's results get all matches unlocked for free
    if (isVip || activeDay === "yesterday") return filteredGroups;

    // For today's free picks, prioritize UPCOMING / LIVE high-confidence games over finished midnight games
    const prioritizedGroups = filteredGroups
      .map((g) => {
        const live = g.matches.filter((m) => m.isLive || m.status === "live");
        const upcoming = g.matches.filter(
          (m) =>
            !m.isLive &&
            m.status !== "live" &&
            m.status !== "won" &&
            m.status !== "lost" &&
            m.status !== "finished" &&
            m.status !== "fin"
        );
        const finished = g.matches.filter(
          (m) =>
            m.status === "won" ||
            m.status === "lost" ||
            m.status === "finished" ||
            m.status === "fin"
        );
        return {
          ...g,
          matches: [...live, ...upcoming, ...finished],
        };
      })
      .sort((a, b) => {
        const aHasPlayable = a.matches.some(
          (m) => m.status !== "won" && m.status !== "lost" && m.status !== "finished" && m.status !== "fin"
        );
        const bHasPlayable = b.matches.some(
          (m) => m.status !== "won" && m.status !== "lost" && m.status !== "finished" && m.status !== "fin"
        );
        if (aHasPlayable && !bHasPlayable) return -1;
        if (!aHasPlayable && bHasPlayable) return 1;
        return 0;
      });

    let matchCounter = 0;
    const limitedGroups: LeagueGroupItem[] = [];

    for (const group of prioritizedGroups) {
      if (matchCounter >= FREE_PREDICTIONS_LIMIT) break;

      const remainingSlots = FREE_PREDICTIONS_LIMIT - matchCounter;
      const allowedMatches = group.matches.slice(0, remainingSlots);

      if (allowedMatches.length > 0) {
        limitedGroups.push({
          ...group,
          matches: allowedMatches,
        });
        matchCounter += allowedMatches.length;
      }
    }

    return limitedGroups;
  }, [filteredGroups, isVip, activeDay]);

  const displayedMatchesCount = useMemo(() => {
    return displayGroups.reduce((acc, g) => acc + g.matches.length, 0);
  }, [displayGroups]);

  const remainingLockedCount = activeDay === "yesterday" ? 0 : Math.max(0, activeTotalMatches - displayedMatchesCount);

  const countToday = todayGroups.reduce((acc, g) => acc + g.matches.length, 0) || totalTodayMatches;
  const countYesterday = yesterdayGroups.reduce((acc, g) => acc + g.matches.length, 0) || totalYesterdayMatches;

  return (
    <div className={styles.feed}>
      {/* ── Day Selection Bar: Today's Free Picks vs Yesterday's Free Picks ── */}
      <div
        className={styles.dayBar}
      >
        {/* Toggle Pills */}
        <div className={styles.dayTabs}>
          <button
            onClick={() => handleSelectDay("today")}
            className={styles.dayTab}
            data-active={activeDay === "today"}
            style={{
              background: activeDay === "today" ? "#7063e6" : "rgba(255, 255, 255, 0.035)",
              border: activeDay === "today"
                ? "1px solid rgba(167, 159, 255, 0.5)"
                : "1px solid rgba(255, 255, 255, 0.07)",
              color: activeDay === "today" ? "#ffffff" : "#a79fff",
              fontWeight: activeDay === "today" ? 800 : 600,
              boxShadow: activeDay === "today" ? "0 2px 8px rgba(124, 108, 245, 0.2)" : "none",
            }}
          >
            <span>Today&apos;s Free Picks</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "1px 7px",
                borderRadius: 999,
                background: activeDay === "today" ? "rgba(255, 255, 255, 0.25)" : "rgba(124, 108, 245, 0.18)",
                color: "#ffffff",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {isVip ? countToday : `${Math.min(FREE_PREDICTIONS_LIMIT, countToday)} Free`}
            </span>
          </button>

          <button
            onClick={() => handleSelectDay("yesterday")}
            className={styles.dayTab}
            data-active={activeDay === "yesterday"}
            style={{
              background: activeDay === "yesterday" ? "#237a56" : "rgba(255, 255, 255, 0.035)",
              border: activeDay === "yesterday"
                ? "1px solid rgba(47, 208, 138, 0.6)"
                : "1px solid rgba(255, 255, 255, 0.07)",
              color: activeDay === "yesterday" ? "#ffffff" : "#a79fff",
              fontWeight: activeDay === "yesterday" ? 800 : 600,
              boxShadow: activeDay === "yesterday" ? "0 2px 8px rgba(47, 208, 138, 0.18)" : "none",
            }}
          >
            <span>Yesterday&apos;s Results</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "1px 7px",
                borderRadius: 999,
                background: activeDay === "yesterday" ? "rgba(255, 255, 255, 0.25)" : "rgba(47, 208, 138, 0.18)",
                color: "#ffffff",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {countYesterday > 0
                ? `${countYesterday} Free`
                : (loadingYesterday ? "..." : "Free Results")}
            </span>
          </button>
        </div>

        {/* Verification & Trust Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {activeDay === "yesterday" ? (
            <div
              className={styles.trustBadge}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "#2fd08a",
                fontSize: 12.5,
                fontWeight: 700,
                background: "rgba(47, 208, 138, 0.12)",
                border: "1px solid rgba(47, 208, 138, 0.28)",
                padding: "6px 14px",
                borderRadius: 999,
              }}
            >
              <CheckCircle2 size={14} color="#2fd08a" />
              <span>Settled Results • 89.4% Algorithm Win Rate</span>
            </div>
          ) : (
            <div
              className={styles.trustBadge}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: isVip ? "#2fd08a" : "#ffd700",
                fontSize: 12.5,
                fontWeight: 700,
                background: isVip ? "rgba(47, 208, 138, 0.12)" : "rgba(255, 215, 0, 0.12)",
                border: isVip ? "1px solid rgba(47, 208, 138, 0.28)" : "1px solid rgba(255, 215, 0, 0.28)",
                padding: "6px 14px",
                borderRadius: 999,
              }}
            >
              {isVip ? (
                <>
                  <Crown size={14} color="#2fd08a" />
                  <span>VIP Pro Unlocked • All {activeTotalMatches} Matches</span>
                </>
              ) : (
                <>
                  <Flame size={14} color="#ffd700" />
                  <span>10 Free AI Picks • {remainingLockedCount > 0 ? `${remainingLockedCount}+ Locked (PRO)` : "PRO Access"}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Dynamic Filter Bar & Modal ── */}
      <MatchFilterModal
        filters={filters}
        onFilterChange={setFilters}
        availableLeagues={availableLeagues}
        totalMatchesCount={activeTotalMatches}
        filteredCount={filteredMatchesCount}
      />

      {/* ── Loading Spinner for Yesterday data if fetching ── */}
      {loadingYesterday && (
        <div className={styles.loadingState}>
          <RefreshCw size={18} className="animate-spin" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Fetching settled yesterday free picks...</span>
        </div>
      )}

      {/* ── League Groups Feed (Strictly 10 Free Predictions for Free Visitors) ── */}
      {!loadingYesterday && displayGroups.length > 0 ? (
        <div className={styles.groupList}>
          {displayGroups.map((group, idx) => (
            <LeagueGroupCard
              key={`${activeDay}_${group.country || "Int"}_${group.leagueName}_${idx}`}
              leagueName={group.leagueName}
              country={group.country}
              flagUrl={group.flagUrl}
              matches={group.matches}
            />
          ))}

          {/* ── High-Converting VIP Pro Paywall Card (Strictly after 10 free picks) ── */}
          {!isVip && remainingLockedCount > 0 && (
            <div
              className={styles.paywall}
              style={{
                marginTop: 12,
                borderRadius: 16,
                padding: "32px 24px",
                background: "#141132",
                border: "1px solid rgba(255, 215, 0, 0.38)",
                boxShadow: "0 14px 32px -20px rgba(0, 0, 0, 0.7)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  maxWidth: 680,
                  margin: "0 auto",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {/* Badge */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 14px",
                    borderRadius: 999,
                    background: "rgba(255, 215, 0, 0.15)",
                    border: "1px solid rgba(255, 215, 0, 0.35)",
                    color: "#ffd700",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    marginBottom: 14,
                  }}
                >
                  <Lock size={13} color="#ffd700" />
                  <span>Free Daily Limit Reached (10 / 10 Predictions Shown)</span>
                </div>

                {/* Headline */}
                <h3
                  style={{
                    fontSize: "clamp(20px, 3.2vw, 26px)",
                    fontWeight: 900,
                    color: "#ffffff",
                    letterSpacing: "-0.02em",
                    margin: "0 0 10px",
                    lineHeight: 1.25,
                  }}
                >
                  Unlock <span style={{ color: "#ffd700" }}>{remainingLockedCount}+ Remaining Matches</span> Today with VIP Pro
                </h3>

                {/* Subtext */}
                <p
                  style={{
                    fontSize: 14,
                    color: "#c3beff",
                    margin: "0 0 22px",
                    lineHeight: 1.5,
                  }}
                >
                  You have viewed all 10 free AI quantitative tips for today. Upgrade to VIP Pro to instantly unlock every match, live algorithmic banker picks, and real-time Telegram bot alerts.
                </p>

                {/* Features pill grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 10,
                    width: "100%",
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(167, 159, 255, 0.15)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <CheckCircle2 size={16} color="#2fd08a" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#ffffff" }}>
                      Unlimited Daily Matches
                    </span>
                  </div>

                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(167, 159, 255, 0.15)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <CheckCircle2 size={16} color="#2fd08a" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#ffffff" }}>
                      85%+ High-Odds Banker Picks
                    </span>
                  </div>

                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(167, 159, 255, 0.15)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <CheckCircle2 size={16} color="#2fd08a" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#ffffff" }}>
                      Instant Telegram Bot Access
                    </span>
                  </div>

                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(167, 159, 255, 0.15)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <CheckCircle2 size={16} color="#2fd08a" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#ffffff" }}>
                      All Markets: 1X2, Goals &amp; BTTS
                    </span>
                  </div>
                </div>

                {/* CTAs */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    width: "100%",
                  }}
                >
                  <Link
                    href="/pricing"
                    style={{
                      padding: "12px 28px",
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)",
                      color: "#0a081d",
                      fontSize: 14,
                      fontWeight: 900,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      boxShadow: "0 4px 18px rgba(255, 215, 0, 0.4)",
                      transition: "all 0.18s ease",
                    }}
                  >
                    <Crown size={17} color="#0a081d" />
                    <span>Get VIP Pro Access — $19.99/mo</span>
                    <ArrowRight size={15} color="#0a081d" />
                  </Link>

                  <Link
                    href="/all-matches"
                    style={{
                      padding: "12px 22px",
                      borderRadius: 12,
                      background: "rgba(124, 108, 245, 0.15)",
                      border: "1px solid rgba(124, 108, 245, 0.35)",
                      color: "#ffffff",
                      fontSize: 13.5,
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>View All Fixtures Schedule</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Trust guarantee */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginTop: 18,
                    fontSize: 11.5,
                    color: "#8b7ff5",
                    fontWeight: 600,
                  }}
                >
                  <span>Instant Activation</span>
                  <span>&bull;</span>
                  <span>Cancel Anytime</span>
                  <span>&bull;</span>
                  <span>Secure Payments</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : !loadingYesterday ? (
        <div className={styles.emptyState}>
          <p style={{ color: "#ffffff", fontSize: "16px", fontWeight: 800, margin: "0 0 8px" }}>
            No matches match the selected filters
          </p>
          <p style={{ color: "#d4cde3", fontSize: "13px", margin: "0 0 16px" }}>
            Try broadening your rating threshold or choosing &quot;All Markets&quot;.
          </p>
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 800,
              cursor: "pointer",
              background: "rgba(139, 127, 245, 0.2)",
              color: "#ffffff",
              border: "1px solid #8b7ff5",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <RotateCcw size={14} />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
