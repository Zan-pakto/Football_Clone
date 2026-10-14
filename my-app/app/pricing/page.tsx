"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Check,
  Crown,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  Globe,
  Smartphone,
  Wallet,
  Zap,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function getValidToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("jt_auth_token");
  if (!token || token === "null" || token === "undefined" || token.trim().length < 10) {
    return null;
  }
  return token.trim();
}

type BillingInterval = "1month" | "6months";
type CurrencyCode = "USD" | "NGN" | "ZAR" | "KES" | "MOMO";

interface CurrencyOption {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  region: string;
  provider: "Whop" | "Bachs.io";
  methodsText: string;
}

const CURRENCIES: Record<CurrencyCode, CurrencyOption> = {
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    flag: "🇺🇸",
    region: "Worldwide & International",
    provider: "Whop",
    methodsText: "PayPal • Cards • Apple Pay • Google Pay",
  },
  NGN: {
    code: "NGN",
    symbol: "₦",
    name: "Nigerian Naira",
    flag: "🇳🇬",
    region: "Nigeria",
    provider: "Whop",
    methodsText: "Instant Bank Transfer • Cards • OPay",
  },
  ZAR: {
    code: "ZAR",
    symbol: "R",
    name: "South African Rand",
    flag: "🇿🇦",
    region: "South Africa",
    provider: "Whop",
    methodsText: "Cards • Instant EFT • Ozow",
  },
  KES: {
    code: "KES",
    symbol: "KSh",
    name: "Kenyan Shilling",
    flag: "🇰🇪",
    region: "Kenya & East Africa",
    provider: "Bachs.io",
    methodsText: "M-Pesa • Airtel Money • Mobile Money",
  },
  MOMO: {
    code: "MOMO",
    symbol: "MoMo",
    name: "African Mobile Money",
    flag: "🌍",
    region: "Ghana, Uganda, Tanzania & All Africa",
    provider: "Bachs.io",
    methodsText: "MTN MoMo • Vodafone Cash • Airtel Money • M-Pesa",
  },
};

const PLAN_PRICING: Record<
  CurrencyCode,
  {
    premium: {
      "1month": { price: string; periodLabel: string; billedNote: string; planId: string };
      "6months": { price: string; periodLabel: string; billedNote: string; planId: string; savings: string };
    };
    vip: {
      "1month": { price: string; periodLabel: string; billedNote: string; planId: string };
      "6months": { price: string; periodLabel: string; billedNote: string; planId: string; savings: string };
    };
  }
