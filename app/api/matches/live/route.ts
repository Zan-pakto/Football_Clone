import { NextRequest, NextResponse } from "next/server";
import { NerdyTipsScraper } from "@/lib/scraper/nerdytips";
import { store } from "@/lib/db/store";

export async function GET(request: NextRequest) {
  try {
    const d = request.nextUrl.searchParams.get("d") ?? "0";

    // 1. Fetch live score updates endpoint
    const liveResult = await NerdyTipsScraper.fetchLiveMatches(d);

    // 2. Ensure matches exist for day d
    let stored = await store.getMatches(d);
    if (stored.matches.length === 0) {
      const scraped = await NerdyTipsScraper.fetchAllMatches(d);
      if (scraped.success) {
        await store.saveScrapedMatches(scraped);
      }
    }

    // 3. Apply live updates
    if (liveResult.success && liveResult.updatedCount > 0) {
      await store.applyLiveUpdates(liveResult.matches, d);
    }

    // 4. Get active live matches
    const liveMatches = await store.getLiveMatches(d);

    return NextResponse.json({
      success: true,
      type: "live",
      d,
      count: liveMatches.length,
      matches: liveMatches,
      liveUpdates: liveResult.matches,
    });
  } catch (error: any) {
    console.error("GET /api/matches/live error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch live updates",
      },
      { status: 500 }
    );
  }
}