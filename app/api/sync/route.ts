import { NextRequest, NextResponse } from "next/server";
import { NerdyTipsScraper } from "@/lib/scraper/nerdytips";
import { store } from "@/lib/db/store";

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}

async function handleSync(request: NextRequest) {
  try {
    const d = request.nextUrl.searchParams.get("d") ?? "0";

    // 1. Scrape all matches
    const scrapeResult = await NerdyTipsScraper.fetchAllMatches(d);
    if (!scrapeResult.success) {
      throw new Error(scrapeResult.error || "Scrape failed");
    }

    // 2. Persist to PostgreSQL database
    await store.saveScrapedMatches(scrapeResult);

    // 3. Fetch live updates
    const liveResult = await NerdyTipsScraper.fetchLiveMatches(d);
    if (liveResult.success && liveResult.updatedCount > 0) {
      await store.applyLiveUpdates(liveResult.matches, d);
    }

    return NextResponse.json({
      success: true,
      d,
      totalMatchesSynced: scrapeResult.matches.length,
      leaguesSynced: scrapeResult.leagueCount,
      liveMatchesUpdated: liveResult.updatedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Sync handler error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Synchronization failed",
      },
      { status: 500 }
    );
  }
}
