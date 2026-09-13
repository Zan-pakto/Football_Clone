import { IPaymentProvider } from "./provider";
import {
  CreateCheckoutInput,
  CheckoutResult,
  StandardWebhookEvent,
} from "./types";
import { getPlanOrThrow } from "./plans.config";

export class MockPaymentProvider implements IPaymentProvider {
  readonly name = "mock";

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const plan = getPlanOrThrow(input.planId);
    const mockSessionId = `mock_sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const mockSubId = `mock_sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const mockCustId = `mock_cus_${input.userId}`;

    // For local development and testing, point to a mock checkout completion landing page
    const checkoutUrl = `${input.successUrl}${input.successUrl.includes("?") ? "&" : "?"}mock_session_id=${mockSessionId}&planId=${plan.id}&mock_sub_id=${mockSubId}&mock_cus_id=${mockCustId}&mock_success=true`;

    console.log(`[MockPaymentProvider] Created mock checkout session for user: ${input.userEmail} (${input.userId}), Plan: ${plan.name}`);

    return {
      sessionId: mockSessionId,
      checkoutUrl,
      provider: this.name,
    };
  }

  async verifyAndParseWebhook(
    rawBody: string | Buffer,
    _signature?: string
  ): Promise<StandardWebhookEvent> {
    const bodyStr = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    let payload: any = {};
    try {
      payload = JSON.parse(bodyStr);
    } catch {
      payload = {};
    }

    const eventId = payload.eventId || `mock_evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const eventType = payload.type || "checkout.completed";

    console.log(`[MockPaymentProvider] Received mock webhook event: ${eventType} (${eventId})`);

    // Calculate next renewal date (1 month or 1 year)
    const intervalDays = payload.planId === "VIP_ANNUAL" ? 365 : 30;
    const currentPeriodEnd = new Date(Date.now() + intervalDays * 86400000);

    return {
      eventId,
      type: eventType,
      provider: this.name,
      userId: payload.userId,
      userEmail: payload.userEmail,
      planId: payload.planId || "VIP_MONTHLY",
      providerSubId: payload.providerSubId || `mock_sub_${Date.now()}`,
      providerCustId: payload.providerCustId || `mock_cus_${payload.userId || "anon"}`,
      status: payload.status || "ACTIVE",
      currentPeriodEnd,
      cancelAtPeriodEnd: Boolean(payload.cancelAtPeriodEnd),
      amountPaid: payload.amountPaid || "$19.99",
    };
  }

  async createCustomerPortalSession(
    providerCustId: string,
    returnUrl: string
  ): Promise<string> {
    console.log(`[MockPaymentProvider] Generating mock customer billing portal for: ${providerCustId}`);
    return `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}portal_status=mock_opened&customer=${providerCustId}`;
  }

  async cancelSubscription(providerSubId: string): Promise<boolean> {
    console.log(`[MockPaymentProvider] Mock cancellation for subscription: ${providerSubId}`);
    return true;
  }
}
