import { Router, Request, Response } from "express";
import { scraperScheduler } from "../lib/scraper/scraper-scheduler";

const router = Router();

// GET /api/health
router.get("/", (_req: Request, res: Response) => {
  return res.json({
    status: "ok",
    service: "jolloftips-backend",
    provider: process.env.FOOTBALL_PROVIDER || "nerdytips",
    lastSync: scraperScheduler.lastStats,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
