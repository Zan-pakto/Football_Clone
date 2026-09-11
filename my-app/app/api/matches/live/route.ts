import { NextRequest, NextResponse } from "next/server";
import { fixtureService } from "@/lib/football/fixture-service";
import { store } from "@/lib/db/store";
import { MatchData, LiveMatchUpdate } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const d = request.nextUrl.searchParams.get("d") ?? "0";

    // Query real active live matches from Bzzoiro live API endpoint
    const liveFixtures = await fixtureService.getLiveFixtures();

    const convertedMatches: MatchData[] = liveFixtures.map((f) => {
      const p1x2 = f.predictions?.find((p) => p.market === "1X2" || p.market === "DOUBLE_CHANCE");
      const pGoals = f.predictions?.find((p) => p.market === "OVER_UNDER");
      const pBtts = f.predictions?.find((p) => p.market === "BTTS");
      const pBest = f.predictions && f.predictions.length > 0
        ? [...f.predictions].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]
        : null;

      const topConfidence = f.predictions && f.predictions.length > 0
        ? Math.max(...f.predictions.map((p) => p.confidence || 80))
        : 84;

      return {
        id: f.id,
        url: `/match/${f.id}`,
        leagueName: f.league?.name || "League",
        country: f.league?.country?.name || "World",
        flagUrl: f.league?.country?.flag || null,
        homeTeam: f.homeTeam.name,
        awayTeam: f.awayTeam.name,
        homeLogo: f.homeTeam.logo || null,
        awayLogo: f.awayTeam.logo || null,
        kickTime: f.kickoffTime ? new Date(f.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
        status: f.status === "LIVE" ? "live" : f.status === "FINISHED" ? "won" : "upcoming",
        homeScore: f.homeScore !== null && f.homeScore !== undefined ? String(f.homeScore) : null,
        awayScore: f.awayScore !== null && f.awayScore !== undefined ? String(f.awayScore) : null,
        elapsed: f.elapsed,
        isLive: true,
        odds: {
          home: f.odds?.home ? String(f.odds.home) : "1.75",
          draw: f.odds?.draw ? String(f.odds.draw) : "3.50",
          away: f.odds?.away ? String(f.odds.away) : "4.20",
        },
        predictions: {
          pickScore: { pick: p1x2?.selection || null, odd: p1x2?.odd ? String(p1x2.odd) : null },
          goals: { pick: pGoals?.selection || null, odd: pGoals?.odd ? String(pGoals.odd) : null },
          btts: { pick: pBtts?.selection || null, odd: pBtts?.odd ? String(pBtts.odd) : null },
          bestTip: { pick: pBest?.selection || p1x2?.selection || null, odd: pBest?.odd ? String(pBest.odd) : p1x2?.odd ? String(p1x2.odd) : null },
        },
        confidence: `${topConfidence}%`,
      };
    });

    // Create live updates map
    const liveUpdates: Record<string, LiveMatchUpdate> = {};
    convertedMatches.forEach((m) => {
      liveUpdates[m.id] = {
        id: m.id,
        status: m.status,
        elapsed: m.elapsed || "LIVE",
        homeScore: m.homeScore !== null ? Number(m.homeScore) : undefined,
        awayScore: m.awayScore !== null ? Number(m.awayScore) : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      type: "live",
      d,
      count: convertedMatches.length,
      matches: convertedMatches,
      liveUpdates,
    });
  } catch (error: any) {
    console.error("GET /api/matches/live error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch live matches",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const d = body.d || "0";
    const updates: Record<string, LiveMatchUpdate> = body.updates || {};

    if (Object.keys(updates).length > 0) {
      await store.applyLiveUpdates(updates, d);
    }

    return NextResponse.json({
      success: true,
      d,
      updatedCount: Object.keys(updates).length,
      message: `Applied ${Object.keys(updates).length} live match updates`,
    });
  } catch (error: any) {
    console.error("POST /api/matches/live error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to apply live updates",
      },
      { status: 500 }
    );
  }
}