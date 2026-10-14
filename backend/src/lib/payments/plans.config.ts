import { PlanId } from "./types";

export interface CurrencyPriceVariant {
  currency: string;
  symbol: string;
  amount: number;
  formattedAmount: string;
  provider: "whop" | "bachs";
  productId?: string;
  checkoutUrl: string;
}

export interface PlanDefinition {
  id: PlanId;
  tier: "PREMIUM" | "VIP";
  name: string;
  badge: string;
  description: string;
  interval: "month" | "6months";
  intervalMonths: 1 | 6;
  amountCents: number; // default USD in cents
  currency: string;
  hasTrial: boolean;
  trialDays: number;
  whopPlanId: string;
  whopCheckoutUrl: string;
  bachsProductId?: string;
  bachsCheckoutUrl?: string;
  stripePriceId?: string;
  features: string[];
  currencyVariants: Record<string, CurrencyPriceVariant>;
}

export const SUBSCRIPTION_PLANS: Record<PlanId, PlanDefinition> = {
  PREMIUM_MONTHLY: {
    id: "PREMIUM_MONTHLY",
    tier: "PREMIUM",
    name: "Premium Pro (1 Month)",
    badge: "Most Popular",
    description: "Full algorithmic predictions, unlocked high-confidence bankers, and bet builder access.",
    interval: "month",
    intervalMonths: 1,
    amountCents: 999, // $9.99
    currency: "usd",
    hasTrial: true,
    trialDays: 7,
    whopPlanId: process.env.WHOP_PLAN_PREMIUM_MONTHLY || "plan_8iNJRtiKtVzMH",
    whopCheckoutUrl: process.env.WHOP_CHECKOUT_URL_PREMIUM_MONTHLY || "https://whop.com/checkout/plan_8iNJRtiKtVzMH",
    bachsProductId: process.env.BACHS_PRODUCT_PREMIUM_MONTHLY || "prod_ed97f1b60dc344e491c8",
    bachsCheckoutUrl: process.env.BACHS_CHECKOUT_URL_PREMIUM_MONTHLY || "https://checkout.bachs.io/pay/pl_a53b4cb6d727",
    features: [
      "7-Day Free Trial Included ($0 Today)",
      "Unlimited Banker of the Day Access",
      "100k Monte Carlo Simulated Probabilities",
      "Mathematical Value Edge (+EV) Alerts",
      "Custom Acca Bet Builder Unlocked",
      "Verified AI Track Record Access",
      "Instant Activation",
    ],
    currencyVariants: {
      usd: {
        currency: "USD",
        symbol: "$",
        amount: 9.99,
        formattedAmount: "$9.99",
        provider: "whop",
        productId: "plan_8iNJRtiKtVzMH",
        checkoutUrl: "https://whop.com/checkout/plan_8iNJRtiKtVzMH",
      },
      ngn: {
        currency: "NGN",
        symbol: "₦",
        amount: 10000,
        formattedAmount: "₦10,000",
        provider: "whop",
        productId: "plan_dIivpO1ZYQApV",
        checkoutUrl: "https://whop.com/checkout/plan_dIivpO1ZYQApV",
      },
      zar: {
        currency: "ZAR",
        symbol: "R",
        amount: 189.99,
        formattedAmount: "R189.99",
        provider: "whop",
        productId: "plan_6TkF3PeSpuGXC",
        checkoutUrl: "https://whop.com/checkout/plan_6TkF3PeSpuGXC",
      },
      kes: {
        currency: "KES",
        symbol: "KSh",
        amount: 1470,
        formattedAmount: "KSh 1,470",
        provider: "bachs",
        productId: "prod_ed97f1b60dc344e491c8",
        checkoutUrl: "https://checkout.bachs.io/pay/pl_a53b4cb6d727",
      },
      momo: {
        currency: "MOMO",
        symbol: "MoMo",
        amount: 1470,
        formattedAmount: "Local Mobile Money",
        provider: "bachs",
        productId: "prod_ed97f1b60dc344e491c8",
        checkoutUrl: "https://checkout.bachs.io/pay/pl_a53b4cb6d727",
      },
    },
  },

  PREMIUM_6MONTHS: {
    id: "PREMIUM_6MONTHS",
    tier: "PREMIUM",
    name: "Premium Pro (6 Months)",
    badge: "Save 17%",
    description: "6 months of algorithmic predictions and unlocked high-confidence bankers with maximum value.",
    interval: "6months",
    intervalMonths: 6,
    amountCents: 4999, // $49.99 (~$8.33/mo)
    currency: "usd",
    hasTrial: true,
    trialDays: 7,
    whopPlanId: process.env.WHOP_PLAN_PREMIUM_6MONTHS || "plan_xaGOGXV9S44NL",
    whopCheckoutUrl: process.env.WHOP_CHECKOUT_URL_PREMIUM_6MONTHS || "https://whop.com/checkout/plan_xaGOGXV9S44NL",
    bachsProductId: process.env.BACHS_PRODUCT_PREMIUM_6MONTHS || "prod_cb9782fabf1c4c5a8b67",
    bachsCheckoutUrl: process.env.BACHS_CHECKOUT_URL_PREMIUM_6MONTHS || "https://checkout.bachs.io/pay/pl_5a184fc4263d",
    features: [
      "7-Day Free Trial Included ($0 Today)",
      "6 Months Continuous VIP Access (Save 17%)",
      "Unlimited Banker of the Day Access",
      "100k Monte Carlo Simulated Probabilities",
      "Mathematical Value Edge (+EV) Alerts",
      "Custom Acca Bet Builder Unlocked",
      "Verified AI Track Record Access",
      "Instant Activation",
    ],
    currencyVariants: {
      usd: {
        currency: "USD",
        symbol: "$",
        amount: 49.99,
        formattedAmount: "$49.99",
        provider: "whop",
        productId: "plan_xaGOGXV9S44NL",
        checkoutUrl: "https://whop.com/checkout/plan_xaGOGXV9S44NL",
      },
      ngn: {
        currency: "NGN",
        symbol: "₦",
        amount: 49999.99,
        formattedAmount: "₦49,999.99",
        provider: "whop",
        productId: "plan_QWBXn1FL9DyO1",
        checkoutUrl: "https://whop.com/checkout/plan_QWBXn1FL9DyO1",
      },
      zar: {
        currency: "ZAR",
        symbol: "R",
        amount: 949.99,
        formattedAmount: "R949.99",
        provider: "whop",
        productId: "plan_u9AXPZ2NqmPIW",
        checkoutUrl: "https://whop.com/checkout/plan_u9AXPZ2NqmPIW",
      },
      kes: {
        currency: "KES",
        symbol: "KSh",
        amount: 7350,
        formattedAmount: "KSh 7,350",
        provider: "bachs",
        productId: "prod_cb9782fabf1c4c5a8b67",
        checkoutUrl: "https://checkout.bachs.io/pay/pl_5a184fc4263d",
      },
      momo: {
        currency: "MOMO",
        symbol: "MoMo",
        amount: 7350,
        formattedAmount: "Local Mobile Money",
        provider: "bachs",
        productId: "prod_cb9782fabf1c4c5a8b67",
        checkoutUrl: "https://checkout.bachs.io/pay/pl_5a184fc4263d",
      },
    },
  },

  VIP_MONTHLY: {
    id: "VIP_MONTHLY",
    tier: "VIP",
    name: "VIP Pro Access (1 Month)",
    badge: "VIP Elite",
    description: "The complete betting intelligence suite with exclusive VIP Telegram alerts and priority insights.",
    interval: "month",
    intervalMonths: 1,
    amountCents: 1999, // $19.99
    currency: "usd",
    hasTrial: true,
    trialDays: 7,
    whopPlanId: process.env.WHOP_PLAN_VIP_MONTHLY || "plan_DfSUCcAweadIa",
    whopCheckoutUrl: process.env.WHOP_CHECKOUT_URL_VIP_MONTHLY || "https://whop.com/checkout/plan_DfSUCcAweadIa",
    bachsProductId: process.env.BACHS_PRODUCT_VIP_MONTHLY || "prod_8bcc294dbe674aab9ad3",
    bachsCheckoutUrl: process.env.BACHS_CHECKOUT_URL_VIP_MONTHLY || "https://checkout.bachs.io/pay/pl_56cf79706b40",
    features: [
      "7-Day Free Trial Included ($0 Today)",
      "Everything in Premium Pro Included",
      "Exclusive VIP Telegram Channel & Instant Alerts",
      "Priority High-Roller Edge Banker Tips",
      "Dedicated 1-on-1 VIP Customer Support",
      "Early Access to High-Confidence Models",
    ],
    currencyVariants: {
      usd: {
        currency: "USD",
        symbol: "$",
        amount: 19.99,
        formattedAmount: "$19.99",
        provider: "whop",
        productId: "plan_DfSUCcAweadIa",
        checkoutUrl: "https://whop.com/checkout/plan_DfSUCcAweadIa",
      },
      ngn: {
        currency: "NGN",
        symbol: "₦",
        amount: 19999.99,
        formattedAmount: "₦19,999.99",
        provider: "whop",
        productId: "plan_qBmyg12UoWVQc",
        checkoutUrl: "https://whop.com/checkout/plan_qBmyg12UoWVQc",
      },
      zar: {
        currency: "ZAR",
        symbol: "R",
        amount: 379.99,
        formattedAmount: "R379.99",
        provider: "whop",
        productId: "plan_9Cx98mNqjAtVE",
        checkoutUrl: "https://whop.com/checkout/plan_9Cx98mNqjAtVE",
      },
      kes: {
        currency: "KES",
        symbol: "KSh",
        amount: 2940,
        formattedAmount: "KSh 2,940",
        provider: "bachs",
        productId: "prod_8bcc294dbe674aab9ad3",
        checkoutUrl: "https://checkout.bachs.io/pay/pl_56cf79706b40",
      },
      momo: {
        currency: "MOMO",
        symbol: "MoMo",
        amount: 2940,
        formattedAmount: "Local Mobile Money",
        provider: "bachs",
        productId: "prod_8bcc294dbe674aab9ad3",
        checkoutUrl: "https://checkout.bachs.io/pay/pl_56cf79706b40",
      },
    },
  },

  VIP_6MONTHS: {
    id: "VIP_6MONTHS",
    tier: "VIP",
    name: "VIP Pro Access (6 Months)",
    badge: "Best Value (Save 33%)",
    description: "6 months of VIP Telegram broadcasts, priority algorithmic predictions, and VIP support.",
    interval: "6months",
    intervalMonths: 6,
    amountCents: 7999, // $79.99 (~$13.33/mo)
    currency: "usd",
    hasTrial: true,
    trialDays: 7,
    whopPlanId: process.env.WHOP_PLAN_VIP_6MONTHS || "plan_fTC4HGr9D33uO",
    whopCheckoutUrl: process.env.WHOP_CHECKOUT_URL_VIP_6MONTHS || "https://whop.com/checkout/plan_fTC4HGr9D33uO",
    bachsProductId: process.env.BACHS_PRODUCT_VIP_6MONTHS || "prod_275e20b69d0940f8a31f",
    bachsCheckoutUrl: process.env.BACHS_CHECKOUT_URL_VIP_6MONTHS || "https://checkout.bachs.io/pay/pl_4c7561fc5da5",
    features: [
      "7-Day Free Trial Included ($0 Today)",
      "6 Months Continuous VIP Pro (Save 33%)",
      "Everything in Premium Pro Included",
      "Exclusive VIP Telegram Channel & Instant Alerts",
      "Priority High-Roller Edge Banker Tips",
      "Dedicated 1-on-1 VIP Customer Support",
      "Early Access to High-Confidence Models",
    ],
    currencyVariants: {
      usd: {
        currency: "USD",
        symbol: "$",
        amount: 79.99,
        formattedAmount: "$79.99",
        provider: "whop",
        productId: "plan_fTC4HGr9D33uO",
        checkoutUrl: "https://whop.com/checkout/plan_fTC4HGr9D33uO",
      },
      ngn: {
        currency: "NGN",
        symbol: "₦",
        amount: 99999.99,
        formattedAmount: "₦99,999.99",
        provider: "whop",
        productId: "plan_b9oSv9CGseeG7",
        checkoutUrl: "https://whop.com/checkout/plan_b9oSv9CGseeG7",
      },
      zar: {
        currency: "ZAR",
        symbol: "R",
        amount: 1899.99,
        formattedAmount: "R1,899.99",
        provider: "whop",
        productId: "plan_x5pw1IbNFyi1Y",
        checkoutUrl: "https://whop.com/checkout/plan_x5pw1IbNFyi1Y",
      },
      kes: {
        currency: "KES",
        symbol: "KSh",
        amount: 14700,
        formattedAmount: "KSh 14,700",
        provider: "bachs",
        productId: "prod_275e20b69d0940f8a31f",
        checkoutUrl: "https://checkout.bachs.io/pay/pl_4c7561fc5da5",
      },
      momo: {
        currency: "MOMO",
        symbol: "MoMo",
        amount: 14700,
        formattedAmount: "Local Mobile Money",
        provider: "bachs",
        productId: "prod_275e20b69d0940f8a31f",
        checkoutUrl: "https://checkout.bachs.io/pay/pl_4c7561fc5da5",
      },
    },
  },
};

