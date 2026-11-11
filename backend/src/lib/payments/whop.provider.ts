import { Webhook, WebhookVerificationError } from "standardwebhooks";
import { IPaymentProvider } from "./provider";
import {
  CreateCheckoutInput,
  CheckoutResult,
  StandardWebhookEvent,
  PlanId,
} from "./types";
import {
  getCreditPackOrNull,
  getPurchasableOrThrow,
  isCreditPackId,
  resolveProviderAndCheckout,
  resolveWhopPlanToInternalId,
} from "./plans.config";

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
    const plan = getPurchasableOrThrow(input.planId);
    const routed = resolveProviderAndCheckout(input.planId, input.currency);
    const isCredits = isCreditPackId(plan.id);
    const targetWhopPlanId = routed.productId || plan.whopPlanId;
    const directUrl = routed.checkoutUrl || (targetWhopPlanId ? `https://whop.com/checkout/${targetWhopPlanId}` : null) || plan.whopCheckoutUrl;

    // If an official Whop API Key is configured, attempt to dynamically create a checkout configuration
    if (this.apiKey && !this.apiKey.includes("placeholder") && targetWhopPlanId) {
      try {
        // Whop requires HTTPS for redirect URLs. If on localhost (http), fallback to production or omit
        const clientRedirectUrl = input.successUrl.startsWith("https://")
          ? input.successUrl
          : (process.env.CLIENT_APP_URL?.startsWith("https://")
              ? `${process.env.CLIENT_APP_URL}/pricing/success${isCredits ? `?type=credits&planId=${plan.id}` : ""}`
              : undefined);

        const payload: Record<string, any> = {
          plan_id: targetWhopPlanId,
          ...(clientRedirectUrl ? { redirect_url: clientRedirectUrl } : {}),
          ...(process.env.WHOP_ACCOUNT_ID ? { account_id: process.env.WHOP_ACCOUNT_ID } : {}),
          metadata: {
            userId: input.userId,
            userEmail: input.userEmail,
            planId: plan.id,
            kind: isCredits ? "credits" : "subscription",
            currency: routed.currency,
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

    // Direct Whop Checkout URL resolution (with metadata query params & currency-matched plan link)
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
        url.searchParams.set("metadata[kind]", isCredits ? "credits" : "subscription");
        url.searchParams.set("metadata[currency]", routed.currency);

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
    const telegramId = metadata.telegramId || metadata.telegram_id || data.custom_fields?.telegram_id || undefined;

    // Resolve internal plan ID (handles both subscription plans & Bet Builder credit packs via metadata or Whop IDs)
    const whopPlanIdRaw = data.plan_id || data.plan?.id || null;
    const whopProductIdRaw = data.product_id || data.product?.id || null;
    let planId: PlanId = "PREMIUM_MONTHLY";
    const metaPlanId = typeof metadata.planId === "string" ? metadata.planId : null;

    if (
      metaPlanId &&
      (metaPlanId === "VIP_MONTHLY" ||
        metaPlanId === "VIP_6MONTHS" ||
        metaPlanId === "PREMIUM_MONTHLY" ||
        metaPlanId === "PREMIUM_6MONTHS" ||
        isCreditPackId(metaPlanId))
    ) {
      planId = metaPlanId as PlanId;
    } else {
      const mapped = resolveWhopPlanToInternalId(whopPlanIdRaw, whopProductIdRaw);
      if (mapped) {
        planId = mapped;
      } else if (typeof whopPlanIdRaw === "string" && whopPlanIdRaw.toLowerCase().includes("vip")) {
        planId = "VIP_MONTHLY";
      }
    }

    const creditPack = getCreditPackOrNull(planId);

    // Format paid amount cleanly preserving currency when available
    let amountPaid: string | undefined;
    const rawCur = (data.currency || metadata.currency || "USD").toString().toUpperCase();
    const curPrefix = rawCur === "NGN" ? "₦" : rawCur === "ZAR" ? "R" : "$";
    if (data.final_amount != null) {
      amountPaid = `${curPrefix}${Number(data.final_amount).toFixed(2)}`;
    } else if (data.amount != null) {
      const numeric = Number(data.amount);
      amountPaid = `${curPrefix}${(numeric > 100 && rawCur === "USD" ? numeric / 100 : numeric).toFixed(2)}`;
    } else if (data.subtotal != null) {
      amountPaid = `${curPrefix}${Number(data.subtotal).toFixed(2)}`;
    }

    // One-time Credit Pack purchases only fulfill on settled payment.succeeded (avoiding premature or duplicate fulfillment)
    if (creditPack) {
      if (eventType === "payment.succeeded") {
        return {
          eventId,
          type: "checkout.completed",
          provider: this.name,
          userId,
          userEmail,
          telegramId,
          planId: creditPack.id,
          creditGrant: creditPack.credits,
          providerSubId: data.id || data.payment_id || eventId,
          providerCustId: data.customer?.id || data.user_id || data.customer_id || undefined,
          status: "ACTIVE",
          amountPaid,
        };
      }
      return {
        eventId,
        type: "ignored",
        provider: this.name,
      };
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
      const daysToAdd = (planId === "PREMIUM_6MONTHS" || planId === "VIP_6MONTHS") ? 180 : 30;
      currentPeriodEnd = new Date(Date.now() + daysToAdd * 86400000);
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
          telegramId,
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
          telegramId,
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
