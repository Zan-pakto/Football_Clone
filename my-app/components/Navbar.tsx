"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crown,
  Sparkles,
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
  ChevronDown,
  ShieldCheck,
  Star,
  Trash2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";

interface NavbarProps {
  liveCount?: number;
  onSync?: () => void;
  isSyncing?: boolean;
}

const navLinks = [
  { href: "/bet-of-the-day", label: "Bet of the day", icon: Flame },
  { href: "/all-matches", label: "All Matches", icon: Activity },
  { href: "/rollovers", label: "Rollover", icon: TrendingUp },
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
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDropdownEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setUserDropdownOpen(true);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setUserDropdownOpen(false);
    }, 180);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Favorites Slips Drawer
  const [favoriteSlips, setFavoriteSlips] = useState<any[]>([]);
  const [showFavoritesDrawer, setShowFavoritesDrawer] = useState<boolean>(false);
  const [copiedSlipId, setCopiedSlipId] = useState<string | null>(null);

  // Admin POV state
  const [adminPov, setAdminPov] = useState<"admin" | "vip" | "free">("admin");

  const loadFavorites = useCallback(() => {
    try {
      const stored = localStorage.getItem("jt_favorite_slips");
      if (stored) {
        setFavoriteSlips(JSON.parse(stored));
      } else {
        setFavoriteSlips([]);
      }
    } catch {
      setFavoriteSlips([]);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
    const handleFavUpdate = () => loadFavorites();
    window.addEventListener("jt_favorites_updated", handleFavUpdate);
    window.addEventListener("storage", handleFavUpdate);
    return () => {
      window.removeEventListener("jt_favorites_updated", handleFavUpdate);
      window.removeEventListener("storage", handleFavUpdate);
    };
  }, [loadFavorites]);

  useEffect(() => {
    const pov = localStorage.getItem("jt_admin_view_pov") as any;
    if (pov === "vip" || pov === "free" || pov === "admin") {
      setAdminPov(pov);
    }
  }, []);

  const handleSwitchAdminPov = (newPov: "admin" | "vip" | "free") => {
    setAdminPov(newPov);
    localStorage.setItem("jt_admin_view_pov", newPov);
    window.dispatchEvent(new Event("jt_auth_change"));
  };

  const handleDeleteFavorite = (favId: string) => {
    try {
      const updated = favoriteSlips.filter((s: any) => s.id !== favId);
      setFavoriteSlips(updated);
      localStorage.setItem("jt_favorite_slips", JSON.stringify(updated));
      window.dispatchEvent(new Event("jt_favorites_updated"));
    } catch (e) {
      console.warn("Failed to delete favorite slip:", e);
    }
  };

  const handleCopyFavSlip = (slip: any) => {
    if (!slip || !Array.isArray(slip.slip)) return;
    const lines = [
      `🎯 Jolloftips.com Saved Slip (${slip.matchesCount} Picks · @${slip.totalOdds})`,
      `━━━━━━━━━━━━━━━━━━━━`,
      ...slip.slip.map((m: any, i: number) => `${i + 1}. ${m.homeTeam} vs ${m.awayTeam} — Pick: ${m.pick} (@${Number(m.odds).toFixed(2)})`),
      `━━━━━━━━━━━━━━━━━━━━`,
      slip.sportyBetCode ? `SportyBet Code: ${slip.sportyBetCode}` : "",
    ].filter(Boolean);
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedSlipId(slip.id);
    setTimeout(() => setCopiedSlipId(null), 2000);
  };

  const isAdmin = currentUser?.role === "ADMIN";

  // Check if current authenticated user has active Pro/VIP/Admin subscription
  const isPro =
    adminPov === "free"
      ? false
      : adminPov === "vip"
      ? true
      : Boolean(
          currentUser && (
            currentUser.isPremium ||
            currentUser.role === "ADMIN" ||
            currentUser.subscriptionPlan === "VIP_PRO" ||
            currentUser.subscriptionPlan === "PRO" ||
            currentUser.subscriptionPlan === "PREMIUM" ||
            currentUser.subscriptionPlan === "VIP" ||
            currentUser.subscriptionStatus === "ACTIVE"
          )
        );

  // Fetch current auth status
  const checkAuthStatus = useCallback(async () => {
    try {
      setLoadingAuth(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/auth?_t=${Date.now()}`, {
        headers,
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setIsLoggedIn(false);
        setCurrentUser(null);
        return;
      }
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("json")) {
        setIsLoggedIn(false);
        setCurrentUser(null);
        return;
      }
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
    const handleAuth = () => {
      checkAuthStatus();
    };
    window.addEventListener("jt_auth_change", handleAuth);
    window.addEventListener("storage", handleAuth);
    return () => {
      window.removeEventListener("jt_auth_change", handleAuth);
      window.removeEventListener("storage", handleAuth);
    };
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
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("jt_auth_token");
        sessionStorage.clear();
        window.dispatchEvent(new Event("jt_auth_change"));
      }
      setIsLoggedIn(false);
      setCurrentUser(null);
      window.location.href = "/";
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
          background: isScrolled ? "rgba(10, 8, 29, 0.96)" : "transparent",
          backdropFilter: isScrolled ? "blur(14px)" : "none",
          WebkitBackdropFilter: isScrolled ? "blur(14px)" : "none",
          textShadow: "none",
          borderBottom: isScrolled ? "1px solid rgba(167, 159, 255, 0.14)" : "1px solid transparent",
          transition: "background-color 0.25s ease, border-color 0.25s ease",
        }}
      >
        <div
          style={{
            maxWidth: 1600,
            margin: "0 auto",
            padding: "0 16px",
            height: 68,
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
            <BrandMark width={20} height={20} />
            <span
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.02em",
                textShadow: "0 0 12px rgba(167, 159, 255, 0.35)",
              }}
            >
              JOLLOF<span style={{ color: "#ffffff" }}>TIPS</span>
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
              const isActive =
                pathname === link.href ||
                (link.href === "/hit-and-win" && pathname === "/hitandwin") ||
                (link.href === "/hitandwin" && pathname === "/hit-and-win") ||
                (link.href === "/leagues" && (pathname.startsWith("/leagues") || pathname.startsWith("/football-leagues")));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: isActive ? 800 : 600,
                    color: "#ffffff",
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
                      e.currentTarget.style.color = "#ffffff";
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
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Search size={14} />
              <span className="navbar-search-text">Search</span>
              <kbd
                className="navbar-search-kbd"
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

            {/* Mobile-Only PRO Badge */}
            {isPro && (
              <Link
                href="/account"
                className="navbar-mobile-pro"
                aria-label="Active Pro Membership"
                style={{
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                  borderRadius: 7,
                  background: "linear-gradient(135deg, #ffd700 0%, #ff8800 100%)",
                  color: "#0b091f",
                  fontWeight: 900,
                  fontSize: 10,
                  letterSpacing: "0.5px",
                  textDecoration: "none",
                  boxShadow: "0 0 10px rgba(255, 184, 0, 0.4)",
                }}
              >
                <Crown size={11} fill="#0b091f" />
                <span>PRO</span>
              </Link>
            )}

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

            {/* ⭐ Favorites Tab Button */}
            <button
              type="button"
              onClick={() => setShowFavoritesDrawer(true)}
              aria-label="View Favorite Bet Slips"
              className="navbar-favorites-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                background: favoriteSlips.length > 0 ? "rgba(255, 215, 0, 0.12)" : "#141132",
                border: favoriteSlips.length > 0 ? "1px solid rgba(255, 215, 0, 0.4)" : "1px solid rgba(167, 159, 255, 0.15)",
                color: favoriteSlips.length > 0 ? "#ffd700" : "#a79fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="View Favorite Generated Bet Slips"
            >
              <Star size={14} fill={favoriteSlips.length > 0 ? "#ffd700" : "none"} color="#ffd700" />
              <span className="navbar-favorites-text navbar-desktop-only">Favorites</span>
              {favoriteSlips.length > 0 && (
                <span
                  style={{
                    background: "#ffd700",
                    color: "#0b091f",
                    fontSize: 10,
                    fontWeight: 900,
                    padding: "1px 5px",
                    borderRadius: 10,
                    lineHeight: 1.2,
                  }}
                >
                  {favoriteSlips.length}
                </span>
              )}
            </button>

            {/* Admin POV Perspective Switcher */}
            {isAdmin && (
              <div
                className="navbar-desktop-only"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "3px 6px",
                  borderRadius: 20,
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  fontSize: 11,
                  fontWeight: 800,
                }}
                title="Admin POV Switcher: preview the site as Admin, VIP Pro, or Free User"
              >
                <span style={{ color: "#ef4444", fontSize: 10, paddingLeft: 4 }}>POV:</span>
                <button
                  type="button"
                  onClick={() => handleSwitchAdminPov("admin")}
                  style={{
                    padding: "2px 7px",
                    borderRadius: 12,
                    border: "none",
                    background: adminPov === "admin" ? "#ef4444" : "transparent",
                    color: adminPov === "admin" ? "#ffffff" : "#fca5a5",
                    fontSize: 10.5,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchAdminPov("vip")}
                  style={{
                    padding: "2px 7px",
                    borderRadius: 12,
                    border: "none",
                    background: adminPov === "vip" ? "#ffd700" : "transparent",
                    color: adminPov === "vip" ? "#0b091f" : "#fef08a",
                    fontSize: 10.5,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  VIP Pro
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchAdminPov("free")}
                  style={{
                    padding: "2px 7px",
                    borderRadius: 12,
                    border: "none",
                    background: adminPov === "free" ? "#a79fff" : "transparent",
                    color: adminPov === "free" ? "#0b091f" : "#c4b5fd",
                    fontSize: 10.5,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Free
                </button>
              </div>
            )}

            {/* Desktop VIP Access Button (Shown only for non-Pro / Free users to upgrade) */}
            {!isPro && (
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
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 800,
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#7c6cf5";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(124, 108, 245, 0.18)";
                  e.currentTarget.style.color = "#ffffff";
                }}
              >
                <Sparkles size={14} />
                <span>PRO Access</span>
              </Link>
            )}

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
                <div
                  ref={userDropdownRef}
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                  style={{ position: "relative" }}
                >
                  {/* Profile Pill Trigger */}
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                    aria-expanded={userDropdownOpen}
                    aria-haspopup="true"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 8px 4px 6px",
                      borderRadius: 999,
                      background: isPro ? "rgba(255, 184, 0, 0.08)" : "#141132",
                      border: isPro ? "1px solid rgba(255, 184, 0, 0.4)" : "1px solid rgba(167, 159, 255, 0.15)",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: isPro ? "0 0 10px rgba(255, 184, 0, 0.15)" : "none",
                      transition: "all 0.2s ease",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      if (isPro) {
                        e.currentTarget.style.borderColor = "rgba(255, 184, 0, 0.7)";
                      } else {
                        e.currentTarget.style.borderColor = "rgba(167, 159, 255, 0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isPro) {
                        e.currentTarget.style.borderColor = "rgba(255, 184, 0, 0.4)";
                      } else {
                        e.currentTarget.style.borderColor = "rgba(167, 159, 255, 0.15)";
                      }
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: isPro ? "linear-gradient(135deg, #ffd700, #ff8800)" : "#2fd08a",
                        color: isPro ? "#0b091f" : "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span
                      className="navbar-user-name"
                      title={currentUser?.name || "Account"}
                      style={{
                        maxWidth: 90,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "inline-block",
                      }}
                    >
                      {currentUser?.name || "Account"}
                    </span>
                    {isPro && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "linear-gradient(135deg, #ffd700 0%, #ff8800 100%)",
                          color: "#0b091f",
                          fontSize: 10,
                          fontWeight: 900,
                          letterSpacing: "0.5px",
                          lineHeight: "14px",
                          flexShrink: 0,
                        }}
                      >
                        <Crown size={9} fill="#0b091f" />
                        PRO
                      </span>
                    )}
                    <ChevronDown
                      size={13}
                      style={{
                        color: isPro ? "#ffd700" : "#a79fff",
                        transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        transform: userDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {/* Dropdown Menu on Hover/Click */}
                  {userDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        width: 230,
                        background: "rgba(18, 14, 51, 0.96)",
                        border: "1px solid rgba(167, 159, 255, 0.22)",
                        borderRadius: 14,
                        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.65), 0 0 24px rgba(124, 108, 245, 0.16)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        padding: "8px",
                        zIndex: 100,
                        animation: "navbarDropdownFade 0.16s ease-out",
                      }}
                    >
                      {/* Header Info */}
                      <div
                        style={{
                          padding: "10px 12px 10px",
                          borderBottom: "1px solid rgba(167, 159, 255, 0.1)",
                          marginBottom: 6,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {currentUser?.name || "Account"}
                          </span>
                          {isPro ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                padding: "1px 6px",
                                borderRadius: 4,
                                background: "linear-gradient(135deg, #ffd700 0%, #ff8800 100%)",
                                color: "#0b091f",
                                fontSize: 9.5,
                                fontWeight: 900,
                              }}
                            >
                              <Sparkles size={8} fill="#0b091f" />
                              PRO
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: "#7874a4",
                                background: "rgba(167, 159, 255, 0.1)",
                                padding: "1px 6px",
                                borderRadius: 4,
                              }}
                            >
                              FREE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#7874a4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {currentUser?.email || ""}
                        </div>
                      </div>

                      {/* Menu Item: View Profile */}
                      <Link
                        href="/account"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 12px",
                          borderRadius: 8,
                          color: "#ffffff",
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: "none",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124, 108, 245, 0.15)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <User size={15} style={{ color: "#a79fff" }} />
                        <span>View Profile</span>
                      </Link>

                      {/* Menu Item: Security & Devices */}
                      <Link
                        href="/account/sessions"
                        onClick={() => setUserDropdownOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 12px",
                          borderRadius: 8,
                          color: "#ffffff",
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: "none",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124, 108, 245, 0.15)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <ShieldCheck size={15} style={{ color: "#a79fff" }} />
                        <span>Security & Devices</span>
                      </Link>

                      <div style={{ height: 1, background: "rgba(167, 159, 255, 0.1)", margin: "6px 0" }} />

                      {/* Menu Item: Log Out */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleLogout();
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 12px",
                          borderRadius: 8,
                          background: "transparent",
                          border: "none",
                          color: "#fb7185",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(251, 113, 133, 0.15)";
                          e.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#fb7185";
                        }}
                      >
                        <LogOut size={15} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
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
                <BrandMark width={18} height={18} />
                <span style={{ fontSize: 16, fontWeight: 900, color: "#ffffff" }}>
                  JOLLOF<span style={{ color: "#ffffff" }}>TIPS</span>
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
                const isActive =
                  pathname === link.href ||
                  (link.href === "/hit-and-win" && pathname === "/hitandwin") ||
                  (link.href === "/hitandwin" && pathname === "/hit-and-win") ||
                  (link.href === "/leagues" && (pathname.startsWith("/leagues") || pathname.startsWith("/football-leagues")));
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
                        background: isPro ? "linear-gradient(135deg, #ffd700, #ff8800)" : "#2fd08a",
                        color: isPro ? "#0b091f" : "#fff",
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
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {currentUser?.name || "Member"}
                        </span>
                        {isPro && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "linear-gradient(135deg, #ffd700 0%, #ff8800 100%)",
                              color: "#0b091f",
                              fontSize: 9,
                              fontWeight: 900,
                              letterSpacing: "0.5px",
                            }}
                          >
                            <Crown size={9} fill="#0b091f" />
                            PRO
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: isPro ? "#ffc837" : "#7874a4", fontWeight: isPro ? 600 : 400 }}>
                        {isPro ? "★ Active PRO Membership" : (currentUser?.email || "")}
                      </div>
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
                      height: 44,
                      borderRadius: 10,
                      background: "rgba(251, 113, 133, 0.08)",
                      border: "1px solid rgba(251, 113, 133, 0.28)",
                      color: "#fb7185",
                      fontWeight: 800,
                      fontSize: 13.5,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(251, 113, 133, 0.16)";
                      e.currentTarget.style.borderColor = "rgba(251, 113, 133, 0.55)";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(251, 113, 133, 0.08)";
                      e.currentTarget.style.borderColor = "rgba(251, 113, 133, 0.28)";
                      e.currentTarget.style.color = "#fb7185";
                    }}
                  >
                    <LogOut size={15} />
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
                    <Sparkles size={15} />
                    <span>Get PRO Access</span>
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

              {/* Official Social Links in Mobile Drawer */}
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(167, 159, 255, 0.12)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#7874a4",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  Official Channels
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  <a
                    href="https://t.me/Jolloftips247"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px 4px",
                      borderRadius: 8,
                      background: "rgba(34, 158, 217, 0.1)",
                      border: "1px solid rgba(34, 158, 217, 0.25)",
                      color: "#ffffff",
                      textDecoration: "none",
                      gap: 4,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#229ED9">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.96z" />
                    </svg>
                    <span style={{ fontSize: 10, fontWeight: 700 }}>Telegram</span>
                  </a>
                  <a
                    href="https://x.com/jolloftips"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px 4px",
                      borderRadius: 8,
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      textDecoration: "none",
                      gap: 4,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#ffffff">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span style={{ fontSize: 10, fontWeight: 700 }}>X (Twitter)</span>
                  </a>
                  <a
                    href="https://www.facebook.com/jolloftips"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "8px 4px",
                      borderRadius: 8,
                      background: "rgba(24, 119, 242, 0.1)",
                      border: "1px solid rgba(24, 119, 242, 0.25)",
                      color: "#ffffff",
                      textDecoration: "none",
                      gap: 4,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span style={{ fontSize: 10, fontWeight: 700 }}>Facebook</span>
                  </a>
                </div>
              </div>
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
          height: "calc(58px + env(safe-area-inset-bottom, 0px))",
          padding: "4px 8px env(safe-area-inset-bottom, 0px)",
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

        {/* Item 4: PRO Access */}
        <Link
          href={isPro ? "/account" : "/pricing"}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            flex: 1,
            height: "100%",
            color: isPro
              ? "#ffc837"
              : pathname === "/pricing"
              ? "#ffffff"
              : "#7874a4",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              padding: "3px 12px",
              borderRadius: 12,
              background: isPro
                ? "rgba(255, 184, 0, 0.15)"
                : pathname === "/pricing"
                ? "rgba(124, 108, 245, 0.22)"
                : "transparent",
            }}
          >
            <Sparkles
              size={18}
              color={isPro ? "#ffc837" : pathname === "/pricing" ? "#8b7ff5" : "#7874a4"}
              fill={isPro ? "#ffc837" : "none"}
            />
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: isPro ? 900 : 700,
              letterSpacing: "0.02em",
              color: isPro ? "#ffc837" : undefined,
            }}
          >
            PRO
          </span>
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
        .navbar-desktop-links a,
        .navbar-search-btn-desktop,
        .navbar-search-btn-mobile,
        .navbar-mobile-toggle,
        .navbar-desktop-only[href="/pricing"],
        .navbar-desktop-only > div > button {
          color: #d4cde3 !important;
        }

        .navbar-desktop-links {
          display: none !important;
        }
        .navbar-search-btn-desktop {
          display: none !important;
        }
        .navbar-search-btn-mobile {
          display: flex !important;
        }
        .navbar-mobile-pro {
          display: inline-flex !important;
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
          .navbar-mobile-pro {
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

        /* Tier 1: 1024px - 1240px (Small desktop / compact laptop) */
        @media (min-width: 1024px) and (max-width: 1240px) {
          .navbar-desktop-links {
            gap: 1px !important;
          }
          .navbar-desktop-links a {
            padding: 4px 6px !important;
            font-size: 11.5px !important;
          }
          .navbar-search-text,
          .navbar-search-kbd,
          .navbar-favorites-text {
            display: none !important;
          }
          .navbar-search-btn-desktop,
          .navbar-favorites-btn {
            padding: 6px 8px !important;
          }
          .navbar-user-name {
            max-width: 60px !important;
          }
        }

        /* Tier 2: 1241px - 1380px (Standard laptops: 1280px & 1366px) */
        @media (min-width: 1241px) and (max-width: 1380px) {
          .navbar-desktop-links {
            gap: 2px !important;
          }
          .navbar-desktop-links a {
            padding: 5px 8px !important;
            font-size: 12px !important;
          }
          .navbar-search-kbd,
          .navbar-favorites-text {
            display: none !important;
          }
          .navbar-user-name {
            max-width: 75px !important;
          }
        }

        /* Tier 3: 1381px - 1500px (1440px MacBooks & 1080p 125% scaling) */
        @media (min-width: 1381px) and (max-width: 1500px) {
          .navbar-desktop-links {
            gap: 2px !important;
          }
          .navbar-desktop-links a {
            padding: 5px 10px !important;
            font-size: 12.5px !important;
          }
          .navbar-search-kbd {
            display: none !important;
          }
          .navbar-user-name {
            max-width: 85px !important;
          }
        }

        @keyframes navbarDropdownFade {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
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

      {/* ⭐ Favorites Slips Drawer */}
      {showFavoritesDrawer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => setShowFavoritesDrawer(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 440,
              height: "100vh",
              background: "#141132",
              borderLeft: "1px solid rgba(167, 159, 255, 0.2)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 22px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Star size={18} fill="#ffd700" color="#ffd700" />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                  Favorite Bet Slips ({favoriteSlips.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFavoritesDrawer(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#cbd5e1",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {favoriteSlips.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: "#94a3b8",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "rgba(255, 215, 0, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                      color: "#ffd700",
                    }}
                  >
                    <Star size={26} />
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", marginBottom: 8 }}>
                    No favorite slips saved
                  </h4>
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: "#94a3b8", marginBottom: 20 }}>
                    After generating an accumulator slip in the Bet Builder, click the <strong>Favorite</strong> button to save it here so you can easily track it anytime!
                  </p>
                  <Link
                    href="/bet-builder"
                    onClick={() => setShowFavoritesDrawer(false)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 18px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #7c6cf5, #6353e8)",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 800,
                      textDecoration: "none",
                    }}
                  >
                    <Zap size={14} />
                    <span>Open Bet Builder</span>
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {favoriteSlips.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(167, 159, 255, 0.18)",
                        borderRadius: 14,
                        padding: 16,
                      }}
                    >
                      {/* Slip Card Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 10,
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : `Slip #${idx + 1}`}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              background: "rgba(47, 208, 138, 0.15)",
                              color: "#2fd08a",
                              fontSize: 11,
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: 6,
                            }}
                          >
                            @{item.totalOdds}
                          </span>
                          <span
                            style={{
                              background: "rgba(124, 108, 245, 0.2)",
                              color: "#c4b5fd",
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 6,
                            }}
                          >
                            {item.matchesCount} Picks
                          </span>
                        </div>
                      </div>

                      {/* Picks Mini List */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                        {item.slip?.slice(0, 4).map((m: any, mIdx: number) => (
                          <div
                            key={mIdx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontSize: 12,
                              color: "#e2e8f0",
                              padding: "4px 0",
                              borderBottom: mIdx < 3 ? "1px solid rgba(255, 255, 255, 0.04)" : "none",
                            }}
                          >
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                              {m.homeTeam} vs {m.awayTeam}
                            </span>
                            <span style={{ fontWeight: 800, color: "#2fd08a", flexShrink: 0 }}>
                              {m.pick} (@{m.odds})
                            </span>
                          </div>
                        ))}
                        {item.slip?.length > 4 && (
                          <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", paddingTop: 2 }}>
                            + {item.slip.length - 4} more matches
                          </div>
                        )}
                      </div>

                      {/* Slip Card Actions */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 8, borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                        <button
                          type="button"
                          onClick={() => handleCopyFavSlip(item)}
                          style={{
                            flex: 1,
                            padding: "7px 12px",
                            borderRadius: 8,
                            background: copiedSlipId === item.id ? "rgba(47, 208, 138, 0.2)" : "rgba(255, 255, 255, 0.06)",
                            border: copiedSlipId === item.id ? "1px solid #2fd08a" : "1px solid rgba(255, 255, 255, 0.12)",
                            color: copiedSlipId === item.id ? "#2fd08a" : "#cbd5e1",
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 5,
                          }}
                        >
                          {copiedSlipId === item.id ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedSlipId === item.id ? "Copied!" : "Copy Slip"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteFavorite(item.id)}
                          style={{
                            padding: "7px 10px",
                            borderRadius: 8,
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.25)",
                            color: "#ef4444",
                            cursor: "pointer",
                          }}
                          title="Delete from favorites"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
