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
  FileText,
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

  // Countdown timer for registration incentive
  const [timeLeft, setTimeLeft] = useState(54);

  // Feedback states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync mode with URL
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "register") setMode("register");
    else if (urlMode === "login") setMode("login");
  }, [searchParams]);

  // Countdown effect
  useEffect(() => {
    if (mode === "register") {
      const interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 1 ? prev - 1 : 59));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [mode]);

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
        setError("Please enter your name");
        return;
      }
      if (!email.trim()) {
        setError("Please enter your email address");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (!acceptTerms) {
        setError("Please accept the Terms and Conditions to create your account");
        return;
      }
    } else {
      if (!loginIdentifier.trim()) {
        setError("Please enter your username or email address");
        return;
      }
      if (!password) {
        setError("Please enter your password");
        return;
      }
    }

    setLoading(true);

    try {
      const payload =
        mode === "register"
          ? {
              action: "register",
              name: name.trim(),
              email: email.trim().toLowerCase(),
              username: username.trim() || undefined,
              password,
            }
          : {
              action: "login",
              email: loginIdentifier.trim().toLowerCase(),
              password,
            };

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(
          mode === "register"
            ? "Account created successfully! Welcome to JollofTips."
            : "Logged in successfully! Redirecting..."
        );
        const targetUrl =
          mode === "register"
            ? `/welcome?name=${encodeURIComponent(data.user?.name || name || "Member")}`
            : redirectUrl;

        setTimeout(() => {
          window.location.href = targetUrl;
        }, 600);
      } else {
        setError(data.error || "Authentication failed. Please check your credentials.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
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
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      setError("Failed to logout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", background: "#080a18", color: "#f8fafc" }}>
      {/* Background Ambient Violet Lighting */}
      <div
        style={{
          position: "fixed",
          top: "0",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "600px",
          background: "radial-gradient(ellipse at 50% 30%, rgba(99, 102, 241, 0.16) 0%, rgba(139, 92, 246, 0.08) 45%, transparent 75%)",
          filter: "blur(100px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Navbar />

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 16px 60px", zIndex: 1 }}>
        <div
          style={{
            maxWidth: 1040,
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "36px",
            alignItems: "stretch",
          }}
        >
          {/* ── Left Column: NerdyTips AI Predictions Banner Card ── */}
          <div
            style={{
              background: "linear-gradient(150deg, #1d194c 0%, #15143a 45%, #0e0d26 100%)",
              border: "1px solid rgba(139, 92, 246, 0.22)",
              borderRadius: "24px",
              padding: "36px 32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(112, 101, 240, 0.1)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top ambient soft radial inside card */}
            <div
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)",
                filter: "blur(40px)",
                pointerEvents: "none",
              }}
            />

            <div>
              {/* Badge: + AI-Powered Predictions */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: 999,
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#cbd5e1",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 20,
                  backdropFilter: "blur(8px)",
                }}
              >
                <Sparkles style={{ width: 13, height: 13, color: "#a5b4fc" }} />
                <span>AI-Powered Predictions</span>
              </div>

              {/* Main Headline */}
              <h1
                style={{
                  color: "#ffffff",
                  fontSize: "clamp(26px, 3.2vw, 36px)",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.18,
                  margin: "0 0 16px",
                }}
              >
                AI Predictions That <br />
                Give You The Edge.
              </h1>

              {/* Subtitle Description */}
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "13.5px",
                  lineHeight: 1.6,
                  margin: "0 0 28px",
                }}
              >
                Our AI analyzes every match across 700+ leagues daily — delivering predictions, banker picks, and insights trusted by thousands of smart bettors.
              </p>

              {/* Feature Bullet Points List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#c084fc",
                      flexShrink: 0,
                    }}
                  >
                    <Sparkles style={{ width: 16, height: 16 }} />
                  </div>
                  <span style={{ color: "#ffffff", fontSize: 13.5, fontWeight: 700 }}>
                    Smart Predictions, Powered by AI
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#c084fc",
                      flexShrink: 0,
                    }}
                  >
                    <Target style={{ width: 16, height: 16 }} />
                  </div>
                  <span style={{ color: "#ffffff", fontSize: 13.5, fontWeight: 700 }}>
                    Bankers: Our Highest-Confidence Picks
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#c084fc",
                      flexShrink: 0,
                    }}
                  >
                    <TrendingUp style={{ width: 16, height: 16 }} />
                  </div>
                  <span style={{ color: "#ffffff", fontSize: 13.5, fontWeight: 700 }}>
                    See the Game Differently
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Showcase Card: WON Real Madrid vs Inter */}
            <div
              style={{
                marginTop: 32,
                background: "rgba(11, 13, 32, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.09)",
                borderRadius: 14,
                padding: "16px 18px",
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
              }}
            >
              {/* Header row: WON & ✓ AI */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span
                  style={{
                    color: "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  WON
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    color: "#34d399",
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  ✓ AI
                </span>
              </div>

              {/* Match Teams & Score */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                {/* Home Team: Real Madrid */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #fef08a 0%, #eab308 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 10px rgba(234, 179, 8, 0.3)",
                    }}
                  >
                    <Crown style={{ width: 18, height: 18, color: "#854d0e" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", textAlign: "center" }}>
                    Real Madrid
                  </span>
                </div>

                {/* Score */}
                <div style={{ fontSize: 14, fontWeight: 800, color: "#94a3b8", padding: "0 10px" }}>
                  2 – 1
                </div>

                {/* Away Team: Inter */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 10px rgba(56, 189, 248, 0.3)",
                    }}
                  >
                    <Shield style={{ width: 16, height: 16, color: "#ffffff" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ffffff", textAlign: "center" }}>
                    Inter
                  </span>
                </div>
              </div>

              {/* Bottom League & Prediction Market Pick */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                  UEFA Champions League
                </span>
                <span
                  style={{
                    background: "rgba(99, 102, 241, 0.25)",
                    border: "1px solid rgba(99, 102, 241, 0.4)",
                    color: "#c7d2fe",
                    fontSize: 11,
                    fontWeight: 900,
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  1
                </span>
              </div>
            </div>
          </div>

          {/* ── Right Column: Interactive Login / Register Form Panel ── */}
          <div
            style={{
              padding: "8px 4px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {/* If user is already logged in, show User Card */}
            {currentUser ? (
              <div
                style={{
                  background: "rgba(15, 19, 44, 0.8)",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  borderRadius: 18,
                  padding: "32px 24px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                    boxShadow: "0 0 24px rgba(112, 101, 240, 0.45)",
                  }}
                >
                  <User style={{ width: 32, height: 32, color: "#fff" }} />
                </div>

                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 12px",
                      borderRadius: 999,
                      background: currentUser.role === "ADMIN" ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                      border: currentUser.role === "ADMIN" ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                      color: currentUser.role === "ADMIN" ? "#fbbf24" : "#34d399",
                      fontSize: 11,
                      fontWeight: 800,
                      marginBottom: 8,
                    }}
                  >
                    {currentUser.role === "ADMIN" ? <Crown style={{ width: 12, height: 12 }} /> : <CheckCircle2 style={{ width: 12, height: 12 }} />}
                    <span>{currentUser.role === "ADMIN" ? "ADMINISTRATOR" : "VERIFIED MEMBER"}</span>
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>
                    {currentUser.name || "Football Analyst"}
                  </h2>
                  <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                    {currentUser.email}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <Link
                    href="/account"
                    style={{
                      flex: 1,
                      padding: "11px",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: 10,
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                      textAlign: "center",
                      textDecoration: "none",
                    }}
                  >
                    Account Info
                  </Link>
                  <Link
                    href="/all-matches"
                    style={{
                      flex: 1,
                      padding: "11px",
                      background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                      borderRadius: 10,
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                      textAlign: "center",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <span>All Matches</span>
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loading}
                  style={{
                    padding: "10px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    borderRadius: 10,
                    color: "#f87171",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <LogOut style={{ width: 14, height: 14 }} />
                  <span>{loading ? "Signing Out..." : "Sign Out"}</span>
                </button>
              </div>
            ) : (
              <div>
                {/* ── Top Segmented Switcher: Login | Register ── */}
                <div
                  style={{
                    display: "flex",
                    background: "#11142b",
                    padding: "4px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    marginBottom: "16px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: mode === "login" ? "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)" : "transparent",
                      color: mode === "login" ? "#ffffff" : "#94a3b8",
                      fontWeight: mode === "login" ? 800 : 600,
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: mode === "login" ? "0 4px 18px rgba(112, 101, 240, 0.45)" : "none",
                      transition: "all 0.18s ease",
                    }}
                  >
                    Login
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: mode === "register" ? "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)" : "transparent",
                      color: mode === "register" ? "#ffffff" : "#94a3b8",
                      fontWeight: mode === "register" ? 800 : 600,
                      fontSize: 14,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: mode === "register" ? "0 4px 18px rgba(112, 101, 240, 0.45)" : "none",
                      transition: "all 0.18s ease",
                    }}
                  >
                    Register
                  </button>
                </div>

                {/* ── Heading ── */}
                <div style={{ marginBottom: mode === "register" ? "14px" : "20px" }}>
                  <h2 style={{ fontSize: 28, fontWeight: 900, color: "#ffffff", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                    {mode === "register" ? "Sign Up" : "Welcome back"}
                  </h2>
                  {mode === "login" && (
                    <p style={{ fontSize: 13.5, color: "#94a3b8", margin: 0 }}>
                      Unlock all football predictions powered by AI.
                    </p>
                  )}
                </div>

                {/* ── Register Countdown Banner (NerdyTips Style) ── */}
                {mode === "register" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "rgba(22, 24, 54, 0.9)",
                      border: "1px solid rgba(99, 102, 241, 0.28)",
                      borderRadius: 10,
                      padding: "10px 14px",
                      marginBottom: 20,
                      fontSize: 13,
                      color: "#cbd5e1",
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 8px rgba(56, 189, 248, 0.5)",
                        flexShrink: 0,
                      }}
                    >
                      <Globe style={{ width: 12, height: 12, color: "#ffffff" }} />
                    </div>
                    <span>
                      Our first prediction: <strong style={{ color: "#ffffff", fontWeight: 800 }}>{timeLeft}s</strong> to register!
                    </span>
                  </div>
                )}

                {/* Error & Success Messages */}
                {error && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.35)",
                      color: "#f87171",
                      padding: "12px 14px",
                      borderRadius: 10,
                      fontSize: 13,
                      marginBottom: 18,
                    }}
                  >
                    <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                    <div>{error}</div>
                  </div>
                )}

                {success && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.35)",
                      color: "#34d399",
                      padding: "12px 14px",
                      borderRadius: 10,
                      fontSize: 13,
                      marginBottom: 18,
                    }}
                  >
                    <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
                    <div>{success}</div>
                  </div>
                )}

                {/* ── Form ── */}
                <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  {mode === "register" ? (
                    <>
                      {/* Name */}
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                          Name
                        </label>
                        <div style={{ position: "relative" }}>
                          <User style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#64748b" }} />
                          <input
                            type="text"
                            required
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                              width: "100%",
                              background: "#0f132a",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: 10,
                              padding: "12px 16px 12px 42px",
                              color: "#ffffff",
                              fontSize: 14,
                              outline: "none",
                              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#7065f0";
                              e.target.style.boxShadow = "0 0 16px rgba(112, 101, 240, 0.25)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                          Email Address
                        </label>
                        <div style={{ position: "relative" }}>
                          <Mail style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#64748b" }} />
                          <input
                            type="email"
                            required
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                              width: "100%",
                              background: "#0f132a",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: 10,
                              padding: "12px 16px 12px 42px",
                              color: "#ffffff",
                              fontSize: 14,
                              outline: "none",
                              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#7065f0";
                              e.target.style.boxShadow = "0 0 16px rgba(112, 101, 240, 0.25)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                        </div>
                      </div>

                      {/* Username */}
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                          Username
                        </label>
                        <div style={{ position: "relative" }}>
                          <User style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#64748b" }} />
                          <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                              width: "100%",
                              background: "#0f132a",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: 10,
                              padding: "12px 16px 12px 42px",
                              color: "#ffffff",
                              fontSize: 14,
                              outline: "none",
                              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#7065f0";
                              e.target.style.boxShadow = "0 0 16px rgba(112, 101, 240, 0.25)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                          Password
                        </label>
                        <div style={{ position: "relative" }}>
                          <Lock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#64748b" }} />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                              width: "100%",
                              background: "#0f132a",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: 10,
                              padding: "12px 42px 12px 42px",
                              color: "#ffffff",
                              fontSize: 14,
                              outline: "none",
                              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#7065f0";
                              e.target.style.boxShadow = "0 0 16px rgba(112, 101, 240, 0.25)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                              position: "absolute",
                              right: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "transparent",
                              border: "none",
                              color: "#64748b",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                          Confirm Password
                        </label>
                        <div style={{ position: "relative" }}>
                          <Lock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#64748b" }} />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                              width: "100%",
                              background: "#0f132a",
                              border: confirmPassword && confirmPassword !== password ? "1px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: 10,
                              padding: "12px 42px 12px 42px",
                              color: "#ffffff",
                              fontSize: 14,
                              outline: "none",
                              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = confirmPassword && confirmPassword !== password ? "#ef4444" : "#7065f0";
                              e.target.style.boxShadow = "0 0 16px rgba(112, 101, 240, 0.25)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = confirmPassword && confirmPassword !== password ? "#ef4444" : "rgba(255, 255, 255, 0.1)";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                              position: "absolute",
                              right: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "transparent",
                              border: "none",
                              color: "#64748b",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {showConfirmPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                          </button>
                        </div>
                      </div>

                      {/* Terms and Conditions Checkbox */}
                      <div style={{ marginTop: 2, marginBottom: 4 }}>
                        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#cbd5e1", cursor: "pointer", lineHeight: 1.4 }}>
                          <input
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            style={{
                              accentColor: "#7065f0",
                              width: 16,
                              height: 16,
                              marginTop: 2,
                              borderRadius: 4,
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          />
                          <span>
                            I accept the{" "}
                            <button
                              type="button"
                              onClick={() => setShowTermsModal(true)}
                              style={{
                                background: "transparent",
                                border: "none",
                                padding: 0,
                                color: "#818cf8",
                                textDecoration: "underline",
                                fontWeight: 700,
                                cursor: "pointer",
                                fontSize: 13,
                              }}
                            >
                              Terms and Conditions
                            </button>
                          </span>
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Login: Username or Email */}
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                          Username or Email Address
                        </label>
                        <div style={{ position: "relative" }}>
                          <User style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#64748b" }} />
                          <input
                            type="text"
                            required
                            placeholder="Username or Email Address"
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value)}
                            style={{
                              width: "100%",
                              background: "#0f132a",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: 10,
                              padding: "12px 16px 12px 42px",
                              color: "#ffffff",
                              fontSize: 14,
                              outline: "none",
                              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#7065f0";
                              e.target.style.boxShadow = "0 0 16px rgba(112, 101, 240, 0.25)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                        </div>
                      </div>

                      {/* Login: Password */}
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                          Password
                        </label>
                        <div style={{ position: "relative" }}>
                          <Lock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "#64748b" }} />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                              width: "100%",
                              background: "#0f132a",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: 10,
                              padding: "12px 42px 12px 42px",
                              color: "#ffffff",
                              fontSize: 14,
                              outline: "none",
                              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#7065f0";
                              e.target.style.boxShadow = "0 0 16px rgba(112, 101, 240, 0.25)";
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                              e.target.style.boxShadow = "none";
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                              position: "absolute",
                              right: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "transparent",
                              border: "none",
                              color: "#64748b",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                          </button>
                        </div>
                      </div>

                      {/* Checkbox & Forgot Password */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: -4 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#cbd5e1", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={keepLoggedIn}
                            onChange={(e) => setKeepLoggedIn(e.target.checked)}
                            style={{
                              accentColor: "#7065f0",
                              width: 15,
                              height: 15,
                              borderRadius: 4,
                              cursor: "pointer",
                            }}
                          />
                          <span>Keep me logged in</span>
                        </label>

                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setError("Password reset link will be sent to your registered email.");
                          }}
                          style={{
                            fontSize: 13,
                            color: "#818cf8",
                            textDecoration: "none",
                            fontWeight: 600,
                          }}
                        >
                          Forgot Password or Username?
                        </a>
                      </div>
                    </>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      marginTop: 8,
                      width: "100%",
                      padding: "13px 20px",
                      background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 10,
                      fontWeight: 800,
                      fontSize: 14.5,
                      cursor: loading ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 4px 20px rgba(112, 101, 240, 0.45)",
                      opacity: loading ? 0.75 : 1,
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 6px 25px rgba(112, 101, 240, 0.6)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 20px rgba(112, 101, 240, 0.45)";
                      }
                    }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>{mode === "register" ? "Register" : "Login"}</span>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── In-Page Terms & Conditions Modal ── */}
      {showTermsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(5, 7, 20, 0.85)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 16px",
          }}
          onClick={() => setShowTermsModal(false)}
        >
          <div
            style={{
              background: "linear-gradient(160deg, #161a3c 0%, #0d1028 100%)",
              border: "1px solid rgba(99, 102, 241, 0.35)",
              borderRadius: "20px",
              maxWidth: 580,
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.2)",
              padding: "28px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    color: "#a5b4fc",
                    fontSize: 11,
                    fontWeight: 800,
                    marginBottom: 8,
                    letterSpacing: "0.04em",
                  }}
                >
                  <FileText style={{ width: 13, height: 13 }} />
                  <span>LEGAL • COMING SOON</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", margin: 0 }}>
                  Terms and Conditions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  color: "#94a3b8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13, color: "#cbd5e1", lineHeight: 1.6, marginBottom: 24 }}>
              <div style={{ background: "rgba(12, 15, 36, 0.6)", padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <div style={{ fontWeight: 800, color: "#ffffff", marginBottom: 4 }}>1. Informational & Statistical AI Models</div>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: 12.5 }}>
                  JollofTips provides statistical probability projections and machine learning football analysis strictly for educational, informational, and entertainment purposes. No guarantee of betting profits is made.
                </p>
              </div>

              <div style={{ background: "rgba(12, 15, 36, 0.6)", padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <div style={{ fontWeight: 800, color: "#ffffff", marginBottom: 4 }}>2. 18+ Responsible Gaming Compliance</div>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: 12.5 }}>
                  You must be at least 18 years old or the legal age in your jurisdiction. We strongly advocate for bankroll discipline and responsible gambling practices.
                </p>
              </div>

              <div style={{ background: "rgba(12, 15, 36, 0.6)", padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                <div style={{ fontWeight: 800, color: "#ffffff", marginBottom: 4 }}>3. Account & Device Security</div>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: 12.5 }}>
                  Each VIP or free account is for personal use with multi-device session verification. Automated scraping or unauthorized redistribution is strictly prohibited.
                </p>
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, paddingTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <Link
                href="/terms"
                onClick={() => setShowTermsModal(false)}
                style={{
                  color: "#818cf8",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                View Full Coming Soon Page →
              </Link>

              <button
                type="button"
                onClick={() => {
                  setAcceptTerms(true);
                  setShowTermsModal(false);
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(112, 101, 240, 0.45)",
                }}
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#080a18" }} />}>
      <AuthContent />
    </Suspense>
  );
}
