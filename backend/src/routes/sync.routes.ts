import { Router, Request, Response } from "express";
import { store } from "../lib/db/store";
import { MatchData, LiveMatchUpdate } from "../lib/types";

const router = Router();

// GET /api/sync
router.get("/", async (req: Request, res: Response) => {
  try {
    const d = (req.query.d as string) ?? "0";
    const data = await store.getMatches(d);
    return res.json({
      success: true,
      d,
      totalMatches: data.matches.length,
      lastSyncedAt: data.lastSyncedAt,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sync
router.post("/", async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const d = body.d ?? "0";
    const matches: MatchData[] = body.matches ?? [];
    const updates: Record<string, LiveMatchUpdate> = body.updates ?? {};

    if (matches.length > 0) {
      await store.saveMatches(matches, d);
    }

    if (Object.keys(updates).length > 0) {
      await store.applyLiveUpdates(updates, d);
    }

    return res.json({
      success: true,
      d,
      totalMatchesSynced: matches.length,
      liveMatchesUpdated: Object.keys(updates).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Sync endpoint error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Data synchronization failed",
    });
  }
});

export default router;
