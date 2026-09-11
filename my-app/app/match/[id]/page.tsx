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
    <div style={{ background: "var(--background)", minHeight: "100vh" }}>
      <Navbar />

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 20px 80px" }}>
        {/* Match Header Hero Card */}
        <div className="luxury-card" style={{
          padding: "36px 28px",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
        }}>
          {/* League & Country Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 28 }}>
            <Trophy size={14} color="var(--gold)" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
                background: "var(--surface-raised)",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 10,
              }}>
                <img src={fixture.homeTeam.logo || ""} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)" }}>{fixture.homeTeam.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--surface-raised)", color: "var(--text-dim)" }}>
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
                    background: "var(--accent-green-bg)",
                    border: "1px solid var(--accent-green-border)",
                    color: "var(--accent-green)",
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 8,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-green)" }} />
                    LIVE {fixture.elapsed || "65'"}
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "2px" }}>
                    {fixture.homeScore ?? 0} - {fixture.awayScore ?? 0}
                  </div>
                </div>
              ) : isFinished ? (
                <div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                    FULL TIME
                  </span>
                  <div style={{ fontSize: 36, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "2px" }}>
                    {fixture.homeScore} - {fixture.awayScore}
                  </div>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>
                    KICKOFF
                  </span>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-primary)" }}>
                    {new Date(fixture.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              )}

              {fixture.venue && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                  <MapPin size={12} />
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
                background: "var(--surface-raised)",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 10,
              }}>
                <img src={fixture.awayTeam.logo || ""} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
              <span style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)" }}>{fixture.awayTeam.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--surface-raised)", color: "var(--text-dim)" }}>
                Form: {fixture.forms?.away?.form || "WDWWL"}
              </span>
            </div>
          </div>
        </div>

        {/* AI Predictions Section */}
        <div className="luxury-card" style={{
          padding: 24,
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <Zap size={20} color="var(--gold)" />
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
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
                      background: "var(--surface-raised)",
                      border: "1px dashed var(--gold-border)",
                      borderRadius: 10,
                      padding: "16px",
                      textAlign: "center",
                    }}
                  >
                    <Lock size={20} color="var(--gold)" style={{ margin: "0 auto 8px" }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                      {p.market} Prediction Locked
                    </div>
                    <Link
                      href="/pricing"
                      className="gold-btn"
                      style={{
                        padding: "6px 14px",
                        fontSize: 11,
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
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border-color)",
                    borderRadius: 10,
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase" }}>
                      {p.market}
                    </span>
                    <span className="status-pill-won">
                      {p.confidence}% Trust
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)", marginBottom: 6 }}>
                    {p.selection}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gold)", fontWeight: 700 }}>
                    Odds: {p.odd ? p.odd.toFixed(2) : "1.65"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lineups & Tactics */}
        {fixture.lineups && (
          <div className="luxury-card" style={{
            padding: 24,
            marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <UserCheck size={18} color="var(--accent-green)" />
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                Starting Lineups & Formations
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", marginBottom: 10 }}>
                  {fixture.homeTeam.name} ({fixture.lineups.home?.formation || "4-3-3"})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(fixture.lineups.home?.startingXl || []).map((p: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "var(--text-dim)", fontFamily: "monospace", width: 18 }}>#{p.number}</span>
                      <span>{p.name} ({p.position})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", marginBottom: 10 }}>
                  {fixture.awayTeam.name} ({fixture.lineups.away?.formation || "4-2-3-1"})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(fixture.lineups.away?.startingXl || []).map((p: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "var(--text-dim)", fontFamily: "monospace", width: 18 }}>#{p.number}</span>
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
