"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { Laptop, Smartphone, Shield, LogOut, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

interface SessionItem {
  id: string;
  deviceName?: string;
  userAgent?: string;
  ipAddress?: string;
  lastUsedAt: string;
  createdAt: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/sessions");
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      } else {
        // Mock fallback if unauthenticated
        setSessions([
          {
            id: "sess_curr_1",
            deviceName: "Current Browser (Chrome / Windows)",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0",
            ipAddress: "192.168.1.104",
            lastUsedAt: new Date().toISOString(),
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: "sess_mobile_2",
            deviceName: "Mobile Device (iPhone / Safari)",
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5) Mobile/15E148",
            ipAddress: "172.56.21.9",
            lastUsedAt: new Date(Date.now() - 86400000).toISOString(),
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
        ]);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await fetch("/api/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", sessionId: id }),
      });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Revoke error:", err);
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div style={{ background: "transparent", minHeight: "100vh", color: "#f8fafc" }}>
      <Navbar />

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "84px 16px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Shield style={{ width: 22, height: 22, color: "#6366f1" }} />
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, color: "#fff" }}>
              Active Device Sessions
            </h1>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
            Manage your logged-in devices. Your account supports up to <strong>5 concurrent device sessions</strong>. If you exceed 5, the oldest inactive session will be automatically disconnected.
          </p>
        </div>

        {/* Device Quota Card */}
        <div style={{
          background: "#0d1222",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}>
          <div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 2 }}>Device Slot Usage</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
              {sessions.length} / 5 Active Devices
            </div>
          </div>
          <div style={{
            padding: "4px 12px",
            borderRadius: 999,
            background: sessions.length <= 5 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            color: sessions.length <= 5 ? "#10b981" : "#ef4444",
            fontSize: 12,
            fontWeight: 800,
          }}>
            {sessions.length <= 5 ? "Quota Normal" : "Limit Reached"}
          </div>
        </div>

        {/* Sessions List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sessions.map((s, idx) => {
            const isMobile = s.userAgent?.toLowerCase().includes("mobile") || s.deviceName?.toLowerCase().includes("mobile");
            return (
              <div
                key={s.id}
                style={{
                  background: "#0d1222",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#818cf8",
                  }}>
                    {isMobile ? <Smartphone style={{ width: 20, height: 20 }} /> : <Laptop style={{ width: 20, height: 20 }} />}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                        {s.deviceName || (isMobile ? "Mobile Device" : "Desktop Workstation")}
                      </span>
                      {idx === 0 && (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
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
                    onClick={() => handleRevoke(s.id)}
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
                      padding: "6px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    <LogOut style={{ width: 13, height: 13 }} />
                    <span>{revokingId === s.id ? "Revoking..." : "Revoke"}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
