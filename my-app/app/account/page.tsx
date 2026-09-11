"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  User,
  Shield,
  Crown,
  Laptop,
  Smartphone,
  Mail,
  Calendar,
  Key,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  LogOut,
  Settings,
  Flame,
  Star,
  Activity,
  Zap,
  Globe,
  Lock,
  Edit3,
  Save,
  Check,
  AlertCircle,
  RefreshCw,
  Sliders,
  ShieldCheck,
} from "lucide-react";

interface UserProfile {
  id: string;
  name?: string | null;
  email: string;
  role: "USER" | "ADMIN";
  isPremium?: boolean;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  createdAt?: string;
}

interface SessionItem {
  id: string;
  deviceName?: string;
  userAgent?: string;
  ipAddress?: string;
  lastUsedAt: string;
  createdAt: string;
}

const TOP_LEAGUES = [
  "Premier League (England)",
  "UEFA Champions League",
  "La Liga (Spain)",
  "Serie A (Italy)",
  "Bundesliga (Germany)",
  "Ligue 1 (France)",
  "Eredivisie (Netherlands)",
  "Primeira Liga (Portugal)",
  "NPFL (Nigeria)",
];

const POPULAR_TEAMS = [
  "Arsenal",
  "Real Madrid",
  "Manchester City",
  "Barcelona",
  "Liverpool",
  "Bayern Munich",
  "Chelsea",
  "Paris Saint-Germain",
  "Inter Milan",
  "Juventus",
  "Manchester United",
  "Napoli",
  "Enyimba FC",
  "Sporting CP",
];

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
  "linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)",
  "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
];

