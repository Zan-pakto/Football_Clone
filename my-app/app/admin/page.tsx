"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  CheckCircle2,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
  Shield,
  Trash2,
  UserCheck,
  UserX,
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
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Admin login credentials input state
  const [loginEmail, setLoginEmail] = useState("admin@jolloftips.com");
  const [loginPassword, setLoginPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin table data
  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<"ALL" | "FREE" | "SUBSCRIBED" | "VIP">("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"ALL" | "ACTIVE" | "BLOCKED">("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (selectedTierFilter !== "ALL") queryParams.set("tier", selectedTierFilter);
      if (selectedStatusFilter !== "ALL") queryParams.set("status", selectedStatusFilter);

      const res = await fetch(`/api/admin?${queryParams.toString()}`, {
        credentials: "include",
      });
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
      // Offline fallback
    } finally {
      setLoading(false);
      setAuthChecking(false);
    }
  }, [selectedTierFilter, selectedStatusFilter]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "login",
          loginIdentifier: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsAuthenticated(true);
        showToast("Admin authenticated successfully!");
        fetchAdminData();
      } else {
        setLoginError(json.error || "Invalid administrator credentials.");
      }
    } catch {
      setLoginError("Login failed due to a network error.");
    } finally {
      setLoginLoading(false);
    }
  };

  // User Tier Change Action
  const handleUpdateTier = async (userId: string, newTier: string) => {
    try {
      setActionLoadingId(userId);
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update_tier",
          userId,
          tier: newTier,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `Tier updated to ${newTier}`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, tier: newTier as any } : u))
        );
      } else {
        showToast(json.error || "Failed to update tier", "error");
      }
    } catch {
      showToast("Network error updating tier", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // User Block / Unblock Action
  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    try {
      setActionLoadingId(userId);
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "toggle_block",
          userId,
          block: !currentBlocked,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || (!currentBlocked ? "User blocked" : "User unblocked"));
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isBlocked: !currentBlocked } : u))
        );
      } else {
        showToast(json.error || "Failed to update user status", "error");
      }
    } catch {
      showToast("Network error updating user status", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Clear Server Cache Action
  const handleClearCache = async () => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "clear_cache" }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Server prediction cache purged successfully!");
      }
    } catch {
      showToast("Failed to clear cache", "error");
    }
  };

  // Filter users smoothly client-side with search query
  const filteredUsers = useMemo(() => {
    let list = users;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q))
      );
    }
    return list;
  }, [users, searchQuery]);

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", color: "var(--foreground)" }}>
      <Navbar />

      {/* Toast Banner */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 100,
            padding: "12px 20px",
            borderRadius: 10,
            background: toastMsg.type === "success" ? "var(--surface)" : "var(--accent-red-bg)",
            border: `1px solid ${toastMsg.type === "success" ? "var(--gold-border)" : "var(--accent-red-border)"}`,
            color: toastMsg.type === "success" ? "var(--gold)" : "var(--accent-red)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {toastMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--gold-bg)",
                border: "1px solid var(--gold-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold)",
              }}
            >
              <Shield size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                Administration Portal
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                User directory, subscription access tiers, and platform telemetry.
              </p>
            </div>
          </div>

          {isAuthenticated && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={handleClearCache}
                className="gold-outline-btn"
                style={{ padding: "8px 16px", fontSize: 13 }}
                title="Purge prediction cache"
              >
                <Trash2 size={14} />
                <span>Purge Cache</span>
              </button>

              <button
                onClick={fetchAdminData}
                className="gold-btn"
                style={{ padding: "8px 16px", fontSize: 13 }}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>Refresh Data</span>
              </button>
            </div>
          )}
        </div>

        {/* If not authenticated as Admin */}
        {!isAuthenticated && !authChecking ? (
          <div className="luxury-card" style={{ maxWidth: 460, margin: "40px auto", padding: "36px" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "var(--gold-bg)",
                  border: "1px solid var(--gold-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  color: "var(--gold)",
                }}
              >
                <KeyRound size={24} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 6px" }}>
                Admin Authentication
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                Enter administrator credentials to manage platform telemetry.
              </p>
            </div>

            {loginError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "var(--accent-red-bg)",
                  border: "1px solid var(--accent-red-border)",
                  color: "var(--accent-red)",
                  fontSize: 13,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertTriangle size={15} />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@jolloftips.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 8,
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Admin Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 40px 11px 14px",
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
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "var(--text-dim)",
                      cursor: "pointer",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="gold-btn"
                style={{
                  padding: "13px",
                  fontSize: 14,
                  fontWeight: 700,
                  marginTop: 6,
                  opacity: loginLoading ? 0.7 : 1,
                  cursor: "pointer",
                }}
              >
                {loginLoading ? "Authenticating..." : "Sign In to Admin Panel"}
              </button>
            </form>
          </div>
        ) : (
          /* Admin Authenticated Dashboard */
          <>
            {/* Quick Metrics Cards */}
            {data?.stats && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  marginBottom: 28,
                }}
              >
                <div className="luxury-card" style={{ padding: "18px 22px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>
                    Total Registered Users
                  </span>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                    {data.stats.totalUsers}
                  </div>
                </div>

                <div className="luxury-card" style={{ padding: "18px 22px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase" }}>
                    Subscribed / VIP
                  </span>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "var(--gold)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                    {data.stats.activeSubscribers}
                  </div>
                </div>

                <div className="luxury-card" style={{ padding: "18px 22px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>
                    Free Tier Members
                  </span>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text-primary)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                    {data.stats.freeTierUsers}
                  </div>
                </div>

                <div className="luxury-card" style={{ padding: "18px 22px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-red)", textTransform: "uppercase" }}>
                    Suspended / Blocked
                  </span>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "var(--accent-red)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                    {data.stats.blockedUsers}
                  </div>
                </div>
              </div>
            )}

            {/* Filter Controls & Search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
                marginBottom: 20,
              }}
            >
              {/* Tier Filter Pills */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {(["ALL", "FREE", "SUBSCRIBED", "VIP"] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTierFilter(tier)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: selectedTierFilter === tier ? "1px solid var(--gold-border)" : "1px solid var(--border-color)",
                      background: selectedTierFilter === tier ? "var(--gold-bg)" : "var(--surface)",
                      color: selectedTierFilter === tier ? "var(--gold)" : "var(--text-secondary)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {tier}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "var(--surface)",
                  border: "1px solid var(--border-color)",
                  width: 280,
                }}
              >
                <Search size={15} color="var(--gold)" />
                <input
                  type="text"
                  placeholder="Filter by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 13,
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            {/* Admin User Management Table */}
            <div className="luxury-card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                  Registered Users ({filteredUsers.length})
                </span>
                {loading && <span style={{ fontSize: 12, color: "var(--gold)" }}>Updating...</span>}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "var(--surface-raised)", borderBottom: "1px solid var(--border-color)", color: "var(--text-dim)", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
                      <th style={{ padding: "12px 18px" }}>User Info</th>
                      <th style={{ padding: "12px 18px" }}>Role</th>
                      <th style={{ padding: "12px 18px" }}>Tier</th>
                      <th style={{ padding: "12px 18px" }}>Status</th>
                      <th style={{ padding: "12px 18px" }}>Joined</th>
                      <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                          No matching users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isLoading = actionLoadingId === u.id;
                        return (
                          <tr key={u.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                            <td style={{ padding: "12px 18px" }}>
                              <p style={{ fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{u.name || "Member"}</p>
                              <p style={{ fontSize: 12, color: "var(--text-dim)", margin: "2px 0 0" }}>{u.email}</p>
                            </td>
                            <td style={{ padding: "12px 18px" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: u.role === "ADMIN" ? "var(--gold)" : "var(--text-secondary)" }}>
                                {u.role}
                              </span>
                            </td>
                            <td style={{ padding: "12px 18px" }}>
                              {/* Interactive Tier Selector */}
                              <select
                                value={u.tier}
                                disabled={isLoading}
                                onChange={(e) => handleUpdateTier(u.id, e.target.value)}
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: 6,
                                  background: "var(--surface-raised)",
                                  border: "1px solid var(--gold-border)",
                                  color: "var(--gold)",
                                  fontSize: 11,
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  outline: "none",
                                }}
                              >
                                <option value="FREE">FREE</option>
                                <option value="PREMIUM_MONTHLY">PREMIUM_MONTHLY</option>
                                <option value="PREMIUM_ANNUAL">PREMIUM_ANNUAL</option>
                                <option value="VIP_PRO">VIP_PRO</option>
                              </select>
                            </td>
                            <td style={{ padding: "12px 18px" }}>
                              <span className={u.isBlocked ? "status-pill-lost" : "status-pill-won"}>
                                {u.isBlocked ? "BLOCKED" : "ACTIVE"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 18px", color: "var(--text-dim)", fontSize: 12 }}>
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: "12px 18px", textAlign: "right" }}>
                              {u.role !== "ADMIN" && (
                                <button
                                  disabled={isLoading}
                                  onClick={() => handleToggleBlock(u.id, u.isBlocked)}
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: 6,
                                    border: `1px solid ${u.isBlocked ? "var(--accent-green-border)" : "var(--accent-red-border)"}`,
                                    background: u.isBlocked ? "var(--accent-green-bg)" : "var(--accent-red-bg)",
                                    color: u.isBlocked ? "var(--accent-green)" : "var(--accent-red)",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  {u.isBlocked ? (
                                    <>
                                      <UserCheck size={12} />
                                      <span>Unblock</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserX size={12} />
                                      <span>Block</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
