import { Router, Request, Response } from "express";
import { store } from "../lib/db/store";
import { scraperScheduler } from "../lib/scraper/scraper-scheduler";

const router = Router();

// GET /api/progress - Fetch latest AI performance progress data from DB / cache
router.get("/", async (_req: Request, res: Response) => {
  try {
    let stats = await store.getProgressStats();
    if (!stats) {
      // Trigger a sync if DB is empty
      const syncResult = await scraperScheduler.syncProgress();
      if (syncResult.success && syncResult.data) {
        stats = syncResult.data;
      }
    }

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("[ProgressRoute] Error fetching progress stats:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/progress/sync - Trigger on-demand progress scrape and DB storage
router.post("/sync", async (_req: Request, res: Response) => {
  try {
    const result = await scraperScheduler.syncProgress();
    return res.json(result);
  } catch (error: any) {
    console.error("[ProgressRoute] Error triggering progress sync:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
