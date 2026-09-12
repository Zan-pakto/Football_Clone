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
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
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
    <div style={{ background: "#0a081d", minHeight: "100vh", color: "#ffffff" }}>
      <Navbar />

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 16px 80px" }}>
        
        {/* Match Header Hero Card */}
        <div
          style={{
            padding: "32px 24px",
            marginBottom: 24,
            borderRadius: 20,
            background: "#141132",
            border: "1px solid rgba(167, 159, 255, 0.16)",
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.6)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle Background Glow */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "80%",
              height: 180,
              background: "radial-gradient(ellipse at 50% 0%, rgba(124, 108, 245, 0.2) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* League & Country Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24, position: "relative", zIndex: 1 }}>
            <Trophy size={14} color="#8b7ff5" />
            <span style={{ fontSize: 12, fontWeight: 800, color: "#a79fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {fixture.league?.country?.name} • {fixture.league?.name}
            </span>
          </div>

          {/* Teams vs Score Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 20,
              textAlign: "center",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Home Team */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "#1b183d",
                  border: "1px solid rgba(167, 159, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 10,
                }}
              >
                {fixture.homeTeam.logo ? (
                  <img src={fixture.homeTeam.logo} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontSize: 20, fontWeight: 900, color: "#ffffff" }}>{fixture.homeTeam.name.charAt(0)}</span>
                )}
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#ffffff" }}>{fixture.homeTeam.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "#1b183d", color: "#a79fff", border: "1px solid rgba(167, 159, 255, 0.1)" }}>
                Form: {fixture.forms?.home?.form || "WWDWW"}
              </span>
            </div>

            {/* Center Status / Score */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              {isLive ? (
                <div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 12px",
                      borderRadius: 999,
                      background: "rgba(255, 93, 120, 0.15)",
                      border: "1px solid rgba(255, 93, 120, 0.35)",
                      color: "#ff5d78",
                      fontSize: 12,
                      fontWeight: 800,
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff5d78", animation: "ping 1.2s infinite" }} />
                    LIVE {fixture.elapsed || "65'"}
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#ffffff", letterSpacing: "2px", fontFamily: "var(--font-mono)" }}>
                    {fixture.homeScore ?? 0} - {fixture.awayScore ?? 0}
                  </div>
                </div>
              ) : isFinished ? (
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#7874a4", display: "block", marginBottom: 6 }}>
                    FULL TIME
                  </span>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "#ffffff", letterSpacing: "2px", fontFamily: "var(--font-mono)" }}>
                    {fixture.homeScore} - {fixture.awayScore}
                  </div>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#7874a4", display: "block", marginBottom: 4 }}>
                    KICKOFF
                  </span>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "#ffffff", fontFamily: "var(--font-mono)" }}>
                    {new Date(fixture.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              )}

              {fixture.venue && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#7874a4", marginTop: 4 }}>
                  <MapPin size={12} />
                  <span>{fixture.venue}</span>
                </div>
              )}
            </div>

            {/* Away Team */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "#1b183d",
                  border: "1px solid rgba(167, 159, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 10,
                }}
              >
                {fixture.awayTeam.logo ? (
                  <img src={fixture.awayTeam.logo} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                ) : (
                  <span style={{ fontSize: 20, fontWeight: 900, color: "#ffffff" }}>{fixture.awayTeam.name.charAt(0)}</span>
                )}
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#ffffff" }}>{fixture.awayTeam.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "#1b183d", color: "#a79fff", border: "1px solid rgba(167, 159, 255, 0.1)" }}>
                Form: {fixture.forms?.away?.form || "WDWWL"}
              </span>
            </div>
          </div>
        </div>

        {/* AI Predictions Section */}
        <div
          style={{
            padding: 24,
            marginBottom: 24,
            borderRadius: 18,
            background: "#141132",
            border: "1px solid rgba(167, 159, 255, 0.12)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Zap size={20} color="#8b7ff5" />
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#ffffff" }}>
              Joloo Tips AI Match Predictions & Odds
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {(fixture.predictions || []).map((p: any, idx: number) => {
              if (p.isLocked) {
                return (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(20, 17, 50, 0.6)",
                      border: "1px dashed rgba(124, 108, 245, 0.4)",
                      borderRadius: 14,
                      padding: "20px 16px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(124, 108, 245, 0.15)",
                        border: "1px solid rgba(124, 108, 245, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Lock size={16} color="#8b7ff5" />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>
                      {p.market} Prediction
                    </div>
                    <div style={{ fontSize: 11, color: "#7874a4", marginBottom: 6 }}>
                      {p.lockReason === "live_kickoff_locked"
                        ? "Locked during live in-play (VIP Only)"
                        : "7/7 Daily Free Limit Reached"}
                    </div>
                    <Link
                      href="/pricing"
                      style={{
                        padding: "6px 16px",
                        fontSize: 11,
                        fontWeight: 800,
                        borderRadius: 8,
                        background: "linear-gradient(135deg, #8b7ff5 0%, #6a5cf0 100%)",
                        color: "#ffffff",
                        textDecoration: "none",
                      }}
                    >
                      Unlock with VIP
                    </Link>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  style={{
                    background: "#1b183d",
                    border: "1px solid rgba(167, 159, 255, 0.1)",
                    borderRadius: 14,
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#7874a4", textTransform: "uppercase" }}>
                      {p.market}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "rgba(47, 208, 138, 0.12)",
                        color: "#2fd08a",
                        border: "1px solid rgba(47, 208, 138, 0.25)",
                      }}
                    >
                      {p.confidence}% Trust
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#ffffff", marginBottom: 6 }}>
                    {p.selection}
                  </div>
                  <div style={{ fontSize: 12, color: "#2fd08a", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    Odds: {p.odd ? p.odd.toFixed(2) : "1.65"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lineups & Tactics */}
        {fixture.lineups && (
          <div
            style={{
              padding: 24,
              marginBottom: 24,
              borderRadius: 18,
              background: "#141132",
              border: "1px solid rgba(167, 159, 255, 0.12)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <UserCheck size={18} color="#2fd08a" />
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#ffffff" }}>
                Starting Lineups & Formations
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", marginBottom: 10 }}>
                  {fixture.homeTeam.name} ({fixture.lineups.home?.formation || "4-3-3"})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(fixture.lineups.home?.startingXl || []).map((p: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: "#a79fff", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#7874a4", fontFamily: "monospace", width: 18 }}>#{p.number}</span>
                      <span>{p.name} ({p.position})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", marginBottom: 10 }}>
                  {fixture.awayTeam.name} ({fixture.lineups.away?.formation || "4-2-3-1"})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(fixture.lineups.away?.startingXl || []).map((p: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: "#a79fff", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#7874a4", fontFamily: "monospace", width: 18 }}>#{p.number}</span>
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
