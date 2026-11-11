import { CreditPackId, PlanId, SubscriptionPlanId } from "./types";

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
  id: SubscriptionPlanId;
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

export interface CreditPackDefinition {
  id: CreditPackId;
  name: string;
  credits: number;
  expirationDays?: number;
  badge?: string;
  description: string;
  amountCents: number;
  currency: string;
  whopProductId: string;
  whopPlanId: string;
  whopCheckoutUrl: string;
  bachsProductId?: string;
  bachsCheckoutUrl?: string;
  currencyVariants: Record<string, CurrencyPriceVariant>;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, PlanDefinition> = {
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

type BachsCurrencyCode = "ghs" | "kes" | "ugx" | "tzs" | "mwk" | "rwf" | "xaf" | "xof" | "zmw";

const BACHS_CURRENCY_META: Record<BachsCurrencyCode, { code: string; symbol: string }> = {
  ghs: { code: "GHS", symbol: "GH₵" },
  kes: { code: "KES", symbol: "KSh " },
  ugx: { code: "UGX", symbol: "UGX " },
  tzs: { code: "TZS", symbol: "TZS " },
  mwk: { code: "MWK", symbol: "MWK " },
  rwf: { code: "RWF", symbol: "RWF " },
  xaf: { code: "XAF", symbol: "XAF " },
  xof: { code: "XOF", symbol: "XOF " },
  zmw: { code: "ZMW", symbol: "ZMW " },
};

function buildBachsCurrencyVariants(
  productId: string,
  checkoutUrl: string,
  prices: Partial<Record<BachsCurrencyCode, number>>
): Record<string, CurrencyPriceVariant> {
  const variants: Record<string, CurrencyPriceVariant> = {};
  for (const [key, amount] of Object.entries(prices) as Array<[BachsCurrencyCode, number | undefined]>) {
    if (amount === undefined) continue;
    const meta = BACHS_CURRENCY_META[key];
    variants[key] = {
      currency: meta.code,
      symbol: meta.symbol.trim(),
      amount,
      formattedAmount: `${meta.symbol}${amount.toLocaleString("en-US")}`,
      provider: "bachs",
      productId,
      checkoutUrl,
    };
  }
  return variants;
}

export const CREDIT_PACKS: Record<CreditPackId, CreditPackDefinition> = {
  CREDITS_1: {
    id: "CREDITS_1",
    name: "Bet Builder Credit (1 Slip)",
    credits: 1,
    description: "1 instant AI Bet Builder slip generation. Credits never expire.",
    amountCents: 100, // $1.00
    currency: "usd",
    whopProductId: "prod_aujxyKH0dFm3q",
    whopPlanId: "plan_jvWQQ5YSRkiOX",
    whopCheckoutUrl: "https://whop.com/checkout/plan_jvWQQ5YSRkiOX",
    currencyVariants: {
      usd: {
        currency: "USD",
        symbol: "$",
        amount: 1.0,
        formattedAmount: "$1.00",
        provider: "whop",
        productId: "plan_jvWQQ5YSRkiOX",
        checkoutUrl: "https://whop.com/checkout/plan_jvWQQ5YSRkiOX",
      },
      ngn: {
        currency: "NGN",
        symbol: "₦",
        amount: 300,
        formattedAmount: "₦300",
        provider: "whop",
        productId: "plan_bTRQpVLxSC16g",
        checkoutUrl: "https://whop.com/checkout/plan_bTRQpVLxSC16g",
      },
      zar: {
        currency: "ZAR",
        symbol: "R",
        amount: 8,
        formattedAmount: "R8",
        provider: "whop",
        productId: "plan_ZsocLQchMnhaT",
        checkoutUrl: "https://whop.com/checkout/plan_ZsocLQchMnhaT",
      },
    },
  },
  CREDITS_3: {
    id: "CREDITS_3",
    name: "Bet Builder Credit (3 Slips)",
    credits: 3,
    expirationDays: 7,
    badge: "Most Popular",
    description: "3 instant AI Bet Builder slips (expires after 7 days).",
    amountCents: 249, // $2.49
    currency: "usd",
    whopProductId: "prod_kJEmaPRVhxJoI",
    whopPlanId: "plan_mb5q96LMRR3SN",
    whopCheckoutUrl: "https://whop.com/checkout/plan_mb5q96LMRR3SN",
    bachsProductId: process.env.BACHS_PRODUCT_CREDITS_3 || "prod_cb545410db9d41e08d25",
    bachsCheckoutUrl: process.env.BACHS_CHECKOUT_URL_CREDITS_3 || undefined,
    currencyVariants: {
      usd: {
        currency: "USD",
        symbol: "$",
        amount: 2.49,
        formattedAmount: "$2.49",
        provider: "whop",
        productId: "plan_mb5q96LMRR3SN",
        checkoutUrl: "https://whop.com/checkout/plan_mb5q96LMRR3SN",
      },
      ngn: {
        currency: "NGN",
        symbol: "₦",
        amount: 700,
        formattedAmount: "₦700",
        provider: "whop",
        productId: "plan_zmjHW7hpqGMlK",
        checkoutUrl: "https://whop.com/checkout/plan_zmjHW7hpqGMlK",
      },
      zar: {
        currency: "ZAR",
        symbol: "R",
        amount: 20,
        formattedAmount: "R20",
        provider: "whop",
        productId: "plan_rgBYUoxQK2ntg",
        checkoutUrl: "https://whop.com/checkout/plan_rgBYUoxQK2ntg",
      },
      ...buildBachsCurrencyVariants(
        "prod_cb545410db9d41e08d25",
        process.env.BACHS_CHECKOUT_URL_CREDITS_3 || "",
        {
          ghs: 12,
          kes: 120,
          ugx: 4000,
          tzs: 2500,
          mwk: 1500,
          rwf: 1400,
          xaf: 600,
          xof: 600,
          zmw: 20,
        }
      ),
    },
  },
  CREDITS_10: {
    id: "CREDITS_10",
    name: "Bet Builder Credit (10 Slips)",
    credits: 10,
    expirationDays: 14,
    badge: "Best Value",
    description: "10 instant AI Bet Builder slips (expires after 14 days).",
    amountCents: 499, // $4.99
    currency: "usd",
    whopProductId: "prod_j6F3w5rILzZ7I",
    whopPlanId: "plan_d9kvGCFy9sGB3",
    whopCheckoutUrl: "https://whop.com/checkout/plan_d9kvGCFy9sGB3",
    bachsProductId: process.env.BACHS_PRODUCT_CREDITS_10 || "prod_9555b53b472d455b92e8",
    bachsCheckoutUrl: process.env.BACHS_CHECKOUT_URL_CREDITS_10 || undefined,
    currencyVariants: {
      usd: {
        currency: "USD",
        symbol: "$",
        amount: 4.99,
        formattedAmount: "$4.99",
        provider: "whop",
        productId: "plan_d9kvGCFy9sGB3",
        checkoutUrl: "https://whop.com/checkout/plan_d9kvGCFy9sGB3",
      },
      ngn: {
        currency: "NGN",
        symbol: "₦",
        amount: 1500,
        formattedAmount: "₦1,500",
        provider: "whop",
        productId: "plan_YJl6MWOzDgo4d",
        checkoutUrl: "https://whop.com/checkout/plan_YJl6MWOzDgo4d",
      },
      zar: {
        currency: "ZAR",
        symbol: "R",
        amount: 40,
        formattedAmount: "R40",
        provider: "whop",
        productId: "plan_POOQfPT71x540",
        checkoutUrl: "https://whop.com/checkout/plan_POOQfPT71x540",
      },
      ...buildBachsCurrencyVariants(
        "prod_9555b53b472d455b92e8",
        process.env.BACHS_CHECKOUT_URL_CREDITS_10 || "",
        {
          ghs: 25,
          kes: 250,
          ugx: 7500,
          tzs: 5000,
          mwk: 3500,
          rwf: 3000,
          xaf: 1350,
          xof: 1350,
        }
      ),
    },
  },
};

export function isCreditPackId(id: string): id is CreditPackId {
  return id === "CREDITS_1" || id === "CREDITS_3" || id === "CREDITS_10";
}

export function getCreditPackOrNull(id?: string | null): CreditPackDefinition | null {
  if (!id || !isCreditPackId(id)) return null;
  return CREDIT_PACKS[id];
}

export type AnyPurchasablePlan = PlanDefinition | CreditPackDefinition;

export function getPlanOrThrow(planId: string): PlanDefinition {
  const plan = SUBSCRIPTION_PLANS[planId as SubscriptionPlanId];
  if (!plan) {
    throw new Error(
      `Invalid subscription plan ID: "${planId}". Valid plans are: ${Object.keys(SUBSCRIPTION_PLANS).join(", ")}`
    );
  }
  return plan;
}

export function getPurchasableOrThrow(planId: string): AnyPurchasablePlan {
  if (isCreditPackId(planId)) {
    return CREDIT_PACKS[planId];
  }
  const plan = SUBSCRIPTION_PLANS[planId as SubscriptionPlanId];
  if (!plan) {
    throw new Error(
      `Invalid plan ID: "${planId}". Valid plans are: ${[
        ...Object.keys(SUBSCRIPTION_PLANS),
        ...Object.keys(CREDIT_PACKS),
      ].join(", ")}`
    );
  }
  return plan;
}

const WHOP_ID_TO_INTERNAL_PLAN: Record<string, PlanId> = {
  // Credit Packs - Plan IDs
  plan_jvWQQ5YSRkiOX: "CREDITS_1",
  plan_bTRQpVLxSC16g: "CREDITS_1",
  plan_ZsocLQchMnhaT: "CREDITS_1",
  plan_mb5q96LMRR3SN: "CREDITS_3",
  plan_zmjHW7hpqGMlK: "CREDITS_3",
  plan_rgBYUoxQK2ntg: "CREDITS_3",
  plan_d9kvGCFy9sGB3: "CREDITS_10",
  plan_YJl6MWOzDgo4d: "CREDITS_10",
  plan_POOQfPT71x540: "CREDITS_10",
  // Credit Packs - Product IDs
  prod_aujxyKH0dFm3q: "CREDITS_1",
  prod_kJEmaPRVhxJoI: "CREDITS_3",
  prod_j6F3w5rILzZ7I: "CREDITS_10",
  // Subscription Plans - Whop Plan IDs
  plan_fTC4HGr9D33uO: "VIP_6MONTHS",
  plan_b9oSv9CGseeG7: "VIP_6MONTHS",
  plan_x5pw1IbNFyi1Y: "VIP_6MONTHS",
  plan_oaCOPGAT2FpXZ: "VIP_6MONTHS",
  plan_DfSUCcAweadIa: "VIP_MONTHLY",
  plan_qBmyg12UoWVQc: "VIP_MONTHLY",
  plan_9Cx98mNqjAtVE: "VIP_MONTHLY",
  plan_JIrwD7tDw5bnJ: "VIP_MONTHLY",
  plan_xaGOGXV9S44NL: "PREMIUM_6MONTHS",
  plan_QWBXn1FL9DyO1: "PREMIUM_6MONTHS",
  plan_u9AXPZ2NqmPIW: "PREMIUM_6MONTHS",
  plan_DL3PT43HhWvir: "PREMIUM_6MONTHS",
  plan_8iNJRtiKtVzMH: "PREMIUM_MONTHLY",
  plan_dIivpO1ZYQApV: "PREMIUM_MONTHLY",
  plan_6TkF3PeSpuGXC: "PREMIUM_MONTHLY",
};

/**
 * Resolve any Whop plan_... or prod_... identifier to an internal subscription or credit pack ID.
 */
export function resolveWhopPlanToInternalId(
  whopPlanId?: string | null,
  whopProductId?: string | null
): PlanId | null {
  if (whopPlanId && WHOP_ID_TO_INTERNAL_PLAN[whopPlanId]) {
    return WHOP_ID_TO_INTERNAL_PLAN[whopPlanId];
  }
  if (whopProductId && WHOP_ID_TO_INTERNAL_PLAN[whopProductId]) {
    return WHOP_ID_TO_INTERNAL_PLAN[whopProductId];
  }
  return null;
}

export const BACHS_PRODUCT_TO_INTERNAL_PLAN: Record<string, PlanId> = {
  prod_cb9782fabf1c4c5a8b67: "PREMIUM_6MONTHS",
  prod_ed97f1b60dc344e491c8: "PREMIUM_MONTHLY",
  prod_275e20b69d0940f8a31f: "VIP_6MONTHS",
  prod_8bcc294dbe674aab9ad3: "VIP_MONTHLY",
  prod_cb545410db9d41e08d25: "CREDITS_3",
  prod_9555b53b472d455b92e8: "CREDITS_10",
};

/**
 * Resolve any Bachs prod_... identifier to an internal subscription or credit pack ID.
 */
export function resolveBachsProductToInternalId(
  bachsProductId?: string | null
): PlanId | null {
  if (bachsProductId && BACHS_PRODUCT_TO_INTERNAL_PLAN[bachsProductId]) {
    return BACHS_PRODUCT_TO_INTERNAL_PLAN[bachsProductId];
  }
  return null;
}

const AFRICAN_MOMO_CURRENCIES = new Set([
  "kes",
  "momo",
  "ghs",
  "ugx",
  "tzs",
  "mwk",
  "rwf",
  "xof",
  "xaf",
  "zmw",
]);

/**
 * Intelligent Payment Routing:
 * - USD, NGN (transfers/OPay), and ZAR -> Whop
 * - African MoMo currencies (KES, GHS, UGX, TZS, MWK, RWF, XAF, XOF, ZMW) -> Bachs (when paylink/API configured)
 * - Unconfigured MoMo credit packs safely fall back to USD -> Whop
 */
export function resolveProviderAndCheckout(
  planId: PlanId,
  currencyInput?: string
): { provider: "whop" | "bachs"; checkoutUrl: string; currency: string; productId?: string } {
  const cur = (currencyInput || "usd").toLowerCase().trim();

  if (isCreditPackId(planId)) {
    const pack = CREDIT_PACKS[planId];
    if (AFRICAN_MOMO_CURRENCIES.has(cur) && pack.bachsCheckoutUrl) {
      const variant = pack.currencyVariants[cur] || pack.currencyVariants.kes || pack.currencyVariants.ghs;
      return {
        provider: "bachs",
        checkoutUrl: variant?.checkoutUrl || pack.bachsCheckoutUrl,
        currency: cur === "momo" ? "MOMO" : cur.toUpperCase(),
        productId: variant?.productId || pack.bachsProductId,
      };
    }

    const targetKey = cur === "ngn" || cur === "zar" ? cur : "usd";
    const variant = pack.currencyVariants[targetKey] || pack.currencyVariants.usd;
    return {
      provider: "whop",
      checkoutUrl: variant.checkoutUrl || pack.whopCheckoutUrl,
      currency: variant.currency,
      productId: variant.productId || pack.whopPlanId,
    };
  }

  const plan = getPlanOrThrow(planId);

  // Strict Routing Rule for Subscriptions:
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

  // African currencies / Mobile Money route to Bachs for subscriptions
  if (AFRICAN_MOMO_CURRENCIES.has(cur)) {
    const variant = plan.currencyVariants[cur] || plan.currencyVariants.momo || plan.currencyVariants.kes;
    return {
      provider: "bachs",
      checkoutUrl: variant?.checkoutUrl || plan.bachsCheckoutUrl || plan.whopCheckoutUrl,
      currency: cur === "momo" ? "MOMO" : cur.toUpperCase(),
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
