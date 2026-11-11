"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "@/components/Navbar";
import { CheckCircle2, Crown, Sparkles, ArrowRight, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [subStatus, setSubStatus] = useState<any>(null);
  const [walletStatus, setWalletStatus] = useState<any>(null);

  const planIdParam = searchParams.get("planId") || "";
  const isCreditPurchase =
    searchParams.get("type") === "credits" || planIdParam.startsWith("CREDITS_");

  const creditLabel =
    planIdParam === "CREDITS_10"
      ? "+10 Bet Builder Slips"
      : planIdParam === "CREDITS_3"
      ? "+3 Bet Builder Slips"
      : planIdParam === "CREDITS_1"
      ? "+1 Bet Builder Slip"
      : "Bet Builder Credits";

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (isCreditPurchase) {
        const res = await fetch(`/api/bet-builder/status?_t=${Date.now()}`, {
          headers,
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (data.success) {
          setWalletStatus(data);
        }
      } else {
        const res = await fetch("/api/payments/subscription-status", {
          headers,
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setSubStatus(data);
        }
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check if coming from a mock checkout
    const isMock = searchParams.get("mock_success");
    const mockSessionId = searchParams.get("mock_session_id");
    const planId = searchParams.get("planId");
    const mockSubId = searchParams.get("mock_sub_id");
    const mockCustId = searchParams.get("mock_cus_id");
    const userId = searchParams.get("userId");
    const userEmail = searchParams.get("userEmail");

    if (isMock && mockSessionId) {
      // In local dev with MockProvider, simulate the webhook delivery automatically
      fetch("/api/payments/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: `mock_evt_${mockSessionId}`,
          type: "checkout.completed",
          planId: planId || "VIP_MONTHLY",
          providerSubId: mockSubId,
          providerCustId: mockCustId,
          userId: userId || undefined,
          userEmail: userEmail || undefined,
        }),
      }).then(() => {
        setTimeout(fetchStatus, 500);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isCreditPurchase]);

  const isActive = subStatus?.hasActiveSubscription || subStatus?.status === "ACTIVE";

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "64px 20px 80px" }}>
        <div
          className="luxury-card"
          style={{
            padding: "48px 36px",
            textAlign: "center",
            borderColor: "var(--gold)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--gold-bg)",
              border: "2px solid var(--gold-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              color: "var(--gold)",
            }}
          >
            <Crown size={36} />
          </div>

          <div className="gold-badge" style={{ marginBottom: 16 }}>
            <Sparkles size={12} />
            <span>PAYMENT COMPLETED</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(26px, 3.5vw, 36px)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: "0 0 12px",
              color: "var(--text-primary)",
            }}
          >
            {isCreditPurchase ? (
              <>
                <span style={{ color: "var(--gold)" }}>Bet Builder Credits</span> Ready!
              </>
            ) : (
              <>
                Welcome to the <span style={{ color: "var(--gold)" }}>VIP Circle</span>!
              </>
            )}
          </h1>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 15,
              lineHeight: 1.65,
              maxWidth: 480,
              margin: "0 auto 32px",
            }}
          >
            {isCreditPurchase
              ? planIdParam === "CREDITS_10"
                ? "Your payment has been received. Your 10 Bet Builder slip credits are added once payment confirmation arrives and remain valid for 14 days."
                : "Your payment has been received. Your Bet Builder credits are added to your account as soon as payment confirmation arrives and never expire."
              : "Your payment was successfully received. Unrestricted algorithmic match predictions, banker accumulators, and value odds telemetry are now accessible."}
          </p>

          {/* Current Status Box */}
          <div
            style={{
              background: "var(--surface-raised)",
              borderRadius: 12,
              border: "1px solid var(--border-color)",
              padding: 20,
              marginBottom: 32,
              textAlign: "left",
            }}
          >
            {isCreditPurchase ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Pack Purchased:</span>
                  <strong style={{ fontSize: 14, color: "var(--gold)" }}>{creditLabel}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Purchased Credit Balance:</span>
                  {loading ? (
                    <span style={{ fontSize: 12, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 6 }}>
                      <RefreshCw size={12} className="animate-spin" /> Checking wallet...
                    </span>
                  ) : (
                    <strong style={{ fontSize: 15, color: "#34d399" }}>
                      {walletStatus?.creditsBalance ?? 0} Slip{(walletStatus?.creditsBalance ?? 0) === 1 ? "" : "s"}
                    </strong>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Weekly Free Allowance:</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                    {walletStatus?.freeWeeklyRemaining > 0 ? "1 Free Slip Ready" : "Used this week"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Subscription Status:</span>
                  {loading ? (
                    <span style={{ fontSize: 12, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 6 }}>
                      <RefreshCw size={12} className="animate-spin" /> Verifying...
                    </span>
                  ) : isActive ? (
                    <span className="status-pill-won" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={12} /> ACTIVE (VIP UNLOCKED)
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--accent-green)", fontWeight: 700 }}>
                      Activating...
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Tier:</span>
                  <strong style={{ fontSize: 14, color: "var(--gold)" }}>
                    {subStatus?.plan || "VIP Pro Access"}
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Valid Until:</span>
                  <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                    {subStatus?.currentPeriodEnd ? new Date(subStatus.currentPeriodEnd).toLocaleDateString() : "Active Ongoing"}
                  </span>
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link
              href={isCreditPurchase ? "/bet-builder" : "/all-matches"}
              className="gold-btn"
              style={{
                padding: "14px 24px",
                fontSize: 15,
                fontWeight: 800,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span>{isCreditPurchase ? "Return to AI Bet Builder" : "Explore All VIP Predictions"}</span>
              <ArrowRight size={16} />
            </Link>

            <button
              onClick={fetchStatus}
              className="gold-outline-btn"
              style={{
                padding: "10px",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>{isCreditPurchase ? "Refresh Wallet Balance" : "Refresh Subscription Status"}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PricingSuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--background)" }} />}>
      <SuccessContent />
    </Suspense>
  );
}
