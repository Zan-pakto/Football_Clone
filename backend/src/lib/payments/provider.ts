import {
  CreateCheckoutInput,
  CheckoutResult,
  StandardWebhookEvent,
} from "./types";

export interface IPaymentProvider {
  /**
   * Human-readable identifier for the provider (e.g. "stripe", "mock", "paystack")
   */
  readonly name: string;

  /**
   * Creates a hosted checkout session URL for the user to submit payment
   */
  createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutResult>;

  /**
   * Cryptographically verifies and translates the raw webhook body into a standardized event
   */
  verifyAndParseWebhook(
    rawBody: string | Buffer,
    signature?: string
  ): Promise<StandardWebhookEvent>;

  /**
   * Generates a link to the payment provider's customer billing portal
   */
  createCustomerPortalSession(
    providerCustId: string,
    returnUrl: string
  ): Promise<string>;

  /**
   * Cancels a subscription directly at the gateway provider
   */
  cancelSubscription(providerSubId: string): Promise<boolean>;
}
