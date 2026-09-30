import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { IPaymentProvider } from "./provider";
import {
  CreateCheckoutInput,
  CheckoutResult,
  StandardWebhookEvent,
  PlanId,
} from "./types";
import { getPlanOrThrow } from "./plans.config";

export class WhopPaymentProvider implements IPaymentProvider {
  readonly name = "whop";
  private apiKey?: string;
  private webhookSecret?: string;

  constructor() {
    this.apiKey = process.env.WHOP_API_KEY || undefined;
    this.webhookSecret = process.env.WHOP_WEBHOOK_SECRET || undefined;
  }

  /**
   * 1. Create Hosted Whop Checkout Session or URL
   */
  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const plan = getPlanOrThrow(input.planId);

    // If an official Whop API Key is configured, attempt to dynamically create a checkout configuration
    if (this.apiKey && !this.apiKey.includes("placeholder")) {
      try {
        // Whop requires HTTPS for redirect URLs. If on localhost (http), fallback to production or omit
        const clientRedirectUrl = input.successUrl.startsWith("https://")
          ? input.successUrl
          : (process.env.CLIENT_APP_URL?.startsWith("https://") ? `${process.env.CLIENT_APP_URL}/pricing/success` : undefined);

        const payload: Record<string, any> = {
          plan_id: plan.whopPlanId,
          ...(clientRedirectUrl ? { redirect_url: clientRedirectUrl } : {}),
          ...(process.env.WHOP_ACCOUNT_ID ? { account_id: process.env.WHOP_ACCOUNT_ID } : {}),
          metadata: {
            userId: input.userId,
            userEmail: input.userEmail,
            planId: plan.id,
          },
        };

        const res = await fetch("https://api.whop.com/api/v1/checkout_configurations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          const checkoutUrl = data.purchase_url || data.url || data.checkout_url || (data.id ? `https://whop.com/checkout/${data.id}` : null);
          if (checkoutUrl) {
            return {
              sessionId: data.id || `whop_${Date.now()}`,
              checkoutUrl,
              provider: this.name,
            };
          }
        } else {
          const errText = await res.text();
          console.warn(`[WhopPaymentProvider] Whop API checkout configuration call returned ${res.status}: ${errText}. Falling back to direct URL.`);
        }
      } catch (err: any) {
        console.warn(`[WhopPaymentProvider] Failed to invoke Whop API: ${err.message}. Falling back to direct URL.`);
      }
    }

    // Direct Whop Checkout URL resolution:
    // ALWAYS prefer https://whop.com/checkout/{plan_id} over storefront links so users go straight to payment
    const directUrl = (plan.whopPlanId ? `https://whop.com/checkout/${plan.whopPlanId}` : null) || plan.whopCheckoutUrl;

    if (directUrl) {
      try {
        const url = new URL(directUrl);
        if (input.successUrl.startsWith("https://")) {
          url.searchParams.set("redirect_url", input.successUrl);
        }
        if (input.userEmail) {
          url.searchParams.set("email", input.userEmail);
        }
        url.searchParams.set("metadata[userId]", input.userId);
        url.searchParams.set("metadata[userEmail]", input.userEmail);
        url.searchParams.set("metadata[planId]", plan.id);

        return {
          sessionId: `whop_link_${Date.now()}`,
          checkoutUrl: url.toString(),
          provider: this.name,
        };
      } catch {
        // Fall through
      }
    }

