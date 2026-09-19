import { Router, Request, Response } from "express";
import { rolloverService } from "../lib/rollovers/rollover-service";
import { RolloverType, RolloverStatus } from "../lib/types";

const router = Router();

// GET /api/rollovers
router.get("/", async (req: Request, res: Response) => {
  try {
    const type = req.query.type as RolloverType | undefined;
    const status = req.query.status as RolloverStatus | undefined;

    const rollovers = await rolloverService.getPublishedRollovers({ type, status });

    return res.json({
      success: true,
      count: rollovers.length,
      rollovers,
    });
  } catch (error: any) {
    console.error("GET /api/rollovers error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch rollovers",
    });
  }
});

// GET /api/rollovers/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rollover = await rolloverService.getRolloverById(id, false);

    if (!rollover) {
      return res.status(404).json({
        success: false,
        error: "Rollover plan not found",
      });
    }

    return res.json({
      success: true,
      rollover,
    });
  } catch (error: any) {
    console.error("GET /api/rollovers/:id error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch rollover details",
    });
  }
});

export default router;
