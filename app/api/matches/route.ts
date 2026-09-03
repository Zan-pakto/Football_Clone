import { NextRequest, NextResponse } from "next/server";
import { NerdyTipsScraper } from "@/lib/scraper/nerdytips";
import { store } from "@/lib/db/store";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const d = searchParams.get("d") ?? "0";
    const country = searchParams.get("country") ?? undefined;
    const league = searchParams.get("league") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const sync = searchParams.get("sync") === "true";

    // 1. Get stored matches from DB / Memory cache
    let data = await store.getMatches(d, { country, league, status, search });

    const isStale =
      !data.lastScrapedAt ||
      Date.now() - new Date(data.lastScrapedAt).getTime() > 3 * 60 * 1000;

    // 2. If force sync, empty stored matches, or stale data (>3 mins), fetch fresh source data
    if (sync || data.matches.length === 0 || isStale) {
      console.log(`Fetching fresh matches from NerdyTips for d=${d}...`);
      const scraped = await NerdyTipsScraper.fetchAllMatches(d);
      if (scraped.success) {
        await store.saveScrapedMatches(scraped);

        // Fetch live updates if any
        const liveRes = await NerdyTipsScraper.fetchLiveMatches(d);
        if (liveRes.success && liveRes.updatedCount > 0) {
          await store.applyLiveUpdates(liveRes.matches, d);
        }

        data = await store.getMatches(d, { country, league, status, search });
      }
    }

    return NextResponse.json({
      success: true,
      type: "all",
      d,
      count: data.matches.length,
      lastScrapedAt: data.lastScrapedAt,
      matches: data.matches,
    });
  } catch (error: any) {
    console.error("GET /api/matches error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch matches",
      },
      { status: 500 }
    );
  }
}