export function getPlanOrThrow(planId: string): PlanDefinition {
  const plan = SUBSCRIPTION_PLANS[planId as PlanId];
  if (!plan) {
    throw new Error(`Invalid plan ID: "${planId}". Valid plans are: ${Object.keys(SUBSCRIPTION_PLANS).join(", ")}`);
  }
  return plan;
}

/**
 * Intelligent Payment Routing:
 * - USD, NGN (transfers/OPay), and ZAR -> Whop
 * - All other African currencies / Mobile Money (KES, GHS, UGX, TZS, etc.) -> Bachs
 * - USD and NGN are NEVER routed through Bachs
 * - Every other country outside Africa / unlisted gets USD -> Whop
 */
export function resolveProviderAndCheckout(
  planId: PlanId,
  currencyInput?: string
): { provider: "whop" | "bachs"; checkoutUrl: string; currency: string; productId?: string } {
  const plan = getPlanOrThrow(planId);
  const cur = (currencyInput || "usd").toLowerCase().trim();

  // Strict Routing Rule:
  // USD, NGN, and ZAR ALWAYS route to Whop
  if (cur === "usd" || cur === "ngn" || cur === "zar") {
    const variant = plan.currencyVariants[cur] || plan.currencyVariants.usd;
    return {
      provider: "whop",
      checkoutUrl: variant.checkoutUrl || plan.whopCheckoutUrl,
      currency: variant.currency,
      productId: variant.productId || plan.whopPlanId,
    };
  }

  // African currencies / Mobile Money route to Bachs
  if (cur === "kes" || cur === "momo" || cur === "ghs" || cur === "ugx" || cur === "tzs" || cur === "rwf" || cur === "xof" || cur === "xaf") {
    const variant = plan.currencyVariants[cur] || plan.currencyVariants.momo || plan.currencyVariants.kes;
    return {
      provider: "bachs",
      checkoutUrl: variant?.checkoutUrl || plan.bachsCheckoutUrl || plan.whopCheckoutUrl,
      currency: variant?.currency || "MOMO",
      productId: variant?.productId || plan.bachsProductId,
    };
  }

  // "Every other country gets USD"
  const defaultVariant = plan.currencyVariants.usd;
  return {
    provider: "whop",
    checkoutUrl: defaultVariant.checkoutUrl || plan.whopCheckoutUrl,
    currency: "USD",
    productId: defaultVariant.productId || plan.whopPlanId,
  };
}
