"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  UserCheck,
  FileText,
  AlertTriangle,
  Mail,
  Send,
  ExternalLink,
  ChevronRight,
  Globe,
  Clock,
  Sparkles,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 25, 2026";

  const corePrinciples = [
    {
      icon: <Lock size={20} color="var(--gold)" />,
      title: "End-to-End Encryption",
      desc: "All authentication, API requests, and data transmissions are secured with modern TLS/SSL cryptographic protocols.",
    },
    {
      icon: <Database size={20} color="#22c55e" />,
      title: "Zero Data Selling",
      desc: "We never sell, rent, monetize, or trade your personal data, email addresses, or usage patterns to third-party advertisers.",
    },
    {
      icon: <UserCheck size={20} color="#38bdf8" />,
      title: "User Data Sovereignty",
      desc: "You retain full control over your data. Request data export, profile rectification, or total account deletion at any time.",
    },
    {
      icon: <ShieldCheck size={20} color="#eab308" />,
      title: "PCI-DSS Compliant Billing",
      desc: "Payment processing is handled exclusively through tier-1 gateways (Stripe & Paystack). We never store raw card numbers.",
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
          <span style={{ color: "var(--gold)", fontWeight: 600 }}>Privacy Policy</span>
        </nav>

        {/* Hero Header */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div className="gold-badge" style={{ marginBottom: 14 }}>
            <ShieldCheck size={14} />
            <span>DATA PROTECTION & PRIVACY POLICY</span>
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
            Privacy Policy & Data Transparency
          </h1>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 15,
              maxWidth: 680,
              margin: "0 auto 16px",
              lineHeight: 1.65,
            }}
          >
            At JollofTips, we believe that world-class sports analytics and algorithmic intelligence must be anchored in absolute user privacy, transparent data practices, and strict legal compliance.
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
            <span>Effective Date: {lastUpdated} · Version 3.4</span>
          </div>
        </div>

        {/* Core Principles Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 48,
          }}
        >
          {corePrinciples.map((cp, idx) => (
            <div
              key={idx}
              className="luxury-card"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
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
                {cp.icon}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                {cp.title}
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, margin: 0 }}>
                {cp.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Policy Body */}
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
              <span style={{ color: "var(--gold)" }}>1.</span> Scope & Data Controller Overview
            </h2>
            <p style={{ marginBottom: 12 }}>
              This Privacy Policy applies to all services, algorithmic predictions, web applications, and VIP membership utilities operated by <strong>JollofTips</strong> (“we,” “our,” or “the Platform”). When you access <strong>https://jolloftips.com</strong> or any associated subdomains, JollofTips acts as the data controller responsible for personal information collected in compliance with the Nigeria Data Protection Act (NDPA / NDPR), the General Data Protection Regulation (GDPR), and applicable international standards.
            </p>
            <p>
              By accessing our predictive models, registering an account, or subscribing to VIP tips, you acknowledge the collection and processing of your details as detailed herein.
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
              <span style={{ color: "var(--gold)" }}>2.</span> Information We Collect
            </h2>
            <p style={{ marginBottom: 12 }}>
              We collect information strictly necessary to provide high-accuracy predictive intelligence and ensure account integrity:
            </p>
            <ul style={{ paddingLeft: 20, marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>
                <strong>Account Credentials:</strong> Email address, username, password hashes (computed via one-way bcrypt hashing; plaintext passwords are never visible or stored).
              </li>
              <li>
                <strong>Subscription & Transaction Metadata:</strong> Payment verification status, subscription tier (Free, PRO, VIP), renewal timestamps, invoice identifiers, and payment gateway references. <em>Notice: All financial card numbers, expiration dates, and security codes are transmitted directly to PCI-DSS Level 1 certified gateways (Stripe & Paystack). JollofTips servers never touch or store raw card information.</em>
              </li>
              <li>
                <strong>Telemetry & Technical Data:</strong> IP address, device fingerprints, browser version, operating system, session timestamps, and referral sources, gathered automatically to defend against distributed denial-of-service (DDoS) threats and automated scraping bots.
              </li>
              <li>
                <strong>Preferences & Interaction Data:</strong> Favorite leagues, odds format choices (Decimal, Fractional, American), bet slip builder selections, and notification settings.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
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
              <span style={{ color: "var(--gold)" }}>3.</span> How We Use Your Information
            </h2>
            <p style={{ marginBottom: 12 }}>
              Your data is processed strictly for legitimate operational purposes:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 14 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 14, borderRadius: 8, border: "1px solid var(--border-color)" }}>
                <strong style={{ color: "var(--text-primary)" }}>Algorithmic Access</strong>
                <p style={{ margin: "4px 0 0", fontSize: 13 }}>Delivering real-time probability outputs, xG metrics, Banker picks, and rollover tracking.</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 14, borderRadius: 8, border: "1px solid var(--border-color)" }}>
                <strong style={{ color: "var(--text-primary)" }}>Account Security</strong>
                <p style={{ margin: "4px 0 0", fontSize: 13 }}>Detecting unauthorized account sharing, credential stuffing, and bot scraping violations.</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 14, borderRadius: 8, border: "1px solid var(--border-color)" }}>
                <strong style={{ color: "var(--text-primary)" }}>Transaction Management</strong>
                <p style={{ margin: "4px 0 0", fontSize: 13 }}>Provisioning instant VIP feature upgrades, issuing automated payment receipts, and processing renewals.</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", padding: 14, borderRadius: 8, border: "1px solid var(--border-color)" }}>
                <strong style={{ color: "var(--text-primary)" }}>Service Communications</strong>
                <p style={{ margin: "4px 0 0", fontSize: 13 }}>Sending critical security alerts, feature updates, and daily high-confidence match digests.</p>
              </div>
            </div>
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
              <span style={{ color: "var(--gold)" }}>4.</span> Cookies & Local Storage Technologies
            </h2>
            <p style={{ marginBottom: 12 }}>
              We use secure cookies, session storage, and local storage tokens to deliver a seamless user experience:
            </p>
            <ul style={{ paddingLeft: 20, marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <li><strong>Essential Cookies:</strong> Required for secure authentication, CSRF protection, and keeping you signed in.</li>
              <li><strong>Functional Storage:</strong> Remembers your match filtering preferences, timezone settings, and bet slip configurations.</li>
              <li><strong>Performance Analytics:</strong> Helps us identify slow server response times, monitor model latency, and optimize page load speed across mobile devices.</li>
            </ul>
            <p>You can manage or disable cookie preferences directly in your browser settings, though doing so may disable automatic authentication and saved bet slips.</p>
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
              <span style={{ color: "var(--gold)" }}>5.</span> Third-Party Processors & Zero Data Sale Guarantee
            </h2>
            <p style={{ marginBottom: 12 }}>
              <strong>We do not sell, rent, or trade your personal data under any circumstances.</strong>
            </p>
            <p style={{ marginBottom: 12 }}>
              We share minimum required data exclusively with certified service vendors under strict confidentiality and data protection contracts:
            </p>
            <ul style={{ paddingLeft: 20, marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <li><strong>Payment Processors:</strong> Stripe Inc. and Paystack Payments Ltd., for PCI-compliant billing and subscriptions.</li>
              <li><strong>Cloud & Hosting Infrastructure:</strong> High-security cloud compute and database clusters with TLS 1.3 encryption and automated redundancy.</li>
              <li><strong>Transactional Email Dispatchers:</strong> Encrypted SMTP gateways to send password resets and VIP confirmation receipts.</li>
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
              <span style={{ color: "var(--gold)" }}>6.</span> Your Data Protection Rights
            </h2>
            <p style={{ marginBottom: 12 }}>
              Regardless of your geographical location, JollofTips extends comprehensive privacy rights to all registered members:
            </p>
            <ul style={{ paddingLeft: 20, marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              <li><strong>Right of Access:</strong> Request a copy of all personal records and activity logs associated with your account.</li>
              <li><strong>Right to Rectification:</strong> Edit or correct your email, username, or display settings directly from your Account Dashboard.</li>
              <li><strong>Right to Erasure (“Right to Be Forgotten”):</strong> Request complete and permanent deletion of your profile and data history.</li>
              <li><strong>Right to Restrict Processing:</strong> Opt out of marketing notifications and analytical cookies at any moment.</li>
            </ul>
            <p>To exercise any of these rights, contact our Data Protection desk at <strong>support@jolloftips.com</strong> or message our verified Telegram support.</p>
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
              <span style={{ color: "var(--gold)" }}>7.</span> Strict 18+ Age Verification & Minors Policy
            </h2>
            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "16px 20px",
                borderRadius: 10,
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}
            >
              <AlertTriangle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: "#ef4444", fontSize: 15 }}>Strict 18+ Platform Policy</strong>
                <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--text-secondary)" }}>
                  JollofTips is strictly intended for individuals aged 18 and older (or the legal age of majority in your jurisdiction). We do not knowingly solicit or collect personal information from minors. If we discover an account belonging to a minor, the account and associated data are immediately expunged from our records.
                </p>
              </div>
            </div>
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
              <span style={{ color: "var(--gold)" }}>8.</span> Official Social Media Channels & External Platforms
            </h2>
            <p style={{ marginBottom: 14 }}>
              When engaging with our community on third-party networks, please ensure you only interact through our <strong>three verified official channels</strong>. Interactions on external platforms are subject to their respective privacy terms:
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
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#229ED9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#ffffff">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.96z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Telegram Channel</div>
                    <div style={{ fontSize: 12, color: "#229ED9" }}>@Jolloftips247</div>
                  </div>
                </div>
                <ExternalLink size={14} color="#229ED9" />
              </a>

              {/* X / Twitter */}
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
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#000000", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#ffffff">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>X (formerly Twitter)</div>
                    <div style={{ fontSize: 12, color: "var(--gold)" }}>@jolloftips</div>
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
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1877F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#ffffff">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Facebook Page</div>
                    <div style={{ fontSize: 12, color: "#38bdf8" }}>facebook.com/jolloftips</div>
                  </div>
                </div>
                <ExternalLink size={14} color="#38bdf8" />
              </a>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-dim)", margin: 0 }}>
              Please be vigilant against impostors and imitation channels. JollofTips administrators will never ask for your account password or send private direct messages requesting funds.
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
              <span style={{ color: "var(--gold)" }}>9.</span> Contacting Our Data Protection Officer (DPO)
            </h2>
            <p style={{ marginBottom: 14 }}>
              If you have inquiries regarding this policy, need assistance with your data rights, or suspect unauthorized access to your account, reach out directly:
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
                  JollofTips Data Governance & Privacy Office
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Email: <span style={{ color: "var(--gold)" }}>support@jolloftips.com</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Telegram Support: <a href="https://t.me/Jolloftips247" target="_blank" rel="noopener noreferrer" style={{ color: "#229ED9", textDecoration: "underline" }}>@Jolloftips247</a>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <Link
                  href="/terms"
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
                  <FileText size={14} />
                  <span>View Terms & Conditions</span>
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