    // Fallback Mock URL for local development / testing without live Whop credentials
    console.warn(`[WhopPaymentProvider] Neither WHOP_API_KEY nor valid WHOP_PLAN_ID/WHOP_CHECKOUT_URL configured for plan ${plan.id}. Using simulated development checkout redirect.`);
    return {
      sessionId: `sim_whop_${Date.now()}`,
      checkoutUrl: `${input.successUrl}${input.successUrl.includes("?") ? "&" : "?"}whop_session_id=sim_whop_${Date.now()}&planId=${plan.id}`,
      provider: this.name,
    };
  }

  /**
   * 2. Cryptographically Verify and Normalize Whop Standard Webhooks
   */
  async verifyAndParseWebhook(
    rawBody: string | Buffer,
    signature?: string,
    headers?: Record<string, string | string[] | undefined>
  ): Promise<StandardWebhookEvent> {
    const webhookSecret = this.webhookSecret;

    const normalizedHeaders: Record<string, string> = {};
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          normalizedHeaders[k.toLowerCase()] = v;
        } else if (Array.isArray(v) && v[0]) {
          normalizedHeaders[k.toLowerCase()] = v[0];
        }
      }
    }

    if (signature && !normalizedHeaders["webhook-signature"]) {
      normalizedHeaders["webhook-signature"] = signature;
    }

    const payloadString = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");

    let event: any;

    if (!webhookSecret || webhookSecret.includes("placeholder")) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("WHOP_WEBHOOK_SECRET is missing. Cannot verify webhook authenticity in production.");
      }
      console.warn("⚠️ [WhopPaymentProvider] WHOP_WEBHOOK_SECRET is not set. In non-production mode, parsing unverified payload.");
      try {
        event = JSON.parse(payloadString);
      } catch {
        throw new Error("Invalid JSON payload in webhook body.");
      }
    } else {
      let wh: Webhook;
      try {
        wh = new Webhook(webhookSecret);
      } catch {
        wh = new Webhook(webhookSecret, { format: "raw" });
      }

      try {
        event = wh.verify(payloadString, normalizedHeaders as any);
      } catch (err: any) {
        console.error(`[WhopPaymentProvider] Webhook verification failed: ${err.message}`);
        throw new Error(`Whop webhook verification failed: ${err.message}`);
      }
    }

    if (!event || typeof event !== "object") {
      return {
        eventId: `whop_evt_${Date.now()}`,
        type: "ignored",
        provider: this.name,
      };
    }

    const eventId = event.id || `whop_evt_${Date.now()}`;
    const eventType = (event.type || event.action || "").toLowerCase();
    const data = event.data || event;

    console.log(`[WhopPaymentProvider] Processing Whop event: ${eventType} (${eventId})`);

    const metadata = data.metadata || {};
    const userId = metadata.userId || metadata.user_id || data.user_id || undefined;
    const userEmail = data.email || data.customer?.email || data.user?.email || metadata.userEmail || undefined;

    // Resolve internal plan ID
    let planId: PlanId = "VIP_MONTHLY";
    if (metadata.planId === "VIP_ANNUAL" || metadata.planId === "VIP_MONTHLY") {
      planId = metadata.planId;
    } else if (data.plan_id) {
      if (
        data.plan_id === process.env.WHOP_PLAN_VIP_ANNUAL ||
        data.plan_id.toLowerCase().includes("annual") ||
        data.plan_id.toLowerCase().includes("year")
      ) {
        planId = "VIP_ANNUAL";
      }
    }

    // Resolve subscription / membership ID
    const providerSubId =
      data.subscription_id ||
      data.membership_id ||
      data.membership?.id ||
      (eventType.startsWith("membership.") ? data.id : undefined) ||
      data.id ||
      undefined;

    // Resolve customer ID
    const providerCustId = data.customer?.id || data.user_id || data.customer_id || undefined;

    // Calculate expiration / currentPeriodEnd
    let currentPeriodEnd: Date | undefined;
    if (data.expires_at || data.renewal_period_end) {
      const parsed = new Date(data.expires_at || data.renewal_period_end);
      if (!isNaN(parsed.getTime())) {
        currentPeriodEnd = parsed;
      }
    }
    if (!currentPeriodEnd) {
      const daysToAdd = planId === "VIP_ANNUAL" ? 365 : 30;
      currentPeriodEnd = new Date(Date.now() + daysToAdd * 86400000);
    }

    // Format paid amount
    let amountPaid: string | undefined;
    if (data.final_amount != null) {
      amountPaid = `$${Number(data.final_amount).toFixed(2)}`;
    } else if (data.amount != null) {
      const numeric = Number(data.amount);
      amountPaid = `$${(numeric > 100 ? numeric / 100 : numeric).toFixed(2)}`;
    } else if (data.subtotal != null) {
      amountPaid = `$${Number(data.subtotal).toFixed(2)}`;
    }

    switch (eventType) {
      case "payment.succeeded":
      case "payment.created": {
        return {
          eventId,
          type: "checkout.completed",
          provider: this.name,
          userId,
          userEmail,
          planId,
          providerSubId,
          providerCustId,
          status: "ACTIVE",
          currentPeriodEnd,
          amountPaid,
        };
      }

      case "membership.went_valid":
      case "membership.activated":
      case "membership.created": {
        return {
          eventId,
          type: "subscription.created",
          provider: this.name,
          userId,
          userEmail,
          planId,
          providerSubId,
          providerCustId,
          status: "ACTIVE",
          currentPeriodEnd,
          amountPaid,
        };
      }

      case "membership.went_invalid":
      case "membership.deactivated":
      case "membership.deleted":
      case "subscription.canceled":
      case "subscription.cancelled": {
        return {
          eventId,
          type: "subscription.deleted",
          provider: this.name,
          providerSubId,
          status: "CANCELLED",
          cancelAtPeriodEnd: true,
        };
      }

      case "payment.failed": {
        return {
          eventId,
          type: "payment.failed",
          provider: this.name,
          providerSubId,
          status: "PAST_DUE",
        };
      }

      default: {
        return {
          eventId,
          type: "ignored",
          provider: this.name,
        };
      }
    }
  }

  /**
   * 3. Customer Billing Portal Session
   */
  async createCustomerPortalSession(
    _providerCustId: string,
    _returnUrl: string
  ): Promise<string> {
    const customPortal = process.env.WHOP_CUSTOMER_PORTAL_URL;
    if (customPortal) {
      return customPortal;
    }
    // Whop customer hub allows users to view subscriptions, manage billing, and download receipts
    return "https://whop.com/hub";
  }

  /**
   * 4. Cancel Subscription directly with Whop
   */
  async cancelSubscription(providerSubId: string): Promise<boolean> {
    if (!this.apiKey || !providerSubId) {
      return true;
    }

    try {
      const res = await fetch(`https://api.whop.com/api/v1/memberships/${providerSubId}/terminate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.warn(`[WhopPaymentProvider] Whop membership terminate returned status: ${res.status}`);
      }
      return true;
    } catch (err: any) {
      console.error(`[WhopPaymentProvider] Failed to cancel Whop subscription: ${err.message}`);
      return false;
    }
  }
}
