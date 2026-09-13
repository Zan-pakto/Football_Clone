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
  User,
  Menu,
  Flame,
  Activity,
  Zap,
  Trophy,
  TrendingUp,
  HelpCircle,
  BookOpen,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  liveCount?: number;
  onSync?: () => void;
  isSyncing?: boolean;
}

const navLinks = [
  { href: "/bet-of-the-day", label: "Bet of the day", icon: Flame },
  { href: "/all-matches", label: "All Matches", icon: Activity },
  { href: "/bet-builder", label: "Bet Builder", icon: Zap },
  { href: "/leagues", label: "Leagues", icon: Trophy },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/hit-and-win", label: "Hit&Win", icon: Flame },
  { href: "/how-it-works", label: "How it works", icon: HelpCircle },
  { href: "/blog", label: "Blog", icon: BookOpen },
];

export default function Navbar({ liveCount = 0 }: NavbarProps) {
  const pathname = usePathname();

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Fetch current auth status
  const checkAuthStatus = useCallback(async () => {
    try {
      setLoadingAuth(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch("/api/auth", {
        headers,
        credentials: "include",
      });
      const data = await res.json();
      if (data.success && data.isLoggedIn && data.user) {
        if (data.token && typeof window !== "undefined") {
          localStorage.setItem("jt_auth_token", data.token);
        }
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
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Keyboard shortcut for Cmd+K / Ctrl+K
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
      }
      setIsLoggedIn(false);
      setCurrentUser(null);
      window.location.reload();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════
          1. TOP MAIN HEADER (DESKTOP & MOBILE)
          ══════════════════════════════════════════════════════════════ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          background: isScrolled ? "rgba(10, 8, 29, 0.95)" : "rgba(10, 8, 29, 0.8)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${isScrolled ? "rgba(167, 159, 255, 0.14)" : "rgba(167, 159, 255, 0.08)"}`,
          transition: "background 0.25s ease, border-color 0.25s ease",
        }}
      >
        <div
          style={{
            maxWidth: 1360,
            margin: "0 auto",
            padding: "0 16px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Left: Brand Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "linear-gradient(135deg, rgba(124, 108, 245, 0.3) 0%, rgba(106, 92, 240, 0.15) 100%)",
                border: "1px solid rgba(124, 108, 245, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 13,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                boxShadow: "0 0 14px rgba(124, 108, 245, 0.3)",
              }}
            >
              JT
            </div>
            <span
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              JOLLOF<span style={{ color: "#8b7ff5" }}>TIPS</span>
            </span>
          </Link>

          {/* Center: Desktop Navigation Links (Desktop Only) */}
          <nav
            className="navbar-desktop-links"
            style={{
              alignItems: "center",
              gap: 2,
            }}
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? "#ffffff" : "#a79fff",
                    background: isActive ? "rgba(124, 108, 245, 0.18)" : "transparent",
                    transition: "all 0.15s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    border: isActive ? "1px solid rgba(124, 108, 245, 0.4)" : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.background = "#1b183d";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "#a79fff";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Quick Search Button (Desktop: bar with ⌘K, Mobile: icon button) */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="navbar-search-btn-desktop"
              style={{
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 8,
                background: "#141132",
                border: "1px solid rgba(167, 159, 255, 0.15)",
                color: "#a79fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Search size={14} />
              <span>Search</span>
              <kbd
                style={{
                  padding: "1px 5px",
                  borderRadius: 4,
                  background: "#1b183d",
                  border: "1px solid rgba(167, 159, 255, 0.1)",
                  fontSize: 10,
                  color: "#7874a4",
                }}
              >
                ⌘K
              </kbd>
            </button>

            {/* Mobile-Only Compact Search Icon */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="navbar-search-btn-mobile"
              aria-label="Search"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#141132",
                border: "1px solid rgba(167, 159, 255, 0.15)",
                color: "#a79fff",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Search size={16} />
            </button>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Desktop VIP Access (Hidden on mobile to prevent overflow) */}
            <Link
              href="/pricing"
              className="navbar-desktop-only"
              style={{
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 8,
                background: "rgba(124, 108, 245, 0.18)",
                border: "1px solid rgba(124, 108, 245, 0.45)",
                color: "#8b7ff5",
                fontSize: 12,
                fontWeight: 800,
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#7c6cf5";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(124, 108, 245, 0.18)";
                e.currentTarget.style.color = "#8b7ff5";
              }}
            >
              <Crown size={14} />
              <span>VIP Access</span>
            </Link>

            {/* Desktop Auth Button (Hidden on mobile) */}
            <div className="navbar-desktop-only">
              {loadingAuth ? (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#141132",
                  }}
                />
              ) : isLoggedIn ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Link
                    href="/account"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 10px 4px 6px",
                      borderRadius: 999,
                      background: "#141132",
                      border: "1px solid rgba(167, 159, 255, 0.15)",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "#2fd08a",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 11,
                      }}
                    >
                      {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {currentUser?.name || "Account"}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Log out"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "transparent",
                      border: "1px solid rgba(167, 159, 255, 0.15)",
                      color: "#7874a4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: "#141132",
                    border: "1px solid rgba(167, 159, 255, 0.18)",
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    textDecoration: "none",
                  }}
                >
                  <LogIn size={14} />
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="navbar-mobile-toggle"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#141132",
                border: "1px solid rgba(167, 159, 255, 0.15)",
                color: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          2. SLIDE-OUT MOBILE DRAWER (SMOOTH SLIDE FROM RIGHT)
          ══════════════════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
          }}
        >
          {/* Backdrop Scrim */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(10, 8, 29, 0.8)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* Drawer Panel */}
          <aside
            style={{
              position: "relative",
              marginLeft: "auto",
              width: "82%",
              maxWidth: 320,
              height: "100%",
              background: "#141132",
              borderLeft: "1px solid rgba(167, 159, 255, 0.15)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-12px 0 36px rgba(0,0,0,0.8)",
              zIndex: 101,
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(167, 159, 255, 0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "rgba(124, 108, 245, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 12,
                    color: "#ffffff",
                  }}
                >
                  JT
                </div>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#ffffff" }}>
                  JOLLOF<span style={{ color: "#8b7ff5" }}>TIPS</span>
                </span>
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid rgba(167, 159, 255, 0.15)",
                  color: "#a79fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
              className="no-scrollbar"
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "11px 14px",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? "#ffffff" : "#d4cde3",
                      background: isActive ? "rgba(124, 108, 245, 0.2)" : "transparent",
                      border: isActive ? "1px solid rgba(124, 108, 245, 0.4)" : "1px solid transparent",
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <IconComponent size={16} color={isActive ? "#8b7ff5" : "#7874a4"} />
                      <span>{link.label}</span>
                    </div>
                    <ChevronRight size={14} color="#7874a4" />
                  </Link>
                );
              })}
            </div>

            {/* Drawer Bottom Actions */}
            <div
              style={{
                padding: "16px 18px",
                borderTop: "1px solid rgba(167, 159, 255, 0.1)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                background: "#0e0c26",
              }}
            >
              {isLoggedIn ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "#2fd08a",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {currentUser?.name || "Member"}
                      </div>
                      <div style={{ fontSize: 11, color: "#7874a4" }}>{currentUser?.email || ""}</div>
                    </div>
                  </div>

                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-ghost"
                    style={{ width: "100%", height: 42, fontSize: 13 }}
                  >
                    My Account
                  </Link>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    style={{
                      width: "100%",
                      height: 40,
                      borderRadius: 10,
                      background: "transparent",
                      border: "1px solid rgba(251, 113, 133, 0.3)",
                      color: "#fb7185",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-primary"
                    style={{ width: "100%", height: 44, fontSize: 14 }}
                  >
                    <Crown size={15} />
                    <span>Get VIP Access</span>
                  </Link>

                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-ghost"
                    style={{ width: "100%", height: 44, fontSize: 14 }}
                  >
                    <LogIn size={15} />
                    <span>Log In</span>
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          3. AUTHENTIC MOBILE BOTTOM NAVIGATION BAR (FIXED ON MOBILE)
          ══════════════════════════════════════════════════════════════ */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 45,
          background: "rgba(14, 11, 38, 0.94)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderTop: "1px solid rgba(167, 159, 255, 0.12)",
          height: 62,
          padding: "0 8px",
          alignItems: "center",
          justifyContent: "space-around",
        }}
      >
        {/* Item 1: Bankers */}
        <Link
          href="/bet-of-the-day"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            flex: 1,
            height: "100%",
            color: pathname === "/bet-of-the-day" ? "#ffffff" : "#7874a4",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              padding: "3px 12px",
              borderRadius: 12,
              background: pathname === "/bet-of-the-day" ? "rgba(124, 108, 245, 0.22)" : "transparent",
            }}
          >
            <Flame size={18} color={pathname === "/bet-of-the-day" ? "#8b7ff5" : "#7874a4"} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.02em" }}>Bankers</span>
        </Link>

        {/* Item 2: All Matches */}
        <Link
          href="/all-matches"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            flex: 1,
            height: "100%",
            color: pathname === "/all-matches" ? "#ffffff" : "#7874a4",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              padding: "3px 12px",
              borderRadius: 12,
              background: pathname === "/all-matches" ? "rgba(124, 108, 245, 0.22)" : "transparent",
            }}
          >
            <Activity size={18} color={pathname === "/all-matches" ? "#8b7ff5" : "#7874a4"} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.02em" }}>All Matches</span>
        </Link>

        {/* Item 3: Bet Builder */}
        <Link
          href="/bet-builder"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            flex: 1,
            height: "100%",
            color: pathname === "/bet-builder" ? "#ffffff" : "#7874a4",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              padding: "3px 12px",
              borderRadius: 12,
              background: pathname === "/bet-builder" ? "rgba(124, 108, 245, 0.22)" : "transparent",
            }}
          >
            <Zap size={18} color={pathname === "/bet-builder" ? "#8b7ff5" : "#7874a4"} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.02em" }}>Builder</span>
        </Link>

        {/* Item 4: VIP Pricing */}
        <Link
          href="/pricing"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            flex: 1,
            height: "100%",
            color: pathname === "/pricing" ? "#ffffff" : "#7874a4",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              padding: "3px 12px",
              borderRadius: 12,
              background: pathname === "/pricing" ? "rgba(124, 108, 245, 0.22)" : "transparent",
            }}
          >
            <Crown size={18} color={pathname === "/pricing" ? "#8b7ff5" : "#7874a4"} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.02em" }}>VIP</span>
        </Link>

        {/* Item 5: Account or Login */}
        <Link
          href={isLoggedIn ? "/account" : "/login"}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            flex: 1,
            height: "100%",
            color: pathname === "/account" || pathname === "/login" ? "#ffffff" : "#7874a4",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              padding: "3px 12px",
              borderRadius: 12,
              background: pathname === "/account" || pathname === "/login" ? "rgba(124, 108, 245, 0.22)" : "transparent",
            }}
          >
            <User size={18} color={pathname === "/account" || pathname === "/login" ? "#8b7ff5" : "#7874a4"} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.02em" }}>
            {isLoggedIn ? "Account" : "Log In"}
          </span>
        </Link>
      </nav>

      {/* Global CSS for Navbar Responsive Breakpoints */}
      <style>{`
        .navbar-desktop-links {
          display: none !important;
        }
        .navbar-search-btn-desktop {
          display: none !important;
        }
        .navbar-search-btn-mobile {
          display: flex !important;
        }
        .navbar-desktop-only {
          display: none !important;
        }
        .navbar-mobile-toggle {
          display: flex !important;
        }
        .mobile-bottom-nav {
          display: flex !important;
        }

        @media (min-width: 1024px) {
          .navbar-desktop-links {
            display: flex !important;
          }
          .navbar-search-btn-desktop {
            display: inline-flex !important;
          }
          .navbar-search-btn-mobile {
            display: none !important;
          }
          .navbar-desktop-only {
            display: inline-flex !important;
          }
          .navbar-mobile-toggle {
            display: none !important;
          }
          .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 150,
            background: "rgba(10, 8, 29, 0.8)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: 80,
            paddingLeft: 16,
            paddingRight: 16,
          }}
          onClick={() => setShowSearchModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 560,
              background: "#141132",
              border: "1px solid rgba(124, 108, 245, 0.45)",
              borderRadius: 14,
              boxShadow: "0 24px 48px -12px rgba(0,0,0,0.8)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                borderBottom: "1px solid rgba(167, 159, 255, 0.1)",
              }}
            >
              <Search size={18} color="#8b7ff5" />
              <input
                type="text"
                autoFocus
                placeholder="Search matches, leagues, teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  color: "#ffffff",
                }}
              />
              <button
                onClick={() => setShowSearchModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#7874a4",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: "16px 18px" }}>
              <p style={{ fontSize: 11, color: "#7874a4", marginBottom: 10, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                POPULAR QUICK LINKS
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowSearchModal(false)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: "#1b183d",
                      border: "1px solid rgba(167, 159, 255, 0.12)",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
