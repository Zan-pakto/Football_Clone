import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db/store";
import { MatchData, LiveMatchUpdate } from "@/lib/types";

export async function GET(request: NextRequest) {
  const d = request.nextUrl.searchParams.get("d") ?? "0";
  const data = await store.getMatches(d);
  return NextResponse.json({
    success: true,
    d,
    totalMatches: data.matches.length,
    lastSyncedAt: data.lastSyncedAt,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const d = body.d ?? "0";
    const matches: MatchData[] = body.matches ?? [];
    const updates: Record<string, LiveMatchUpdate> = body.updates ?? {};

    if (matches.length > 0) {
      await store.saveMatches(matches, d);
    }

    if (Object.keys(updates).length > 0) {
      await store.applyLiveUpdates(updates, d);
    }

    return NextResponse.json({
      success: true,
      d,
      totalMatchesSynced: matches.length,
      liveMatchesUpdated: Object.keys(updates).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Sync endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Data synchronization failed",
      },
      { status: 500 }
    );
  }
}
