import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {};
    if (authHeader) headers["Authorization"] = authHeader;

    const res = await fetch(`${backendUrl}/api/hitandwin`, {
      headers,
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.warn("[NextAPI /api/hitandwin] Backend proxy error, using fallback:", err);
  }

  // Graceful fallback matches
  return NextResponse.json({
    success: true,
    userTier: "free",
    allowedSlips: 1,
    usedSlipsToday: 0,
    remainingSlips: 1,
    slips: [],
    matches: [
      { index: 1, id: "1638365", time: "23:15", homeTeam: { name: "Madureira", logo: "https://cdn.nerdytips.com/public/img/logos/7780.webp?width=48" }, awayTeam: { name: "Sampaio C", logo: "https://cdn.nerdytips.com/public/img/logos/13115.webp?width=48" }, odds: { "1": "2.62", "X": "2.90", "2": "2.95" } },
      { index: 2, id: "1638366", time: "23:30", homeTeam: { name: "Gimnasia LP 2", logo: "https://cdn.nerdytips.com/public/img/logos/18686.webp?width=48" }, awayTeam: { name: "Estudiant", logo: "https://cdn.nerdytips.com/public/img/logos/18685.webp?width=48" }, odds: { "1": "2.62", "X": "3.00", "2": "2.55" } },
      { index: 3, id: "1638367", time: "23:30", homeTeam: { name: "Saguntino", logo: null }, awayTeam: { name: "Navalcarnero", logo: null }, odds: { "1": "3.60", "X": "3.05", "2": "2.12" } },
      { index: 4, id: "1638368", time: "23:30", homeTeam: { name: "Aldosivi 2", logo: null }, awayTeam: { name: "Quilmes 2", logo: null }, odds: { "1": "2.90", "X": "3.05", "2": "2.40" } },
      { index: 5, id: "1528862", time: "00:15", dayLabel: "Sep 25", homeTeam: { name: "Netherlands", logo: "https://cdn.nerdytips.com/public/img/logos/1118.webp?width=48" }, awayTeam: { name: "Germany", logo: "https://cdn.nerdytips.com/public/img/logos/25.webp?width=48" }, odds: { "1": "2.42", "X": "3.75", "2": "2.72" } },
      { index: 6, id: "1528863", time: "00:15", dayLabel: "Sep 25", homeTeam: { name: "Serbia", logo: null }, awayTeam: { name: "Greece", logo: null }, odds: { "1": "2.65", "X": "3.30", "2": "2.72" } },
      { index: 7, id: "1528864", time: "00:15", dayLabel: "Sep 25", homeTeam: { name: "Kosovo", logo: null }, awayTeam: { name: "Ireland", logo: null }, odds: { "1": "2.45", "X": "3.15", "2": "3.10" } },
      { index: 8, id: "1528865", time: "00:15", dayLabel: "Sep 25", homeTeam: { name: "Norway", logo: null }, awayTeam: { name: "Denmark", logo: null }, odds: { "1": "1.78", "X": "4.10", "2": "4.35" } },
      { index: 9, id: "1528866", time: "00:15", dayLabel: "Sep 26", homeTeam: { name: "Italy", logo: null }, awayTeam: { name: "Belgium", logo: null }, odds: { "1": "2.18", "X": "3.55", "2": "3.40" } },
      { index: 10, id: "1528884", time: "00:15", dayLabel: "Sep 26", homeTeam: { name: "Hungary", logo: "https://cdn.nerdytips.com/public/img/logos/769.webp?width=48" }, awayTeam: { name: "Ukraine", logo: "https://cdn.nerdytips.com/public/img/logos/772.webp?width=48" }, odds: { "1": "2.32", "X": "3.30", "2": "3.25" } },
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const authHeader = req.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) headers["Authorization"] = authHeader;

    const body = await req.json();

    const res = await fetch(`${backendUrl}/api/hitandwin/slip`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to submit slip" },
      { status: 500 }
    );
  }
}
