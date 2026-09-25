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
  TrendingUp,
  Plus,
  Layers,
  ChevronDown,
  ChevronUp,
  Ticket,
  Image as ImageIcon,
  UploadCloud,
  X,
} from "lucide-react";
import { Rollover, RolloverStep, RolloverType, RolloverStatus, RolloverStepStatus } from "@/lib/types";

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

  // Admin section switcher
  const [adminActiveTab, setAdminActiveTab] = useState<"telemetry" | "rollovers">("telemetry");

  // Rollover state
  const [rollovers, setRollovers] = useState<Rollover[]>([]);
  const [selectedRolloverStatus, setSelectedRolloverStatus] = useState<"ALL" | RolloverStatus>("ALL");
  const [selectedRolloverType, setSelectedRolloverType] = useState<"ALL" | RolloverType>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedRolloverId, setExpandedRolloverId] = useState<string | null>(null);

  // Create Rollover form state
  const [newRollName, setNewRollName] = useState("");
  const [newRollType, setNewRollType] = useState<RolloverType>("MANUAL");
  const [newRollStart, setNewRollStart] = useState("500");
  const [newRollSteps, setNewRollSteps] = useState("5");
  const [newRollDesc, setNewRollDesc] = useState("");
  const [newRollBookingCode, setNewRollBookingCode] = useState("");
  const [newRollInstructions, setNewRollInstructions] = useState("");
  const [newRollImageUrl, setNewRollImageUrl] = useState("");
  const [createRollLoading, setCreateRollLoading] = useState(false);
  const [generateAiLoading, setGenerateAiLoading] = useState(false);

  // Edit Rollover Details state (for expanded card)
  const [editBookingCode, setEditBookingCode] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [updateDetailsLoading, setUpdateDetailsLoading] = useState(false);

  // Add Step form state
  const [addStepMatch, setAddStepMatch] = useState("");
  const [addStepPick, setAddStepPick] = useState("");
  const [addStepOdds, setAddStepOdds] = useState("1.50");
  const [addStepDate, setAddStepDate] = useState("Today, 18:00");
  const [addStepBookingCode, setAddStepBookingCode] = useState("");
  const [addStepInstructions, setAddStepInstructions] = useState("");
  const [addStepImageUrl, setAddStepImageUrl] = useState("");
  const [addStepLoading, setAddStepLoading] = useState(false);

  // Image upload helper (converts to base64 Data URL)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image exceeds 5MB limit", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

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

      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/admin?${queryParams.toString()}`, {
        headers,
        credentials: "include",
      });
      const json = await res.json();

      if (json.success) {
        setIsAuthenticated(true);
        setData(json);
        setUsers(json.users || []);
        if (json.rollovers) {
          setRollovers(json.rollovers);
        }
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
          email: loginEmail.trim().toLowerCase(),
          loginIdentifier: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        }),
      });

      const json = await res.json();
      if (json.success) {
        if (json.token && typeof window !== "undefined") {
          localStorage.setItem("jt_auth_token", json.token);
        }
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
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers,
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
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers,
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
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers,
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

  // ── Rollover Action Handlers ──
  const handleCreateRollover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRollName.trim()) {
      showToast("Rollover name is required", "error");
      return;
    }

    try {
      setCreateRollLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          action: "create_rollover",
          name: newRollName.trim(),
          type: newRollType,
          startingAmount: parseFloat(newRollStart) || 500,
          targetSteps: parseInt(newRollSteps, 10) || 5,
          description: newRollDesc.trim() || undefined,
          bookingCode: newRollBookingCode.trim() || undefined,
          instructions: newRollInstructions.trim() || undefined,
          imageUrl: newRollImageUrl.trim() || undefined,
          isPublished: true,
        }),
      });

      const json = await res.json();
      if (json.success && json.rollover) {
        showToast(`Rollover "${json.rollover.name}" created!`);
        setRollovers((prev) => [json.rollover, ...prev]);
        setShowCreateModal(false);
        setNewRollName("");
        setNewRollDesc("");
        setNewRollBookingCode("");
        setNewRollInstructions("");
        setNewRollImageUrl("");
        setExpandedRolloverId(json.rollover.id);
        setEditBookingCode(json.rollover.bookingCode || "");
        setEditInstructions(json.rollover.instructions || "");
        setEditImageUrl(json.rollover.imageUrl || "");
      } else {
        showToast(json.error || "Failed to create rollover", "error");
      }
    } catch {
      showToast("Network error creating rollover", "error");
    } finally {
      setCreateRollLoading(false);
    }
  };

  const handleUpdateRolloverDetails = async (rolloverId: string) => {
    try {
      setUpdateDetailsLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          action: "update_rollover",
          rolloverId,
          bookingCode: editBookingCode.trim() || null,
          instructions: editInstructions.trim() || null,
          imageUrl: editImageUrl.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success && json.rollover) {
        showToast("Rollover details and game slip updated!");
        setRollovers((prev) =>
          prev.map((r) => (r.id === rolloverId ? json.rollover : r))
        );
      } else {
        showToast(json.error || "Failed to update rollover details", "error");
      }
    } catch {
      showToast("Network error updating rollover details", "error");
    } finally {
      setUpdateDetailsLoading(false);
    }
  };

  const handleGenerateAiRollover = async () => {
    try {
      setGenerateAiLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          action: "generate_ai_rollover",
          targetSteps: 5,
          startingAmount: 500,
        }),
      });

      const json = await res.json();
      if (json.success && json.rollover) {
        showToast(`AI Rollover generated: ${json.rollover.name}!`);
        setRollovers((prev) => [json.rollover, ...prev]);
        setExpandedRolloverId(json.rollover.id);
      } else {
        showToast(json.error || "Failed to generate AI rollover", "error");
      }
    } catch {
      showToast("Network error generating AI rollover", "error");
    } finally {
      setGenerateAiLoading(false);
    }
  };

  const handleTogglePublish = async (rolloverId: string, currentPublished: boolean) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          action: "update_rollover",
          rolloverId,
          isPublished: !currentPublished,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(!currentPublished ? "Rollover published to public site" : "Rollover unpublished (draft)");
        setRollovers((prev) =>
          prev.map((r) => (r.id === rolloverId ? { ...r, isPublished: !currentPublished } : r))
        );
      } else {
        showToast(json.error || "Failed to update publish state", "error");
      }
    } catch {
      showToast("Network error updating rollover", "error");
    }
  };

  const handleUpdateRolloverStatus = async (rolloverId: string, status: RolloverStatus) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          action: "update_rollover",
          rolloverId,
          status,
        }),
      });

      const json = await res.json();
      if (json.success && json.rollover) {
        showToast(`Rollover status marked as ${status}`);
        setRollovers((prev) =>
          prev.map((r) => (r.id === rolloverId ? json.rollover : r))
        );
      } else {
        showToast(json.error || "Failed to update status", "error");
      }
    } catch {
      showToast("Network error updating rollover status", "error");
    }
  };

  const handleDeleteRollover = async (rolloverId: string) => {
    if (!confirm("Are you sure you want to delete this rollover plan? This cannot be undone.")) return;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          action: "delete_rollover",
          rolloverId,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("Rollover deleted successfully");
        setRollovers((prev) => prev.filter((r) => r.id !== rolloverId));
        if (expandedRolloverId === rolloverId) setExpandedRolloverId(null);
      } else {
        showToast(json.error || "Failed to delete rollover", "error");
      }
    } catch {
      showToast("Network error deleting rollover", "error");
    }
  };

  const handleAddStep = async (rolloverId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!addStepMatch.trim() || !addStepPick.trim()) {
      showToast("Match and prediction pick are required", "error");
      return;
    }

    try {
      setAddStepLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          action: "add_rollover_step",
          rolloverId,
          match: addStepMatch.trim(),
          prediction: addStepPick.trim(),
          odds: parseFloat(addStepOdds) || 1.50,
          matchDate: addStepDate.trim() || "Today",
          bookingCode: addStepBookingCode.trim() || undefined,
          instructions: addStepInstructions.trim() || undefined,
          imageUrl: addStepImageUrl.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success && json.rollover) {
        showToast("Step game added successfully!");
        setRollovers((prev) =>
          prev.map((r) => (r.id === rolloverId ? json.rollover : r))
        );
        setAddStepMatch("");
        setAddStepPick("");
        setAddStepOdds("1.50");
        setAddStepBookingCode("");
        setAddStepInstructions("");
        setAddStepImageUrl("");
      } else {
        showToast(json.error || "Failed to add step", "error");
      }
    } catch {
      showToast("Network error adding step", "error");
    } finally {
      setAddStepLoading(false);
    }
  };

  const handleUpdateStepStatus = async (rolloverId: string, stepId: string, newStatus: RolloverStepStatus) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          action: "update_rollover_step",
          rolloverId,
          stepId,
          status: newStatus,
        }),
      });

      const json = await res.json();
      if (json.success && json.rollover) {
        showToast(`Step status marked as ${newStatus}`);
        setRollovers((prev) =>
          prev.map((r) => (r.id === rolloverId ? json.rollover : r))
        );
      } else {
        showToast(json.error || "Failed to update step status", "error");
      }
    } catch {
      showToast("Network error updating step status", "error");
    }
  };

  const handleDeleteStep = async (rolloverId: string, stepId: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("jt_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          action: "delete_rollover_step",
          rolloverId,
          stepId,
        }),
      });

      const json = await res.json();
      if (json.success && json.rollover) {
        showToast("Step removed");
        setRollovers((prev) =>
          prev.map((r) => (r.id === rolloverId ? json.rollover : r))
        );
      } else {
        showToast(json.error || "Failed to delete step", "error");
      }
    } catch {
      showToast("Network error removing step", "error");
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
            {/* Top Navigation Tabs */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 24,
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setAdminActiveTab("telemetry")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 18px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  background:
                    adminActiveTab === "telemetry"
                      ? "linear-gradient(135deg, #8b7ff5 0%, #6a5cf0 100%)"
                      : "transparent",
                  color: adminActiveTab === "telemetry" ? "#ffffff" : "var(--text-secondary)",
                  border:
                    adminActiveTab === "telemetry"
                      ? "1px solid rgba(167, 159, 255, 0.4)"
                      : "1px solid transparent",
                }}
              >
                <Users size={16} />
                <span>Platform & User Telemetry</span>
              </button>

              <button
                onClick={() => setAdminActiveTab("rollovers")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 18px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  background:
                    adminActiveTab === "rollovers"
                      ? "linear-gradient(135deg, #8b7ff5 0%, #6a5cf0 100%)"
                      : "transparent",
                  color: adminActiveTab === "rollovers" ? "#ffffff" : "var(--text-secondary)",
                  border:
                    adminActiveTab === "rollovers"
                      ? "1px solid rgba(167, 159, 255, 0.4)"
                      : "1px solid transparent",
                }}
              >
                <TrendingUp size={16} />
                <span>Rollover Management</span>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background:
                      adminActiveTab === "rollovers"
                        ? "rgba(255, 255, 255, 0.2)"
                        : "rgba(124, 108, 245, 0.2)",
                    color: adminActiveTab === "rollovers" ? "#ffffff" : "var(--gold)",
                  }}
                >
                  {rollovers.length}
                </span>
              </button>
            </div>

            {/* TAB 1: Platform & User Telemetry */}
            {adminActiveTab === "telemetry" && (
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

            {/* TAB 2: Rollover Management Console */}
            {adminActiveTab === "rollovers" && (
              <div>
                {/* Action Bar & Summary Stats */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="gold-btn"
                      style={{ padding: "9px 18px", fontSize: 13 }}
                    >
                      <Plus size={16} />
                      <span>Create Expert Rollover</span>
                    </button>

                    <button
                      onClick={handleGenerateAiRollover}
                      disabled={generateAiLoading}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "9px 18px",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        background: "rgba(124, 108, 245, 0.15)",
                        border: "1px solid rgba(124, 108, 245, 0.35)",
                        color: "var(--gold)",
                        opacity: generateAiLoading ? 0.7 : 1,
                      }}
                    >
                      <Sparkles size={16} />
                      <span>{generateAiLoading ? "Generating AI Plan..." : "Generate AI Rollover"}</span>
                    </button>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {(["ALL", "ACTIVE", "COMPLETED", "LOST"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setSelectedRolloverStatus(st)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          border:
                            selectedRolloverStatus === st
                              ? "1px solid var(--gold-border)"
                              : "1px solid var(--border-color)",
                          background:
                            selectedRolloverStatus === st ? "var(--gold-bg)" : "var(--surface)",
                          color: selectedRolloverStatus === st ? "var(--gold)" : "var(--text-secondary)",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create Rollover Modal / Drawer */}
                {showCreateModal && (
                  <div
                    className="luxury-card"
                    style={{
                      padding: "24px",
                      marginBottom: 28,
                      border: "1px solid rgba(124, 108, 245, 0.4)",
                      background: "var(--surface-raised)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 18,
                      }}
                    >
                      <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                        Create New Rollover Series
                      </h3>
                      <button
                        onClick={() => setShowCreateModal(false)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-dim)",
                          cursor: "pointer",
                          fontSize: 16,
                          fontWeight: 800,
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleCreateRollover} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                            Rollover Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Jolloftips Weekend Rollover"
                            value={newRollName}
                            onChange={(e) => setNewRollName(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              borderRadius: 8,
                              background: "var(--surface)",
                              border: "1px solid var(--border-color)",
                              color: "var(--text-primary)",
                              fontSize: 13,
                              outline: "none",
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                            Type
                          </label>
                          <select
                            value={newRollType}
                            onChange={(e) => setNewRollType(e.target.value as RolloverType)}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              borderRadius: 8,
                              background: "var(--surface)",
                              border: "1px solid var(--border-color)",
                              color: "var(--text-primary)",
                              fontSize: 13,
                              outline: "none",
                            }}
                          >
                            <option value="MANUAL">Expert Rollover (Analyst Curated)</option>
                            <option value="AI">AI Rollover (Prediction Engine)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                            Starting Stake (₦)
                          </label>
                          <input
                            type="number"
                            required
                            min="100"
                            value={newRollStart}
                            onChange={(e) => setNewRollStart(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              borderRadius: 8,
                              background: "var(--surface)",
                              border: "1px solid var(--border-color)",
                              color: "var(--text-primary)",
                              fontSize: 13,
                              outline: "none",
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                            Target Steps
                          </label>
                          <input
                            type="number"
                            required
                            min="2"
                            max="15"
                            value={newRollSteps}
                            onChange={(e) => setNewRollSteps(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              borderRadius: 8,
                              background: "var(--surface)",
                              border: "1px solid var(--border-color)",
                              color: "var(--text-primary)",
                              fontSize: 13,
                              outline: "none",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                          Plan Description / Strategy Notes (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Consecutive banker selections targeting 1.50 - 1.65 odds."
                          value={newRollDesc}
                          onChange={(e) => setNewRollDesc(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: 8,
                            background: "var(--surface)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-primary)",
                            fontSize: 13,
                            outline: "none",
                          }}
                        />
                      </div>

                      {/* Booking Code, Instructions & Ticket Image Slip (For Manual & Ticket drops) */}
                      <div
                        style={{
                          padding: "16px",
                          borderRadius: 10,
                          background: "var(--surface)",
                          border: "1px dashed rgba(124, 108, 245, 0.45)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 14,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Ticket size={16} color="var(--gold)" />
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
                            Booked Game Slip & Instructions (Optional for Manual / Slip drops)
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                              Booking Code (SportyBet / Bet9ja / 1xBet etc.)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. BC-9941X2 or SportyBet: 5K89A"
                              value={newRollBookingCode}
                              onChange={(e) => setNewRollBookingCode(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: 8,
                                background: "var(--surface-raised)",
                                border: "1px solid var(--border-color)",
                                color: "var(--gold)",
                                fontFamily: "monospace",
                                fontSize: 13,
                                fontWeight: 700,
                                outline: "none",
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                              Booked Game Ticket Slip (Image Upload or URL)
                            </label>
                            <div style={{ display: "flex", gap: 8 }}>
                              <input
                                type="text"
                                placeholder="Paste image URL https://... or choose file →"
                                value={newRollImageUrl}
                                onChange={(e) => setNewRollImageUrl(e.target.value)}
                                style={{
                                  flex: 1,
                                  padding: "10px 14px",
                                  borderRadius: 8,
                                  background: "var(--surface-raised)",
                                  border: "1px solid var(--border-color)",
                                  color: "var(--text-primary)",
                                  fontSize: 12,
                                  outline: "none",
                                }}
                              />
                              <label
                                style={{
                                  padding: "8px 14px",
                                  borderRadius: 8,
                                  background: "rgba(124, 108, 245, 0.15)",
                                  border: "1px solid rgba(124, 108, 245, 0.35)",
                                  color: "#8b7ff5",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <UploadCloud size={14} />
                                <span>Upload Slip</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: "none" }}
                                  onChange={(e) => handleImageFileChange(e, setNewRollImageUrl)}
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Image Preview thumbnail if available */}
                        {newRollImageUrl && (
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                            <div
                              style={{
                                width: 80,
                                height: 80,
                                borderRadius: 8,
                                overflow: "hidden",
                                border: "1px solid var(--gold)",
                                background: "#000",
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={newRollImageUrl}
                                alt="Booked slip preview"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#2fd08a" }}>
                                ✓ Booked Game Slip attached
                              </span>
                              <button
                                type="button"
                                onClick={() => setNewRollImageUrl("")}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#fb7185",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: 0,
                                }}
                              >
                                <X size={12} /> Remove Slip
                              </button>
                            </div>
                          </div>
                        )}

                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                            Instructions & Staking Advice
                          </label>
                          <textarea
                            rows={3}
                            placeholder="e.g. Load this booking code on SportyBet. Stake exactly ₦500. Avoid cashout until Step 3 completes..."
                            value={newRollInstructions}
                            onChange={(e) => setNewRollInstructions(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              borderRadius: 8,
                              background: "var(--surface-raised)",
                              border: "1px solid var(--border-color)",
                              color: "var(--text-primary)",
                              fontSize: 12,
                              outline: "none",
                              resize: "vertical",
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(false)}
                          style={{
                            padding: "10px 18px",
                            borderRadius: 8,
                            background: "transparent",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-secondary)",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={createRollLoading}
                          className="gold-btn"
                          style={{ padding: "10px 22px", fontSize: 13 }}
                        >
                          {createRollLoading ? "Creating..." : "Save & Add Games"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Rollovers Management List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {rollovers
                    .filter((r) => selectedRolloverStatus === "ALL" || r.status === selectedRolloverStatus)
                    .map((roll) => {
                      const isExpanded = expandedRolloverId === roll.id;
                      const wonSteps = roll.steps.filter((s) => s.status === "WON").length;

                      return (
                        <div
                          key={roll.id}
                          className="luxury-card"
                          style={{
                            overflow: "hidden",
                            border: isExpanded ? "1px solid rgba(124, 108, 245, 0.4)" : "1px solid var(--border-color)",
                          }}
                        >
                          {/* Rollover Card Header */}
                          <div
                            style={{
                              padding: "18px 22px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: 14,
                              background: "var(--surface)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)" }}>
                                    {roll.name}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      padding: "2px 8px",
                                      borderRadius: 4,
                                      background: roll.type === "AI" ? "rgba(124, 108, 245, 0.2)" : "rgba(47, 208, 138, 0.15)",
                                      color: roll.type === "AI" ? "#8b7ff5" : "#2fd08a",
                                    }}
                                  >
                                    {roll.type}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      padding: "2px 8px",
                                      borderRadius: 4,
                                      background: roll.isPublished ? "rgba(47, 208, 138, 0.15)" : "rgba(120, 116, 164, 0.15)",
                                      color: roll.isPublished ? "#2fd08a" : "var(--text-dim)",
                                    }}
                                  >
                                    {roll.isPublished ? "Published" : "Draft"}
                                  </span>
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                                  Start: ₦{roll.startingAmount.toLocaleString()} → Current:{" "}
                                  <strong style={{ color: "var(--gold)" }}>₦{roll.currentAmount.toLocaleString()}</strong> | Progress:{" "}
                                  {wonSteps}/{roll.targetSteps} Steps | Potential:{" "}
                                  <strong style={{ color: "#2fd08a" }}>₦{(roll.potentialReturn || roll.currentAmount).toLocaleString()}</strong>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              {/* Status Dropdown */}
                              <select
                                value={roll.status}
                                onChange={(e) => handleUpdateRolloverStatus(roll.id, e.target.value as RolloverStatus)}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  background: "var(--surface-raised)",
                                  border: "1px solid var(--border-color)",
                                  color: "var(--text-primary)",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  outline: "none",
                                  cursor: "pointer",
                                }}
                              >
                                <option value="ACTIVE">Status: ACTIVE</option>
                                <option value="COMPLETED">Status: COMPLETED</option>
                                <option value="LOST">Status: LOST</option>
                                <option value="CANCELLED">Status: CANCELLED</option>
                              </select>

                              {/* Publish / Unpublish Toggle */}
                              <button
                                onClick={() => handleTogglePublish(roll.id, roll.isPublished)}
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 8,
                                  background: roll.isPublished ? "rgba(47, 208, 138, 0.15)" : "var(--surface-raised)",
                                  border: roll.isPublished ? "1px solid rgba(47, 208, 138, 0.4)" : "1px solid var(--border-color)",
                                  color: roll.isPublished ? "#2fd08a" : "var(--text-secondary)",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                {roll.isPublished ? "Published" : "Make Public"}
                              </button>

                              {/* Manage Steps & Slips Button */}
                              <button
                                onClick={() => {
                                  if (isExpanded) {
                                    setExpandedRolloverId(null);
                                  } else {
                                    setExpandedRolloverId(roll.id);
                                    setEditBookingCode(roll.bookingCode || "");
                                    setEditInstructions(roll.instructions || "");
                                    setEditImageUrl(roll.imageUrl || "");
                                  }
                                }}
                                style={{
                                  padding: "6px 14px",
                                  borderRadius: 8,
                                  background: isExpanded ? "var(--gold-bg)" : "var(--surface-raised)",
                                  border: isExpanded ? "1px solid var(--gold)" : "1px solid var(--border-color)",
                                  color: isExpanded ? "var(--gold)" : "var(--text-primary)",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <span>{isExpanded ? "Close Panel" : `Manage Slip & Steps (${roll.steps.length})`}</span>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>

                              {/* Delete Rollover */}
                              <button
                                onClick={() => handleDeleteRollover(roll.id)}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  background: "rgba(251, 113, 133, 0.15)",
                                  border: "1px solid rgba(251, 113, 133, 0.35)",
                                  color: "#fb7185",
                                  cursor: "pointer",
                                }}
                                title="Delete Rollover"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Step & Slip Management Panel */}
                          {isExpanded && (
                            <div style={{ padding: "20px 22px", background: "var(--surface-raised)", borderTop: "1px solid var(--border-color)" }}>
                              {/* Booking Code, Instructions & Ticket Slip Manager */}
                              <div
                                style={{
                                  marginBottom: 24,
                                  padding: "16px 18px",
                                  borderRadius: 10,
                                  background: "var(--surface)",
                                  border: "1px solid rgba(124, 108, 245, 0.35)",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 12,
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Ticket size={16} color="var(--gold)" />
                                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
                                      Drop Booking Code, Instructions & Game Slip
                                    </span>
                                    {roll.bookingCode && (
                                      <span
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 800,
                                          fontFamily: "monospace",
                                          padding: "2px 8px",
                                          borderRadius: 4,
                                          background: "rgba(232, 195, 74, 0.15)",
                                          color: "var(--gold)",
                                        }}
                                      >
                                        Active Code: {roll.bookingCode}
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    disabled={updateDetailsLoading}
                                    onClick={() => handleUpdateRolloverDetails(roll.id)}
                                    className="gold-btn"
                                    style={{ padding: "6px 14px", fontSize: 12 }}
                                  >
                                    {updateDetailsLoading ? "Saving..." : "Save Slip & Instructions"}
                                  </button>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                                  <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-dim)", marginBottom: 4 }}>
                                      Booking Code (SportyBet / Bet9ja / 1xBet etc.)
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. BC-9941X2 or SportyBet: 5K89A"
                                      value={editBookingCode}
                                      onChange={(e) => setEditBookingCode(e.target.value)}
                                      style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: 6,
                                        background: "var(--surface-raised)",
                                        border: "1px solid var(--border-color)",
                                        color: "var(--gold)",
                                        fontFamily: "monospace",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        outline: "none",
                                      }}
                                    />
                                  </div>

                                  <div>
                                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-dim)", marginBottom: 4 }}>
                                      Ticket Slip Image (Upload or URL)
                                    </label>
                                    <div style={{ display: "flex", gap: 6 }}>
                                      <input
                                        type="text"
                                        placeholder="Paste image URL https://... or choose file →"
                                        value={editImageUrl}
                                        onChange={(e) => setEditImageUrl(e.target.value)}
                                        style={{
                                          flex: 1,
                                          padding: "8px 12px",
                                          borderRadius: 6,
                                          background: "var(--surface-raised)",
                                          border: "1px solid var(--border-color)",
                                          color: "var(--text-primary)",
                                          fontSize: 12,
                                          outline: "none",
                                        }}
                                      />
                                      <label
                                        style={{
                                          padding: "6px 12px",
                                          borderRadius: 6,
                                          background: "rgba(124, 108, 245, 0.15)",
                                          border: "1px solid rgba(124, 108, 245, 0.35)",
                                          color: "#8b7ff5",
                                          fontSize: 11,
                                          fontWeight: 700,
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 4,
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        <UploadCloud size={13} />
                                        <span>Upload</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          style={{ display: "none" }}
                                          onChange={(e) => handleImageFileChange(e, setEditImageUrl)}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                </div>

                                {/* Thumbnail preview if image attached */}
                                {editImageUrl && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div
                                      style={{
                                        width: 70,
                                        height: 70,
                                        borderRadius: 8,
                                        overflow: "hidden",
                                        border: "1px solid var(--gold)",
                                        background: "#000",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <img
                                        src={editImageUrl}
                                        alt="Booked game slip preview"
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                      />
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: "#2fd08a" }}>
                                        ✓ Game slip attached
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setEditImageUrl("")}
                                        style={{
                                          background: "transparent",
                                          border: "none",
                                          color: "#fb7185",
                                          fontSize: 11,
                                          fontWeight: 700,
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 4,
                                          padding: 0,
                                        }}
                                      >
                                        <X size={12} /> Remove Slip
                                      </button>
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-dim)", marginBottom: 4 }}>
                                    Instructions & Staking Advice
                                  </label>
                                  <textarea
                                    rows={2}
                                    placeholder="e.g. Load booking code on SportyBet. Stake ₦500. Next step will be dropped at 16:00."
                                    value={editInstructions}
                                    onChange={(e) => setEditInstructions(e.target.value)}
                                    style={{
                                      width: "100%",
                                      padding: "8px 12px",
                                      borderRadius: 6,
                                      background: "var(--surface-raised)",
                                      border: "1px solid var(--border-color)",
                                      color: "var(--text-primary)",
                                      fontSize: 12,
                                      outline: "none",
                                      resize: "vertical",
                                    }}
                                  />
                                </div>
                              </div>

                              <h4 style={{ fontSize: 13, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", margin: "0 0 12px" }}>
                                Rollover Steps & Game Progression
                              </h4>

                              {/* Existing Steps */}
                              {roll.steps.length === 0 ? (
                                <p style={{ fontSize: 13, color: "var(--text-dim)", margin: "0 0 16px" }}>
                                  No games have been added to this rollover plan yet. Add the first game below.
                                </p>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                                  {roll.steps.map((step) => {
                                    return (
                                      <div
                                        key={step.id}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          flexWrap: "wrap",
                                          gap: 12,
                                          padding: "12px 16px",
                                          borderRadius: 8,
                                          background: "var(--surface)",
                                          border: "1px solid var(--border-color)",
                                        }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                          <span
                                            style={{
                                              padding: "3px 8px",
                                              borderRadius: 6,
                                              background: "var(--surface-raised)",
                                              fontSize: 11,
                                              fontWeight: 800,
                                              color: "var(--gold)",
                                            }}
                                          >
                                            Step {step.stepNumber}
                                          </span>
                                          <div>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
                                              {step.match}
                                            </div>
                                            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                                              Pick: <strong style={{ color: "var(--gold)" }}>{step.prediction}</strong> | Odds: {step.odds.toFixed(2)} | Date: {step.matchDate || "Upcoming"}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Step Status Action Buttons */}
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                          <button
                                            onClick={() => handleUpdateStepStatus(roll.id, step.id, "WON")}
                                            style={{
                                              padding: "5px 10px",
                                              borderRadius: 6,
                                              background: step.status === "WON" ? "rgba(47, 208, 138, 0.3)" : "rgba(47, 208, 138, 0.12)",
                                              border: step.status === "WON" ? "1px solid #2fd08a" : "1px solid rgba(47, 208, 138, 0.3)",
                                              color: "#2fd08a",
                                              fontSize: 11,
                                              fontWeight: 800,
                                              cursor: "pointer",
                                            }}
                                          >
                                            Won
                                          </button>

                                          <button
                                            onClick={() => handleUpdateStepStatus(roll.id, step.id, "ACTIVE")}
                                            style={{
                                              padding: "5px 10px",
                                              borderRadius: 6,
                                              background: step.status === "ACTIVE" ? "rgba(232, 195, 74, 0.3)" : "rgba(232, 195, 74, 0.12)",
                                              border: step.status === "ACTIVE" ? "1px solid #e8c34a" : "1px solid rgba(232, 195, 74, 0.3)",
                                              color: "#e8c34a",
                                              fontSize: 11,
                                              fontWeight: 800,
                                              cursor: "pointer",
                                            }}
                                          >
                                            Active
                                          </button>

                                          <button
                                            onClick={() => handleUpdateStepStatus(roll.id, step.id, "PENDING")}
                                            style={{
                                              padding: "5px 10px",
                                              borderRadius: 6,
                                              background: step.status === "PENDING" ? "rgba(120, 116, 164, 0.3)" : "rgba(120, 116, 164, 0.12)",
                                              border: step.status === "PENDING" ? "1px solid #a79fff" : "1px solid rgba(120, 116, 164, 0.3)",
                                              color: "#a79fff",
                                              fontSize: 11,
                                              fontWeight: 800,
                                              cursor: "pointer",
                                            }}
                                          >
                                            Pending
                                          </button>

                                          <button
                                            onClick={() => handleUpdateStepStatus(roll.id, step.id, "LOST")}
                                            style={{
                                              padding: "5px 10px",
                                              borderRadius: 6,
                                              background: step.status === "LOST" ? "rgba(251, 113, 133, 0.3)" : "rgba(251, 113, 133, 0.12)",
                                              border: step.status === "LOST" ? "1px solid #fb7185" : "1px solid rgba(251, 113, 133, 0.3)",
                                              color: "#fb7185",
                                              fontSize: 11,
                                              fontWeight: 800,
                                              cursor: "pointer",
                                            }}
                                          >
                                            Lost
                                          </button>

                                          <button
                                            onClick={() => handleDeleteStep(roll.id, step.id)}
                                            style={{
                                              padding: "5px 8px",
                                              borderRadius: 6,
                                              background: "transparent",
                                              border: "1px solid var(--border-color)",
                                              color: "var(--text-dim)",
                                              cursor: "pointer",
                                            }}
                                            title="Delete step"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Form to Add Next Step */}
                              <div
                                style={{
                                  padding: "16px",
                                  borderRadius: 8,
                                  background: "var(--surface)",
                                  border: "1px solid var(--border-color)",
                                }}
                              >
                                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--gold)", display: "block", marginBottom: 12 }}>
                                  + Add Next Game (Step {roll.steps.length + 1})
                                </span>

                                <form onSubmit={(e) => handleAddStep(roll.id, e)}>
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
                                    <div>
                                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-dim)", marginBottom: 4 }}>
                                        Match (Teams)
                                      </label>
                                      <input
                                        type="text"
                                        required
                                        placeholder="e.g. Arsenal vs Chelsea"
                                        value={addStepMatch}
                                        onChange={(e) => setAddStepMatch(e.target.value)}
                                        style={{
                                          width: "100%",
                                          padding: "8px 12px",
                                          borderRadius: 6,
                                          background: "var(--surface-raised)",
                                          border: "1px solid var(--border-color)",
                                          color: "var(--text-primary)",
                                          fontSize: 12,
                                          outline: "none",
                                        }}
                                      />
                                    </div>

                                    <div>
                                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-dim)", marginBottom: 4 }}>
                                        Prediction Pick
                                      </label>
                                      <input
                                        type="text"
                                        required
                                        placeholder="e.g. Arsenal Win or Over 1.5"
                                        value={addStepPick}
                                        onChange={(e) => setAddStepPick(e.target.value)}
                                        style={{
                                          width: "100%",
                                          padding: "8px 12px",
                                          borderRadius: 6,
                                          background: "var(--surface-raised)",
                                          border: "1px solid var(--border-color)",
                                          color: "var(--text-primary)",
                                          fontSize: 12,
                                          outline: "none",
                                        }}
                                      />
                                    </div>

                                    <div>
                                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-dim)", marginBottom: 4 }}>
                                        Odds
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="1.01"
                                        max="10.0"
                                        required
                                        value={addStepOdds}
                                        onChange={(e) => setAddStepOdds(e.target.value)}
                                        style={{
                                          width: "100%",
                                          padding: "8px 12px",
                                          borderRadius: 6,
                                          background: "var(--surface-raised)",
                                          border: "1px solid var(--border-color)",
                                          color: "var(--text-primary)",
                                          fontSize: 12,
                                          outline: "none",
                                        }}
                                      />
                                    </div>

                                    <div>
                                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-dim)", marginBottom: 4 }}>
                                        Date / Time
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Today, 18:00"
                                        value={addStepDate}
                                        onChange={(e) => setAddStepDate(e.target.value)}
                                        style={{
                                          width: "100%",
                                          padding: "8px 12px",
                                          borderRadius: 6,
                                          background: "var(--surface-raised)",
                                          border: "1px solid var(--border-color)",
                                          color: "var(--text-primary)",
                                          fontSize: 12,
                                          outline: "none",
                                        }}
                                      />
                                    </div>

                                    <div>
                                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-dim)", marginBottom: 4 }}>
                                        Step Booking Code (Optional)
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="e.g. BC-12345"
                                        value={addStepBookingCode}
                                        onChange={(e) => setAddStepBookingCode(e.target.value)}
                                        style={{
                                          width: "100%",
                                          padding: "8px 12px",
                                          borderRadius: 6,
                                          background: "var(--surface-raised)",
                                          border: "1px solid var(--border-color)",
                                          color: "var(--gold)",
                                          fontFamily: "monospace",
                                          fontSize: 12,
                                          outline: "none",
                                        }}
                                      />
                                    </div>

                                    <div>
                                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-dim)", marginBottom: 4 }}>
                                        Step Game Slip Image (Optional)
                                      </label>
                                      <div style={{ display: "flex", gap: 6 }}>
                                        <input
                                          type="text"
                                          placeholder="URL or upload →"
                                          value={addStepImageUrl}
                                          onChange={(e) => setAddStepImageUrl(e.target.value)}
                                          style={{
                                            flex: 1,
                                            padding: "8px 12px",
                                            borderRadius: 6,
                                            background: "var(--surface-raised)",
                                            border: "1px solid var(--border-color)",
                                            color: "var(--text-primary)",
                                            fontSize: 12,
                                            outline: "none",
                                          }}
                                        />
                                        <label
                                          style={{
                                            padding: "6px 12px",
                                            borderRadius: 6,
                                            background: "rgba(124, 108, 245, 0.15)",
                                            border: "1px solid rgba(124, 108, 245, 0.35)",
                                            color: "#8b7ff5",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 4,
                                          }}
                                        >
                                          <UploadCloud size={13} />
                                          <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: "none" }}
                                            onChange={(e) => handleImageFileChange(e, setAddStepImageUrl)}
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="submit"
                                    disabled={addStepLoading}
                                    className="gold-btn"
                                    style={{ padding: "8px 16px", fontSize: 12 }}
                                  >
                                    {addStepLoading ? "Adding..." : "Add Step Game"}
                                  </button>
                                </form>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

