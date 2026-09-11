import Navbar from "@/components/Navbar";
import { cookies } from "next/headers";
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  ShieldAlert,
  Activity,
  UserCheck,
  Lock,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export default async function MatchDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const headers: Record<string, string> = token ? { Cookie: `auth_token=${token}` } : {};

  const res = await fetch(`${BACKEND_URL}/api/fixtures/${params.id}`, {
    headers,
    next: { revalidate: 30 },
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const fixture = res?.fixture;
  if (!fixture) {
    notFound();
  }

  const isLive = fixture.status === "LIVE";
  const isFinished = fixture.status === "FINISHED";

  return (
    <div style={{ background: "transparent", minHeight: "100vh", color: "#f8fafc" }}>
      <Navbar />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "84px 16px 80px" }}>
        {/* Match Header Hero Card */}
        <div style={{
          background: "linear-gradient(180deg, rgba(20, 25, 58, 0.95) 0%, rgba(14, 18, 44, 0.95) 100%)",
          border: "1px solid rgba(168, 85, 247, 0.25)",
          boxShadow: "0 10px 32px rgba(0, 0, 0, 0.45), 0 0 24px rgba(139, 92, 246, 0.1)",
          borderRadius: 16,
          padding: "32px 24px",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
        }}>
          {/* League & Country Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
            <Trophy style={{ width: 14, height: 14, color: "#818cf8" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {fixture.league?.country?.name} • {fixture.league?.name}
            </span>
          </div>

          {/* Teams vs Score Row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 20,
            textAlign: "center",
          }}>
            {/* Home Team */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 10,
              }}>
                <img src={fixture.homeTeam.logo || ""} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{fixture.homeTeam.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                Form: {fixture.forms?.home?.form || "WWDWW"}
              </span>
            </div>

            {/* Center Status / Score */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              {isLive ? (
                <div>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    borderRadius: 999,
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    color: "#10b981",
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 8,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                    LIVE {fixture.elapsed || "65'"}
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#ffffff", letterSpacing: "2px" }}>
                    {fixture.homeScore ?? 0} - {fixture.awayScore ?? 0}
                  </div>
                </div>
              ) : isFinished ? (
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 6 }}>
                    FULL TIME
                  </span>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#ffffff", letterSpacing: "2px" }}>
                    {fixture.homeScore} - {fixture.awayScore}
                  </div>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                    KICKOFF
                  </span>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#ffffff" }}>
                    {new Date(fixture.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              )}

              {fixture.venue && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  <MapPin style={{ width: 12, height: 12 }} />
                  <span>{fixture.venue}</span>
                </div>
              )}
            </div>

            {/* Away Team */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 10,
              }}>
                <img src={fixture.awayTeam.logo || ""} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{fixture.awayTeam.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                Form: {fixture.forms?.away?.form || "WDWWL"}
              </span>
            </div>
          </div>
        </div>

        {/* AI Predictions Section */}
        <div style={{
          background: "#0d1222",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: 24,
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Zap style={{ width: 20, height: 20, color: "#818cf8" }} />
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#fff" }}>
              JollofTips AI Match Predictions & Odds
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {(fixture.predictions || []).map((p: any, idx: number) => {
              if (p.isLocked) {
                return (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px dashed rgba(99, 102, 241, 0.3)",
                      borderRadius: 10,
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <Lock style={{ width: 20, height: 20, color: "#818cf8", margin: "0 auto 8px" }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1", marginBottom: 8 }}>
                      {p.market} Prediction Locked
                    </div>
                    <Link
                      href="/pricing"
                      style={{
                        display: "inline-block",
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "6px 14px",
                        borderRadius: 6,
                        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                        color: "#fff",
                        textDecoration: "none",
                      }}
                    >
                      Unlock with Pro
                    </Link>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  style={{
                    background: "#12182e",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                      {p.market}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#10b981", background: "rgba(16, 185, 129, 0.15)", padding: "2px 6px", borderRadius: 4 }}>
                      {p.confidence}% Trust
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 6 }}>
                    {p.selection}
                  </div>
                  <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>
                    Odds: {p.odd ? p.odd.toFixed(2) : "1.65"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lineups & Tactics */}
        {fixture.lineups && (
          <div style={{
            background: "#0d1222",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: 24,
            marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <UserCheck style={{ width: 18, height: 18, color: "#10b981" }} />
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#fff" }}>
                Starting Lineups & Formations
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 10 }}>
                  {fixture.homeTeam.name} ({fixture.lineups.home?.formation || "4-3-3"})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(fixture.lineups.home?.startingXl || []).map((p: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: "#cbd5e1", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#64748b", fontFamily: "monospace", width: 18 }}>#{p.number}</span>
                      <span>{p.name} ({p.position})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 10 }}>
                  {fixture.awayTeam.name} ({fixture.lineups.away?.formation || "4-2-3-1"})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(fixture.lineups.away?.startingXl || []).map((p: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: "#cbd5e1", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#64748b", fontFamily: "monospace", width: 18 }}>#{p.number}</span>
                      <span>{p.name} ({p.position})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
