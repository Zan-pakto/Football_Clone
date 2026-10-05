import { PlanId } from "./types";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  badge: string;
  description: string;
  amountCents: number; // in cents e.g. 1999 = $19.99
  currency: string;
  interval: "month" | "year";
  whopPlanId?: string;
  whopCheckoutUrl?: string;
  stripePriceId?: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<PlanId, PlanDefinition> = {
  PREMIUM_MONTHLY: {
    id: "PREMIUM_MONTHLY",
    name: "Premium Pro (Monthly)",
    badge: "Most Popular",
    description: "Full algorithmic predictions, unlocked high-confidence bankers, and bet builder access.",
    amountCents: 999, // $9.99
    currency: "usd",
    interval: "month",
    whopPlanId: process.env.WHOP_PLAN_PREMIUM_MONTHLY || "plan_8iNJRtiKtVzMH",
    whopCheckoutUrl: process.env.WHOP_CHECKOUT_URL_PREMIUM_MONTHLY || "https://whop.com/checkout/plan_8iNJRtiKtVzMH",
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || undefined,
    features: [
      "Unlimited Banker of the Day Access",
      "100k Monte Carlo Simulated Probabilities",
      "Mathematical Value Edge (+EV) Alerts",
      "Custom Acca Bet Builder Unlocked",
      "Verified AI Track Record Access",
      "Instant Whop Activation",
    ],
  },
  VIP_MONTHLY: {
    id: "VIP_MONTHLY",
    name: "VIP Pro Access (Monthly)",
    badge: "VIP Elite",
    description: "The complete betting intelligence suite with exclusive VIP Telegram alerts and priority insights.",
    amountCents: 1999, // $19.99
    currency: "usd",
    interval: "month",
    whopPlanId: process.env.WHOP_PLAN_VIP_MONTHLY || "plan_DfSUCcAweadIa",
    whopCheckoutUrl: process.env.WHOP_CHECKOUT_URL_VIP_MONTHLY || "https://whop.com/checkout/plan_DfSUCcAweadIa",
    stripePriceId: process.env.STRIPE_PRICE_VIP_MONTHLY || undefined,
    features: [
      "Everything in Premium Pro Included",
      "Exclusive VIP Telegram Channel & Instant Alerts",
      "Priority High-Roller Edge Banker Tips",
      "Dedicated 1-on-1 VIP Customer Support",
      "Early Access to High-Confidence Models",
    ],
  },
  VIP_ANNUAL: {
    id: "VIP_ANNUAL",
    name: "VIP Pro Access (Annual)",
    badge: "Save 25%",
    description: "Full algorithmic access for a full year with maximum savings.",
    amountCents: 17999, // $179.99/yr (~$14.99/mo)
    currency: "usd",
    interval: "year",
    whopPlanId: process.env.WHOP_PLAN_VIP_ANNUAL || undefined,
    whopCheckoutUrl: process.env.WHOP_CHECKOUT_URL_VIP_ANNUAL || undefined,
    stripePriceId: process.env.STRIPE_PRICE_VIP_ANNUAL || undefined,
    features: [
      "All VIP Monthly Features Included",
      "Save 25% compared to monthly billing",
      "Priority Algorithmic Calculations",
      "Dedicated VIP Customer Support",
    ],
  },
};

export function getPlanOrThrow(planId: string): PlanDefinition {
  const plan = SUBSCRIPTION_PLANS[planId as PlanId];
  if (!plan) {
    throw new Error(`Invalid plan ID: "${planId}". Valid plans are: ${Object.keys(SUBSCRIPTION_PLANS).join(", ")}`);
  }
  return plan;
}
