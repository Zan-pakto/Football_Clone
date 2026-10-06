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
  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<any>(null);

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

  const handleCheckout = async (planId: "PREMIUM_MONTHLY" | "VIP_MONTHLY") => {
    setErrorMessage(null);

    // Frontend guard: do not allow checkout if user is already an active VIP
    if (isVipActive) {
      const expDate = subStatus.currentPeriodEnd
        ? new Date(subStatus.currentPeriodEnd).toLocaleDateString()
        : "active";
      setErrorMessage(`You already have an active ${subStatus.plan} plan valid until ${expDate}. You can pay again once this period expires.`);
      return;
    }

    setLoading(true);
    setLoadingPlan(planId);

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

      if (data.alreadyActive) {
        setErrorMessage(data.error || "You already have an active VIP subscription.");
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

          {/* Simple Monthly Billing Sub-badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(124, 108, 245, 0.08)",
            border: "1px solid rgba(167, 159, 255, 0.2)",
            padding: "8px 18px",
            borderRadius: 24,
            marginTop: 26,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-secondary)",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent-green)" }} />
            <span>All Memberships Billed Monthly &bull; Cancel Anytime</span>
          </div>
        </div>

        {errorMessage && (
          <div style={{ maxWidth: 600, margin: "0 auto 24px", padding: "12px 16px", borderRadius: 8, background: "var(--accent-red-bg)", border: "1px solid var(--accent-red-border)", color: "var(--accent-red)", fontSize: 13, textAlign: "center" }}>
            {errorMessage}
          </div>
        )}

        {isVipActive && (
          <div style={{ maxWidth: 700, margin: "0 auto 32px", padding: 22, borderRadius: 14, background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.35)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--gold)", fontWeight: 800, fontSize: 15 }}>
                <Crown size={18} />
                <span>You Have an Active VIP Pro Subscription</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Current Plan: <strong style={{ color: "#ffffff" }}>{subStatus.plan}</strong> &bull; Valid Until: <strong style={{ color: "var(--gold)" }}>{subStatus.currentPeriodEnd ? new Date(subStatus.currentPeriodEnd).toLocaleDateString() : "Ongoing"}</strong>
                <br />
                <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  Duplicate payments are blocked while active. You will be able to pay again once your current pass expires.
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
          <div style={{ maxWidth: 700, margin: "0 auto 32px", padding: 20, borderRadius: 14, background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
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
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 24,
          alignItems: "stretch",
          maxWidth: 1120,
          margin: "0 auto",
        }}>
          {/* 1. Free Starter Tier */}
          <div className="luxury-card" style={{
            padding: 28,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            boxSizing: "border-box",
            borderRadius: 14,
          }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Free Starter</h3>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "var(--surface-raised)", color: "var(--text-dim)", border: "1px solid var(--border-color)" }}>
                  Free Forever
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 20 }}>
                Explore daily football predictions with standard confidence access.
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

          {/* 2. Premium Pro Tier (MOST POPULAR - $9.99) */}
          <div className="luxury-card" style={{
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
          }}>
            <div style={{ position: "absolute", top: -12, right: 20 }}>
              <span className="gold-badge" style={{ background: "var(--gold)", color: "var(--gold-btn-text)", borderColor: "var(--gold)", fontWeight: 800 }}>
                <Sparkles size={11} /> MOST POPULAR
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--gold)" }}>
                  Premium Pro
                </h3>
                <span className="gold-badge">Popular Deal</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 20 }}>
                Full algorithmic access, unlocked banker tips, and real-time value odds edges.
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)" }}>$9.99</span>
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>/month</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 28, flex: 1 }}>
                {[
                  "Unlimited Banker of the Day Access",
                  "100k Monte Carlo Simulated Probabilities",
                  "Mathematical Value Edge (+EV) Alerts",
                  "Custom Acca Bet Builder Unlocked",
                  "Verified AI Track Record Access",
                  "Instant Whop Activation",
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
                onClick={() => handleCheckout("PREMIUM_MONTHLY")}
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
                {loading && loadingPlan === "PREMIUM_MONTHLY" ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Securing Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>Get Premium Pro ($9.99)</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>

          {/* 3. VIP Pro Tier ($19.99) */}
          <div className="luxury-card" style={{
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
          }}>
            <div style={{ position: "absolute", top: -12, right: 20 }}>
              <span className="gold-badge" style={{ background: "rgba(245, 158, 11, 0.18)", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.5)", fontWeight: 800 }}>
                <Crown size={11} /> VIP ELITE
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#f59e0b" }}>
                  VIP Pro
                </h3>
                <span className="gold-badge" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.3)" }}>
                  All Access
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 20 }}>
                Ultimate betting intelligence suite with exclusive VIP Telegram broadcast alerts and priority bankers.
              </p>

              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)" }}>
                  $19.99
                </span>
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  /month
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 28, flex: 1 }}>
                {[
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
                    Active membership &bull; Auto-synced with Whop
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
                onClick={() => handleCheckout("VIP_MONTHLY")}
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
                {loading && loadingPlan === "VIP_MONTHLY" ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Securing Checkout...</span>
                  </>
                ) : isExpired ? (
                  <>
                    <span>Renew VIP Pro ($19.99)</span>
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <span>Unlock VIP Pro Access</span>
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
