import Navbar from "@/components/Navbar";
import HeroLanding from "@/components/HeroLanding";
import HomeMatchesFeed, { LeagueGroupItem } from "@/components/HomeMatchesFeed";
import {
  LeagueCoverageStrip,
  TrackRecordSection,
  ExploreRail,
  PredictionsSimpleSection,
  PredictionWorkflowSection,
  PredictionProofSection,
  PlansSection,
} from "@/components/LandingSections";
import { cookies } from "next/headers";
import { Flame, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toCachedLogoUrl } from "@/lib/logo-utils";
import feedStyles from "@/components/HomeMatchesFeed.module.css";

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
      <HeroLanding totalMatches={totalMatches} todayMatches={allTodayMatchesFlat}>

      {/* ── 3. Free Predictions Feed (Today & Yesterday Free Picks) ── */}
      <main id="matches-feed" className={`${feedStyles.section} scroll-mt-16`}>
        {/* Section Header */}
        <div className={feedStyles.sectionHeader}>
          <div className={feedStyles.sectionIntro}>
            <div className={feedStyles.titleRow}>
              <h2 className={feedStyles.sectionTitle}>
                10 Free Football Predictions
              </h2>
              <span className={feedStyles.sectionEyebrow}>
                FREE AI FOOTBALL PREDICTIONS (10 DAILY PICKS)
              </span>
            </div>
            <p className={feedStyles.sectionDescription}>
              Top 10 mathematically graded quantitative tips for today • VIP Pro unlocks all {totalMatches > 0 ? `${totalMatches}+ ` : ""}matches
            </p>
          </div>

          <Link
            href="/all-matches"
            className={feedStyles.sectionLink}
          >
            <span>View All {totalMatches > 0 ? `${totalMatches} ` : ""}Fixtures</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Bet of the Day / Featured AI Pick Hero */}
        <div
          className={feedStyles.featuredPick}
        >
          <div className={feedStyles.featuredContent}>
            <div className={feedStyles.featuredCopy}>
              <div
                className={feedStyles.featuredBadge}
              >
                {featuredMatch ? (
                  <>
                    <Flame size={12} color="#2fd08a" />
                    <span>AI BET OF THE DAY &middot; {featuredMatch.confidence || "89%"} CONFIDENCE</span>
                  </>
                ) : (
                  <span>NO FEATURED PICK</span>
                )}
              </div>
              <h3 className={feedStyles.featuredTitle}>
                {featuredMatch ? `${featuredMatch.homeTeam} vs ${featuredMatch.awayTeam} \u2014 ${featuredMatch.leagueName}` : "No featured match right now"}
              </h3>
              <p className={feedStyles.featuredDetail}>
                {featuredMatch ? (
                  <>
                    High-confidence consensus for{" "}
                    <strong style={{ color: "#2fd08a", fontWeight: 800 }}>
                      {`${featuredMatch.predictions.bestTip.pick || "Home Win"} @ ${featuredMatch.predictions.bestTip.odd || "1.75"}`}
                    </strong>
                  </>
                ) : (
                  "Live fixture data is unavailable. Browse all fixtures to explore matches."
                )}
              </p>
            </div>

            <div className={feedStyles.featuredActions}>
              <Link
                href={featuredMatch?.url || "/all-matches"}
                className={`btn-primary ${feedStyles.featuredCta}`}
              >
                <span>{featuredMatch ? "View Full Analysis" : "Browse Fixtures"}</span>
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
      </HeroLanding>

      {/* ── Lower landing sections ── */}
      <LeagueCoverageStrip />
      <TrackRecordSection />
      <ExploreRail />
      <PredictionsSimpleSection />
      <PredictionWorkflowSection />
      <PredictionProofSection />
      <PlansSection />
    </div>
  );
}
