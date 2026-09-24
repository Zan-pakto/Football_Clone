import { prisma } from "../db/prisma";
import { emailService } from "../email/email-service";
import { IPaymentProvider } from "./provider";
import { StripePaymentProvider } from "./stripe.provider";
import { MockPaymentProvider } from "./mock.provider";
import {
  CreateCheckoutInput,
  CheckoutResult,
  StandardWebhookEvent,
  PlanId,
} from "./types";
import { getPlanOrThrow } from "./plans.config";

export class PaymentService {
  private provider: IPaymentProvider;

  constructor() {
    const providerName = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase().trim();
    if (providerName === "stripe") {
      this.provider = new StripePaymentProvider();
      console.log("💳 [PaymentService] Initialized with STRIPE connector");
    } else {
      this.provider = new MockPaymentProvider();
      console.log("💳 [PaymentService] Initialized with MOCK connector (Zero-Stripe dev/test mode)");
    }
  }

  /**
   * Get active provider name
   */
  getProviderName(): string {
    return this.provider.name;
  }

  /**
   * 1. Create Checkout Session (Initiated from frontend with planId)
   */
  async createCheckoutSession(input: {
    userId: string;
    userEmail: string;
    userName?: string;
    planId: PlanId;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutResult> {
    // Validate that the plan exists on the server
    const plan = getPlanOrThrow(input.planId);
    console.log(`💳 [PaymentService] Creating checkout session for user: ${input.userEmail} | Plan: ${plan.name} (${plan.id}) | Gateway: ${this.provider.name}`);

    return await this.provider.createCheckoutSession({
      userId: input.userId,
      userEmail: input.userEmail,
      userName: input.userName,
      planId: plan.id,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    });
  }

  /**
   * 2. Transactional Webhook Processing with Idempotency Protection
   */
  async handleWebhook(
    rawBody: string | Buffer,
    signature?: string
  ): Promise<{ status: "processed" | "already_processed" | "ignored"; eventId: string; type: string }> {
    // Cryptographically verify & normalize into standard event
    const event: StandardWebhookEvent = await this.provider.verifyAndParseWebhook(rawBody, signature);

    if (event.type === "ignored") {
      return { status: "ignored", eventId: event.eventId, type: event.type };
    }

    console.log(`📥 [PaymentService:Webhook] Processing ${event.type} (${event.eventId}) via ${event.provider}`);

    // ATOMIC TRANSACTION: Check Idempotency + Update Subscription
    const result = await prisma.$transaction(async (tx) => {
      // 1. Idempotency Check: Check if event ID was already processed
      const existingEvent = await tx.paymentWebhookEvent.findUnique({
        where: { eventId: event.eventId },
      });

      if (existingEvent) {
        console.log(`⚠️ [PaymentService:Webhook] Duplicate event ${event.eventId} detected. Skipping processing.`);
        return { status: "already_processed" as const, eventId: event.eventId, type: event.type };
      }

      // 2. Mark event as processed in idempotency table
      await tx.paymentWebhookEvent.create({
        data: {
          eventId: event.eventId,
          provider: event.provider,
          eventType: event.type,
        },
      });

      // 3. Process Lifecycle Events
      if (event.type === "checkout.completed" || event.type === "subscription.created") {
        if (event.userId || event.userEmail) {
          // Resolve User (try by ID, then fallback to email)
          let user = null;
          if (event.userId) {
            user = await tx.user.findUnique({ where: { id: event.userId } });
          }
          if (!user && event.userEmail) {
            user = await tx.user.findFirst({
              where: { email: { equals: event.userEmail.trim(), mode: "insensitive" } },
            });
          }

          const plan = getPlanOrThrow(event.planId || "VIP_MONTHLY");
          const expiresAt = event.currentPeriodEnd || new Date(Date.now() + (plan.interval === "year" ? 365 : 30) * 86400000);
          const amountFormatted = event.amountPaid || `$${(plan.amountCents / 100).toFixed(2)}`;

          if (user) {
            // Upsert Subscription in database
            await tx.subscription.upsert({
              where: {
                providerSubId: event.providerSubId || `sub_${user.id}_${plan.id}`,
              },
              update: {
                status: "ACTIVE",
                plan: plan.id,
                currentPeriodEnd: expiresAt,
                expiresAt: expiresAt,
                cancelAtPeriodEnd: false,
                provider: event.provider,
                providerCustId: event.providerCustId,
              },
              create: {
                userId: user.id,
                plan: plan.id,
                status: "ACTIVE",
                provider: event.provider,
                providerSubId: event.providerSubId || `sub_${user.id}_${plan.id}`,
                providerCustId: event.providerCustId,
                currentPeriodEnd: expiresAt,
                expiresAt: expiresAt,
                cancelAtPeriodEnd: false,
              },
            });

            console.log(`🎉 [PaymentService:Webhook] VIP subscription activated for user: ${user.email} (${user.id})`);

            // Dispatch VIP Confirmation Email to the user's account email
            const confirmationEmail = emailService.getSubscriptionConfirmationEmail({
              name: user.name || "Valued VIP Member",
              email: user.email,
              planName: plan.name,
              amount: amountFormatted,
              expiresAt: expiresAt.toISOString(),
              orderId: event.providerSubId || event.eventId,
              provider: event.provider,
            });

            emailService.sendEmail(confirmationEmail)
              .then((sendRes) => {
                if (sendRes.success) {
                  console.log(`✉️ [PaymentService] VIP confirmation email delivered to: ${user.email} (Message ID: ${sendRes.messageId})`);
                } else {
                  console.warn(`⚠️ [PaymentService] VIP confirmation email not sent: ${sendRes.error}`);
                }
              })
              .catch((err) => console.error(`❌ [PaymentService] Failed to send VIP confirmation email:`, err));
          } else if (event.userEmail) {
            // Purchaser email provided but user account not in DB yet (e.g. guest checkout)
            console.log(`✉️ [PaymentService:Webhook] Sending VIP confirmation email to buyer email: ${event.userEmail}`);
            const confirmationEmail = emailService.getSubscriptionConfirmationEmail({
              name: "VIP Member",
              email: event.userEmail,
              planName: plan.name,
              amount: amountFormatted,
              expiresAt: expiresAt.toISOString(),
              orderId: event.providerSubId || event.eventId,
              provider: event.provider,
            });

            emailService.sendEmail(confirmationEmail)
              .then((sendRes) => {
                if (sendRes.success) {
                  console.log(`✉️ [PaymentService] VIP confirmation email delivered to: ${event.userEmail} (Message ID: ${sendRes.messageId})`);
                }
              })
              .catch((err) => console.error(`❌ [PaymentService] Failed to send VIP confirmation email:`, err));
          }
        }
      } else if (event.type === "subscription.updated") {
        if (event.providerSubId) {
          await tx.subscription.updateMany({
            where: { providerSubId: event.providerSubId },
            data: {
              status: (event.status as any) || "ACTIVE",
              currentPeriodEnd: event.currentPeriodEnd,
              expiresAt: event.currentPeriodEnd,
              cancelAtPeriodEnd: event.cancelAtPeriodEnd ?? false,
            },
          });
          console.log(`🔄 [PaymentService:Webhook] Subscription ${event.providerSubId} updated. Status: ${event.status}`);
        }
      } else if (event.type === "subscription.deleted") {
        if (event.providerSubId) {
          await tx.subscription.updateMany({
            where: { providerSubId: event.providerSubId },
            data: {
              status: "CANCELLED",
              cancelAtPeriodEnd: true,
            },
          });
          console.log(`🛑 [PaymentService:Webhook] Subscription ${event.providerSubId} cancelled.`);
        }
      } else if (event.type === "payment.failed") {
        if (event.providerSubId) {
          await tx.subscription.updateMany({
            where: { providerSubId: event.providerSubId },
            data: {
              status: "PAST_DUE",
            },
          });
          console.log(`⚠️ [PaymentService:Webhook] Subscription ${event.providerSubId} marked PAST_DUE due to failed invoice.`);
        }
      }

      return { status: "processed" as const, eventId: event.eventId, type: event.type };
    });

    return result;
  }

  /**
   * 3. Customer Billing Portal Session
   */
  async getCustomerPortalUrl(userId: string, returnUrl: string): Promise<string> {
    const sub = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (!sub || !sub.providerCustId) {
      throw new Error("No active billing profile or customer ID found for this account.");
    }

    return await this.provider.createCustomerPortalSession(sub.providerCustId, returnUrl);
  }

  /**
   * 4. Query current user's subscription details (with real-time expiration validation)
   */
  async getUserSubscriptionStatus(userId: string) {
    const latestSub = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!latestSub) {
      return {
        hasActiveSubscription: false,
        isExpired: false,
        plan: "FREE",
        status: "FREE",
        provider: this.provider.name,
      };
    }

    const expiry = latestSub.currentPeriodEnd || latestSub.expiresAt;
    const isExpiredByDate = expiry ? new Date(expiry).getTime() <= Date.now() : false;
    const isActiveStatus = latestSub.status === "ACTIVE" || latestSub.status === "TRIALING";

    // If subscription period has elapsed, auto-downgrade to EXPIRED
    if (isActiveStatus && isExpiredByDate) {
      prisma.subscription
        .update({
          where: { id: latestSub.id },
          data: { status: "EXPIRED" },
        })
        .catch(() => {});

      return {
        hasActiveSubscription: false,
        isExpired: true,
        plan: "FREE",
        previousPlan: latestSub.plan,
        status: "EXPIRED",
        provider: latestSub.provider,
        expiredAt: expiry?.toISOString(),
      };
    }

    if (!isActiveStatus || isExpiredByDate) {
      return {
        hasActiveSubscription: false,
        isExpired: latestSub.status === "EXPIRED" || isExpiredByDate,
        plan: "FREE",
        previousPlan: latestSub.plan,
        status: latestSub.status,
        provider: latestSub.provider,
        expiredAt: expiry?.toISOString(),
      };
    }

    return {
      hasActiveSubscription: true,
      isExpired: false,
      plan: latestSub.plan,
      status: latestSub.status,
      provider: latestSub.provider,
      currentPeriodEnd: latestSub.currentPeriodEnd || latestSub.expiresAt,
      expiresAt: latestSub.expiresAt || latestSub.currentPeriodEnd,
      cancelAtPeriodEnd: latestSub.cancelAtPeriodEnd,
    };
  }
}

export const paymentService = new PaymentService();
