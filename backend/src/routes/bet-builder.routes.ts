import { Router, Request, Response } from "express";
import { authService } from "../lib/auth/auth-service";
import { betBuilderCreditsService } from "../lib/bet-builder/credits-service";
import { CREDIT_PACKS } from "../lib/payments/plans.config";

const router = Router();

function getAuthToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (bearerToken && bearerToken !== "null" && bearerToken !== "undefined" && bearerToken.length > 10) {
    return bearerToken;
  }
  const cookieToken = req.cookies?.auth_token;
  if (cookieToken && cookieToken !== "null" && cookieToken !== "undefined") {
    return cookieToken;
  }
  return undefined;
}

/**
 * GET /api/bet-builder/status
 * Returns caller's Bet Builder quota (1 free weekly slip for registered free accounts,
 * purchased credits wallet, or unlimited for active Premium/VIP Pro subscribers).
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);

    if (!user) {
      return res.json({
        success: true,
        isLoggedIn: false,
        requiresSignup: true,
        isUnlimited: false,
        creditsBalance: 0,
        freeWeeklyRemaining: 0,
        nextFreeResetAt: null,
        canGenerate: false,
        subscriptionPlan: "GUEST",
        packs: Object.values(CREDIT_PACKS),
      });
    }

    const wallet = await betBuilderCreditsService.getWalletStatus(user);
    return res.json({
      success: true,
      isLoggedIn: true,
      requiresSignup: false,
      userId: user.id,
      email: user.email,
      ...wallet,
      packs: Object.values(CREDIT_PACKS),
    });
  } catch (error: any) {
    console.error("[BetBuilderRoute] GET /status error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bet-builder/consume
 * Atomically consumes 1 Bet Builder generation:
 * - Guests must sign up / log in first (401)
 * - Active Premium / VIP Pro subscribers pass with unlimited access
 * - Registered free/trial accounts use 1 weekly free slip first, then 1 credit from wallet
 */
router.post("/consume", async (req: Request, res: Response) => {
  try {
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        requiresSignup: true,
        error: "Create a free account to claim your 1 free weekly Bet Builder slip.",
      });
    }

    const result = await betBuilderCreditsService.consumeGeneration(user);
    if (!result.allowed) {
      return res.status(402).json({
        success: false,
        quotaExhausted: true,
        ...result,
        error: "Your weekly free slip has been used and your credit balance is 0.",
      });
    }

    return res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[BetBuilderRoute] POST /consume error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

