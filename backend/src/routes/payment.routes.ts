import { Router, Request, Response } from "express";
import { paymentService } from "../lib/payments/payment.service";
import { SUBSCRIPTION_PLANS, getPlanOrThrow } from "../lib/payments/plans.config";
import { authService } from "../lib/auth/auth-service";

const router = Router();

// Helper to extract auth token
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
 * 1. GET /api/payments/plans
 * Returns public pricing plans from the server authority
 */
router.get("/plans", (_req: Request, res: Response) => {
  const plans = Object.values(SUBSCRIPTION_PLANS).map((p) => ({
    id: p.id,
    name: p.name,
    badge: p.badge,
    description: p.description,
    amount: (p.amountCents / 100).toFixed(2),
    currency: p.currency.toUpperCase(),
    interval: p.interval,
    features: p.features,
  }));

  return res.json({
    success: true,
    provider: paymentService.getProviderName(),
    plans,
  });
});

/**
 * 2. POST /api/payments/checkout
 * Authenticated checkout session generation
 */
router.post("/checkout", async (req: Request, res: Response) => {
  try {
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "You must be signed in to upgrade to a VIP plan.",
      });
    }

    const { planId } = req.body || {};
    if (!planId) {
      return res.status(400).json({
        success: false,
        error: "Missing required 'planId'.",
      });
    }

    // Validate plan exists
    getPlanOrThrow(planId);

    const clientAppUrl = process.env.CLIENT_APP_URL || "http://localhost:3000";
    const successUrl = `${clientAppUrl}/pricing/success`;
    const cancelUrl = `${clientAppUrl}/pricing?status=cancelled`;

    const result = await paymentService.createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      userName: user.name || undefined,
      planId,
      successUrl,
      cancelUrl,
    });

    return res.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
      provider: result.provider,
    });
  } catch (error: any) {
    console.error("❌ [PAYMENTS:CHECKOUT_ERROR]", error.message);
    return res.status(400).json({
      success: false,
      error: error.message || "Failed to initialize checkout session.",
    });
  }
});

/**
 * 3. POST /api/payments/webhook
 * Webhook handler with signature validation and idempotency
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const signature = (req.headers["stripe-signature"] as string) || undefined;

    // Express text/raw body handling
    let rawBody: string | Buffer = req.body;
    if (typeof rawBody !== "string" && !Buffer.isBuffer(rawBody)) {
      rawBody = JSON.stringify(rawBody);
    }

    const result = await paymentService.handleWebhook(rawBody, signature);

    return res.status(200).json({
      received: true,
      status: result.status,
      eventId: result.eventId,
    });
  } catch (error: any) {
    console.error("❌ [PAYMENTS:WEBHOOK_ERROR]", error.message);
    return res.status(400).json({
      received: false,
      error: error.message || "Webhook processing error",
    });
  }
});

/**
 * 4. POST /api/payments/portal
 * Customer billing management portal
 */
router.post("/portal", async (req: Request, res: Response) => {
  try {
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);

    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const clientAppUrl = process.env.CLIENT_APP_URL || "http://localhost:3000";
    const returnUrl = `${clientAppUrl}/account`;

    const portalUrl = await paymentService.getCustomerPortalUrl(user.id, returnUrl);

    return res.json({
      success: true,
      portalUrl,
    });
  } catch (error: any) {
    console.error("❌ [PAYMENTS:PORTAL_ERROR]", error.message);
    return res.status(400).json({
      success: false,
      error: error.message || "Unable to open customer portal.",
    });
  }
});

/**
 * 5. GET /api/payments/subscription-status
 * Check current user VIP subscription status
 */
router.get("/subscription-status", async (req: Request, res: Response) => {
  try {
    const token = getAuthToken(req);
    const user = await authService.getCurrentUser(token);

    if (!user) {
      return res.json({
        success: true,
        isLoggedIn: false,
        hasActiveSubscription: false,
        plan: "FREE",
      });
    }

    const status = await paymentService.getUserSubscriptionStatus(user.id);

    return res.json({
      success: true,
      isLoggedIn: true,
      userId: user.id,
      email: user.email,
      ...status,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
