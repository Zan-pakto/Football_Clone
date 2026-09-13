import { PlanId } from "./types";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  badge: string;
  description: string;
  amountCents: number; // in cents e.g. 1999 = $19.99
  currency: string;
  interval: "month" | "year";
  stripePriceId?: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<PlanId, PlanDefinition> = {
  VIP_MONTHLY: {
    id: "VIP_MONTHLY",
    name: "VIP Pro Access (Monthly)",
    badge: "Most Popular",
    description: "Full algorithmic access, unlocked high-confidence bankers, and real-time value odds edges.",
    amountCents: 1999, // $19.99
    currency: "usd",
    interval: "month",
    stripePriceId: process.env.STRIPE_PRICE_VIP_MONTHLY || undefined,
    features: [
      "Unlimited Banker of the Day Access",
      "100k Monte Carlo Simulated Probabilities",
      "Mathematical Value Edge (+EV) Alerts",
      "Custom Acca Bet Builder Unlocked",
      "VIP Telegram / Push Notification Alerts",
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
