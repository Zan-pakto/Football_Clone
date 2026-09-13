"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Check, Crown, Sparkles, RefreshCw, ShieldCheck, CreditCard, ArrowRight } from "lucide-react";
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

export default function PricingPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<any>(null);

  useEffect(() => {
    async function checkSubscription() {
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
      }
    }
    checkSubscription();
  }, []);

  const handleCheckout = async (planId: "VIP_MONTHLY" | "VIP_ANNUAL") => {
    setErrorMessage(null);
    setLoading(true);

    try {
      let token = getValidToken();

      // If token missing in localStorage, recover from cookie via /api/auth
      if (!token) {
        try {
          const authRes = await fetch("/api/auth", { credentials: "include" });
          const authData = await authRes.json();
          if (authData?.success && authData?.token) {
            token = authData.token;
            localStorage.setItem("jt_auth_token", authData.token);
          } else if (authData && !authData.isLoggedIn) {
            // Truly not logged in -> redirect to login with return back to pricing
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
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();

      if (res.status === 401 || (!data.success && data.error?.toLowerCase().includes("signed in"))) {
        // Not logged in -> redirect to login with return back to pricing
        router.push(`/login?mode=register&redirect=/pricing`);
        return;
      }

      if (!res.ok || !data.success || !data.checkoutUrl) {
        setErrorMessage(data.error || "Failed to initialize payment checkout. Please try again.");
        return;
      }

      // Redirect user to payment checkout
      window.location.href = data.checkoutUrl;
    } catch {
      setErrorMessage("Network connection error. Please check your connection and try again.");
    } finally {
      setLoading(false);
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

  const isVipActive = Boolean(subStatus?.hasActiveSubscription);

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 20px 80px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div className="gold-badge" style={{ marginBottom: 14 }}>
            <Crown size={14} />
            PREMIUM ACCESS & VIP ALGORITHMIC TIPS
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 12px", color: "var(--text-primary)" }}>
            Choose the Perfect Plan for <span style={{ color: "var(--gold)" }}>Consistent Value</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 620, margin: "0 auto", lineHeight: 1.6 }}>
            Get unlimited access to all algorithmic high-confidence match predictions, Bet of the Day, and value accumulators.
          </p>

          {/* Billing Cycle Toggle */}
          <div style={{ display: "inline-flex", background: "var(--surface-raised)", padding: 4, borderRadius: 10, border: "1px solid var(--border-color)", marginTop: 28 }}>
            <button
              onClick={() => setBillingCycle("monthly")}
              style={{
                padding: "8px 18px",
                borderRadius: 7,
                border: "none",
                background: billingCycle === "monthly" ? "var(--gold)" : "transparent",
                color: billingCycle === "monthly" ? "var(--gold-btn-text)" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              style={{
                padding: "8px 18px",
                borderRadius: 7,
                border: "none",
                background: billingCycle === "annual" ? "var(--gold)" : "transparent",
                color: billingCycle === "annual" ? "var(--gold-btn-text)" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <span>Annual Billing</span>
              <span style={{ fontSize: 10, background: "rgba(16, 185, 129, 0.2)", color: "var(--accent-green)", padding: "1px 6px", borderRadius: 4, fontWeight: 800 }}>
                SAVE 25%
              </span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div style={{ maxWidth: 600, margin: "0 auto 24px", padding: "12px 16px", borderRadius: 8, background: "var(--accent-red-bg)", border: "1px solid var(--accent-red-border)", color: "var(--accent-red)", fontSize: 13, textAlign: "center" }}>
            {errorMessage}
          </div>
        )}

        {isVipActive && (
          <div style={{ maxWidth: 700, margin: "0 auto 32px", padding: 20, borderRadius: 12, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--accent-green)", fontWeight: 800, fontSize: 14 }}>
                <ShieldCheck size={18} />
                <span>You Have an Active VIP Subscription</span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
                Current Plan: <strong>{subStatus.plan}</strong> &bull; Valid Until: {subStatus.currentPeriodEnd ? new Date(subStatus.currentPeriodEnd).toLocaleDateString() : "Ongoing"}
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

        {/* Pricing Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
          alignItems: "stretch",
          maxWidth: 900,
          margin: "0 auto",
        }}>
          {/* Free Starter Tier */}
          <div className="luxury-card" style={{
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Free Starter</h3>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "var(--surface-raised)", color: "var(--text-dim)", border: "1px solid var(--border-color)" }}>
                  Free Forever
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 24 }}>
                Explore daily football predictions with standard confidence access.
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 28 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)" }}>$0</span>
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>/month</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
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
                display: "block",
                textAlign: "center",
                padding: "12px",
                fontSize: 14,
              }}
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro VIP Tier (Featured) */}
          <div className="luxury-card" style={{
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderColor: "var(--gold)",
            boxShadow: "var(--shadow-glow)",
            position: "relative",
          }}>
            <div style={{ position: "absolute", top: -12, right: 24 }}>
              <span className="gold-badge" style={{ background: "var(--gold)", color: "var(--gold-btn-text)", borderColor: "var(--gold)" }}>
                <Sparkles size={11} /> MOST POPULAR
              </span>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--gold)" }}>
                  VIP Pro {billingCycle === "annual" ? "Annual" : "Monthly"}
                </h3>
                <span className="gold-badge">Best Value</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 24 }}>
                Full algorithmic access, unlocked high-confidence bankers, and real-time value odds edges.
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 28 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)" }}>
                  {billingCycle === "annual" ? "$179.99" : "$19.99"}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {billingCycle === "annual" ? "/year (~$14.99/mo)" : "/month"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {[
                  "Unlimited Banker of the Day Access",
                  "100k Monte Carlo Simulated Probabilities",
                  "Mathematical Value Edge (+EV) Alerts",
                  "Custom Acca Bet Builder Unlocked",
                  "VIP Telegram / Push Notification Alerts",
                ].map((feat) => (
                  <div key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                    <Check size={16} color="var(--gold)" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {isVipActive ? (
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
                }}
              >
                <span>Access VIP Predictions</span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <button
                onClick={() => handleCheckout(billingCycle === "annual" ? "VIP_ANNUAL" : "VIP_MONTHLY")}
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
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Securing Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock VIP Pro Now</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
