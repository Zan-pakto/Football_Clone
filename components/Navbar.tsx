"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw, Crown, LogOut, LogIn, X, Key, Check, AlertCircle, User, Lock } from "lucide-react";

interface NavbarProps {
  liveCount?: number;
  onSync?: () => void;
  isSyncing?: boolean;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/all-matches", label: "All Matches" },
  { href: "/leagues", label: "Leagues" },
];

export default function Navbar({ liveCount = 0, onSync, isSyncing = false }: NavbarProps) {
  const pathname = usePathname();

  // Premium Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
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
        background: "#0d1220",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 1px 12px rgba(0,0,0,0.4)",
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 58,
        }}>
          {/* Brand */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{
              fontSize: 18,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-0.5px",
            }}>
              NERDYTIPS
            </span>
          </Link>

          {/* Nav Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#fff" : "#94a3b8",
                    textDecoration: "none",
                    borderBottom: isActive ? "2px solid #10b981" : "2px solid transparent",
                    transition: "all 0.15s",
                    height: 58,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Controls: Live + Sync + Premium Login/Logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {liveCount > 0 && (
              <Link
                href="/live"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 700, color: "#10b981",
                  background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                  padding: "5px 11px", borderRadius: 999, textDecoration: "none",
                }}
              >
                <span style={{ position: "relative", display: "flex", width: 7, height: 7 }}>
                  <span style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: "#10b981", opacity: 0.75,
                    animation: "ping 1.2s cubic-bezier(0,0,0.2,1) infinite",
                  }} />
                  <span style={{ position: "relative", width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} />
                </span>
                LIVE {liveCount}
              </Link>
            )}

            {onSync && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "transparent", color: "#64748b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 6,
                  cursor: isSyncing ? "not-allowed" : "pointer",
                  opacity: isSyncing ? 0.6 : 1,
                  transition: "all 0.15s",
                }}
              >
                <RefreshCw style={{ width: 12, height: 12, animation: isSyncing ? "spin 1s linear infinite" : "none" }} />
                {isSyncing ? "Syncing..." : "Sync"}
              </button>
            )}

            {/* Premium Login / Logout Controls */}
            {!loadingAuth && (
              isLoggedIn ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    color: "#fbbf24",
                    fontSize: 11, fontWeight: 700,
                    padding: "5px 10px", borderRadius: 6,
                  }}>
                    <Crown style={{ width: 13, height: 13, color: "#f59e0b" }} />
                    <span>Premium</span>
                  </div>

                  <button
                    onClick={handleLogout}
                    disabled={isSubmitting}
                    title="Logout Premium Session"
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      color: "#f87171",
                      fontSize: 11, fontWeight: 700,
                      padding: "5px 11px", borderRadius: 6,
                      cursor: isSubmitting ? "wait" : "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <LogOut style={{ width: 12, height: 12 }} />
                    {isSubmitting ? "Logging out..." : "Logout"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#000",
                    border: "none",
                    fontSize: 11, fontWeight: 800,
                    padding: "6px 14px", borderRadius: 6,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(16,185,129,0.25)",
                    transition: "all 0.15s",
                  }}
                >
                  <Crown style={{ width: 13, height: 13 }} />
                  <span>Login (Premium)</span>
                </button>
              )
            )}
          </div>
        </div>
      </nav>

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
            background: "#0f172a",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
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
                background: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Crown style={{ width: 20, height: 20, color: "#f59e0b" }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>
                  NerdyTips Premium Auth
                </h3>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>
                  Manage session authentication & unlock full AI predictions
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: "flex",
              background: "#080d18",
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
                      placeholder="e.g. user@example.com"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#080d18",
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
                        background: "#080d18",
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
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#000",
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
                      background: "#080d18",
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
          </div>
        </div>
      )}

      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
