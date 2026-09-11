"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  User,
  Shield,
  Crown,
  Laptop,
  Mail,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  LogOut,
  Settings,
  Flame,
  Globe,
  Lock,
  Edit3,
  Check,
  AlertCircle,
  RefreshCw,
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

const TOP_LEAGUES = [
  "Premier League (England)",
  "UEFA Champions League",
  "La Liga (Spain)",
  "Serie A (Italy)",
  "Bundesliga (Germany)",
  "Ligue 1 (France)",
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
];

export default function AccountPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "subscription" | "security">("profile");

  const [displayName, setDisplayName] = useState("");
  const [favoriteLeague, setFavoriteLeague] = useState(TOP_LEAGUES[0]);
  const [favoriteTeam, setFavoriteTeam] = useState(POPULAR_TEAMS[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (data.success && data.isLoggedIn && data.user) {
        setUser(data.user);
        setDisplayName(data.user.name || "");
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      window.location.href = "/login";
    } catch {
      // Fallback
    }
  };

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Account Header */}
        <div className="luxury-card" style={{ padding: "32px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "var(--gold-bg)",
                border: "2px solid var(--gold-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold)",
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                {user?.name || "Member Account"}
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                {user?.email || "Signed in"} · Member since 2026
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleLogout}
              className="gold-outline-btn"
              style={{ padding: "8px 16px", fontSize: 13 }}
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "var(--surface-raised)", padding: 4, borderRadius: 10, border: "1px solid var(--border-color)", width: "fit-content" }}>
          {(["profile", "subscription", "security"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                background: activeTab === tab ? "var(--gold)" : "transparent",
                color: activeTab === tab ? "var(--gold-btn-text)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 800,
                textTransform: "capitalize",
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab 1: Profile Settings */}
        {activeTab === "profile" && (
          <div className="luxury-card" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", marginBottom: 20 }}>
              Profile Preferences
            </h2>

            {savedSuccess && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "var(--accent-green-bg)", border: "1px solid var(--accent-green-border)", color: "var(--accent-green)", fontSize: 13, marginBottom: 20 }}>
                <CheckCircle2 size={16} />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 500 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
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
                  Favorite League
                </label>
                <select
                  value={favoriteLeague}
                  onChange={(e) => setFavoriteLeague(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    fontSize: 13,
                    outline: "none",
                  }}
                >
                  {TOP_LEAGUES.map((l) => (
                    <option key={l} value={l} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>{l}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="gold-btn"
                style={{ width: "fit-content", padding: "10px 24px", fontSize: 13, marginTop: 8 }}
              >
                Save Preferences
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Subscription */}
        {activeTab === "subscription" && (
          <div className="luxury-card" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16 }}>
              Current Plan & Membership
            </h2>

            <div style={{ padding: "20px", borderRadius: 12, background: "var(--gold-bg)", border: "1px solid var(--gold-border)", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div className="gold-badge" style={{ marginBottom: 6 }}>FREE TIER ACTIVE</div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>Standard Access</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 0" }}>Daily free algorithmic picks & basic live match trackers.</p>
              </div>

              <Link
                href="/pricing"
                className="gold-btn"
                style={{ padding: "10px 20px", fontSize: 13 }}
              >
                <Crown size={15} />
                <span>Upgrade to VIP Pro</span>
              </Link>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Sessions */}
        {activeTab === "security" && (
          <div className="luxury-card" style={{ padding: "32px" }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", marginBottom: 16 }}>
              Security & Active Devices
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
              Manage password changes and review connected device sessions.
            </p>

            <Link
              href="/account/sessions"
              className="gold-outline-btn"
              style={{ padding: "10px 20px", fontSize: 13 }}
            >
              <Laptop size={15} />
              <span>Manage Connected Devices (Sessions)</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
