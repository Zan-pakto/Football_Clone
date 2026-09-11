"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import {
  Users,
  ShieldAlert,
  Search,
  RefreshCw,
  Zap,
  Crown,
  Lock,
  Unlock,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Check,
  LogOut,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
  Fingerprint,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  isBlocked: boolean;
  tier: "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL" | "VIP_PRO";
  subscriptionStatus: "ACTIVE" | "EXPIRED" | "CANCELLED" | "TRIALING" | "NONE";
  subscriptionExpiresAt: string | null;
  createdAt: string;
  activeSessionsCount: number;
  lastActive: string;
}

export default function AdminDashboardPage() {
  // Auth state
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  // Login form state (pre-filled for effortless 1-click access)
  const [loginEmail, setLoginEmail] = useState("admin@jolloftips.com");
  const [loginPassword, setLoginPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin Dashboard state
  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<"ALL" | "FREE" | "SUBSCRIBED" | "VIP">("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"ALL" | "ACTIVE" | "BLOCKED">("ALL");

  // Actions state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Tier select dropdown popover
  const [editingTierUserId, setEditingTierUserId] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch Admin Data (Real data from API)
  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set("search", searchQuery);
      if (selectedTierFilter !== "ALL") queryParams.set("tier", selectedTierFilter);
      if (selectedStatusFilter !== "ALL") queryParams.set("status", selectedStatusFilter);

      const res = await fetch(`/api/admin?${queryParams.toString()}`);
      const json = await res.json();

      if (json.success) {
        setIsAuthenticated(true);
        setData(json);
        setUsers(json.users || []);
      } else {
        if (res.status === 401 || res.status === 403) {
          setIsAuthenticated(false);
        }
      }
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTierFilter, selectedStatusFilter]);

  // Initial Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthChecking(true);
        const res = await fetch("/api/auth");
        const json = await res.json();
        if (json.isLoggedIn && json.user?.role === "ADMIN") {
          setIsAuthenticated(true);
          setCurrentAdmin(json.user);
          await fetchAdminData();
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, [fetchAdminData]);

  // Handle Admin Login
  const handleAdminLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    const emailToUse = customEmail || loginEmail;
    const passwordToUse = customPassword || loginPassword;

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: emailToUse,
          password: passwordToUse,
        }),
      });
      const json = await res.json();

      if (json.success && json.user) {
        if (json.user.role !== "ADMIN") {
          setLoginError("Account does not possess Administrator privileges.");
          return;
        }
        setIsAuthenticated(true);
        setCurrentAdmin(json.user);
        showToast("Welcome back, Administrator!");
        await fetchAdminData();
      } else {
        setLoginError(json.error || "Invalid administrator credentials.");
      }
    } catch {
      setLoginError("Failed to connect to authentication server.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Admin Logout
  const handleAdminLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      setIsAuthenticated(false);
      setCurrentAdmin(null);
      setUsers([]);
      setData(null);
      showToast("Administrator logged out successfully.");
    } catch {
      setIsAuthenticated(false);
    }
  };

  // Handle Block / Unblock Toggle
  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    setActionLoadingId(userId);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_block",
          userId,
          block: !currentBlocked,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || (!currentBlocked ? "User blocked successfully" : "User unblocked successfully"));
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isBlocked: !currentBlocked } : u))
        );
        fetchAdminData();
      } else {
        showToast(json.error || "Failed to update user status", "error");
      }
    } catch {
      showToast("Network error executing action", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Tier Update
  const handleUpdateTier = async (userId: string, newTier: "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL" | "VIP_PRO") => {
    setActionLoadingId(userId);
    setEditingTierUserId(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_tier",
          userId,
          tier: newTier,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`User plan updated to ${newTier.replace("_", " ")}`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, tier: newTier, subscriptionStatus: newTier === "FREE" ? "NONE" : "ACTIVE" } : u))
        );
        fetchAdminData();
      } else {
        showToast(json.error || "Failed to update tier", "error");
      }
    } catch {
      showToast("Network error updating tier", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const stats = data?.stats || {
    totalUsers: users.length,
    activeSubscribers: users.filter((u) => u.tier !== "FREE" && !u.isBlocked).length,
    freeTierUsers: users.filter((u) => u.tier === "FREE" && !u.isBlocked).length,
    blockedUsers: users.filter((u) => u.isBlocked).length,
  };

  // ── Loading Spinner State ──
  if (authChecking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060914" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 44,
            height: 44,
            border: "3px solid rgba(99, 102, 241, 0.2)",
            borderTopColor: "#6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }} />
          <p style={{ color: "#94a3b8", fontSize: "14px", fontWeight: 600 }}>Verifying administrative credentials...</p>
        </div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Admin Login Gate (Rendered when unauthenticated / non-admin) ──
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "#060914", color: "#f8fafc", position: "relative", overflow: "hidden" }}>
        <Navbar />

        {/* Cyber glow background effects */}
        <div style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }} />

        <main style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "120px 20px 80px",
          position: "relative",
          zIndex: 10,
        }}>
          {/* Admin Login Card */}
          <div style={{
            background: "linear-gradient(180deg, rgba(17, 24, 48, 0.85) 0%, rgba(10, 14, 28, 0.95) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            borderRadius: 20,
            padding: "36px 32px",
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(99, 102, 241, 0.12)",
            backdropFilter: "blur(16px)",
          }}>
            {/* Header Lock Icon & Badge */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.4)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                boxShadow: "0 8px 20px rgba(99, 102, 241, 0.25)",
              }}>
                <Fingerprint style={{ width: 28, height: 28, color: "#818cf8" }} />
              </div>

              <div style={{ display: "inline-block", marginBottom: 8 }}>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 900,
                  padding: "4px 12px",
                  borderRadius: "999px",
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "#f87171",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  Restricted Access • Admin Only
                </span>
              </div>

              <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#ffffff", margin: "4px 0 8px", letterSpacing: "-0.02em" }}>
                Admin Command Center
              </h1>
              <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
                Sign in to manage real users and active subscriptions.
              </p>
            </div>

            {/* Quick-Fill Helper Card */}
            <div style={{
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px dashed rgba(99, 102, 241, 0.3)",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 24,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ⚡ Pre-configured Credentials
                </span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#34d399", background: "rgba(16, 185, 129, 0.15)", padding: "2px 6px", borderRadius: 4 }}>
                  Ready
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.6 }}>
                <div><span style={{ color: "#94a3b8" }}>Email:</span> <code style={{ color: "#ffffff", fontWeight: 700, background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4 }}>admin@jolloftips.com</code></div>
                <div><span style={{ color: "#94a3b8" }}>Password:</span> <code style={{ color: "#ffffff", fontWeight: 700, background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: 4 }}>password123</code></div>
              </div>

              {/* 1-Click Instant Login Button */}
              <button
                type="button"
                onClick={() => handleAdminLogin(undefined, "admin@jolloftips.com", "password123")}
                disabled={loginLoading}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "9px 14px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(16, 185, 129, 0.35) 100%)",
                  border: "1px solid rgba(99, 102, 241, 0.5)",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.15s ease",
                }}
              >
                <Zap style={{ width: 14, height: 14, color: "#fbbf24" }} />
                <span>1-Click Instant Admin Login</span>
              </button>
            </div>

            {/* Error Message */}
            {loginError && (
              <div style={{
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: 10,
                padding: "12px 14px",
                color: "#f87171",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
              }}>
                <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>{loginError}</span>
              </div>
            )}

            {/* Manual Login Form */}
            <form onSubmit={(e) => handleAdminLogin(e)}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@jolloftips.com"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>
                  Master Access Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px 42px 12px 14px",
                      borderRadius: 10,
                      background: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#ffffff",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s ease",
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
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  width: "100%",
                  padding: "13px 18px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: loginLoading ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.5)",
                  transition: "all 0.2s ease",
                }}
              >
                {loginLoading ? (
                  <>
                    <RefreshCw style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <KeyRound style={{ width: 16, height: 16 }} />
                    <span>Authenticate & Access Console</span>
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Authenticated Admin Console ──
  return (
    <div style={{ background: "transparent", minHeight: "100vh", color: "#f8fafc" }}>
      <Navbar />

      {/* Toast Notification Alert */}
      {toastMsg && (
        <div style={{
          position: "fixed",
          top: "80px",
          right: "24px",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 20px",
          borderRadius: "10px",
          background: toastMsg.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)",
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "13px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          backdropFilter: "blur(10px)",
          animation: "slideInRight 0.3s ease",
        }}>
          {toastMsg.type === "success" ? (
            <CheckCircle2 style={{ width: "16px", height: "16px" }} />
          ) : (
            <AlertTriangle style={{ width: "16px", height: "16px" }} />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "84px 16px 80px" }}>
        {/* ── Top Header Control Center ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: "11px",
                fontWeight: 900,
                padding: "3px 10px",
                borderRadius: "6px",
                background: "rgba(99, 102, 241, 0.15)",
                color: "#a5b4fc",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}>
                Security Restricted Portal
              </span>
              <span style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#34d399",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                Live Database Sync
              </span>
              {currentAdmin && (
                <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                  Logged in as <strong style={{ color: "#fff" }}>{currentAdmin.email || "admin@jolloftips.com"}</strong>
                </span>
              )}
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", margin: 0, letterSpacing: "-0.02em" }}>
              User Management & Platform Console
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Refresh Live Data */}
            <button
              onClick={fetchAdminData}
              disabled={loading}
              title="Refresh live user data"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#ffffff",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <RefreshCw style={{ width: 14, height: 14, animation: loading ? "spin 1s linear infinite" : "none" }} />
              <span>Refresh</span>
            </button>

            {/* Admin Logout Button */}
            <button
              onClick={handleAdminLogout}
              title="Sign out of Administrator console"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <LogOut style={{ width: 14, height: 14 }} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* ── KPI Summary Cards ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}>
          {/* Total Registered Accounts */}
          <div
            onClick={() => { setSelectedTierFilter("ALL"); setSelectedStatusFilter("ALL"); }}
            style={{
              background: "linear-gradient(135deg, rgba(20, 26, 60, 0.9) 0%, rgba(13, 17, 40, 0.95) 100%)",
              border: selectedTierFilter === "ALL" && selectedStatusFilter === "ALL" ? "1.5px solid #6366f1" : "1px solid rgba(99, 102, 241, 0.25)",
              borderRadius: 14,
              padding: "20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <Users style={{ width: 16, height: 16, color: "#818cf8" }} />
                Total Registered
              </span>
              <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 800, background: "rgba(99, 102, 241, 0.15)", padding: "2px 6px", borderRadius: 4 }}>
                100%
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#ffffff" }}>
              {stats.totalUsers}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
              Active accounts in database
            </div>
          </div>

          {/* Subscribed Users */}
          <div
            onClick={() => { setSelectedTierFilter("SUBSCRIBED"); setSelectedStatusFilter("ACTIVE"); }}
            style={{
              background: "linear-gradient(135deg, rgba(16, 40, 40, 0.9) 0%, rgba(10, 28, 28, 0.95) 100%)",
              border: selectedTierFilter === "SUBSCRIBED" ? "1.5px solid #10b981" : "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: 14,
              padding: "20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <Crown style={{ width: 16, height: 16, color: "#34d399" }} />
                Subscribed Users
              </span>
              <span style={{ fontSize: 11, color: "#34d399", fontWeight: 800, background: "rgba(16, 185, 129, 0.15)", padding: "2px 6px", borderRadius: 4 }}>
                {stats.totalUsers ? Math.round((stats.activeSubscribers / stats.totalUsers) * 100) : 0}% Conv.
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#34d399" }}>
              {stats.activeSubscribers}
            </div>
            <div style={{ fontSize: 11, color: "#6ee7b7", marginTop: 4 }}>
              Active Monthly, Annual & VIP tiers
            </div>
          </div>

          {/* Free Tier Users */}
          <div
            onClick={() => { setSelectedTierFilter("FREE"); setSelectedStatusFilter("ALL"); }}
            style={{
              background: "linear-gradient(135deg, rgba(28, 24, 60, 0.9) 0%, rgba(18, 15, 42, 0.95) 100%)",
              border: selectedTierFilter === "FREE" ? "1.5px solid #a855f7" : "1px solid rgba(168, 85, 247, 0.3)",
              borderRadius: 14,
              padding: "20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <Zap style={{ width: 16, height: 16, color: "#c084fc" }} />
                Free Tier Users
              </span>
              <span style={{ fontSize: 11, color: "#c084fc", fontWeight: 800, background: "rgba(168, 85, 247, 0.15)", padding: "2px 6px", borderRadius: 4 }}>
                {stats.totalUsers ? Math.round((stats.freeTierUsers / stats.totalUsers) * 100) : 0}%
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#c084fc" }}>
              {stats.freeTierUsers}
            </div>
            <div style={{ fontSize: 11, color: "#d8b4fe", marginTop: 4 }}>
              Standard free registered users
            </div>
          </div>

          {/* Suspended / Blocked Accounts */}
          <div
            onClick={() => { setSelectedTierFilter("ALL"); setSelectedStatusFilter("BLOCKED"); }}
            style={{
              background: "linear-gradient(135deg, rgba(45, 16, 22, 0.9) 0%, rgba(30, 10, 14, 0.95) 100%)",
              border: selectedStatusFilter === "BLOCKED" ? "1.5px solid #ef4444" : "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 14,
              padding: "20px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldAlert style={{ width: 16, height: 16, color: "#f87171" }} />
                Suspended / Blocked
              </span>
              <span style={{ fontSize: 11, color: "#f87171", fontWeight: 800, background: "rgba(239, 68, 68, 0.2)", padding: "2px 6px", borderRadius: 4 }}>
                {stats.blockedUsers > 0 ? "Flagged" : "Clear"}
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#f87171" }}>
              {stats.blockedUsers}
            </div>
            <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 4 }}>
              Access restricted & sessions revoked
            </div>
          </div>
        </div>

        {/* ── User Management Table ── */}
        <div style={{
          background: "#0d1222",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 16,
          padding: "24px",
          boxShadow: "0 12px 35px rgba(0,0,0,0.5)",
        }}>
          {/* Search and Filter Control Bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
            marginBottom: 20,
          }}>
            {/* Search input */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 10,
              padding: "8px 14px",
              flex: "1 1 280px",
              maxWidth: "400px",
            }}>
              <Search style={{ width: 16, height: 16, color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search user name or email address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#ffffff",
                  fontSize: 13,
                }}
              />
            </div>

            {/* Tier & Status Filter Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Tier:</span>
              {(["ALL", "FREE", "SUBSCRIBED", "VIP"] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTierFilter(tier)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: selectedTierFilter === tier ? "1px solid #7065f0" : "1px solid rgba(255,255,255,0.08)",
                    background: selectedTierFilter === tier ? "rgba(112, 101, 240, 0.2)" : "rgba(255,255,255,0.03)",
                    color: selectedTierFilter === tier ? "#ffffff" : "#94a3b8",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tier === "ALL" ? "All Tiers" : tier === "FREE" ? "Free Only" : tier === "SUBSCRIBED" ? "Subscribed" : "VIP / Annual"}
                </button>
              ))}

              <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Status:</span>
              {(["ALL", "ACTIVE", "BLOCKED"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatusFilter(status)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: selectedStatusFilter === status ? "1px solid #7065f0" : "1px solid rgba(255,255,255,0.08)",
                    background: selectedStatusFilter === status ? "rgba(112, 101, 240, 0.2)" : "rgba(255,255,255,0.03)",
                    color: selectedStatusFilter === status ? "#ffffff" : "#94a3b8",
                    transition: "all 0.15s ease",
                  }}
                >
                  {status === "ALL" ? "All Status" : status === "ACTIVE" ? "Active" : "Blocked"}
                </button>
              ))}
            </div>
          </div>

          {/* Live Users Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "#64748b", fontWeight: 800, textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "12px 16px" }}>User Profile</th>
                  <th style={{ padding: "12px 16px" }}>Subscription Tier</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Joined / Activity</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px 16px", textAlign: "center", color: "#64748b" }}>
                      {loading ? "Fetching live user records..." : "No users match the selected filters."}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isActionBusy = actionLoadingId === u.id;
                    const isFree = u.tier === "FREE";
                    const isVip = u.tier === "VIP_PRO" || u.tier === "PREMIUM_ANNUAL";

                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                          background: u.isBlocked ? "rgba(239, 68, 68, 0.04)" : "transparent",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* User Profile */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: u.role === "ADMIN"
                                ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                                : u.isBlocked
                                ? "linear-gradient(135deg, #ef4444 0%, #991b1b 100%)"
                                : isFree
                                ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                                : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 14,
                              color: "#ffffff",
                              flexShrink: 0,
                            }}>
                              {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontWeight: 800, color: "#ffffff", fontSize: "14px" }}>
                                  {u.name}
                                </span>
                                {u.role === "ADMIN" && (
                                  <span style={{ fontSize: 10, fontWeight: 900, background: "rgba(245, 158, 11, 0.2)", color: "#fbbf24", padding: "1px 6px", borderRadius: 4 }}>
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tier & Plan */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ position: "relative", display: "inline-block" }}>
                            <button
                              onClick={() => setEditingTierUserId(editingTierUserId === u.id ? null : u.id)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "4px 10px",
                                borderRadius: 8,
                                background: isFree
                                  ? "rgba(148, 163, 184, 0.12)"
                                  : isVip
                                  ? "rgba(245, 158, 11, 0.16)"
                                  : "rgba(16, 185, 129, 0.16)",
                                border: isFree
                                  ? "1px solid rgba(148, 163, 184, 0.25)"
                                  : isVip
                                  ? "1px solid rgba(245, 158, 11, 0.4)"
                                  : "1px solid rgba(16, 185, 129, 0.4)",
                                color: isFree ? "#94a3b8" : isVip ? "#fbbf24" : "#34d399",
                                fontWeight: 800,
                                fontSize: 11,
                                cursor: "pointer",
                              }}
                            >
                              {isVip ? (
                                <Crown style={{ width: 12, height: 12 }} />
                              ) : isFree ? (
                                <Zap style={{ width: 12, height: 12 }} />
                              ) : (
                                <Sparkles style={{ width: 12, height: 12 }} />
                              )}
                              <span>{u.tier.replace("_", " ")}</span>
                              <ChevronDown style={{ width: 12, height: 12, opacity: 0.6 }} />
                            </button>

                            {/* Tier Selector Dropdown Popover */}
                            {editingTierUserId === u.id && (
                              <div style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                zIndex: 30,
                                marginTop: 6,
                                width: 180,
                                background: "#12182c",
                                border: "1px solid rgba(255,255,255,0.14)",
                                borderRadius: 10,
                                boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                                padding: "6px",
                              }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", padding: "4px 8px", textTransform: "uppercase" }}>
                                  Set Subscription Plan:
                                </div>
                                {(["FREE", "PREMIUM_MONTHLY", "PREMIUM_ANNUAL", "VIP_PRO"] as const).map((t) => (
                                  <button
                                    key={t}
                                    onClick={() => handleUpdateTier(u.id, t)}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      width: "100%",
                                      padding: "7px 10px",
                                      borderRadius: 6,
                                      background: u.tier === t ? "rgba(99, 102, 241, 0.2)" : "transparent",
                                      color: u.tier === t ? "#ffffff" : "#cbd5e1",
                                      fontSize: 12,
                                      fontWeight: u.tier === t ? 800 : 500,
                                      border: "none",
                                      textAlign: "left",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <span>{t.replace("_", " ")}</span>
                                    {u.tier === t && <Check style={{ width: 12, height: 12, color: "#818cf8" }} />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {u.subscriptionExpiresAt && (
                            <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                              Expires: {new Date(u.subscriptionExpiresAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>

                        {/* Account Status */}
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 9px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 800,
                            background: u.isBlocked
                              ? "rgba(239, 68, 68, 0.15)"
                              : "rgba(16, 185, 129, 0.15)",
                            color: u.isBlocked ? "#f87171" : "#34d399",
                            border: u.isBlocked
                              ? "1px solid rgba(239, 68, 68, 0.3)"
                              : "1px solid rgba(16, 185, 129, 0.3)",
                          }}>
                            <span style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: u.isBlocked ? "#ef4444" : "#10b981",
                            }} />
                            {u.isBlocked ? "BLOCKED" : "ACTIVE"}
                          </span>
                        </td>

                        {/* Joined / Last Active */}
                        <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "12px" }}>
                          <div>Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            {u.activeSessionsCount} active session{u.activeSessionsCount === 1 ? "" : "s"} • {u.lastActive}
                          </div>
                        </td>

                        {/* Admin Actions */}
                        <td style={{ padding: "14px 16px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            {/* Block / Unblock Toggle Button */}
                            {u.role !== "ADMIN" && (
                              <button
                                onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                                disabled={isActionBusy}
                                title={u.isBlocked ? "Restore user access" : "Block user and terminate sessions"}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "6px 12px",
                                  borderRadius: 8,
                                  background: u.isBlocked
                                    ? "rgba(16, 185, 129, 0.14)"
                                    : "rgba(239, 68, 68, 0.12)",
                                  border: u.isBlocked
                                    ? "1px solid rgba(16, 185, 129, 0.35)"
                                    : "1px solid rgba(239, 68, 68, 0.3)",
                                  color: u.isBlocked ? "#34d399" : "#f87171",
                                  fontSize: 12,
                                  fontWeight: 800,
                                  cursor: isActionBusy ? "wait" : "pointer",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {u.isBlocked ? (
                                  <>
                                    <Unlock style={{ width: 13, height: 13 }} />
                                    <span>Unblock</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock style={{ width: 13, height: 13 }} />
                                    <span>Block User</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
