export type PlanId = "VIP_MONTHLY" | "VIP_ANNUAL";

export interface CreateCheckoutInput {
  userId: string;
  userEmail: string;
  userName?: string;
  planId: PlanId;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  sessionId: string;
  checkoutUrl: string;
  provider: string;
}

export type WebhookStandardEventType =
  | "checkout.completed"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.deleted"
  | "payment.failed"
  | "ignored";

export interface StandardWebhookEvent {
  eventId: string;
  type: WebhookStandardEventType;
  provider: string;
  userId?: string;
  userEmail?: string;
  planId?: string;
  providerSubId?: string;
  providerCustId?: string;
  status?: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  amountPaid?: string;
}
