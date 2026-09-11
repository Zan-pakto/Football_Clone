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
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

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
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          background: isScrolled ? "var(--bg-header)" : "var(--background)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${isScrolled ? "var(--border-color)" : "var(--border-subtle)"}`,
          transition: "background 0.25s ease, border-color 0.25s ease",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "0 20px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Left: Brand Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "var(--gold-bg)",
                border: "1px solid var(--gold-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 14,
                color: "var(--gold)",
                letterSpacing: "-0.02em",
                boxShadow: "0 0 12px var(--gold-glow)",
              }}
            >
              JT
            </div>
            <span
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
              }}
            >
              JOLLOF<span style={{ color: "var(--gold)" }}>TIPS</span>
            </span>
          </Link>

          {/* Center: Desktop Navigation Links (Always visible on desktop!) */}
          <nav
            className="navbar-desktop-links"
            style={{
              alignItems: "center",
              gap: 4,
            }}
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? "var(--gold)" : "var(--text-secondary)",
                    background: isActive ? "var(--gold-bg)" : "transparent",
                    transition: "all 0.15s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    border: isActive ? "1px solid var(--gold-border)" : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--text-primary)";
                      e.currentTarget.style.background = "var(--surface-raised)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "var(--text-secondary)";
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {/* Quick Search Button */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="navbar-search-btn"
              style={{
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 8,
                background: "var(--surface-raised)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
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
                  background: "var(--surface)",
                  border: "1px solid var(--border-color)",
                  fontSize: 10,
                  color: "var(--text-dim)",
                }}
              >
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle Button (Light/Dark switch) */}
            <ThemeToggle />

            {/* VIP Upgrade Pill */}
            <Link
              href="/pricing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 8,
                background: "var(--gold-bg)",
                border: "1px solid var(--gold-border)",
                color: "var(--gold)",
                fontSize: 12,
                fontWeight: 800,
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--gold)";
                e.currentTarget.style.color = "var(--gold-btn-text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--gold-bg)";
                e.currentTarget.style.color = "var(--gold)";
              }}
            >
              <Crown size={14} />
              <span className="hidden sm:inline">VIP Access</span>
            </Link>

            {/* Auth Button */}
            {loadingAuth ? (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--surface-raised)",
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
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--accent-green)",
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
                  <span className="hidden md:inline" style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--accent-red)";
                    e.currentTarget.style.borderColor = "var(--accent-red-border)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.borderColor = "var(--border-color)";
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
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                <LogIn size={14} />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="navbar-mobile-toggle"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "var(--surface-raised)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
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

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: "16px 20px",
              background: "var(--bg-surface)",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              boxShadow: "var(--shadow-card)",
            }}
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? "var(--gold)" : "var(--text-primary)",
                    background: isActive ? "var(--gold-bg)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Global CSS for Navbar Responsive Breakpoints */}
      <style>{`
        .navbar-desktop-links {
          display: none !important;
        }
        .navbar-search-btn {
          display: none !important;
        }
        .navbar-mobile-toggle {
          display: flex !important;
        }

        @media (min-width: 1024px) {
          .navbar-desktop-links {
            display: flex !important;
          }
          .navbar-search-btn {
            display: inline-flex !important;
          }
          .navbar-mobile-toggle {
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
            zIndex: 100,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: 100,
            paddingLeft: 16,
            paddingRight: 16,
          }}
          onClick={() => setShowSearchModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 560,
              background: "var(--bg-card)",
              border: "1px solid var(--gold-border)",
              borderRadius: 14,
              boxShadow: "var(--shadow-card)",
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
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <Search size={18} color="var(--gold)" />
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
                  color: "var(--text-primary)",
                }}
              />
              <button
                onClick={() => setShowSearchModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: "16px 18px" }}>
              <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10, fontWeight: 700 }}>
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
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                      fontSize: 12,
                      fontWeight: 600,
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
