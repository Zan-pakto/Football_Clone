import crypto from "crypto";
import { IPaymentProvider } from "./provider";
import {
  CreateCheckoutInput,
  CheckoutResult,
  StandardWebhookEvent,
} from "./types";
import { getPlanOrThrow } from "./plans.config";

export class BachsPaymentProvider implements IPaymentProvider {
  readonly name = "bachs";
  private secretKey: string;
  private publicKey: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor() {
    this.secretKey = process.env.BACHS_SECRET_KEY || "";
    this.publicKey = process.env.BACHS_PUBLIC_KEY || "";
    this.webhookSecret = process.env.BACHS_WEBHOOK_SECRET || "";
    this.baseUrl = process.env.BACHS_BASE_URL || "https://api.bachs.io/v1";

    if (!this.secretKey) {
      console.warn("⚠️ [BachsProvider] BACHS_SECRET_KEY not set. Ready for API credentials when generated.");
    }
  }

  /**
   * 1. Create Checkout Session on Bachs.io
   */
  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const plan = getPlanOrThrow(input.planId);

    // If keys not configured yet, return dev fallback with instructions
    if (!this.secretKey) {
      console.log(`[BachsProvider] Pending API credentials for ${input.userEmail} on plan ${plan.name}`);
      return {
        sessionId: `bachs_pending_${Date.now()}`,
        checkoutUrl: `${input.successUrl}?bachs_trial=true&plan=${input.planId}`,
        provider: this.name,
      };
    }

    try {
      const payload = {
        amount: plan.amountCents,
        currency: plan.currency.toUpperCase(),
        customer: {
          email: input.userEmail,
          name: input.userName || input.userEmail.split("@")[0],
          metadata: {
            userId: input.userId,
            planId: input.planId,
          },
        },
        trial_period_days: plan.hasTrial ? (plan.trialDays || 7) : undefined,
        redirect_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: {
          userId: input.userId,
          userEmail: input.userEmail,
          planId: input.planId,
          trialDays: plan.trialDays || 7,
        },
      };

      const res = await fetch(`${this.baseUrl}/checkouts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.secretKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Bachs API checkout error (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      return {
        sessionId: data.id || data.reference || `bachs_${Date.now()}`,
        checkoutUrl: data.checkout_url || data.url || input.successUrl,
        provider: this.name,
      };
    } catch (err: any) {
      console.error("[BachsProvider] Checkout creation failed:", err.message);
      throw err;
    }
  }

  /**
   * 2. Verify and parse Bachs.io Webhook
   */
  async verifyAndParseWebhook(
    rawBody: string | Buffer,
    signature?: string,
    headers?: Record<string, string | string[] | undefined>
  ): Promise<StandardWebhookEvent> {
    const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody;

    // Verify HMAC signature if secret is provided
    if (this.webhookSecret && signature) {
      const computed = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(bodyStr)
        .digest("hex");

      if (computed !== signature) {
        throw new Error("Invalid Bachs webhook signature");
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(bodyStr);
    } catch {
      throw new Error("Invalid JSON in Bachs webhook body");
    }

    const eventType = payload.event || payload.type || "";
    const data = payload.data || payload;

    const userEmail = data.customer?.email || data.email || data.metadata?.userEmail;
    const userId = data.metadata?.userId || data.customer?.metadata?.userId;
    const planId = data.metadata?.planId || "VIP_MONTHLY";
    const providerSubId = data.subscription_id || data.id || data.reference;
    const providerCustId = data.customer?.id || data.customer_id;

    // Handle Trialing / Subscriptions
    if (
      eventType.includes("subscription.created") ||
      eventType.includes("subscription.trialing") ||
      eventType.includes("charge.success") ||
      eventType.includes("checkout.completed")
    ) {
      const isTrial = Boolean(data.is_trial || data.status === "trialing" || eventType.includes("trialing"));
      const trialDays = data.metadata?.trialDays || 7;
      const trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

      return {
        eventId: payload.id || `evt_${Date.now()}`,
        type: "subscription.created",
        provider: this.name,
        userId,
        userEmail,
        planId,
        providerSubId,
        providerCustId,
        status: isTrial ? "TRIALING" : "ACTIVE",
        currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : trialEnd,
      };
    }

    if (eventType.includes("subscription.cancelled") || eventType.includes("subscription.deleted")) {
      return {
        eventId: payload.id || `evt_${Date.now()}`,
        type: "subscription.deleted",
        provider: this.name,
        providerSubId,
        status: "CANCELLED",
      };
    }

    if (eventType.includes("payment.failed") || eventType.includes("charge.failed")) {
      return {
        eventId: payload.id || `evt_${Date.now()}`,
        type: "payment.failed",
        provider: this.name,
        providerSubId,
        status: "PAST_DUE",
      };
    }

    return {
      eventId: payload.id || `evt_${Date.now()}`,
      type: "ignored",
      provider: this.name,
    };
  }

  /**
   * 3. Customer Portal Session
   */
  async createCustomerPortalSession(providerCustId: string, returnUrl: string): Promise<string> {
    return `${this.baseUrl}/portal/${providerCustId}?return_url=${encodeURIComponent(returnUrl)}`;
  }

  /**
   * 4. Cancel Subscription
   */
  async cancelSubscription(providerSubId: string): Promise<boolean> {
    if (!this.secretKey || !providerSubId) return false;
    try {
      const res = await fetch(`${this.baseUrl}/subscriptions/${providerSubId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