> = {
  USD: {
    premium: {
      "1month": { price: "$9.99", periodLabel: "/month", billedNote: "Billed monthly • Cancel anytime", planId: "PREMIUM_MONTHLY" },
      "6months": { price: "$49.99", periodLabel: "/6-mo", billedNote: "$8.33/month equivalent • Save 17%", planId: "PREMIUM_6MONTHS", savings: "SAVE 17%" },
    },
    vip: {
      "1month": { price: "$19.99", periodLabel: "/month", billedNote: "Billed monthly • Cancel anytime", planId: "VIP_MONTHLY" },
      "6months": { price: "$79.99", periodLabel: "/6-mo", billedNote: "$13.33/month equivalent • Save 33%", planId: "VIP_6MONTHS", savings: "SAVE 33%" },
    },
  },
  NGN: {
    premium: {
      "1month": { price: "₦10,000", periodLabel: "/month", billedNote: "Billed monthly • Pay via Bank/OPay", planId: "PREMIUM_MONTHLY" },
      "6months": { price: "₦49,999.99", periodLabel: "/6-mo", billedNote: "₦8,333/mo equivalent • Save 17%", planId: "PREMIUM_6MONTHS", savings: "SAVE 17%" },
    },
    vip: {
      "1month": { price: "₦19,999.99", periodLabel: "/month", billedNote: "Billed monthly • Pay via Bank/OPay", planId: "VIP_MONTHLY" },
      "6months": { price: "₦99,999.99", periodLabel: "/6-mo", billedNote: "₦16,666/mo equivalent • Save 17%", planId: "VIP_6MONTHS", savings: "SAVE 17%" },
    },
  },
  ZAR: {
    premium: {
      "1month": { price: "R189.99", periodLabel: "/month", billedNote: "Billed monthly • Cancel anytime", planId: "PREMIUM_MONTHLY" },
      "6months": { price: "R949.99", periodLabel: "/6-mo", billedNote: "R158.33/mo equivalent • Save 17%", planId: "PREMIUM_6MONTHS", savings: "SAVE 17%" },
    },
    vip: {
      "1month": { price: "R379.99", periodLabel: "/month", billedNote: "Billed monthly • Cancel anytime", planId: "VIP_MONTHLY" },
      "6months": { price: "R1,899.99", periodLabel: "/6-mo", billedNote: "R316.66/mo equivalent • Save 17%", planId: "VIP_6MONTHS", savings: "SAVE 17%" },
    },
  },
  KES: {
    premium: {
      "1month": { price: "KSh 1,470", periodLabel: "/month", billedNote: "Billed monthly via M-Pesa", planId: "PREMIUM_MONTHLY" },
      "6months": { price: "KSh 7,350", periodLabel: "/6-mo", billedNote: "KSh 1,225/mo equivalent • Save 17%", planId: "PREMIUM_6MONTHS", savings: "SAVE 17%" },
    },
    vip: {
      "1month": { price: "KSh 2,940", periodLabel: "/month", billedNote: "Billed monthly via M-Pesa", planId: "VIP_MONTHLY" },
      "6months": { price: "KSh 14,700", periodLabel: "/6-mo", billedNote: "KSh 2,450/mo equivalent • Save 17%", planId: "VIP_6MONTHS", savings: "SAVE 17%" },
    },
  },
  MOMO: {
    premium: {
      "1month": { price: "Mobile Money", periodLabel: "/month", billedNote: "Local Mobile Money (MTN, Airtel, Orange)", planId: "PREMIUM_MONTHLY" },
      "6months": { price: "Mobile Money", periodLabel: "/6-mo", billedNote: "6 Months local pass • Save 17%", planId: "PREMIUM_6MONTHS", savings: "SAVE 17%" },
    },
    vip: {
      "1month": { price: "Mobile Money", periodLabel: "/month", billedNote: "Local Mobile Money (MTN, Airtel, Orange)", planId: "VIP_MONTHLY" },
      "6months": { price: "Mobile Money", periodLabel: "/6-mo", billedNote: "6 Months VIP pass • Save 17%", planId: "VIP_6MONTHS", savings: "SAVE 17%" },
    },
  },
};