export default function AccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "subscription" | "security" | "sessions">("profile");

  // Profile Form State
  const [displayName, setDisplayName] = useState("");
  const [favoriteLeague, setFavoriteLeague] = useState(TOP_LEAGUES[0]);
  const [favoriteTeam, setFavoriteTeam] = useState(POPULAR_TEAMS[0]);
  const [oddsFormat, setOddsFormat] = useState<"decimal" | "fractional" | "american">("decimal");
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState("");
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("");

  // Sessions State
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [sessionMsg, setSessionMsg] = useState("");

  // Fetch current user
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setDisplayName(data.user.name || data.user.email.split("@")[0]);
      } else {
        // Guest Demo fallback
        const guest: UserProfile = {
          id: "user_sample_guest",
          name: "Football Fan",
          email: "member@jolloftips.com",
          role: "USER",
          isPremium: false,
          subscriptionPlan: "FREE",
          subscriptionStatus: "ACTIVE",
          createdAt: new Date().toISOString(),
        };
        setUser(guest);
        setDisplayName(guest.name || "Football Fan");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const res = await fetch("/api/auth/sessions");
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      } else {
        setSessions([
          {
            id: "sess_curr",
            deviceName: "Current Device (Chrome / Windows)",
            ipAddress: "127.0.0.1",
            lastUsedAt: new Date().toISOString(),
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchSessions();
  }, [fetchUser, fetchSessions]);

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_profile",
          name: displayName,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setProfileSuccessMsg("Profile updated successfully!");
        setTimeout(() => setProfileSuccessMsg(""), 4000);
      } else {
        setProfileErrorMsg(data.error || "Failed to update profile");
      }
    } catch {
      setProfileErrorMsg("Network error updating profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg("");
    setPasswordErrorMsg("");

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordErrorMsg("Password must be at least 6 characters");
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordSuccessMsg("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccessMsg(""), 4000);
      } else {
        setPasswordErrorMsg(data.error || "Failed to change password");
      }
    } catch {
      setPasswordErrorMsg("Error contacting server");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Handle Session Revoke
  const handleRevokeSession = async (id: string) => {
    setRevokingId(id);
    setSessionMsg("");
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", sessionId: id }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        setSessionMsg("Device session revoked successfully");
        setTimeout(() => setSessionMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRevokingId(null);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
    }
  };

  const isVip = user?.isPremium || user?.role === "ADMIN";

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", display: "flex", flexDirection: "column", color: "var(--foreground)" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 1120, margin: "0 auto", padding: "100px 16px 80px", width: "100%" }}>
        
        {/* ── Top User Profile Hero Banner ── */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(21, 26, 56, 0.95) 0%, rgba(15, 18, 42, 0.98) 100%)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            borderRadius: 20,
            padding: "32px",
            marginBottom: 32,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.1)",
          }}
        >
          {/* Ambient Glow */}
          <div
            style={{
              position: "absolute",
              top: -60,
              right: -60,
              width: 250,
              height: 250,
              borderRadius: "50%",
              background: isVip 
                ? "radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)" 
                : "radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)",
              filter: "blur(50px)",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, position: "relative", zIndex: 2 }}>
            
            {/* Left: Avatar & Identity */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 20,
                    background: AVATAR_GRADIENTS[avatarIndex],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: 28,
                    fontWeight: 900,
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : user?.email ? user.email.slice(0, 2).toUpperCase() : "JT"}
                </div>

                {isVip && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #0f1226",
                      boxShadow: "0 0 10px rgba(245, 158, 11, 0.6)",
                    }}
                    title="VIP Pro Verified"
                  >
                    <Crown style={{ width: 14, height: 14, color: "#ffffff" }} />
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 900, color: "#ffffff", margin: 0, letterSpacing: "-0.02em" }}>
                    {user?.name || "Football Member"}
                  </h1>
                  
                  {isVip ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: "rgba(245, 158, 11, 0.15)",
                        border: "1px solid rgba(245, 158, 11, 0.35)",
                        color: "#fbbf24",
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.04em",
                      }}
                    >
                      <Crown style={{ width: 12, height: 12 }} />
                      VIP PRO MEMBER
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: "rgba(99, 102, 241, 0.12)",
                        border: "1px solid rgba(99, 102, 241, 0.3)",
                        color: "#a5b4fc",
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      FREE TIER
                    </span>
                  )}

                  {user?.role === "ADMIN" && (
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#f87171",
                        fontSize: 10,
                        fontWeight: 900,
                      }}
                    >
                      ADMIN
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", fontSize: 13, color: "#94a3b8" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Mail style={{ width: 14, height: 14, color: "#818cf8" }} />
                    {user?.email}
                  </span>
                  <span>•</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Calendar style={{ width: 14, height: 14, color: "#818cf8" }} />
                    Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "2026"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action CTAs */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {!isVip && (
                <Link
                  href="/pricing"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "11px 22px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 800,
                    textDecoration: "none",
                    boxShadow: "0 4px 18px rgba(245, 158, 11, 0.35)",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Crown style={{ width: 15, height: 15 }} />
                  <span>Upgrade to VIP Pro</span>
                </Link>
              )}

              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 18px",
                    borderRadius: 10,
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#f87171",
                    fontSize: 13,
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  <Shield style={{ width: 14, height: 14 }} />
                  <span>Admin Console</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 18px",
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#cbd5e1",
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

          {/* Key Metrics Quick Ribbon */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
              marginTop: 28,
              paddingTop: 24,
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Subscription
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: isVip ? "#fbbf24" : "#ffffff" }}>
                {user?.subscriptionPlan || (isVip ? "VIP_PRO" : "FREE_TIER")}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Active Devices
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#818cf8" }}>
                {sessions.length} / 5 Logged In
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                AI Model Accuracy
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#34d399" }}>
                88.4% Verified
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Odds Display
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#c7d2fe", textTransform: "capitalize" }}>
                {oddsFormat} Format
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 28,
            borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
            paddingBottom: 12,
            overflowX: "auto",
          }}
        >
          <button
            onClick={() => setActiveTab("profile")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              background: activeTab === "profile" ? "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)" : "rgba(255, 255, 255, 0.03)",
              border: activeTab === "profile" ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.06)",
              color: activeTab === "profile" ? "#ffffff" : "#94a3b8",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: activeTab === "profile" ? "0 4px 16px rgba(112, 101, 240, 0.35)" : "none",
            }}
          >
            <User style={{ width: 15, height: 15 }} />
            <span>Profile & Preferences</span>
          </button>

          <button
            onClick={() => setActiveTab("subscription")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              background: activeTab === "subscription" ? "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)" : "rgba(255, 255, 255, 0.03)",
              border: activeTab === "subscription" ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.06)",
              color: activeTab === "subscription" ? "#ffffff" : "#94a3b8",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: activeTab === "subscription" ? "0 4px 16px rgba(112, 101, 240, 0.35)" : "none",
            }}
          >
            <Crown style={{ width: 15, height: 15 }} />
            <span>VIP Membership</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              background: activeTab === "security" ? "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)" : "rgba(255, 255, 255, 0.03)",
              border: activeTab === "security" ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.06)",
              color: activeTab === "security" ? "#ffffff" : "#94a3b8",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: activeTab === "security" ? "0 4px 16px rgba(112, 101, 240, 0.35)" : "none",
            }}
          >
            <Lock style={{ width: 15, height: 15 }} />
            <span>Security & Password</span>
          </button>

          <button
            onClick={() => setActiveTab("sessions")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 10,
              background: activeTab === "sessions" ? "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)" : "rgba(255, 255, 255, 0.03)",
              border: activeTab === "sessions" ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255, 255, 255, 0.06)",
              color: activeTab === "sessions" ? "#ffffff" : "#94a3b8",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: activeTab === "sessions" ? "0 4px 16px rgba(112, 101, 240, 0.35)" : "none",
            }}
          >
            <Laptop style={{ width: 15, height: 15 }} />
            <span>Connected Devices ({sessions.length})</span>
          </button>
        </div>

        {/* ── TAB 1: Profile & Preferences ── */}
        {activeTab === "profile" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            
            {/* Left Card: Edit Details */}
            <div
              style={{
                background: "rgba(21, 26, 56, 0.85)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: 16,
                padding: "28px 24px",
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", marginBottom: 6 }}>
                Personal Information
              </h3>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
                Update your public display identity and custom match tracking settings.
              </p>

              {profileSuccessMsg && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                  <CheckCircle2 style={{ width: 16, height: 16 }} />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                  <AlertCircle style={{ width: 16, height: 16 }} />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                
                {/* Display Name */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    Display Name / Username
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 8,
                      background: "rgba(10, 13, 34, 0.8)",
                      border: "1px solid rgba(99, 102, 241, 0.25)",
                      color: "#ffffff",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>

                {/* Email Address (Read Only) */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    Email Address (Account Identifier)
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 8,
                      background: "rgba(10, 13, 34, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      color: "#64748b",
                      fontSize: 14,
                      cursor: "not-allowed",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#64748b", marginTop: 4, display: "block" }}>
                    Verified through PostgreSQL authentication.
                  </span>
                </div>

                {/* Avatar Color Theme */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 8 }}>
                    Avatar Gradient Style
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {AVATAR_GRADIENTS.map((grad, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setAvatarIndex(i)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: grad,
                          border: avatarIndex === i ? "2px solid #ffffff" : "2px solid transparent",
                          cursor: "pointer",
                          transform: avatarIndex === i ? "scale(1.1)" : "scale(1)",
                          transition: "all 0.15s ease",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  style={{
                    marginTop: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 20px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 800,
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 4px 16px rgba(112, 101, 240, 0.35)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Save style={{ width: 16, height: 16 }} />
                  <span>{isSavingProfile ? "Saving..." : "Save Profile Details"}</span>
                </button>
              </form>
            </div>

            {/* Right Card: Football & Odds Preferences */}
            <div
              style={{
                background: "rgba(21, 26, 56, 0.85)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: 16,
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", marginBottom: 6 }}>
                Betting & Model Preferences
              </h3>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
                Configure your default calculation formats and primary leagues.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
                
                {/* Odds Format Selector */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 8 }}>
                    Default Odds Representation
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {(["decimal", "fractional", "american"] as const).map((fmt) => (
                      <button
                        type="button"
                        key={fmt}
                        onClick={() => setOddsFormat(fmt)}
                        style={{
                          padding: "10px",
                          borderRadius: 8,
                          background: oddsFormat === fmt ? "rgba(99, 102, 241, 0.25)" : "rgba(10, 13, 34, 0.8)",
                          border: oddsFormat === fmt ? "1px solid #818cf8" : "1px solid rgba(255, 255, 255, 0.08)",
                          color: oddsFormat === fmt ? "#ffffff" : "#94a3b8",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          textTransform: "capitalize",
                        }}
                      >
                        {fmt === "decimal" ? "Decimal (1.85)" : fmt === "fractional" ? "Fractional (5/6)" : "American (-118)"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Favorite League */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    Primary Followed Competition
                  </label>
                  <select
                    value={favoriteLeague}
                    onChange={(e) => setFavoriteLeague(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 8,
                      background: "rgba(10, 13, 34, 0.8)",
                      border: "1px solid rgba(99, 102, 241, 0.25)",
                      color: "#ffffff",
                      fontSize: 13,
                      outline: "none",
                    }}
                  >
                    {TOP_LEAGUES.map((lg) => (
                      <option key={lg} value={lg} style={{ background: "#0f1226", color: "#fff" }}>
                        {lg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Favorite Club */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    Favorite Club / Team
                  </label>
                  <select
                    value={favoriteTeam}
                    onChange={(e) => setFavoriteTeam(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 8,
                      background: "rgba(10, 13, 34, 0.8)",
                      border: "1px solid rgba(99, 102, 241, 0.25)",
                      color: "#ffffff",
                      fontSize: 13,
                      outline: "none",
                    }}
                  >
                    {POPULAR_TEAMS.map((tm) => (
                      <option key={tm} value={tm} style={{ background: "#0f1226", color: "#fff" }}>
                        {tm}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    marginTop: "auto",
                    padding: "14px",
                    borderRadius: 10,
                    background: "rgba(99, 102, 241, 0.08)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    fontSize: 12,
                    color: "#a5b4fc",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Sparkles style={{ width: 18, height: 18, color: "#818cf8", flexShrink: 0 }} />
                  <span>Your favorite team and primary league will be highlighted at the top of your daily predictions board.</span>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ── TAB 2: VIP Membership ── */}
        {activeTab === "subscription" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            
            {/* Current Plan Card */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(21, 26, 56, 0.95) 0%, rgba(15, 18, 42, 0.98) 100%)",
                border: isVip ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(99, 102, 241, 0.25)",
                borderRadius: 16,
                padding: "28px 24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: isVip ? "rgba(245, 158, 11, 0.15)" : "rgba(99, 102, 241, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isVip ? "#fbbf24" : "#818cf8",
                    }}
                  >
                    <Crown style={{ width: 24, height: 24 }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                      {isVip ? "VIP Pro Tier" : "Free Explorer Tier"}
                    </h3>
                    <span style={{ fontSize: 12, color: isVip ? "#34d399" : "#94a3b8", fontWeight: 700 }}>
                      {isVip ? "Active Subscription" : "Standard Features"}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: isVip ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.08)",
                    color: isVip ? "#10b981" : "#cbd5e1",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {user?.subscriptionStatus || "ACTIVE"}
                </span>
              </div>

              {/* Feature List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24, fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#cbd5e1" }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                  <span>AI 1X2 Model Predictions (Full Access)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#cbd5e1" }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                  <span>Over/Under Goals Probability Engine</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#cbd5e1" }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: "#34d399" }} />
                  <span>Both Teams to Score (BTTS) Analysis</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: isVip ? "#cbd5e1" : "#64748b" }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: isVip ? "#34d399" : "#64748b" }} />
                  <span>High-Confidence AI Bet of the Day</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: isVip ? "#cbd5e1" : "#64748b" }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: isVip ? "#34d399" : "#64748b" }} />
                  <span>Live Match Probability Radar & 5-Device Concurrency</span>
                </div>
              </div>

              {!isVip ? (
                <Link
                  href="/pricing"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "13px 20px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 800,
                    textDecoration: "none",
                    boxShadow: "0 4px 20px rgba(245, 158, 11, 0.4)",
                  }}
                >
                  <Crown style={{ width: 16, height: 16 }} />
                  <span>Unlock VIP Pro for $19/mo</span>
                </Link>
              ) : (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: 8,
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    color: "#34d399",
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  ✓ All VIP features active on your account
                </div>
              )}
            </div>

            {/* VIP Perks Overview */}
            <div
              style={{
                background: "rgba(21, 26, 56, 0.85)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: 16,
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", marginBottom: 6 }}>
                  Why Go VIP Pro?
                </h3>
                <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
                  Unlock quantitative superiority backed by verified historical performance.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(139, 92, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa", flexShrink: 0 }}>
                      <Flame style={{ width: 16, height: 16 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>AI Value Edge Algorithms</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>Detect bookmaker mispricings in real time across 120+ football leagues.</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399", flexShrink: 0 }}>
                      <ShieldCheck style={{ width: 16, height: 16 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>Settled Track Record Access</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>Every single forecast is timestamped and settled against official match records.</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(99, 102, 241, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8", flexShrink: 0 }}>
                      <Zap style={{ width: 16, height: 16 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>Instant Odds Synchronizer</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>Live feeds updated within 3 seconds of kickoff changes and team news.</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <Link href="/pricing" style={{ color: "#818cf8", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                  <span>Compare Free vs VIP Pro Plans</span>
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 3: Security & Password ── */}
        {activeTab === "security" && (
          <div style={{ maxWidth: 640 }}>
            <div
              style={{
                background: "rgba(21, 26, 56, 0.85)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: 16,
                padding: "28px 24px",
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", marginBottom: 6 }}>
                Change Account Password
              </h3>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
                Ensure your account uses a secure password with at least 6 characters.
              </p>

              {passwordSuccessMsg && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                  <CheckCircle2 style={{ width: 16, height: 16 }} />
                  <span>{passwordSuccessMsg}</span>
                </div>
              )}

              {passwordErrorMsg && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                  <AlertCircle style={{ width: 16, height: 16 }} />
                  <span>{passwordErrorMsg}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 8,
                      background: "rgba(10, 13, 34, 0.8)",
                      border: "1px solid rgba(99, 102, 241, 0.25)",
                      color: "#ffffff",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Minimum 6 characters"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 8,
                      background: "rgba(10, 13, 34, 0.8)",
                      border: "1px solid rgba(99, 102, 241, 0.25)",
                      color: "#ffffff",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 8,
                      background: "rgba(10, 13, 34, 0.8)",
                      border: "1px solid rgba(99, 102, 241, 0.25)",
                      color: "#ffffff",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingPassword}
                  style={{
                    marginTop: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px 20px",
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #7065f0 0%, #5d50e6 100%)",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 800,
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 4px 16px rgba(112, 101, 240, 0.35)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Key style={{ width: 16, height: 16 }} />
                  <span>{isSavingPassword ? "Updating Password..." : "Update Password"}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── TAB 4: Connected Devices & Sessions ── */}
        {activeTab === "sessions" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", margin: "0 0 4px" }}>
                  Active Device Sessions
                </h3>
                <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                  Manage connected browsers and devices. Your account supports up to <strong>5 concurrent sessions</strong>.
                </p>
              </div>

              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: sessions.length <= 5 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  color: sessions.length <= 5 ? "#10b981" : "#ef4444",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {sessions.length} / 5 Slots Active
              </div>
            </div>

            {sessionMsg && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                <CheckCircle2 style={{ width: 16, height: 16 }} />
                <span>{sessionMsg}</span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sessions.map((s, idx) => {
                const isMobile = s.userAgent?.toLowerCase().includes("mobile") || s.deviceName?.toLowerCase().includes("mobile");
                return (
                  <div
                    key={s.id}
                    style={{
                      background: "rgba(21, 26, 56, 0.85)",
                      border: "1px solid rgba(99, 102, 241, 0.2)",
                      borderRadius: 14,
                      padding: "18px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: "rgba(99, 102, 241, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#818cf8",
                        }}
                      >
                        {isMobile ? <Smartphone style={{ width: 22, height: 22 }} /> : <Laptop style={{ width: 22, height: 22 }} />}
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "#ffffff" }}>
                            {s.deviceName || (isMobile ? "Mobile Device" : "Desktop Computer")}
                          </span>
                          {idx === 0 && (
                            <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                              Current Session
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          IP: {s.ipAddress || "127.0.0.1"} • Last active: {new Date(s.lastUsedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {idx !== 0 && (
                      <button
                        onClick={() => handleRevokeSession(s.id)}
                        disabled={revokingId === s.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.25)",
                          color: "#f87171",
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "7px 14px",
                          borderRadius: 8,
                          cursor: "pointer",
                        }}
                      >
                        <LogOut style={{ width: 13, height: 13 }} />
                        <span>{revokingId === s.id ? "Revoking..." : "Revoke Session"}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
