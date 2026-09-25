"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  Scale,
  BookOpen,
  Lock,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  DollarSign,
  HelpCircle,
} from "lucide-react";

export default function TermsPage() {
  const lastUpdated = "September 25, 2026";

  const summaryCards = [
    {
      icon: <Scale size={20} color="var(--gold)" />,
      title: "1. Service & Algorithmic Access",
      desc: "JollofTips provides statistical modeling, machine learning football predictions, and historical performance metrics for informational and entertainment purposes only.",
      badge: "Verified Policy",
      badgeColor: "var(--gold)",
    },
    {
      icon: <ShieldAlert size={20} color="#f59e0b" />,
      title: "2. Strictly 18+ Responsible Policy",
      desc: "Sports betting entails financial risk. We are not a bookmaker and do not accept wagers. Strict adherence to bankroll discipline and responsible gaming is mandatory.",
      badge: "Strictly 18+",
      badgeColor: "#f59e0b",
    },
    {
      icon: <ShieldCheck size={20} color="#22c55e" />,
      title: "3. No Outcome Guarantees",
      desc: "All quantitative models, win probabilities, expected goals (xG), and odds calculations are probabilistic estimates. Past analytical performance does not guarantee future results.",
      badge: "Audited Ledger",
      badgeColor: "#22c55e",
    },
    {
      icon: <BookOpen size={20} color="#38bdf8" />,
      title: "4. VIP Billing & Cancel Anytime",
      desc: "Subscriptions renew automatically each billing cycle. You may cancel with a single click at any time directly from your Account Dashboard with no hidden lock-ins.",
      badge: "Transparent Billing",
      badgeColor: "#38bdf8",
    },
  ];

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 20px 80px", width: "100%", flex: 1 }}>
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 24,
          }}
        >
          <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
            Home
          </Link>
          <ChevronRight size={14} color="var(--text-dim)" />
          <span style={{ color: "var(--gold)", fontWeight: 600 }}>Terms & Conditions</span>
        </nav>

        {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div className="gold-badge" style={{ marginBottom: 14 }}>
            <FileText size={14} />
            <span>LEGAL AGREEMENT & PLATFORM COVENANT</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(30px, 4.5vw, 46px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: "0 0 16px",
              color: "var(--text-primary)",
              lineHeight: 1.15,
            }}
          >
            Terms and Conditions of Service
          </h1>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 15,
              maxWidth: 700,
              margin: "0 auto 16px",
              lineHeight: 1.65,
            }}
          >
            Please read these Terms and Conditions carefully before accessing or using the JollofTips platform, algorithmic feeds, and VIP prediction tools.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "var(--text-dim)",
              background: "var(--surface)",
              padding: "6px 14px",
              borderRadius: 20,
              border: "1px solid var(--border-color)",
            }}
          >
            <Clock size={13} color="var(--gold)" />
            <span>Last Revised: {lastUpdated} · Version 4.1</span>
          </div>
        </div>

        {/* Highlight Summary Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 48,
          }}
        >
          {summaryCards.map((s, idx) => (
            <div
              key={idx}
              className="luxury-card"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "var(--gold-bg)",
                      border: "1px solid var(--gold-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {s.icon}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: s.badgeColor,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${s.badgeColor}33`,
                      padding: "3px 8px",
                      borderRadius: 12,
                    }}
                  >
                    {s.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px" }}>
                  {s.title}
                </h3>

                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Legal Sections */}
        <div
          className="luxury-card"
          style={{
            padding: "36px 32px",
            fontSize: 14.5,
            lineHeight: 1.75,
            color: "var(--text-secondary)",
          }}
        >
          {/* Section 1 */}
          <section style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ color: "var(--gold)" }}>1.</span> Agreement to Terms & Eligibility
            </h2>
            <p style={{ marginBottom: 12 }}>
              These Terms and Conditions constitute a legally binding agreement between you (“User,” “you,” or “your”) and <strong>JollofTips</strong> (“Company,” “we,” “us,” or “our”), concerning your access to and use of the website <strong>https://jolloftips.com</strong> and any related mobile or desktop software applications (collectively, the “Platform”).
            </p>
            <p>
              By accessing, browsing, registering for, or purchasing subscriptions on JollofTips, you acknowledge that you have read, understood, and agreed to be bound by these Terms and our accompanying <Link href="/privacy" style={{ color: "var(--gold)", textDecoration: "underline" }}>Privacy Policy</Link>. If you do not agree with any part of these Terms, you are expressly prohibited from using the Platform and must discontinue use immediately.
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ color: "var(--gold)" }}>2.</span> Purely Informational Nature & Non-Bookmaker Disclaimer
            </h2>
            <div
              style={{
                background: "rgba(234, 179, 8, 0.08)",
                border: "1px solid rgba(234, 179, 8, 0.25)",
                padding: "16px 20px",
                borderRadius: 10,
                marginBottom: 14,
              }}
            >
              <strong style={{ color: "#facc15", display: "block", marginBottom: 6 }}>
                Critical Operational Clarification:
              </strong>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-primary)" }}>
                JollofTips is <strong>NOT a bookmaker, gambling operator, casino, or betting broker</strong>. We do not accept bets, stake funds, hold deposits, or handle gambling payouts. We are exclusively a statistical technology and sports data analytics software platform.
              </p>
            </div>
            <p style={{ marginBottom: 12 }}>
              All algorithmic win probabilities, expected goals (xG), banker ratings, value percentage indicators, and rollover recommendations generated on JollofTips are calculated using historical match datasets, quantitative probability distributions, and machine learning models.
            </p>
            <p>
              <strong>No Outcome Guarantees:</strong> In any professional sporting contest, unforeseen events—including red cards, injuries, weather, tactical decisions, and human officiating—can alter results. No algorithmic tip constitutes a financial guarantee. Any decision to place real-money bets with licensed third-party bookmakers is made at your sole discretion, risk, and responsibility.
            </p>
          </section>

          {/* Section 3 */}
          <section id="responsible-gaming" style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ color: "var(--gold)" }}>3.</span> 18+ Responsible Gaming Mandate
            </h2>
            <p style={{ marginBottom: 12 }}>
              Access to JollofTips is strictly limited to individuals who are at least <strong>18 years of age</strong> (or the legal age of gambling maturity in your jurisdiction). By registering, you affirm that you satisfy this age requirement.
            </p>
            <p style={{ marginBottom: 12 }}>
              We are staunch advocates of responsible gaming:
            </p>
            <ul style={{ paddingLeft: 20, marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <li>Never wager money you cannot comfortably afford to lose.</li>
              <li>Treat sports betting as entertainment, not a source of guaranteed income or financial salvation.</li>
              <li>Establish strict daily or weekly bankroll limits and never chase past losses.</li>
              <li>If you or someone you know is struggling with gambling-related issues, please seek assistance from certified support organizations including <strong>GambleAware</strong> (gambleaware.org) or <strong>GamCare</strong> (gamcare.org.uk).</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ color: "var(--gold)" }}>4.</span> Account Registration & Multi-Device Security
            </h2>
            <p style={{ marginBottom: 12 }}>
              To access specific features, including the Bet Builder, Rollover Tracker, and VIP algorithmic insights, you must create a registered account:
            </p>
            <ul style={{ paddingLeft: 20, marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <li><strong>One Individual Per Account:</strong> Subscriptions are granted for individual, non-commercial personal use only. Sharing VIP account credentials, distributing internal picks on unauthorized forums, or pooling subscriptions is strictly prohibited and results in immediate account termination without refund.</li>
              <li><strong>Credential Security:</strong> You are responsible for maintaining the confidentiality of your login email and password. Any actions taken under your credentials will be deemed your responsibility.</li>
              <li><strong>Account Suspension:</strong> We reserve the right to suspend or terminate accounts suspected of fraudulent activity, bot automation, or payment disputes.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ color: "var(--gold)" }}>5.</span> VIP Memberships, Recurring Billing & Cancellation Policy
            </h2>
            <p style={{ marginBottom: 12 }}>
              JollofTips offers premium tiers (VIP, VIP PRO, and Annual plans) providing unlocked banker models, live score predictive shifts, and specialized rollover filters:
            </p>
            <ul style={{ paddingLeft: 20, marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <li><strong>Billing Cycle:</strong> Subscriptions are billed on an automated recurring cycle (monthly or annually) according to the package selected at checkout.</li>
              <li><strong>Payment Gateways:</strong> Transactions are handled by globally accredited gateways (Stripe and Paystack) ensuring end-to-end tokenized security.</li>
              <li><strong>Cancel Anytime:</strong> You may cancel your VIP subscription renewal at any moment directly from your <strong>Account Settings</strong>. Upon cancellation, you retain full VIP benefits until the conclusion of your current billing period.</li>
              <li><strong>Digital Product Delivery & Refunds:</strong> Because statistical predictions and data feeds are digital items delivered instantly upon subscription, payments are generally non-refundable once the billing cycle begins, except where mandated by statutory consumer protection laws.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ color: "var(--gold)" }}>6.</span> Intellectual Property & Anti-Scraping Restrictions
            </h2>
            <p style={{ marginBottom: 12 }}>
              All algorithmic models, calculation formulas, proprietary xG estimates, site layout, typography, visual charts, and source code are the exclusive intellectual property of JollofTips and protected by international copyright, trademark, and intellectual property statutes.
            </p>
            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                padding: "16px 20px",
                borderRadius: 10,
              }}
            >
              <strong style={{ color: "#ef4444", display: "block", marginBottom: 6 }}>
                Prohibited Technical Activities:
              </strong>
              <p style={{ margin: 0, fontSize: 13.5 }}>
                You may NOT: (a) scrape, crawl, spider, or harvest data feeds using automated tools; (b) reverse-engineer or decompile our quantitative models; (c) resell, syndicate, or republish VIP predictions for commercial profit; or (d) launch denial-of-service attacks or inject malicious code into the Platform.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ color: "var(--gold)" }}>7.</span> Official Verified Channels & Anti-Fraud Warnings
            </h2>
            <p style={{ marginBottom: 14 }}>
              To protect our users from predatory impersonators and counterfeit channels, JollofTips maintains <strong>three verified official channels</strong>. We do not operate any other public communication channels:
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              {/* Telegram */}
              <a
                href="https://t.me/Jolloftips247"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderRadius: 10,
                  background: "rgba(34, 158, 217, 0.08)",
                  border: "1px solid rgba(34, 158, 217, 0.25)",
                  color: "#ffffff",
                  textDecoration: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#229ED9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#ffffff">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.96z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Official Telegram</div>
                    <div style={{ fontSize: 12, color: "#229ED9" }}>t.me/Jolloftips247</div>
                  </div>
                </div>
                <ExternalLink size={14} color="#229ED9" />
              </a>

              {/* Twitter / X */}
              <a
                href="https://x.com/jolloftips"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  textDecoration: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#000000", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#ffffff">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Official X / Twitter</div>
                    <div style={{ fontSize: 12, color: "var(--gold)" }}>x.com/jolloftips</div>
                  </div>
                </div>
                <ExternalLink size={14} color="var(--gold)" />
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/jolloftips"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderRadius: 10,
                  background: "rgba(24, 119, 242, 0.08)",
                  border: "1px solid rgba(24, 119, 242, 0.25)",
                  color: "#ffffff",
                  textDecoration: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1877F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#ffffff">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Official Facebook</div>
                    <div style={{ fontSize: 12, color: "#38bdf8" }}>facebook.com/jolloftips</div>
                  </div>
                </div>
                <ExternalLink size={14} color="#38bdf8" />
              </a>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-dim)", margin: 0 }}>
              <strong>Notice:</strong> We will never solicit personal bank transfers, private crypto wallet deposits, or WhatsApp money transfers. If someone claims to be JollofTips management and requests private payments outside of <strong>https://jolloftips.com</strong>, report them immediately.
            </p>
          </section>

          {/* Section 8 */}
          <section style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ color: "var(--gold)" }}>8.</span> Limitation of Liability
            </h2>
            <p style={{ marginBottom: 12 }}>
              To the fullest extent permitted by applicable law, in no event shall JollofTips, its founders, data analysts, directors, or affiliates be liable for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages—including lost profits, lost betting stakes, or data loss—arising from your use of the Platform or reliance on any predictive outputs.
            </p>
            <p>
              Your use of the Platform is entirely at your own risk. The analytics are provided on an “as is” and “as available” basis without warranties of any kind, whether express or implied.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ color: "var(--gold)" }}>9.</span> Governing Law & Legal Inquiries
            </h2>
            <p style={{ marginBottom: 14 }}>
              These Terms shall be governed by and construed in accordance with the laws governing digital services and consumer protection. Any disputes arising under these Terms shall be resolved amicably or through competent legal arbitration.
            </p>
            <div
              style={{
                background: "var(--surface)",
                padding: "20px",
                borderRadius: 12,
                border: "1px solid var(--border-color)",
                display: "flex",
                flexWrap: "wrap",
                gap: 20,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: 15, marginBottom: 4 }}>
                  Legal & Compliance Department
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Email: <span style={{ color: "var(--gold)" }}>legal@jolloftips.com</span> / <span style={{ color: "var(--gold)" }}>support@jolloftips.com</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Telegram Support Desk: <a href="https://t.me/Jolloftips247" target="_blank" rel="noopener noreferrer" style={{ color: "#229ED9", textDecoration: "underline" }}>@Jolloftips247</a>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Link
                  href="/privacy"
                  className="btn-ghost"
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Lock size={14} />
                  <span>View Privacy Policy</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
