import Stripe from "stripe";
import { IPaymentProvider } from "./provider";
import {
  CreateCheckoutInput,
  CheckoutResult,
  StandardWebhookEvent,
} from "./types";
import { getPlanOrThrow } from "./plans.config";

export class StripePaymentProvider implements IPaymentProvider {
  readonly name = "stripe";
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key";
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2025-02-24.acacia" as any,
    });
  }

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const plan = getPlanOrThrow(input.planId);

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("placeholder")) {
      console.warn("[StripePaymentProvider] STRIPE_SECRET_KEY not set or invalid. Falling back to mock URL for testing.");
      return {
        sessionId: `sim_stripe_${Date.now()}`,
        checkoutUrl: `${input.successUrl}${input.successUrl.includes("?") ? "&" : "?"}stripe_session_id=sim_stripe_${Date.now()}&planId=${plan.id}`,
        provider: this.name,
      };
    }

    // Prepare line item (supports existing Stripe Price ID OR creates price data dynamically on-the-fly)
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

    if (plan.stripePriceId) {
      lineItems = [{ price: plan.stripePriceId, quantity: 1 }];
    } else {
      lineItems = [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.amountCents,
            recurring: {
              interval: plan.interval,
            },
          },
          quantity: 1,
        },
      ];
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: input.userEmail,
      client_reference_id: input.userId,
      subscription_data: {
        metadata: {
          userId: input.userId,
          userEmail: input.userEmail,
          planId: plan.id,
        },
      },
      metadata: {
        userId: input.userId,
        userEmail: input.userEmail,
        planId: plan.id,
      },
      success_url: `${input.successUrl}${input.successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: input.cancelUrl,
    });

    if (!session.url) {
      throw new Error("Stripe failed to return a checkout URL.");
    }

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      provider: this.name,
    };
  }

  async verifyAndParseWebhook(
    rawBody: string | Buffer,
    signature?: string
  ): Promise<StandardWebhookEvent> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is missing. Cannot verify webhook authenticity.");
    }
    if (!signature) {
      throw new Error("Missing 'stripe-signature' header. Webhook signature verification is mandatory.");
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error(`[StripePaymentProvider] Webhook signature verification failed: ${err.message}`);
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    const eventId = event.id;
    console.log(`[StripePaymentProvider] Verified Stripe event: ${event.type} (${eventId})`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        const planId = session.metadata?.planId || "VIP_MONTHLY";
        const providerSubId = typeof session.subscription === "string" ? session.subscription : (session.subscription as any)?.id;
        const providerCustId = typeof session.customer === "string" ? session.customer : (session.customer as any)?.id;

        return {
          eventId,
          type: "checkout.completed",
          provider: this.name,
          userId: userId || undefined,
          userEmail: session.customer_email || session.metadata?.userEmail,
          planId,
          providerSubId: providerSubId || undefined,
          providerCustId: providerCustId || undefined,
          status: "ACTIVE",
          amountPaid: session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : undefined,
        };
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        const planId = sub.metadata?.planId || "VIP_MONTHLY";
        const providerCustId = typeof sub.customer === "string" ? sub.customer : (sub.customer as any)?.id;

        let status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED" | "EXPIRED" = "ACTIVE";
        if (sub.status === "past_due") status = "PAST_DUE";
        else if (sub.status === "canceled" || sub.status === "unpaid") status = "CANCELLED";
        else if (sub.status === "trialing") status = "TRIALING";

        // Stripe timestamp is in seconds
        const currentPeriodEnd = (sub as any).current_period_end
          ? new Date((sub as any).current_period_end * 1000)
          : undefined;

        return {
          eventId,
          type: event.type === "customer.subscription.created" ? "subscription.created" : "subscription.updated",
          provider: this.name,
          userId: userId || undefined,
          planId,
          providerSubId: sub.id,
          providerCustId: providerCustId || undefined,
          status,
          currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        };
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        return {
          eventId,
          type: "subscription.deleted",
          provider: this.name,
          providerSubId: sub.id,
          status: "CANCELLED",
          cancelAtPeriodEnd: true,
        };
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const providerSubId = typeof (invoice as any).subscription === "string"
          ? (invoice as any).subscription
          : (invoice as any).subscription?.id;

        return {
          eventId,
          type: "payment.failed",
          provider: this.name,
          providerSubId: providerSubId || undefined,
          status: "PAST_DUE",
        };
      }

      default:
        return {
          eventId,
          type: "ignored",
          provider: this.name,
        };
    }
  }

  async createCustomerPortalSession(
    providerCustId: string,
    returnUrl: string
  ): Promise<string> {
    const portalSession = await this.stripe.billingPortal.sessions.create({
      customer: providerCustId,
      return_url: returnUrl,
    });
    return portalSession.url;
  }

  async cancelSubscription(providerSubId: string): Promise<boolean> {
    await this.stripe.subscriptions.update(providerSubId, {
      cancel_at_period_end: true,
    });
    return true;
  }
}
