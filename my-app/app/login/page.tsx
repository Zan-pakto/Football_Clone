"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  Target,
  TrendingUp,
  Globe,
  RefreshCw,
  LogOut,
  Crown,
  ArrowRight,
  Shield,
  X,
  Scale,
} from "lucide-react";

function AuthContent() {
  const searchParams = useSearchParams();

  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const redirectUrl = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync mode with URL
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "register") setMode("register");
    else if (urlMode === "login") setMode("login");
  }, [searchParams]);

  // Check current session
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (data.success && data.isLoggedIn && data.user) {
          setCurrentUser(data.user);
        }
      } catch {
        // Not logged in
      }
    }
    checkUser();
  }, []);

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    const newUrl = `/login?mode=${newMode}`;
    window.history.replaceState(null, "", newUrl);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === "register") {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!acceptTerms) {
        setError("You must accept the Terms of Service to create an account.");
        return;
      }
    } else {
      if (!loginIdentifier.trim()) {
        setError("Please enter your email or username.");
        return;
      }
      if (!password) {
        setError("Please enter your password.");
        return;
      }
    }

    setLoading(true);

    try {
      const authEmail = mode === "register" ? email.trim().toLowerCase() : loginIdentifier.trim().toLowerCase();

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          name: mode === "register" ? name.trim() : undefined,
          email: authEmail,
          username: mode === "register" ? username.trim().toLowerCase() : undefined,
          loginIdentifier: loginIdentifier.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Authentication failed. Please check your credentials.");
        return;
      }

      setSuccess(mode === "register" ? "Account created successfully! Redirecting..." : "Welcome back! Redirecting...");
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      setCurrentUser(null);
      setSuccess("Logged out successfully.");
    } catch {
      setError("Failed to logout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--background)" }}>
      <Navbar />

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px 80px", zIndex: 1 }}>
        <div
          style={{
            maxWidth: 1040,
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "32px",
            alignItems: "stretch",
          }}
        >
          {/* ── Left Column: Value Banner Card ── */}
          <div
            className="luxury-card"
            style={{
              padding: "40px 32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div>
              <div className="gold-badge" style={{ marginBottom: 20 }}>
                <Sparkles size={12} />
                <span>AI-Powered Predictions</span>
              </div>

              <h1
                style={{
                  color: "var(--text-primary)",
                  fontSize: "clamp(26px, 3.2vw, 36px)",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  margin: "0 0 16px",
                }}
              >
                AI Predictions That <br />
                Give You The <span style={{ color: "var(--gold)" }}>Edge</span>.
              </h1>

              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  margin: "0 0 28px",
                }}
              >
                Our proprietary AI evaluates every match across 160+ leagues daily — delivering predictions, banker picks, and value edges trusted by smart bettors.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "var(--gold-bg)",
                      border: "1px solid var(--gold-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gold)",
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles size={16} />
                  </div>
                  <span style={{ color: "var(--text-primary)", fontSize: 13.5, fontWeight: 700 }}>
                    100,000 Monte Carlo Simulations Per Game
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "var(--gold-bg)",
                      border: "1px solid var(--gold-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gold)",
                      flexShrink: 0,
                    }}
                  >
                    <Target size={16} />
                  </div>
                  <span style={{ color: "var(--text-primary)", fontSize: 13.5, fontWeight: 700 }}>
                    Confidence Ratings from 70% to 95%
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "var(--gold-bg)",
                      border: "1px solid var(--gold-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gold)",
                      flexShrink: 0,
                    }}
                  >
                    <Globe size={16} />
                  </div>
                  <span style={{ color: "var(--text-primary)", fontSize: 13.5, fontWeight: 700 }}>
                    Real-Time In-Play Tracking
                  </span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 20, marginTop: 28, display: "flex", alignItems: "center", gap: 10 }}>
              <span className="status-pill-won">100% Audited</span>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Permanent blockchain-grade record</span>
            </div>
          </div>

          {/* ── Right Column: Authentication Card Form ── */}
          <div
            className="luxury-card"
            style={{
              padding: "40px 32px",
            }}
          >
            {/* If user is already logged in */}
            {currentUser ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "var(--gold-bg)",
                    border: "2px solid var(--gold-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    color: "var(--gold)",
                    fontSize: 24,
                    fontWeight: 900,
                  }}
                >
                  {currentUser.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", marginBottom: 6 }}>
                  You are currently logged in
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
                  Signed in as <strong>{currentUser.email || currentUser.name}</strong>
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Link
                    href="/account"
                    className="gold-btn"
                    style={{ padding: "12px", textDecoration: "none" }}
                  >
                    Go to Account Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="gold-outline-btn"
                    style={{ padding: "12px" }}
                  >
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Mode Selector Tabs */}
                <div
                  style={{
                    display: "flex",
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 10,
                    padding: 4,
                    marginBottom: 24,
                  }}
                >
                  <button
                    onClick={() => switchMode("login")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 8,
                      border: "none",
                      background: mode === "login" ? "var(--gold)" : "transparent",
                      color: mode === "login" ? "var(--gold-btn-text)" : "var(--text-secondary)",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => switchMode("register")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 8,
                      border: "none",
                      background: mode === "register" ? "var(--gold)" : "transparent",
                      color: mode === "register" ? "var(--gold-btn-text)" : "var(--text-secondary)",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    Create Account
                  </button>
                </div>

                {/* Feedback Alerts */}
                {error && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 16px",
                      borderRadius: 8,
                      background: "var(--accent-red-bg)",
                      border: "1px solid var(--accent-red-border)",
                      color: "var(--accent-red)",
                      fontSize: 13,
                      marginBottom: 20,
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 16px",
                      borderRadius: 8,
                      background: "var(--accent-green-bg)",
                      border: "1px solid var(--accent-green-border)",
                      color: "var(--accent-green)",
                      fontSize: 13,
                      marginBottom: 20,
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{success}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {mode === "register" && (
                    <>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                          Full Name
                        </label>
                        <div style={{ position: "relative" }}>
                          <User size={16} color="var(--text-dim)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                          <input
                            type="text"
                            required
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 14px 10px 40px",
                              borderRadius: 8,
                              background: "var(--surface-raised)",
                              border: "1px solid var(--border-color)",
                              color: "var(--text-primary)",
                              fontSize: 13,
                              outline: "none",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                          Email Address
                        </label>
                        <div style={{ position: "relative" }}>
                          <Mail size={16} color="var(--text-dim)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                          <input
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 14px 10px 40px",
                              borderRadius: 8,
                              background: "var(--surface-raised)",
                              border: "1px solid var(--border-color)",
                              color: "var(--text-primary)",
                              fontSize: 13,
                              outline: "none",
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {mode === "login" && (
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                        Email or Username
                      </label>
                      <div style={{ position: "relative" }}>
                        <Mail size={16} color="var(--text-dim)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="text"
                          required
                          placeholder="you@example.com"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 14px 10px 40px",
                            borderRadius: 8,
                            background: "var(--surface-raised)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-primary)",
                            fontSize: 13,
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Password Field */}
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                      Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock size={16} color="var(--text-dim)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 40px 10px 40px",
                          borderRadius: 8,
                          background: "var(--surface-raised)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer" }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password on Register */}
                  {mode === "register" && (
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                        Confirm Password
                      </label>
                      <div style={{ position: "relative" }}>
                        <Lock size={16} color="var(--text-dim)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 40px 10px 40px",
                            borderRadius: 8,
                            background: "var(--surface-raised)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-primary)",
                            fontSize: 13,
                            outline: "none",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer" }}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Terms Checkbox */}
                  {mode === "register" && (
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        style={{ marginTop: 2, accentColor: "var(--gold)" }}
                      />
                      <span>
                        I agree to the <Link href="/terms" style={{ color: "var(--gold)", textDecoration: "underline" }}>Terms of Service</Link> and Privacy Policy.
                      </span>
                    </label>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="gold-btn"
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: 14,
                      marginTop: 8,
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <span>{mode === "login" ? "Sign In to JT" : "Create Account"}</span>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--background)" }} />}>
      <AuthContent />
    </Suspense>
  );
}
