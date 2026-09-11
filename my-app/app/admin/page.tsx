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
  Shield,
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

  const [loginEmail, setLoginEmail] = useState("admin@jolloftips.com");
  const [loginPassword, setLoginPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<"ALL" | "FREE" | "SUBSCRIBED" | "VIP">("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"ALL" | "ACTIVE" | "BLOCKED">("ALL");

  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

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
      // Fallback
    } finally {
      setLoading(false);
      setAuthChecking(false);
    }
  }, [searchQuery, selectedTierFilter, selectedStatusFilter]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          loginIdentifier: loginEmail,
          password: loginPassword,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsAuthenticated(true);
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

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 20px 80px" }}>
        
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
                User management, subscription tiers, and system metrics.
              </p>
            </div>
          </div>

          <button
            onClick={fetchAdminData}
            className="gold-outline-btn"
            style={{ padding: "8px 16px", fontSize: 13 }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* If not authenticated */}
        {!isAuthenticated && !authChecking ? (
          <div className="luxury-card" style={{ maxWidth: 440, margin: "40px auto", padding: "32px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16, textAlign: "center" }}>
              Admin Sign In
            </h2>

            {loginError && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--accent-red-bg)", border: "1px solid var(--accent-red-border)", color: "var(--accent-red)", fontSize: 13, marginBottom: 16 }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>Admin Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "var(--surface-raised)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>Admin Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "var(--surface-raised)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontSize: 13 }}
                />
              </div>

              <button type="submit" disabled={loginLoading} className="gold-btn" style={{ padding: "12px", fontSize: 14 }}>
                {loginLoading ? "Authenticating..." : "Sign In to Admin Panel"}
              </button>
            </form>
          </div>
        ) : (
          /* Admin Table Content */
          <div className="luxury-card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                Registered Users Directory ({users.length})
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, background: "var(--surface-raised)", border: "1px solid var(--border-color)", width: 240 }}>
                <Search size={14} color="var(--gold)" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 12, color: "var(--text-primary)" }}
                />
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--surface-raised)", borderBottom: "1px solid var(--border-color)", color: "var(--text-dim)", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 18px" }}>User</th>
                    <th style={{ padding: "12px 18px" }}>Role</th>
                    <th style={{ padding: "12px 18px" }}>Plan Tier</th>
                    <th style={{ padding: "12px 18px" }}>Status</th>
                    <th style={{ padding: "12px 18px" }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u, idx) => (
                      <tr key={u.id || idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "12px 18px" }}>
                          <p style={{ fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{u.name || "Member"}</p>
                          <p style={{ fontSize: 11, color: "var(--text-dim)", margin: "2px 0 0" }}>{u.email}</p>
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: u.role === "ADMIN" ? "var(--gold)" : "var(--text-secondary)" }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <span className="gold-badge" style={{ fontSize: 10 }}>
                            {u.tier}
                          </span>
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <span className={u.isBlocked ? "status-pill-lost" : "status-pill-won"}>
                            {u.isBlocked ? "BLOCKED" : "ACTIVE"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 18px", color: "var(--text-dim)", fontSize: 12 }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
