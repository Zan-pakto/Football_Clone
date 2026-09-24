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
  Globe,
  RefreshCw,
  LogOut,
  Shield,
  Check,
  X,
} from "lucide-react";

function AuthContent() {
  const searchParams = useSearchParams();

  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const redirectUrl = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Form Fields (Unified email across both tabs)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle Google OAuth callback params and errors
  useEffect(() => {
    const googleAuthParam = searchParams.get("google_auth");
    const tokenParam = searchParams.get("token");
    const errParam = searchParams.get("error");

    if (googleAuthParam === "success" && tokenParam) {
      if (typeof window !== "undefined") {
        localStorage.setItem("jt_auth_token", tokenParam);
      }
      setSuccess("Welcome to JollofTips! Signed in with Google. Redirecting...");
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 700);
    } else if (errParam) {
      if (errParam === "google_not_configured") {
        setError("Google Sign-In is not yet configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the server .env file.");
      } else if (errParam === "google_cancelled") {
        setError("Google Sign-In was cancelled.");
      } else {
        setError(`Google Sign-In failed: ${errParam.replace(/_/g, " ")}`);
      }
    }
  }, [searchParams, redirectUrl]);

  // Optional: Google Identity Services One-Tap integration if client ID is configured
  useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId.trim() === "" || currentUser) return;

    // Load Google Identity Services script
    const scriptId = "google-gsi-client";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if ((window as any).google?.accounts?.id) {
          try {
            (window as any).google.accounts.id.initialize({
              client_id: googleClientId,
              callback: async (response: any) => {
                if (response?.credential) {
                  setGoogleLoading(true);
                  try {
                    const res = await fetch("/api/auth/google", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ credential: response.credential }),
                    });
                    const data = await res.json();
                    if (data.success && data.token) {
                      localStorage.setItem("jt_auth_token", data.token);
                      setSuccess("Welcome to JollofTips! Signed in with Google. Redirecting...");
                      setTimeout(() => {
                        window.location.href = redirectUrl;
                      }, 700);
                    } else {
                      setError(data.error || "Google authentication failed.");
                    }
                  } catch {
                    setError("Network error while communicating with Google auth service.");
                  } finally {
                    setGoogleLoading(false);
                  }
                }
              },
            });
            (window as any).google.accounts.id.prompt();
          } catch (e) {
            console.warn("Google One-Tap initialization skipped:", e);
          }
        }
      };
      document.body.appendChild(script);
    }
  }, [currentUser, redirectUrl]);

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
        const res = await fetch("/api/auth", { credentials: "include" });
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

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setError(null);
    const targetUrl = `/api/auth/google?redirect=${encodeURIComponent(redirectUrl)}`;
    window.location.href = targetUrl;
  };

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

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!cleanPassword) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (cleanPassword.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (cleanPassword !== confirmPassword) {
        setError("Passwords do not match. Please re-check your confirm password.");
        return;
      }
      if (!acceptTerms) {
        setError("You must accept the Terms of Service to create an account.");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: mode,
          name: mode === "register" ? name.trim() : undefined,
          email: cleanEmail,
          loginIdentifier: cleanEmail,
          password: cleanPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Authentication failed. Please check your credentials.");
        return;
      }

      if (data.token && typeof window !== "undefined") {
        localStorage.setItem("jt_auth_token", data.token);
      }

      setSuccess(mode === "register" ? "Account registered successfully! Redirecting..." : "Welcome back! Redirecting...");
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 800);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      await fetch("/api/auth", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ action: "logout" }),
      });
      if (typeof window !== "undefined") {
        localStorage.removeItem("jt_auth_token");
        sessionStorage.clear();
        window.dispatchEvent(new Event("jt_auth_change"));
      }
      setCurrentUser(null);
      setSuccess("Logged out successfully.");
    } catch {
      setError("Failed to logout.");
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="auth-page-container">
      <Navbar />

      <main className="auth-main-wrapper">
        <div className="auth-grid">
          {/* ── Form Card: Placed first on mobile for immediate interaction ── */}
          <div className="auth-form-card luxury-card">
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
                    style={{ padding: "12px", textDecoration: "none", minHeight: 46 }}
                  >
                    Go to Account Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="gold-outline-btn"
                    style={{ padding: "12px", minHeight: 46 }}
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
                    marginBottom: 20,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="auth-tab-btn"
                    style={{
                      background: mode === "login" ? "var(--gold)" : "transparent",
                      color: mode === "login" ? "var(--gold-btn-text)" : "var(--text-secondary)",
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="auth-tab-btn"
                    style={{
                      background: mode === "register" ? "var(--gold)" : "transparent",
                      color: mode === "register" ? "var(--gold-btn-text)" : "var(--text-secondary)",
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
                      padding: "12px 14px",
                      borderRadius: 8,
                      background: "var(--accent-red-bg, rgba(251, 113, 133, 0.12))",
                      border: "1px solid var(--accent-red-border, rgba(251, 113, 133, 0.3))",
                      color: "var(--accent-red)",
                      fontSize: 13,
                      marginBottom: 18,
                      lineHeight: 1.45,
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 8,
                      background: "var(--accent-green-bg, rgba(47, 208, 138, 0.12))",
                      border: "1px solid var(--accent-green-border, rgba(47, 208, 138, 0.3))",
                      color: "var(--accent-green)",
                      fontSize: 13,
                      marginBottom: 18,
                      lineHeight: 1.45,
                    }}
                  >
                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                    <span>{success}</span>
                  </div>
                )}

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="auth-google-btn"
                  style={{
                    cursor: googleLoading || loading ? "not-allowed" : "pointer",
                    opacity: googleLoading ? 0.75 : 1,
                  }}
                >
                  {googleLoading ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  )}
                  <span>
                    {googleLoading
                      ? "Connecting to Google..."
                      : mode === "login"
                      ? "Continue with Google"
                      : "Sign up with Google"}
                  </span>
                </button>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", marginBottom: 18, gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)" }}>
                    or continue with email
                  </span>
                  <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
                </div>

                {/* Form */}
                <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {mode === "register" && (
                    <div>
                      <label htmlFor="reg-name" style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                        Full Name
                      </label>
                      <div style={{ position: "relative" }}>
                        <User size={17} className="auth-input-icon" />
                        <input
                          id="reg-name"
                          name="name"
                          type="text"
                          required
                          autoComplete="name"
                          autoCapitalize="words"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="auth-input"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email Input */}
                  <div>
                    <label htmlFor="auth-email" style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                      Email Address
                    </label>
                    <div style={{ position: "relative" }}>
                      <Mail size={17} className="auth-input-icon" />
                      <input
                        id="auth-email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="auth-input"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="auth-password" style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                      Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock size={17} className="auth-input-icon" />
                      <input
                        id="auth-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={mode === "register" ? "new-password" : "current-password"}
                        autoCapitalize="none"
                        autoCorrect="off"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="auth-input"
                        style={{ paddingRight: 48 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="auth-password-toggle"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field on Register */}
                  {mode === "register" && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <label htmlFor="reg-confirm-password" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }}>
                          Confirm Password
                        </label>
                        {passwordsMatch && (
                          <span style={{ fontSize: 11, color: "var(--accent-green)", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                            <Check size={12} /> Passwords match
                          </span>
                        )}
                        {passwordsMismatch && (
                          <span style={{ fontSize: 11, color: "var(--accent-red)", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                            <X size={12} /> Mismatch
                          </span>
                        )}
                      </div>

                      <div style={{ position: "relative" }}>
                        <Lock size={17} className="auth-input-icon" />
                        <input
                          id="reg-confirm-password"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          autoCapitalize="none"
                          autoCorrect="off"
                          required
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="auth-input"
                          style={{
                            paddingRight: 48,
                            borderColor: passwordsMismatch
                              ? "var(--accent-red)"
                              : passwordsMatch
                              ? "var(--accent-green)"
                              : "var(--border-color)",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="auth-password-toggle"
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        >
                          {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Terms Checkbox */}
                  {mode === "register" && (
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 12.5, color: "var(--text-secondary)", cursor: "pointer", lineHeight: 1.4 }}>
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        style={{ marginTop: 2, accentColor: "var(--gold)", width: 16, height: 16, flexShrink: 0 }}
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
                    className="gold-btn auth-submit-btn"
                    style={{
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? (
                      <RefreshCw size={17} className="animate-spin" />
                    ) : (
                      <span>{mode === "login" ? "Sign In to JollofTips" : "Create My Free Account"}</span>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* ── Left/Bottom Column: Value Banner Card ── */}
          <div className="auth-value-card luxury-card">
            <div>
              <div className="gold-badge" style={{ marginBottom: 16 }}>
                <Sparkles size={12} />
                <span>AI FOOTBALL INTELLIGENCE</span>
              </div>

              <h1 className="auth-heading">
                Predict Smarter. <br />
                Win With <span style={{ color: "var(--gold)" }}>Data</span>.
              </h1>

              <p className="auth-value-text">
                Instant access to 10,000-scenario Monte Carlo simulations, xG model telemetry, and verified 89.4% banker picks across 700+ worldwide leagues.
              </p>

              <div className="auth-value-features" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
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
                  <span style={{ color: "var(--text-primary)", fontSize: 13.5, fontWeight: 700, lineHeight: 1.35 }}>
                    10,000 Monte Carlo Simulations Per Game
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
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
                  <span style={{ color: "var(--text-primary)", fontSize: 13.5, fontWeight: 700, lineHeight: 1.35 }}>
                    Calibrated Banker Confidence (85%–95%)
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
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
                  <span style={{ color: "var(--text-primary)", fontSize: 13.5, fontWeight: 700, lineHeight: 1.35 }}>
                    Real-Time Live Odds & In-Play Tracking
                  </span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 18, marginTop: 24, display: "flex", alignItems: "center", gap: 10 }}>
              <span className="status-pill-won" style={{ fontSize: 11, padding: "3px 8px" }}>100% Audited</span>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Permanent verifiable track record</span>
            </div>
          </div>
        </div>
      </main>

      {/* Scoped CSS for responsive auth layout and mobile optimization */}
      <style>{`
        .auth-page-container {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--background);
          color: var(--foreground);
          overflow-x: hidden;
        }

        .auth-main-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px 80px;
          width: 100%;
          box-sizing: border-box;
          z-index: 1;
        }

        .auth-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          gap: 32px;
          max-width: 1040px;
          width: 100%;
          align-items: stretch;
          box-sizing: border-box;
        }

        .auth-form-card {
          order: 2;
          padding: 40px 32px;
          box-sizing: border-box;
          border-radius: 16px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.4);
        }

        .auth-value-card {
          order: 1;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
          border-radius: 16px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.4);
        }

        .auth-heading {
          color: var(--text-primary);
          font-size: clamp(24px, 3vw, 34px);
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.22;
          margin: 0 0 14px;
        }

        .auth-value-text {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.65;
          margin: 0 0 24px;
        }

        .auth-input {
          width: 100%;
          height: 48px;
          padding: 0 16px 0 42px;
          border-radius: 10px;
          background: var(--surface-raised);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .auth-input:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(124, 108, 245, 0.18);
        }

        .auth-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: var(--text-dim);
        }

        .auth-password-toggle {
          position: absolute;
          right: 3px;
          top: 50%;
          transform: translateY(-50%);
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          border-radius: 8px;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .auth-password-toggle:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .auth-tab-btn {
          flex: 1;
          height: 42px;
          border-radius: 8px;
          border: none;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-google-btn {
          width: 100%;
          height: 48px;
          border-radius: 10px;
          background: var(--surface-raised);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-bottom: 18px;
          box-sizing: border-box;
        }

        .auth-google-btn:hover:not(:disabled) {
          border-color: var(--gold);
          background: rgba(124, 108, 245, 0.08);
        }

        .auth-submit-btn {
          width: 100%;
          height: 48px;
          font-size: 14.5px;
          font-weight: 800;
          border-radius: 10px;
          margin-top: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .auth-submit-btn:active {
          transform: scale(0.985);
        }

        /* ── Mobile and Tablet Breakpoint (<= 860px) ── */
        @media (max-width: 860px) {
          .auth-main-wrapper {
            padding: 16px 14px 48px;
            align-items: flex-start;
          }

          .auth-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
            max-width: 480px;
            margin: 0 auto;
          }

          /* Form card takes top priority on mobile */
          .auth-form-card {
            order: 1 !important;
            padding: 22px 18px;
            border-radius: 14px;
          }

          /* Value banner rests below as supporting proof */
          .auth-value-card {
            order: 2 !important;
            padding: 20px 18px;
            border-radius: 14px;
          }

          /* Prevent iOS Safari 16px auto-zoom on input focus */
          .auth-input {
            font-size: 16px !important;
            height: 48px;
          }

          .auth-heading {
            font-size: 20px !important;
            margin-bottom: 10px;
          }

          .auth-value-text {
            font-size: 13px !important;
            margin-bottom: 18px;
            line-height: 1.55;
          }

          .auth-tab-btn {
            height: 44px;
            font-size: 14px;
          }

          .auth-google-btn {
            height: 48px;
            font-size: 14px;
          }

          .auth-submit-btn {
            height: 48px;
            font-size: 15px;
          }
        }

        /* ── Small Mobile Screens (<= 380px) ── */
        @media (max-width: 380px) {
          .auth-main-wrapper {
            padding: 12px 10px 40px;
          }

          .auth-form-card,
          .auth-value-card {
            padding: 18px 14px;
          }

          .auth-tab-btn {
            font-size: 13px;
          }
        }
      `}</style>
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