export default function PricingPage() {
  const router = useRouter();
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [interval, setInterval] = useState<BillingInterval>("1month");
  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<any>(null);

  // Auto-detect visitor's country / currency based on timezone
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.includes("Lagos") || tz.includes("Nigeria")) {
        setCurrency("NGN");
      } else if (tz.includes("Johannesburg") || tz.includes("South_Africa")) {
        setCurrency("ZAR");
      } else if (tz.includes("Nairobi")) {
        setCurrency("KES");
      } else if (
        tz.includes("Accra") ||
        tz.includes("Kampala") ||
        tz.includes("Dar_es_Salaam") ||
        tz.includes("Kigali") ||
        tz.includes("Douala") ||
        tz.includes("Abidjan")
      ) {
        setCurrency("MOMO");
      } else {
        // Every other country defaults to USD
        setCurrency("USD");
      }
    } catch {
      setCurrency("USD");
    }
  }, []);

  useEffect(() => {
    async function checkSubscription() {
      setStatusLoading(true);
      try {
        let token = getValidToken();
        if (!token) {
          const authRes = await fetch("/api/auth", { credentials: "include" });
          const authData = await authRes.json();
          if (authData?.success && authData?.token) {
            token = authData.token;
            localStorage.setItem("jt_auth_token", authData.token);
          }
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const res = await fetch("/api/payments/subscription-status", {
          headers,
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setSubStatus(data);
        }
      } catch {
        // Guest or unauthenticated
      } finally {
        setStatusLoading(false);
      }
    }
    checkSubscription();
  }, []);

  const isVipActive = Boolean(subStatus?.hasActiveSubscription && !subStatus?.isExpired);
  const isExpired = Boolean(subStatus?.isExpired);

  const currentPrices = PLAN_PRICING[currency];
  const curInfo = CURRENCIES[currency];

  const handleCheckout = async (planKey: "premium" | "vip") => {
    setErrorMessage(null);

    const targetPlanId = currentPrices[planKey][interval].planId;

    // Frontend guard: do not allow checkout if user is already an active VIP
    if (isVipActive) {
      const expDate = subStatus.currentPeriodEnd
        ? new Date(subStatus.currentPeriodEnd).toLocaleDateString()
        : "active";
      setErrorMessage(`You already have an active ${subStatus.plan} plan valid until ${expDate}. You can renew once this period ends.`);
      return;
    }

    setLoading(true);
    setLoadingPlan(targetPlanId);

    try {
      let token = getValidToken();

      if (!token) {
        try {
          const authRes = await fetch("/api/auth", { credentials: "include" });
          const authData = await authRes.json();
          if (authData?.success && authData?.token) {
            token = authData.token;
            localStorage.setItem("jt_auth_token", authData.token);
          } else if (authData && !authData.isLoggedIn) {
            router.push(`/login?mode=register&redirect=/pricing`);
            return;
          }
        } catch {
          // Proceed to attempt checkout
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          planId: targetPlanId,
          currency: currency.toLowerCase(),
        }),
      });

      const data = await res.json();

      if (res.status === 401 || (!data.success && data.error?.toLowerCase().includes("signed in"))) {
        router.push(`/login?mode=register&redirect=/pricing`);
        return;
      }

      if (data.alreadyActive) {
        setErrorMessage(data.error || "You already have an active VIP subscription.");
        return;
      }

      if (!res.ok || !data.success || !data.checkoutUrl) {
        setErrorMessage(data.error || "Failed to initialize payment checkout. Please try again.");
        return;
      }

      // Redirect user to payment gateway checkout
      window.location.href = data.checkoutUrl;
    } catch {
      setErrorMessage("Network connection error. Please check your connection and try again.");
    } finally {
      setLoading(false);
      setLoadingPlan(null);
    }
  };

  const handleOpenBillingPortal = async () => {
    setLoading(true);
    try {
      const token = getValidToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("/api/payments/portal", {
        method: "POST",
        headers,
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.portalUrl) {
        window.location.href = data.portalUrl;
      } else {
        setErrorMessage(data.error || "Unable to open billing portal.");
      }
    } catch {
      setErrorMessage("Network error opening portal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "44px 20px 88px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="gold-badge" style={{ marginBottom: 14 }}>
            <Crown size={14} />
            <span>ALGORITHMIC VIP PREDICTIONS & BET BUILDER</span>
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: "0 0 14px",
              color: "var(--text-primary)",
            }}
          >
            Upgrade to <span style={{ color: "var(--gold)" }}>VIP Pro Access</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
            Gain daily high-confidence bankers, mathematical value edge (+EV) alerts, custom acca bet builders, and instant Telegram VIP broadcasts.
          </p>

          {/* 7-Day Free Trial Global Banner */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(47, 208, 138, 0.1)",
              border: "1px solid rgba(47, 208, 138, 0.35)",
              padding: "10px 22px",
              borderRadius: 30,
              marginTop: 22,
              fontSize: 13.5,
              fontWeight: 700,
              color: "#2fd08a",
            }}
          >
            <Sparkles size={16} />
            <span>🎁 7-Day Free Trial Included on All Sign-Ups &bull; $0 Today &bull; Cancel Anytime</span>
          </div>
        </div>

        {/* Currency Switcher Bar */}
        <div
          style={{
            maxWidth: 820,
            margin: "0 auto 30px",
            background: "rgba(18, 18, 30, 0.75)",
            border: "1px solid var(--border-color)",
            borderRadius: 16,
            padding: "14px 18px",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Globe size={16} color="var(--gold)" />
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
                Select Your Currency & Country:
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: "var(--text-dim)" }}>
              Every other country gets USD &bull; Automatic frictionless gateway routing
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))",
              gap: 8,
            }}
          >
            {(Object.keys(CURRENCIES) as CurrencyCode[]).map((cKey) => {
              const opt = CURRENCIES[cKey];
              const isSelected = currency === cKey;
              return (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => setCurrency(cKey)}
                  style={{
                    background: isSelected ? "var(--gold)" : "rgba(255, 255, 255, 0.04)",
                    color: isSelected ? "var(--gold-btn-text)" : "var(--text-secondary)",
                    border: isSelected ? "1px solid var(--gold)" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 10,
                    padding: "9px 12px",
                    fontSize: 12.5,
                    fontWeight: isSelected ? 800 : 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    transition: "all 0.2s ease",
                    boxShadow: isSelected ? "0 2px 10px rgba(245, 158, 11, 0.3)" : "none",
                  }}
                >
                  <span style={{ fontSize: 15 }}>{opt.flag}</span>
                  <span>{opt.code}</span>
                  <span style={{ opacity: 0.75 }}>({opt.symbol})</span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
              fontSize: 12,
              color: "var(--text-dim)",
            }}
          >
            <div>
              <strong style={{ color: "var(--text-secondary)" }}>{curInfo.name} ({curInfo.code})</strong>
              <span> &bull; Routed securely via <strong style={{ color: "var(--gold)" }}>{curInfo.provider}</strong></span>
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>Payment Methods: </span>
              <span style={{ color: "#2fd08a", fontWeight: 700 }}>{curInfo.methodsText}</span>
            </div>
          </div>
        </div>

        {/* 1 Month vs 6 Months Billing Frequency Toggle */}
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-color)",
              borderRadius: 30,
              padding: 4,
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setInterval("1month")}
              style={{
                padding: "8px 22px",
                borderRadius: 24,
                border: "none",
                background: interval === "1month" ? "var(--gold)" : "transparent",
                color: interval === "1month" ? "var(--gold-btn-text)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              1 Month Billing
            </button>
            <button
              type="button"
              onClick={() => setInterval("6months")}
              style={{
                padding: "8px 22px",
                borderRadius: 24,
                border: "none",
                background: interval === "6months" ? "var(--gold)" : "transparent",
                color: interval === "6months" ? "var(--gold-btn-text)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s ease",
              }}
            >
              <span>6 Months Pass</span>
              <span
                style={{
                  background: interval === "6months" ? "rgba(0, 0, 0, 0.25)" : "rgba(245, 158, 11, 0.2)",
                  color: interval === "6months" ? "#08071e" : "var(--gold)",
                  padding: "2px 8px",
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                SAVE UP TO 33%
              </span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div
            style={{
              maxWidth: 620,
              margin: "0 auto 24px",
              padding: "12px 18px",
              borderRadius: 10,
              background: "var(--accent-red-bg)",
              border: "1px solid var(--accent-red-border)",
              color: "var(--accent-red)",
              fontSize: 13.5,
              textAlign: "center",
            }}
          >
            {errorMessage}
          </div>
        )}

        {isVipActive && (
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto 32px",
              padding: 22,
              borderRadius: 14,
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--gold)", fontWeight: 800, fontSize: 15 }}>
                <Crown size={18} />
                <span>You Have an Active VIP Pro Subscription</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Current Plan: <strong style={{ color: "#ffffff" }}>{subStatus.plan}</strong> &bull; Valid Until:{" "}
                <strong style={{ color: "var(--gold)" }}>
                  {subStatus.currentPeriodEnd ? new Date(subStatus.currentPeriodEnd).toLocaleDateString() : "Ongoing"}
                </strong>
                <br />
                <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  Duplicate payments are blocked while active. You will be able to pay again once your pass expires.
                </span>
              </p>
            </div>
            <button
              onClick={handleOpenBillingPortal}
              disabled={loading}
              className="gold-outline-btn"
              style={{ fontSize: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}
            >
              <CreditCard size={14} />
              <span>Manage Billing / Cards</span>
            </button>
          </div>
        )}

        {isExpired && (
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto 32px",
              padding: 20,
              borderRadius: 14,
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 14,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--accent-red)", fontWeight: 800, fontSize: 14 }}>
                <RefreshCw size={16} />
                <span>Your VIP Access has Expired</span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
                Your pass ended {subStatus.expiredAt ? `on ${new Date(subStatus.expiredAt).toLocaleDateString()}` : "recently"}. Choose a plan below to renew and unlock banker predictions again.
              </p>
            </div>
          </div>
        )}

        {/* Pricing Cards Grid (3-Tier) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
            alignItems: "stretch",
            maxWidth: 1140,
            margin: "0 auto 48px",
          }}
        >
          {/* 1. Free Starter Tier */}
          <div
            className="luxury-card"
            style={{
              padding: 28,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "100%",
              boxSizing: "border-box",
              borderRadius: 14,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Free Starter</h3>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "var(--surface-raised)",
                    color: "var(--text-dim)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  Free Forever
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 20 }}>
                Explore daily football predictions with standard confidence access and public records.
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)" }}>$0</span>
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>/month</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 28, flex: 1 }}>
                {[
                  "7 Free Daily Match Tips",
                  "Standard 1X2 Match Predictions",
                  "Live Match Scores & Minutes",
                  "Public Track Record Access",
                ].map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-secondary)" }}>
                    <Check size={16} color="var(--accent-green)" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/all-matches"
              className="gold-outline-btn"
              style={{
                width: "100%",
                display: "block",
                textAlign: "center",
                padding: "13px",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            >
              Get Started Free
            </Link>
          </div>

          {/* 2. Premium Pro Tier */}
          <div
            className="luxury-card"
            style={{
              padding: 28,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderColor: "var(--gold)",
              boxShadow: "0 0 25px rgba(124, 108, 245, 0.25)",
              position: "relative",
              height: "100%",
              boxSizing: "border-box",
              borderRadius: 14,
            }}
          >
            <div style={{ position: "absolute", top: -12, right: 20, zIndex: 2 }}>
              <span
                className="gold-badge"
                style={{
                  background: "var(--gold)",
                  color: "var(--gold-btn-text)",
                  borderColor: "var(--gold)",
                  fontWeight: 800,
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
                }}
              >
                <Sparkles size={11} /> MOST POPULAR
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--gold)" }}>Premium Pro</h3>
                {interval === "6months" && currentPrices.premium["6months"].savings && (
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6, background: "rgba(245, 158, 11, 0.2)", color: "var(--gold)" }}>
                    {currentPrices.premium["6months"].savings}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 18 }}>
                Full algorithmic access, unlocked banker tips, and real-time value odds edges.
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 34, fontWeight: 900, color: "var(--text-primary)" }}>
                  {currentPrices.premium[interval].price}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {currentPrices.premium[interval].periodLabel}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 16 }}>
                {currentPrices.premium[interval].billedNote}
              </div>

              {/* 7-Day Free Trial Pill */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: "3px 9px",
                    borderRadius: 6,
                    background: "rgba(47, 208, 138, 0.15)",
                    color: "#2fd08a",
                    border: "1px solid rgba(47, 208, 138, 0.3)",
                  }}
                >
                  🎁 7-Day Free Trial
                </span>
                <span style={{ fontSize: 11.5, color: "var(--text-dim)" }}>$0 charged today</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 28, flex: 1 }}>
                {[
                  "7-Day Free Trial Included ($0 Today)",
                  "Unlimited Banker of the Day Access",
                  "100k Monte Carlo Simulated Probabilities",
                  "Mathematical Value Edge (+EV) Alerts",
                  "Custom Acca Bet Builder Unlocked",
                  "Verified AI Track Record Access",
                  "Instant Activation",
                ].map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                    <Check size={16} color="var(--gold)" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {statusLoading ? (
              <button
                disabled
                className="gold-outline-btn"
                style={{
                  width: "100%",
                  padding: "13px",
                  fontSize: 13,
                  fontWeight: 700,
                  opacity: 0.6,
                  cursor: "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxSizing: "border-box",
                }}
              >
                <RefreshCw size={14} className="animate-spin" />
                <span>Verifying...</span>
              </button>
            ) : isVipActive ? (
              <Link
                href="/all-matches"
                className="gold-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  textAlign: "center",
                  padding: "13px",
                  fontSize: 14,
                  boxSizing: "border-box",
                }}
              >
                <span>Access Premium Predictions</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <button
                onClick={() => handleCheckout("premium")}
                disabled={loading}
                className="gold-btn"
                style={{
                  width: "100%",
                  textAlign: "center",
                  padding: "13px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: loading ? 0.7 : 1,
                  boxSizing: "border-box",
                }}
              >
                {loading && loadingPlan === currentPrices.premium[interval].planId ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Connecting Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>Start 7-Day Free Trial ({currentPrices.premium[interval].price})</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>

          {/* 3. VIP Pro Tier */}
          <div
            className="luxury-card"
            style={{
              padding: 28,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderColor: "rgba(245, 158, 11, 0.45)",
              boxShadow: "0 0 25px rgba(245, 158, 11, 0.15)",
              position: "relative",
              height: "100%",
              boxSizing: "border-box",
              borderRadius: 14,
            }}
          >
            <div style={{ position: "absolute", top: -12, right: 20, zIndex: 2 }}>
              <span
                className="gold-badge"
                style={{
                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                  color: "#08071e",
                  borderColor: "#fbbf24",
                  fontWeight: 800,
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
                }}
              >
                <Crown size={11} strokeWidth={2.5} /> VIP ELITE
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#f59e0b" }}>VIP Pro</h3>
                {interval === "6months" && currentPrices.vip["6months"].savings && (
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6, background: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" }}>
                    {currentPrices.vip["6months"].savings}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 18 }}>
                Ultimate betting intelligence suite with exclusive VIP Telegram broadcast alerts and priority bankers.
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 34, fontWeight: 900, color: "var(--text-primary)" }}>
                  {currentPrices.vip[interval].price}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {currentPrices.vip[interval].periodLabel}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 16 }}>
                {currentPrices.vip[interval].billedNote}
              </div>

              {/* 7-Day Free Trial Pill */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: "3px 9px",
                    borderRadius: 6,
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                  }}
                >
                  🎁 7-Day Free Trial
                </span>
                <span style={{ fontSize: 11.5, color: "var(--text-dim)" }}>$0 charged today</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 28, flex: 1 }}>
                {[
                  "7-Day Free Trial Included ($0 Today)",
                  "Everything in Premium Pro Included",
                  "Exclusive VIP Telegram Channel & Instant Alerts",
                  "Priority High-Roller Edge Banker Tips",
                  "VIP Accumulator Strategy Guides",
                  "Dedicated 1-on-1 VIP Customer Support",
                  "Early Access to Machine Learning Models",
                ].map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                    <Check size={16} color="#f59e0b" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {statusLoading ? (
              <button
                disabled
                className="gold-outline-btn"
                style={{
                  width: "100%",
                  padding: "13px",
                  fontSize: 13,
                  fontWeight: 700,
                  opacity: 0.6,
                  cursor: "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxSizing: "border-box",
                }}
              >
                <RefreshCw size={14} className="animate-spin" />
                <span>Verifying...</span>
              </button>
            ) : isVipActive ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                  <span style={{ color: "var(--accent-green)", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Check size={16} /> VIP Active Until {subStatus.currentPeriodEnd ? new Date(subStatus.currentPeriodEnd).toLocaleDateString() : "Ongoing"}
                  </span>
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--text-secondary)" }}>
                    Active membership &bull; Auto-synced
                  </p>
                </div>

                <Link
                  href="/all-matches"
                  className="vip-gold-btn"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    textAlign: "center",
                    padding: "13px",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                >
                  <span>Access VIP Predictions</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <button
                onClick={() => handleCheckout("vip")}
                disabled={loading}
                className="vip-gold-btn"
                style={{
                  width: "100%",
                  textAlign: "center",
                  padding: "13px",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: loading ? 0.7 : 1,
                  boxSizing: "border-box",
                }}
              >
                {loading && loadingPlan === currentPrices.vip[interval].planId ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Connecting Checkout...</span>
                  </>
                ) : isExpired ? (
                  <>
                    <span>Renew VIP Pro ({currentPrices.vip[interval].price})</span>
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <span>Start 7-Day Free Trial ({currentPrices.vip[interval].price})</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Accepted Payment Methods Section (Featuring PayPal, OPay, M-Pesa, Mobile Money) */}
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto 40px",
            background: "rgba(18, 18, 30, 0.7)",
            border: "1px solid var(--border-color)",
            borderRadius: 16,
            padding: "28px 24px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "var(--gold)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                display: "block",
                marginBottom: 6,
              }}
            >
              FLEXIBLE LOCAL & GLOBAL BILLING
            </span>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
              Accepted Payment Methods
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "6px 0 0" }}>
              Pay easily and securely using PayPal, OPay, M-Pesa, Mobile Money, credit/debit cards, or instant bank transfer.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {/* 1. PayPal Highlight */}
            <div
              style={{
                background: "rgba(0, 112, 186, 0.08)",
                border: "1px solid rgba(0, 112, 186, 0.3)",
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#0070ba",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                P
              </div>
              <div>
                <strong style={{ fontSize: 14, color: "#60a5fa", display: "block", marginBottom: 3 }}>
                  PayPal
                </strong>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  Fast & protected 1-click international checkout for all global subscribers.
                </p>
              </div>
            </div>

            {/* 2. OPay, M-Pesa & Mobile Money */}
            <div
              style={{
                background: "rgba(47, 208, 138, 0.08)",
                border: "1px solid rgba(47, 208, 138, 0.3)",
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#10b981",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Smartphone size={20} />
              </div>
              <div>
                <strong style={{ fontSize: 14, color: "#34d399", display: "block", marginBottom: 3 }}>
                  Pay with OPay, M-Pesa & Mobile Money
                </strong>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  Direct wallet & PIN payments: OPay (NG), M-Pesa (KE/TZ), MTN MoMo, Airtel & Vodafone.
                </p>
              </div>
            </div>

            {/* 3. Cards & Digital Wallets */}
            <div
              style={{
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#f59e0b",
                  color: "#08071e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CreditCard size={20} />
              </div>
              <div>
                <strong style={{ fontSize: 14, color: "#fbbf24", display: "block", marginBottom: 3 }}>
                  Cards, Apple Pay & Google Pay
                </strong>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  Visa, Mastercard, American Express, Apple Pay, and Google Pay with 256-bit SSL encryption.
                </p>
              </div>
            </div>

            {/* 4. Instant Bank Transfer */}
            <div
              style={{
                background: "rgba(124, 108, 245, 0.08)",
                border: "1px solid rgba(124, 108, 245, 0.25)",
                borderRadius: 12,
                padding: "16px 18px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#7c6cf5",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Wallet size={20} />
              </div>
              <div>
                <strong style={{ fontSize: 14, color: "#a79fff", display: "block", marginBottom: 3 }}>
                  Instant Bank Transfers
                </strong>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  Pay via direct bank app transfer in Nigeria & South Africa (Instant EFT & Ozow).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Supported Local Payment Currencies List */}
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            borderRadius: 16,
            padding: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={16} color="var(--gold)" />
              <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                Supported Local Payment Currencies & Coverage
              </h4>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
              *Every other country defaults to USD without foreign exchange fees
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            {[
              { code: "USD ($)", name: "United States & Global", flag: "🇺🇸", gateway: "Whop", methods: "PayPal, Cards, Apple/Google Pay" },
              { code: "NGN (₦)", name: "Nigerian Naira", flag: "🇳🇬", gateway: "Whop", methods: "Bank Transfer, OPay, ATM Cards" },
              { code: "ZAR (R)", name: "South African Rand", flag: "🇿🇦", gateway: "Whop", methods: "Credit/Debit Cards, Instant EFT" },
              { code: "KES (KSh)", name: "Kenyan Shilling", flag: "🇰🇪", gateway: "Bachs.io", methods: "M-Pesa, Airtel Money" },
              { code: "GHS (GH₵)", name: "Ghanaian Cedi", flag: "🇬🇭", gateway: "Bachs.io", methods: "MTN MoMo, Vodafone Cash" },
              { code: "UGX", name: "Ugandan Shilling", flag: "🇺🇬", gateway: "Bachs.io", methods: "Airtel Money, MTN MoMo" },
              { code: "TZS", name: "Tanzanian Shilling", flag: "🇹🇿", gateway: "Bachs.io", methods: "M-Pesa, Airtel Money" },
              { code: "XOF / XAF", name: "West & Central African CFA", flag: "🌍", gateway: "Bachs.io", methods: "Orange Money, MTN Mobile" },
              { code: "RWF", name: "Rwandan Franc", flag: "🇷🇼", gateway: "Bachs.io", methods: "MTN Mobile Money" },
            ].map((item) => (
              <div
                key={item.code}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 20 }}>{item.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{item.code}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "var(--text-dim)" }}>
                      {item.gateway}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {item.methods}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 18,
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(47, 208, 138, 0.08)",
              border: "1px solid rgba(47, 208, 138, 0.2)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12.5,
              color: "#2fd08a",
            }}
          >
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Zero-Risk 7-Day Guarantee:</strong> All subscriptions start with an automated 7-day free trial ($0 today). Cancel anytime with 1 click before day 7 ends and you will not be charged.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
