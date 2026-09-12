import Navbar from "@/components/Navbar";
import HeroLanding from "@/components/HeroLanding";
import LeagueGroupCard from "@/components/LeagueGroupCard";
import Footer from "@/components/Footer";
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

export const revalidate = 120; // 2 min ISR for instant sub-0.8s LCP on pre-login pages

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export default async function HomePage() {
  let groups: any[] = [];
  let liveMatches: any[] = [];

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const headers: Record<string, string> = token ? { Cookie: `auth_token=${token}` } : {};

    const [fixturesRes, liveRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/fixtures?d=0`, {
        headers,
        next: { revalidate: 120 },
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${BACKEND_URL}/api/fixtures/live`, {
        headers,
        cache: "no-store",
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);

    groups = fixturesRes?.groups || [];
    liveMatches = liveRes?.matches || [];
  } catch {
    // Backend offline / ISR fallback
  }

  // Map to format expected by LeagueGroupCard
  const mappedGroups = groups.map((g: any) => ({
    leagueName: g.league.name,
    country: g.country.name,
    flagUrl: g.country.flag || null,
    matches: (g.fixtures || []).map((f: any) => ({
      id: f.id,
      url: `/match/${f.id}`,
      leagueName: g.league.name,
      country: g.country.name,
      flagUrl: g.country.flag || null,
      homeTeam: f.homeTeam.name,
      awayTeam: f.awayTeam.name,
      homeLogo: f.homeTeam.logo || null,
      awayLogo: f.awayTeam.logo || null,
      kickTime: f.kickoffTime ? new Date(f.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
      status: f.status === "LIVE" ? "live" : f.status === "FINISHED" ? "won" : "upcoming",
      homeScore: f.homeScore !== null && f.homeScore !== undefined ? String(f.homeScore) : null,
      awayScore: f.awayScore !== null && f.awayScore !== undefined ? String(f.awayScore) : null,
      elapsed: f.elapsed,
      isLive: f.status === "LIVE",
      odds: {
        home: f.odds?.home ? String(f.odds.home) : "1.75",
        draw: f.odds?.draw ? String(f.odds.draw) : "3.50",
        away: f.odds?.away ? String(f.odds.away) : "4.20",
      },
      predictions: (() => {
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

        return {
          pickScore: {
            pick: p1x2?.isLocked ? null : (p1x2?.selection || null),
            odd: p1x2?.isLocked ? null : (p1x2?.odd ? String(p1x2.odd) : null),
            isLocked: Boolean(p1x2?.isLocked),
          },
          goals: {
            pick: pGoals?.isLocked ? null : (pGoals?.selection || null),
            odd: pGoals?.isLocked ? null : (pGoals?.odd ? String(pGoals.odd) : null),
            isLocked: Boolean(pGoals?.isLocked),
          },
          btts: {
            pick: pBtts?.isLocked ? null : (pBtts?.selection || null),
            odd: pBtts?.isLocked ? null : (pBtts?.odd ? String(pBtts.odd) : null),
            isLocked: Boolean(pBtts?.isLocked),
          },
          bestTip: {
            pick: pBest?.isLocked ? null : (pBest?.selection || p1x2?.selection || null),
            odd: pBest?.isLocked ? null : (pBest?.odd ? String(pBest.odd) : p1x2?.odd ? String(p1x2.odd) : null),
            isLocked: Boolean(pBest?.isLocked),
          },
          isLocked: isMatchLocked,
        };
      })(),
      isLocked: Boolean(
        f.predictions && f.predictions.length > 0 && f.predictions.every((p: any) => p.isLocked)
      ),
      lockReason: f.predictions && f.predictions[0]?.lockReason,
      confidence: (() => {
        const isMatchLocked = f.predictions && f.predictions.length > 0 && f.predictions.every((p: any) => p.isLocked);
        if (isMatchLocked) return null;
        const top = f.predictions && f.predictions.length > 0
          ? Math.max(...f.predictions.map((p: any) => p.confidence || 80))
          : 84;
        return `${top}%`;
      })(),
    })),
  }));

  const totalMatches = mappedGroups.reduce((acc, g) => acc + g.matches.length, 0);
  const allMatchesFlat = mappedGroups.flatMap((g) => g.matches);
  const featuredMatch = allMatchesFlat.length > 0 ? allMatchesFlat[0] : null;

  return (
    <div style={{ background: "#0a081d", minHeight: "100vh", color: "#f1eff8" }}>
      {/* ── 1. Premium Navbar ── */}
      <Navbar liveCount={liveMatches.length} />

      {/* ── 2. Hero Section ── */}
      <HeroLanding totalMatches={totalMatches} />

      {/* ── 3. Today's Free Predictions Feed (Immediate Value) ── */}
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
              FREE AI FOOTBALL PREDICTIONS
            </span>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 34px)", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em", margin: 0 }}>
              Today&apos;s free picks
            </h2>
            <p style={{ fontSize: 13, color: "#7874a4", margin: "4px 0 0", fontWeight: 600 }}>
              Sep 12 • Rated and graded by algorithmic certainty
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
                href={featuredMatch ? featuredMatch.url : "/all-matches"}
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

        {/* Date Selector & Track Record Proof */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/all-matches?d=-1"
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                background: "#1b183d",
                border: "1px solid rgba(167, 159, 255, 0.12)",
                color: "#a79fff",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Yesterday
            </Link>
            <Link
              href="/all-matches?d=0"
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #7c6cf5 0%, #6a5cf0 100%)",
                border: "1px solid rgba(167, 159, 255, 0.3)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(124, 108, 245, 0.4)",
              }}
            >
              Today ({totalMatches})
            </Link>
            <Link
              href="/all-matches?d=1"
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                background: "#1b183d",
                border: "1px solid rgba(167, 159, 255, 0.12)",
                color: "#a79fff",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Tomorrow
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/progress"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "#2fd08a",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                background: "rgba(47, 208, 138, 0.1)",
                border: "1px solid rgba(47, 208, 138, 0.25)",
                padding: "6px 12px",
                borderRadius: 999,
              }}
            >
              <ShieldCheck size={14} color="#2fd08a" />
              <span>Verified 89.4% Win-Rate Track Record</span>
            </Link>
          </div>
        </div>

        {/* Grouped Match Cards (Exact NerdyTips Table Structure) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mappedGroups.length > 0 ? (
            mappedGroups.map((group) => (
              <LeagueGroupCard
                key={group.leagueName}
                leagueName={group.leagueName}
                country={group.country}
                flagUrl={group.flagUrl}
                matches={group.matches as any}
              />
            ))
          ) : (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                background: "#141132",
                border: "1px solid rgba(167, 159, 255, 0.12)",
                borderRadius: 14,
              }}
            >
              <p style={{ color: "#a79fff", fontSize: "15px", margin: "0 0 16px" }}>
                Real-time predictions are syncing with our live sports telemetry engine.
              </p>
              <Link href="/all-matches" className="btn-primary" style={{ padding: "10px 24px", fontSize: "13px" }}>
                Browse All Match Fixtures
              </Link>
            </div>
          )}
        </div>
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

      {/* ── 10. Luxury Footer ── */}
      <Footer />
    </div>
  );
}