"use client";

import Navbar from "@/components/Navbar";
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  Scale,
  Clock,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  const sections = [
    {
      icon: <Scale style={{ width: 22, height: 22, color: "#818cf8" }} />,
      title: "1. Service Terms & User Agreement",
      desc: "Full terms outlining fair algorithmic prediction access, account quotas, multi-device usage guidelines, and intellectual property protections.",
      status: "In Legal Review",
    },
    {
      icon: <ShieldAlert style={{ width: 22, height: 22, color: "#f59e0b" }} />,
      title: "2. 18+ Responsible Platform Policy",
      desc: "JollofTips provides statistical probabilities and sports data analytics for informational and entertainment purposes only. We encourage strict bankroll management and responsible betting.",
      status: "Draft Finalized",
    },
    {
      icon: <ShieldCheck style={{ width: 22, height: 22, color: "#10b981" }} />,
      title: "3. Prediction Disclaimer & Accuracy",
      desc: "All quantitative models, win probabilities, expected goals (xG), and odds calculations are estimations based on historical data with no guarantee of future match outcomes.",
      status: "Verified",
    },
    {
      icon: <BookOpen style={{ width: 22, height: 22, color: "#ec4899" }} />,
      title: "4. Subscription & Billing Terms",
      desc: "Clear guidelines regarding recurring VIP plans, cancellation anytime from your account dashboard, and secure transaction handling via certified gateways.",
      status: "In Legal Review",
    },
  ];

  return (
    <div style={{ background: "transparent", minHeight: "100vh", color: "#f8fafc" }}>
      <Navbar />

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "110px 16px 80px", position: "relative" }}>
        {/* Ambient Glow */}
        <div style={{
          position: "absolute",
          top: "6%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "700px",
          height: "380px",
          background: "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.16) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)",
          filter: "blur(90px)",
          pointerEvents: "none",
          zIndex: 0,
        }} />

        {/* Hero Section */}
        <div style={{ textAlign: "center", position: "relative", zIndex: 1, marginBottom: 50 }}>
          {/* Status Badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            borderRadius: 999,
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.35)",
            color: "#a5b4fc",
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 20,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.2)",
          }}>
            <FileText style={{ width: 15, height: 15, color: "#818cf8" }} />
            <span>TERMS & CONDITIONS • COMING SOON</span>
            <span style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#38bdf8",
              boxShadow: "0 0 8px #38bdf8",
            }} />
          </div>

          <h1 style={{
            fontSize: "clamp(30px, 5vw, 50px)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            margin: "0 0 16px",
            color: "#ffffff",
            lineHeight: 1.15,
          }}>
            Terms of Service & <br />
            <span style={{
              background: "linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #38bdf8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Responsible Platform Guidelines
            </span>
          </h1>

          <p style={{
            color: "#94a3b8",
            fontSize: "clamp(14px, 1.8vw, 17px)",
            maxWidth: 680,
            margin: "0 auto 32px",
            lineHeight: 1.6,
          }}>
            Our legal documentation is being revised for upcoming multi-jurisdiction compliance. Below is an overview of key platform policies currently in effect across JollofTips.
          </p>

          {/* Development Status Meter */}
          <div style={{
            maxWidth: 440,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "12px 18px",
            borderRadius: 10,
            background: "rgba(12, 15, 36, 0.65)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
              <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: 5 }}>
                <Clock style={{ width: 13, height: 13, color: "#818cf8" }} /> Publication Status
              </span>
              <span style={{ color: "#818cf8" }}>90% Complete • Final Legal Review</span>
            </div>
            <div style={{ width: "100%", height: 6, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              <div style={{ width: "90%", height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #6366f1 0%, #38bdf8 100%)" }} />
            </div>
          </div>
        </div>

        {/* Section Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          marginBottom: 44,
        }}>
          {sections.map((sec, idx) => (
            <div
              key={idx}
              style={{
                background: "linear-gradient(180deg, rgba(18, 22, 54, 0.8) 0%, rgba(12, 16, 40, 0.9) 100%)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 14,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {sec.icon}
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#818cf8",
                    background: "rgba(99, 102, 241, 0.12)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    padding: "3px 8px",
                    borderRadius: 6,
                    textTransform: "uppercase",
                  }}>
                    {sec.status}
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: "0 0 8px" }}>
                  {sec.title}
                </h3>
                <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  {sec.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div style={{
          textAlign: "center",
          background: "linear-gradient(135deg, rgba(17, 22, 54, 0.9) 0%, rgba(10, 13, 34, 0.95) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          borderRadius: 16,
          padding: "28px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div style={{ textAlign: "left" }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#ffffff", margin: "0 0 4px" }}>
              Ready to create your account?
            </h3>
            <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
              Join JollofTips to access live AI match analysis and daily football tips.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/login?mode=register"
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 4px 14px rgba(112, 101, 240, 0.4)",
              }}
            >
              <span>Back to Register</span>
              <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
