"use client";

import Navbar from "@/components/Navbar";
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  Scale,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  const sections = [
    {
      icon: <Scale size={20} color="var(--gold)" />,
      title: "1. Service Terms & User Agreement",
      desc: "Full terms outlining fair algorithmic prediction access, account quotas, multi-device usage guidelines, and intellectual property protections.",
      status: "Verified",
    },
    {
      icon: <ShieldAlert size={20} color="var(--accent-amber)" />,
      title: "2. 18+ Responsible Platform Policy",
      desc: "JollofTips provides statistical probabilities and sports data analytics for informational and entertainment purposes only. We encourage strict bankroll management and responsible betting.",
      status: "Active",
    },
    {
      icon: <ShieldCheck size={20} color="var(--accent-green)" />,
      title: "3. Prediction Disclaimer & Accuracy",
      desc: "All quantitative models, win probabilities, expected goals (xG), and odds calculations are estimations based on historical data with no guarantee of future match outcomes.",
      status: "Verified",
    },
    {
      icon: <BookOpen size={20} color="var(--gold)" />,
      title: "4. Subscription & Billing Terms",
      desc: "Clear guidelines regarding recurring VIP plans, cancellation anytime from your account dashboard, and secure transaction handling via certified gateways.",
      status: "Active",
    },
  ];

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 20px 80px", position: "relative" }}>
        {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div className="gold-badge" style={{ marginBottom: 14 }}>
            <FileText size={14} />
            <span>TERMS & LEGAL POLICIES</span>
          </div>

          <h1 style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            margin: "0 0 14px",
            color: "var(--text-primary)",
            lineHeight: 1.15,
          }}>
            Terms of Service & Responsible Platform Policy
          </h1>

          <p style={{
            color: "var(--text-secondary)",
            fontSize: 15,
            maxWidth: 620,
            margin: "0 auto",
            lineHeight: 1.6,
          }}>
            Transparency and accountability form the bedrock of our platform. Please review the key guidelines governing our algorithmic intelligence services.
          </p>
        </div>

        {/* Sections Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}>
          {sections.map((s, idx) => (
            <div
              key={idx}
              className="luxury-card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "var(--gold-bg)",
                    border: "1px solid var(--gold-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {s.icon}
                  </div>
                  <span className="status-pill-won">{s.status}</span>
                </div>

                <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 10 }}>
                  {s.title}
                </h2>

                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
