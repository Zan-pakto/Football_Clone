"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crown,
  LogOut,
  LogIn,
  X,
  Search,
  UserPlus,
  User,
} from "lucide-react";

interface NavbarProps {
  liveCount?: number;
  onSync?: () => void;
  isSyncing?: boolean;
}

const navLinks = [
  { href: "/bet-of-the-day", label: "Bet of the day" },
  { href: "/all-matches", label: "All Matches" },
  { href: "/bet-builder", label: "Bet Builder" },
  { href: "/leagues", label: "Leagues" },
  { href: "/progress", label: "Progress" },
  { href: "/hit-and-win", label: "Hit&Win" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/blog", label: "Blog" },
];

export default function Navbar({ liveCount = 0 }: NavbarProps) {
  const pathname = usePathname();

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Fetch current auth status
  const checkAuthStatus = useCallback(async () => {
    try {
      setLoadingAuth(true);
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (data.success && data.isLoggedIn && data.user) {
        setIsLoggedIn(true);
        setCurrentUser(data.user);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
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

  // Scroll listener for dynamic navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      setIsLoggedIn(false);
      setCurrentUser(null);
      window.location.reload();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isLanding = pathname === "/" || pathname === "";
  const isNavOpaque = !isLanding || isScrolled;

  return (
    <>
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        zIndex: 50,
        background: isNavOpaque ? "rgba(18, 22, 50, 0.92)" : "transparent",
        backdropFilter: isNavOpaque ? "blur(16px)" : "none",
        WebkitBackdropFilter: isNavOpaque ? "blur(16px)" : "none",
        borderBottom: isNavOpaque ? "1px solid rgba(168, 85, 247, 0.2)" : "1px solid transparent",
        boxShadow: isNavOpaque ? "0 4px 24px rgba(10, 12, 30, 0.6), 0 0 20px rgba(139, 92, 246, 0.08)" : "none",
        transition: "background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease",
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
          {/* Brand Logo - JollofTips Style */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
              boxShadow: "0 0 14px rgba(249,115,22,0.45)",
              transform: "skew(-6deg)",
            }}>
              <span style={{
                color: "#ffffff",
                fontWeight: 900,
                fontSize: 16,
                fontStyle: "italic",
                letterSpacing: "-0.5px",
                transform: "skew(6deg)",
                userSelect: "none",
              }}>
                JT
              </span>
            </div>
            <span style={{
              fontSize: 18,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "0.5px",
              fontFamily: "inherit",
              textTransform: "uppercase",
            }}>
              JOLLOF<span style={{ color: "#f97316", fontWeight: 900 }}>TIPS</span>
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

          {/* Right Action Icons & Auth */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {/* Quick Search */}
            <button
              onClick={() => setShowSearchModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 8,
                padding: "6px 12px",
                color: "#94a3b8",
                fontSize: 12,
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
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

            {/* Direct Login / Register Links or Active User Pill */}
            {!loadingAuth && (
              isLoggedIn && currentUser ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Link
                    href="/account"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: 999,
                      padding: "3px 12px 3px 4px",
                      textDecoration: "none",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: currentUser.role === "ADMIN" ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: currentUser.role === "ADMIN" ? "#451a03" : "#022c22",
                      fontWeight: 800,
                      fontSize: 12,
                    }}>
                      {(currentUser.name || currentUser.email || "U").charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>
                      {currentUser.name || currentUser.email?.split("@")[0] || "My Account"}
                    </span>
                    {currentUser.role === "ADMIN" && (
                      <Crown style={{ width: 12, height: 12, color: "#fbbf24" }} />
                    )}
                  </Link>

                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      color: "#f87171",
                      borderRadius: 8,
                      padding: "6px 8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LogOut style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Link
                    href="/login"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      color: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 8,
                      padding: "6px 14px",
                      fontSize: 12,
                      fontWeight: 800,
                      textDecoration: "none",
                      boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 0 22px rgba(99, 102, 241, 0.65)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 0 16px rgba(99, 102, 241, 0.4)";
                    }}
                  >
                    <LogIn style={{ width: 14, height: 14, strokeWidth: 2.2 }} />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/register"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "#cbd5e1",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <UserPlus style={{ width: 13, height: 13, color: "#818cf8" }} />
                    <span>Register</span>
                  </Link>
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

      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .nav-links-container { display: none !important; }
          .search-label { display: none; }
        }
      `}</style>
    </>
  );
}
