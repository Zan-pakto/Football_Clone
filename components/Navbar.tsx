"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw, Crown, LogOut, LogIn, X, Key, Check, AlertCircle, User, Lock, Search, ChevronDown } from "lucide-react";

interface NavbarProps {
  liveCount?: number;
  onSync?: () => void;
  isSyncing?: boolean;
}

const navLinks = [
  { href: "/all-matches?filter=predicted", label: "Bet of the day" },
  { href: "/all-matches", label: "All Matches" },
  { href: "/all-matches", label: "Bet Builder" },
  { href: "/leagues", label: "Leagues" },
  { href: "/all-matches?filter=won", label: "Progress" },
  { href: "/all-matches?filter=won", label: "Hit&Win" },
  { href: "/#story", label: "How it works" },
  { href: "/#story", label: "Blog" },
];

export default function Navbar({ liveCount = 0, onSync, isSyncing = false }: NavbarProps) {
  const pathname = usePathname();

  // Premium Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("Don");
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"credentials" | "cookie">("credentials");

  // Form states
  const [formUsername, setFormUsername] = useState<string>("");
  const [formPassword, setFormPassword] = useState<string>("");
  const [formCookie, setFormCookie] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Fetch current auth status
  const checkAuthStatus = useCallback(async () => {
    try {
      setLoadingAuth(true);
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(Boolean(data.isLoggedIn));
        if (data.username) setUsername(data.username);
      }
    } catch (err) {
      console.error("Failed to check auth status:", err);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Keyboard shortcut for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle Login via Credentials
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          username: formUsername,
          password: formPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        if (data.username) setUsername(data.username);
        setAuthSuccess("Successfully authenticated Premium session!");
        setTimeout(() => {
          setShowModal(false);
          setAuthSuccess(null);
        }, 1200);
      } else {
        setAuthError(data.error || "Login failed. Please check credentials.");
      }
    } catch (err: any) {
      setAuthError(err.message || "An unexpected error occurred during login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Cookie Paste Submit
  const handleCookieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cookie",
          cookie: formCookie,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        if (data.username) setUsername(data.username);
        setAuthSuccess("Session cookie saved successfully!");
        setTimeout(() => {
          setShowModal(false);
          setAuthSuccess(null);
        }, 1200);
      } else {
        setAuthError(data.error || "Failed to update cookie.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to update session cookie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(false);
        setUsername("");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#080915",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
      }}>
        <div style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
          gap: 16,
        }}>
          {/* Brand Logo - Exact NerdyTips Style */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 6,
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              boxShadow: "0 0 12px rgba(239,68,68,0.4)",
              transform: "skew(-8deg)",
            }}>
              <span style={{
                color: "#ffffff",
                fontWeight: 900,
                fontSize: 16,
                fontStyle: "italic",
                letterSpacing: "-1px",
                transform: "skew(8deg)",
                userSelect: "none",
              }}>
                NT
              </span>
            </div>
            <span style={{
              fontSize: 17,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.5px",
              fontFamily: "inherit",
              textTransform: "uppercase",
            }}>
              NERDY<span style={{ color: "#ffffff", fontWeight: 800 }}>TIPS</span>
            </span>
          </Link>

          {/* Nav Links - Exact NerdyTips List */}
          <div className="nav-links-container" style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "nowrap" }}>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "6px 12px",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#ffffff" : "#94a3b8",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    borderRadius: 6,
                    transition: "color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = isActive ? "#ffffff" : "#94a3b8"; }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Controls: Flag + Search + User Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {/* Live Matches Pill */}
            {liveCount > 0 && (
              <Link
                href="/all-matches?filter=live"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 11, fontWeight: 800, color: "#10b981",
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                  padding: "4px 10px", borderRadius: 999, textDecoration: "none",
                }}
              >
                <span style={{ position: "relative", display: "flex", width: 6, height: 6 }}>
                  <span style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: "#10b981", opacity: 0.75,
                    animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite",
                  }} />
                  <span style={{ position: "relative", width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                </span>
                LIVE {liveCount}
              </Link>
            )}

            {/* Sync button */}
            {onSync && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                title="Sync latest odds and predictions"
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "rgba(255,255,255,0.04)", color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 6,
                  cursor: isSyncing ? "not-allowed" : "pointer",
                  opacity: isSyncing ? 0.6 : 1,
                  transition: "all 0.15s",
                }}
              >
                <RefreshCw style={{ width: 11, height: 11, animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
                <span className="sync-text">{isSyncing ? "Syncing" : "Sync"}</span>
              </button>
            )}

            {/* Country / Language Dropdown Pill (UK Flag) */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "4px 8px",
              borderRadius: 8,
              cursor: "pointer",
            }}>
              <span style={{ fontSize: 14 }}>🇬🇧</span>
              <ChevronDown style={{ width: 12, height: 12, color: "#64748b" }} />
            </div>

            {/* Search Pill (Search ⌘K) */}
            <button
              onClick={() => setShowSearchModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "5px 12px",
                color: "#94a3b8",
                fontSize: 12,
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            >
              <Search style={{ width: 13, height: 13, color: "#64748b" }} />
              <span className="search-label">Search</span>
              <span style={{
                background: "rgba(255,255,255,0.07)",
                fontSize: 10,
                fontWeight: 700,
                color: "#64748b",
                padding: "1px 5px",
                borderRadius: 4,
                fontFamily: "monospace",
              }}>
                ⌘K
              </span>
            </button>

            {/* User Profile Avatar Pill (Don / Premium) */}
            {!loadingAuth && (
              isLoggedIn ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(99, 102, 241, 0.12)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  borderRadius: 999,
                  padding: "3px 10px 3px 4px",
                  cursor: "pointer",
                }}
                onClick={() => setShowModal(true)}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 11,
                  }}>
                    {username ? username.charAt(0).toUpperCase() : "D"}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>
                    {username || "Don"}
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(99, 102, 241, 0.12)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    borderRadius: 999,
                    padding: "3px 12px 3px 4px",
                    cursor: "pointer",
                  }}
                  onClick={() => setShowModal(true)}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 11,
                  }}>
                    D
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>
                    Don
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </nav>

      {/* ── Search Modal ── */}
      {showSearchModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 110,
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 16px 16px",
        }}
        onClick={() => setShowSearchModal(false)}
        >
          <div
            style={{
              background: "#0d1220",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              maxWidth: 540,
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 25px 50px rgba(0,0,0,0.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <Search style={{ width: 16, height: 16, color: "#94a3b8", marginRight: 10 }} />
              <input
                type="text"
                autoFocus
                placeholder="Search matches, leagues, teams or countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    window.location.href = `/all-matches?q=${encodeURIComponent(searchQuery.trim())}`;
                  }
                }}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                onClick={() => setShowSearchModal(false)}
                style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div style={{ padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#64748b", width: "100%", marginBottom: 4 }}>Quick Navigation:</span>
              {[
                { label: "Premier League", href: "/all-matches?q=Premier%20League" },
                { label: "La Liga", href: "/all-matches?q=La%20Liga" },
                { label: "Champions League", href: "/all-matches?q=Champions" },
                { label: "Live Matches", href: "/all-matches?filter=live" },
                { label: "All Leagues Directory", href: "/leagues" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setShowSearchModal(false)}
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    background: "#13172e",
                    border: "1px solid rgba(255,255,255,0.06)",
                    padding: "5px 10px",
                    borderRadius: 6,
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Premium Auth Modal ── */}
      {showModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}>
          <div style={{
            background: "#0d1220",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            maxWidth: 440,
            width: "100%",
            padding: 24,
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            position: "relative",
          }}>
            {/* Close Button */}
            <button
              onClick={() => {
                setShowModal(false);
                setAuthError(null);
                setAuthSuccess(null);
              }}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: 4,
                borderRadius: 4,
              }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>

            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Crown style={{ width: 20, height: 20, color: "#6366f1" }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>
                  NerdyTips Account & Auth
                </h3>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>
                  Manage Premium session and unlock all AI match predictions
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: "flex",
              background: "#080915",
              borderRadius: 8,
              padding: 3,
              marginBottom: 18,
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <button
                type="button"
                onClick={() => { setActiveTab("credentials"); setAuthError(null); }}
                style={{
                  flex: 1,
                  padding: "7px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "none",
                  background: activeTab === "credentials" ? "#1e293b" : "transparent",
                  color: activeTab === "credentials" ? "#fff" : "#64748b",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Login Credentials
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("cookie"); setAuthError(null); }}
                style={{
                  flex: 1,
                  padding: "7px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: "none",
                  background: activeTab === "cookie" ? "#1e293b" : "transparent",
                  color: activeTab === "cookie" ? "#fff" : "#64748b",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Paste Cookie
              </button>
            </div>

            {/* Alerts */}
            {authError && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171", padding: "10px 12px", borderRadius: 6,
                fontSize: 12, marginBottom: 14, lineHeight: 1.4,
              }}>
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
                <div>{authError}</div>
              </div>
            )}

            {authSuccess && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#34d399", padding: "10px 12px", borderRadius: 6,
                fontSize: 12, marginBottom: 14,
              }}>
                <Check style={{ width: 16, height: 16, flexShrink: 0 }} />
                <div>{authSuccess}</div>
              </div>
            )}

            {/* Form 1: Credentials */}
            {activeTab === "credentials" && (
              <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    Username or Email
                  </label>
                  <div style={{ position: "relative" }}>
                    <User style={{ position: "absolute", left: 12, top: 11, width: 15, height: 15, color: "#64748b" }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. don@nerdytips.com"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#080915",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 6,
                        padding: "9px 12px 9px 36px",
                        color: "#fff",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock style={{ position: "absolute", left: 12, top: 11, width: 15, height: 15, color: "#64748b" }} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#080915",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 6,
                        padding: "9px 12px 9px 36px",
                        color: "#fff",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    marginTop: 6,
                    width: "100%",
                    padding: "10px",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: isSubmitting ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <LogIn style={{ width: 14, height: 14 }} />
                      <span>Log In to NerdyTips</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Form 2: Manual Cookie */}
            {activeTab === "cookie" && (
              <form onSubmit={handleCookieSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 6 }}>
                    Session Cookie String
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Paste full cookie string (e.g. PHPSESSID=... or nerdytips_session=...)"
                    value={formCookie}
                    onChange={(e) => setFormCookie(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#080915",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 6,
                      padding: "10px 12px",
                      color: "#fff",
                      fontSize: 12,
                      fontFamily: "monospace",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                  <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                    Tip: If standard login hits a device limit error, copy your active browser cookie from nerdytips.com and paste it here.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: isSubmitting ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                      <span>Saving Cookie...</span>
                    </>
                  ) : (
                    <>
                      <Key style={{ width: 14, height: 14 }} />
                      <span>Save Session Cookie</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {isLoggedIn && (
              <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}>
                <button
                  onClick={handleLogout}
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    borderRadius: 6,
                    color: "#f87171",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <LogOut style={{ width: 14, height: 14 }} />
                  <span>Logout Current Session</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .nav-links-container { display: none !important; }
          .search-label { display: none; }
        }
        @media (max-width: 640px) {
          .sync-text { display: none; }
        }
      `}</style>
    </>
  );
}
