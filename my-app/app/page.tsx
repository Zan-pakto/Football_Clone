import Navbar from "@/components/Navbar";
import HeroLanding from "@/components/HeroLanding";
import HomeMatchesFeed, { LeagueGroupItem } from "@/components/HomeMatchesFeed";
import {
  TrustStrip,
  HowJollofTipsWorks,
  AIIntelligenceSection,
  PerformanceAccuracySection,
  WhyJollofTips,
  PremiumCTABanner,
} from "@/components/LandingSections";
import { cookies } from "next/headers";
import { Flame, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toCachedLogoUrl } from "@/lib/logo-utils";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

function mapRawFixtureGroups(groups: any[]): LeagueGroupItem[] {
  return (groups || []).map((g: any) => ({
    leagueName: g.league.name,
    country: g.country.name,
    flagUrl: g.country.flag || null,
    matches: (g.fixtures || []).map((f: any) => {
      const p1x2 = f.predictions?.find((p: any) => p.market === "1X2" || p.market === "DOUBLE_CHANCE");
      const pGoals = f.predictions?.find((p: any) => p.market === "OVER_UNDER");
      const pBtts = f.predictions?.find((p: any) => p.market === "BTTS");
      const pBest = f.predictions && f.predictions.length > 0
        ? [...f.predictions].sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0))[0]
        : null;

      const isMatchLocked = Boolean(
        pBest?.isLocked ||
        (f.predictions && f.predictions.length > 0 && f.predictions.every((p: any) => p.isLocked))
      );

      const isGoalsBest = Boolean(pBest && pBest.market === "OVER_UNDER");
      const isBttsBest = Boolean(pBest && pBest.market === "BTTS");
      const is1x2Best = Boolean(pBest ? (!isGoalsBest && !isBttsBest) : true);
      const bestMarket = isGoalsBest ? "goals" : isBttsBest ? "btts" : "pickScore";
      const bestMarketLabel = isGoalsBest ? "O/U Goals" : isBttsBest ? "BTTS" : "1X2 Winner";

      const hasScores = f.homeScore !== null && f.homeScore !== undefined && f.awayScore !== null && f.awayScore !== undefined;

      return {
        id: f.id,
        url: `/match/${f.id}`,
        leagueName: g.league.name,
        country: g.country.name,
        flagUrl: g.country.flag || null,
        homeTeam: f.homeTeam.name,
        awayTeam: f.awayTeam.name,
        homeLogo: toCachedLogoUrl(f.homeTeam?.logo || f.homeLogo),
        awayLogo: toCachedLogoUrl(f.awayTeam?.logo || f.awayLogo),
        kickTime: f.kickTime || (f.kickoffTime?.includes("T") ? new Date(f.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : f.kickoffTime) || "00:00",
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
            rating: pGoals?.rating ?? (pGoals?.confidence ? Number((pGoals.confidence / 10).toFixed(1)) : null),
            isBest: isGoalsBest,
          },
          btts: {
            pick: (pBtts?.isLocked || isMatchLocked) ? null : (pBtts?.selection || null),
            odd: (pBtts?.isLocked || isMatchLocked) ? null : (pBtts?.odd ? String(pBtts.odd) : null),
            isLocked: Boolean(pBtts?.isLocked || isMatchLocked),
            market: "BTTS",
            marketLabel: "Both Teams Score",
            confidence: pBtts?.confidence || null,
            rating: pBtts?.rating ?? (pBtts?.confidence ? Number((pBtts.confidence / 10).toFixed(1)) : null),
            isBest: isBttsBest,
          },
          bestTip: {
            pick: (pBest?.isLocked || isMatchLocked) ? null : (pBest?.selection || p1x2?.selection || null),
            odd: (pBest?.isLocked || isMatchLocked) ? null : (pBest?.odd ? String(pBest.odd) : p1x2?.odd ? String(p1x2.odd) : null),
            isLocked: Boolean(pBest?.isLocked || isMatchLocked),
            market: pBest?.market || "1X2",
            marketLabel: bestMarketLabel,
            confidence: pBest?.confidence || null,
            rating: pBest?.confidence ? Number((pBest.confidence / 10).toFixed(1)) : (f.rating || 8.0),
            isBest: true,
          },
          bestMarket,
          isLocked: isMatchLocked,
        },
        isLocked: isMatchLocked,
        lockReason: f.predictions && f.predictions[0]?.lockReason,
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

export default async function HomePage() {
  let todayGroups: LeagueGroupItem[] = [];
  let yesterdayGroups: LeagueGroupItem[] = [];
  let liveMatches: any[] = [];

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const headers: Record<string, string> = token
      ? { Cookie: `auth_token=${token}`, Authorization: `Bearer ${token}` }
      : {};

    const [todayRes, yesterdayRes, liveRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/fixtures?d=0`, {
        headers,
        cache: "no-store",
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${BACKEND_URL}/api/fixtures?d=-1`, {
        headers,
        cache: "no-store",
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${BACKEND_URL}/api/fixtures/live`, {
        headers,
        cache: "no-store",
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);

    todayGroups = mapRawFixtureGroups(todayRes?.groups || []);
    yesterdayGroups = mapRawFixtureGroups(yesterdayRes?.groups || []);
    liveMatches = liveRes?.matches || [];
  } catch {
    // Backend offline / fallback
  }

  const totalMatches = todayGroups.reduce((acc, g) => acc + g.matches.length, 0);
  const totalYesterday = yesterdayGroups.reduce((acc, g) => acc + g.matches.length, 0);
  const allTodayMatchesFlat = todayGroups.flatMap((g) => g.matches);
  const featuredMatch = allTodayMatchesFlat.length > 0 ? allTodayMatchesFlat[0] : null;

  return (
    <div style={{ background: "#0a081d", minHeight: "100vh", color: "#f1eff8" }}>
      {/* ── 1. Premium Navbar ── */}
      <Navbar liveCount={liveMatches.length} />

      {/* ── 2. Hero Section ── */}
      <HeroLanding totalMatches={totalMatches} />

      {/* ── 3. Free Predictions Feed (Today & Yesterday Free Picks) ── */}
      <main id="matches-feed" className="scroll-mt-16" style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 16px 70px" }}>
        {/* Section Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#8b7ff5",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                display: "inline-block",
                marginBottom: 6,
              }}
            >
              FREE AI FOOTBALL PREDICTIONS (10 DAILY PICKS)
            </span>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em", margin: 0 }}>
              10 Free Football Predictions
            </h2>
            <p style={{ fontSize: 13, color: "#7874a4", margin: "4px 0 0", fontWeight: 600 }}>
              Top 10 mathematically graded quantitative tips for today • VIP Pro unlocks all {totalMatches > 0 ? `${totalMatches}+ ` : ""}matches
            </p>
          </div>

          <Link
            href="/all-matches"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#8b7ff5",
              fontSize: 14,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            <span>View All {totalMatches > 0 ? `${totalMatches} ` : ""}Fixtures</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Bet of the Day / Featured AI Pick Hero */}
        <div
          style={{
            padding: "20px 24px",
            marginBottom: 24,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(124, 108, 245, 0.16) 0%, rgba(20, 17, 50, 0.9) 100%)",
            border: "1px solid rgba(124, 108, 245, 0.35)",
            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: "rgba(124, 108, 245, 0.2)",
                  border: "1px solid rgba(124, 108, 245, 0.4)",
                  color: "#8b7ff5",
                  fontSize: 10.5,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 8,
                }}
              >
                <Flame size={12} color="#2fd08a" />
                <span>AI BET OF THE DAY • {featuredMatch?.confidence || "89%"} CONFIDENCE</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                {featuredMatch ? `${featuredMatch.homeTeam} vs ${featuredMatch.awayTeam} — ${featuredMatch.leagueName}` : "Featured Match Analysis"}
              </h3>
              <p style={{ color: "#a79fff", fontSize: 13, margin: 0 }}>
                High-confidence consensus for{" "}
                <strong style={{ color: "#2fd08a", fontWeight: 800 }}>
                  {featuredMatch ? `${featuredMatch.predictions.bestTip.pick || "Home Win"} @ ${featuredMatch.predictions.bestTip.odd || "1.75"}` : "Arsenal Win @ 1.72"}
                </strong>
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link
                href={featuredMatch?.url || "/all-matches"}
                className="btn-primary"
                style={{
                  padding: "9px 18px",
                  fontSize: 13,
                }}
              >
                <span>View Full Analysis</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Feed with Today's Free Picks and Yesterday's Free Picks Switcher */}
        <HomeMatchesFeed
          initialTodayGroups={todayGroups}
          initialYesterdayGroups={yesterdayGroups}
          totalTodayMatches={totalMatches}
          totalYesterdayMatches={totalYesterday}
        />
      </main>

      {/* ── 4. Trust / Statistics Strip ── */}
      <TrustStrip totalMatches={totalMatches} />

      {/* ── 5. How JollofTips Works ── */}
      <HowJollofTipsWorks />

      {/* ── 6. AI Intelligence Section ── */}
      <AIIntelligenceSection />

      {/* ── 7. Performance / Accuracy Section ── */}
      <PerformanceAccuracySection />

      {/* ── 8. Why JollofTips ── */}
      <WhyJollofTips />

      {/* ── 9. Premium CTA Banner ── */}
      <PremiumCTABanner />
    </div>
  );
}