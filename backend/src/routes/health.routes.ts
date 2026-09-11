import { Router, Request, Response } from "express";

const router = Router();

// GET /api/health
router.get("/", (_req: Request, res: Response) => {
  return res.json({
    status: "ok",
    service: "jolloftips-backend",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
