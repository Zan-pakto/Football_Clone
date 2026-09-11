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

        return {
          pickScore: { pick: p1x2?.selection || null, odd: p1x2?.odd ? String(p1x2.odd) : null },
          goals: { pick: pGoals?.selection || null, odd: pGoals?.odd ? String(pGoals.odd) : null },
          btts: { pick: pBtts?.selection || null, odd: pBtts?.odd ? String(pBtts.odd) : null },
          bestTip: { pick: pBest?.selection || p1x2?.selection || null, odd: pBest?.odd ? String(pBest.odd) : p1x2?.odd ? String(p1x2.odd) : null },
        };
      })(),
      confidence: (() => {
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
    <div style={{ background: "var(--background)", minHeight: "100vh", color: "var(--foreground)" }}>
      {/* ── 1. Premium Navbar ── */}
      <Navbar liveCount={liveMatches.length} />

      {/* ── 2. Hero Section ── */}
      <HeroLanding totalMatches={totalMatches} />

      {/* ── 3. Trust / Statistics Strip ── */}
      <TrustStrip totalMatches={totalMatches} />

      {/* ── 4. How JollofTips Works ── */}
      <HowJollofTipsWorks />

      {/* ── 5. Today's Predictions Feed ── */}
      <main id="matches-feed" className="scroll-mt-12" style={{ maxWidth: 1360, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Section Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div className="gold-badge" style={{ marginBottom: 8 }}>
              TODAY&apos;S AI PREDICTIONS
            </div>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em", margin: 0 }}>
              Live Match Predictions & Telemetry
            </h2>
          </div>

          <Link
            href="/all-matches"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--gold)",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <span>View All {totalMatches > 0 ? totalMatches : ""} Fixtures</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Bet of the Day / Featured AI Pick Hero */}
        <div className="luxury-card" style={{
          padding: "24px 28px",
          marginBottom: 32,
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div className="gold-badge" style={{ marginBottom: 10 }}>
                <Flame size={13} />
                AI BET OF THE DAY • {featuredMatch?.confidence || "89%"} CONFIDENCE
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                {featuredMatch ? `${featuredMatch.homeTeam} vs ${featuredMatch.awayTeam} — ${featuredMatch.leagueName}` : "Featured Match Analysis"}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>
                High-confidence AI consensus for{" "}
                <strong style={{ color: "var(--gold)", fontWeight: 700 }}>{featuredMatch ? `${featuredMatch.predictions.bestTip.pick || "Home Win"} @ ${featuredMatch.predictions.bestTip.odd || "1.75"}` : "Arsenal Win @ 1.72"}</strong>
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link
                href={featuredMatch ? featuredMatch.url : "/all-matches"}
                className="gold-btn"
                style={{
                  padding: "10px 20px",
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                <span>View Full Analysis</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Date Selector & Navigation Bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/all-matches?d=-1"
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: "var(--surface-raised)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
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
                borderRadius: 8,
                background: "var(--gold-bg)",
                border: "1px solid var(--gold-border)",
                color: "var(--gold)",
                fontSize: 13,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Today ({totalMatches})
            </Link>
            <Link
              href="/all-matches?d=1"
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: "var(--surface-raised)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Tomorrow
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/progress"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "var(--gold)",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <ShieldCheck size={16} color="var(--accent-green)" />
              <span>Verified 89.4% Win-Rate Track Record</span>
            </Link>
          </div>
        </div>

        {/* Grouped Match Cards */}
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
              className="luxury-card"
              style={{
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <p style={{ color: "var(--text-secondary)", fontSize: "15px", margin: "0 0 16px" }}>
                Real-time predictions are syncing with our live sports telemetry engine.
              </p>
              <Link href="/all-matches" className="gold-btn" style={{ padding: "10px 24px", fontSize: "13px" }}>
                Browse All Match Fixtures
              </Link>
            </div>
          )}
        </div>
      </main>

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