import crypto from "crypto";
import { IPaymentProvider } from "./provider";
import {
  CreateCheckoutInput,
  CheckoutResult,
  StandardWebhookEvent,
} from "./types";
import {
  getCreditPackOrNull,
  getPurchasableOrThrow,
  isCreditPackId,
  resolveBachsProductToInternalId,
} from "./plans.config";

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
    const plan = getPurchasableOrThrow(input.planId);
    const isCredits = isCreditPackId(plan.id);

    // 1. Direct Bachs Checkout Paylink (Preferred for hosted Mobile Money / M-Pesa checkouts)
    const targetUrl = plan.bachsCheckoutUrl;
    if (targetUrl) {
      try {
        const url = new URL(targetUrl);
        if (input.userEmail) {
          url.searchParams.set("email", input.userEmail);
        }
        if (input.userName) {
          url.searchParams.set("name", input.userName);
        }
        url.searchParams.set("metadata[userId]", input.userId);
        url.searchParams.set("metadata[userEmail]", input.userEmail);
        url.searchParams.set("metadata[planId]", plan.id);
        url.searchParams.set("metadata[kind]", isCredits ? "credits" : "subscription");
        if (input.successUrl.startsWith("https://")) {
          url.searchParams.set("redirect_url", input.successUrl);
        }
        if (input.currency) {
          url.searchParams.set("currency", input.currency);
          url.searchParams.set("metadata[currency]", input.currency);
        }
        if (input.country) {
          url.searchParams.set("country", input.country);
          url.searchParams.set("metadata[country]", input.country);
        }

        return {
          sessionId: `bachs_${Date.now()}`,
          checkoutUrl: url.toString(),
          provider: this.name,
        };
      } catch {
        // Fallback to API checkout if URL parsing fails
      }
    }

    // 2. Fallback to Bachs API if keys are provided
    if (!this.secretKey) {
      console.log(`[BachsProvider] Using default Bachs direct paylink for ${input.userEmail} on plan ${plan.name}`);
      return {
        sessionId: `bachs_direct_${Date.now()}`,
        checkoutUrl: plan.bachsCheckoutUrl || `${input.successUrl}?bachs_trial=true&plan=${input.planId}`,
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
        ...(!isCredits && "hasTrial" in plan && plan.hasTrial
          ? { trial_period_days: plan.trialDays || 7 }
          : {}),
        redirect_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: {
          userId: input.userId,
          userEmail: input.userEmail,
          planId: input.planId,
          kind: isCredits ? "credits" : "subscription",
          ...(!isCredits && "trialDays" in plan ? { trialDays: plan.trialDays || 7 } : {}),
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

    const lowerHeaders: Record<string, string> = {};
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        lowerHeaders[k.toLowerCase()] = Array.isArray(v) ? (v[0] || "") : (v || "");
      }
    }

    const headerSig =
      lowerHeaders["x-bachs-signature"] ||
      lowerHeaders["bachs-signature"] ||
      signature ||
      "";
    const sigV2 = lowerHeaders["x-bachs-signature-v2"] || "";
    const headerTs = lowerHeaders["x-bachs-timestamp"] || "";

    // Parse optional v2 header format: "t=<unix_sec>,v1=<hex>"
    let v2Timestamp = "";
    let v2Signature = "";
    if (sigV2) {
      for (const part of sigV2.split(",")) {
        const [k, val] = part.split("=").map((s) => s.trim());
        if (k === "t" && val) v2Timestamp = val;
        if (k === "v1" && val) v2Signature = val;
      }
    }

    const activeTimestamp = (headerTs || v2Timestamp).trim();
    const activeSignature = (headerSig || v2Signature).replace(/^sha256=/i, "").trim().toLowerCase();

    // Verify HMAC-SHA256 signature when BACHS_WEBHOOK_SECRET is configured
    if (this.webhookSecret) {
      if (!activeSignature) {
        throw new Error("Missing Bachs webhook signature");
      }

      if (activeTimestamp) {
        const tsNum = parseInt(activeTimestamp, 10);
        if (!Number.isFinite(tsNum) || Math.abs(Math.floor(Date.now() / 1000) - tsNum) > 300) {
          throw new Error("Stale or invalid Bachs webhook timestamp");
        }
      }

      const candidatePayloads = activeTimestamp
        ? [`${activeTimestamp}.${bodyStr}`, bodyStr]
        : [bodyStr];

      const providedBuf = Buffer.from(activeSignature, "utf8");
      const matched = candidatePayloads.some((payloadToSign) => {
        const computed = crypto
          .createHmac("sha256", this.webhookSecret)
          .update(payloadToSign, "utf8")
          .digest("hex")
          .toLowerCase();
        const computedBuf = Buffer.from(computed, "utf8");
        return (
          providedBuf.length === computedBuf.length &&
          crypto.timingSafeEqual(providedBuf, computedBuf)
        );
      });

      if (!matched) {
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
    const productId = data.product_id || data.product?.id || data.metadata?.productId || data.metadata?.product_id;
    const mappedFromProduct = resolveBachsProductToInternalId(productId);
    const planId = mappedFromProduct || data.metadata?.planId || "VIP_MONTHLY";
    const creditPack = getCreditPackOrNull(planId);

    const providerSubId = data.subscription_id || data.id || data.reference;
    const providerCustId = data.customer?.id || data.customer_id;

    // One-time Bet Builder Credit Pack purchases grant credits only on settled collection/charge events
    if (creditPack) {
      if (
        eventType.includes("collection.succeeded") ||
        eventType.includes("charge.success") ||
        eventType.includes("payment.succeeded") ||
        eventType.includes("checkout.completed") ||
        eventType.includes("order.paid")
      ) {
        const curCode = (data.currency || data.metadata?.currency || "").toString().toUpperCase();
        const amountPaid =
          data.amount != null && curCode
            ? `${curCode} ${data.amount}`
            : undefined;
        return {
          eventId: payload.id || `bachs_evt_${Date.now()}`,
          type: "checkout.completed",
          provider: this.name,
          userId,
          userEmail,
          planId: creditPack.id,
          creditGrant: creditPack.credits,
          providerSubId: data.reference || data.id,
          providerCustId,
          status: "ACTIVE",
          amountPaid,
        };
      }
      return {
        eventId: payload.id || `bachs_evt_${Date.now()}`,
        type: "ignored",
        provider: this.name,
      };
    }

    // Handle Trialing / Subscriptions
    if (
      eventType.includes("subscription.created") ||
      eventType.includes("subscription.trialing") ||
      eventType.includes("collection.succeeded") ||
      eventType.includes("invoice.paid") ||
      eventType.includes("charge.success") ||
      eventType.includes("checkout.completed")
    ) {
      const isTrial = Boolean(data.is_trial || data.status === "trialing" || eventType.includes("trialing"));
      const trialDays = data.metadata?.trialDays || 7;
      const durationDays = (planId === "PREMIUM_6MONTHS" || planId === "VIP_6MONTHS") ? 180 : 30;
      const periodEnd = isTrial
        ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

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
        currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : periodEnd,
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

    if (
      eventType.includes("payment.failed") ||
      eventType.includes("charge.failed") ||
      eventType.includes("collection.failed")
    ) {
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
