export type PlanId =
  | "PREMIUM_MONTHLY"
  | "PREMIUM_6MONTHS"
  | "VIP_MONTHLY"
  | "VIP_6MONTHS";

export interface CreateCheckoutInput {
  userId: string;
  userEmail: string;
  userName?: string;
  planId: PlanId;
  currency?: string;
  country?: string;
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
  telegramId?: string | number;
  planId?: string;
  providerSubId?: string;
  providerCustId?: string;
  status?: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  amountPaid?: string;
}
