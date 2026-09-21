import Navbar from "@/components/Navbar";
import MatchDetailView from "@/components/MatchDetailView";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { fetchNerdyMatchDetails } from "@/lib/nerdytips-parser";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

export default async function MatchDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const headers: Record<string, string> = token ? { Cookie: `auth_token=${token}` } : {};

  // 1. Fetch from backend API
  let fixture: any = null;
  try {
    const res = await fetch(`${BACKEND_URL}/api/fixtures/${params.id}`, {
      headers,
      next: { revalidate: 30 },
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

    if (res?.fixture) {
      fixture = res.fixture;
    }
  } catch (err) {
    console.warn("Backend fetch failed in match page:", err);
  }

  // 2. If no fixture or missing matchDetails, fetch directly from NerdyTips
  let matchDetails = fixture?.matchDetails || null;
  if (!matchDetails) {
    try {
      matchDetails = await fetchNerdyMatchDetails(params.id);
    } catch (e) {
      console.warn("Direct NerdyTips fetch failed:", e);
    }
  }

  // 3. If fixture is missing but matchDetails was fetched, build fixture fallback
  if (!fixture && matchDetails) {
    const hTeam = matchDetails.hero.homeTeam;
    const aTeam = matchDetails.hero.awayTeam;
    const pHome = matchDetails.hero.odds1x2?.find((o: any) => o.label === "1");
    const pDraw = matchDetails.hero.odds1x2?.find((o: any) => o.label === "X");
    const pAway = matchDetails.hero.odds1x2?.find((o: any) => o.label === "2");
    const best = matchDetails.tips.bestTip;

    fixture = {
      id: params.id,
      externalId: params.id,
      leagueId: matchDetails.hero.leagueName?.toLowerCase().replace(/\s+/g, "-"),
      league: {
        id: matchDetails.hero.leagueName?.toLowerCase().replace(/\s+/g, "-"),
        name: matchDetails.hero.leagueName,
        country: {
          id: matchDetails.hero.country?.toLowerCase().replace(/\s+/g, "-"),
          name: matchDetails.hero.country,
          flag: matchDetails.hero.countryFlag,
        },
      },
      homeTeam: {
        id: hTeam.name?.toLowerCase().replace(/\s+/g, "-"),
        name: hTeam.name,
        logo: hTeam.logo,
      },
      awayTeam: {
        id: aTeam.name?.toLowerCase().replace(/\s+/g, "-"),
        name: aTeam.name,
        logo: aTeam.logo,
      },
      matchDate: matchDetails.hero.date,
      kickoffTime: matchDetails.hero.time,
      status:
        matchDetails.hero.status === "Finished"
          ? "FINISHED"
          : matchDetails.hero.status === "Live"
          ? "LIVE"
          : "UPCOMING",
      homeScore: matchDetails.hero.homeScore !== null ? parseInt(matchDetails.hero.homeScore, 10) : null,
      awayScore: matchDetails.hero.awayScore !== null ? parseInt(matchDetails.hero.awayScore, 10) : null,
      odds: {
        home: pHome ? parseFloat(pHome.odd) || 1.85 : 1.85,
        draw: pDraw ? parseFloat(pDraw.odd) || 3.4 : 3.4,
        away: pAway ? parseFloat(pAway.odd) || 3.8 : 3.8,
        bookmaker: "Consensus",
      },
      predictions: [
        {
          fixtureId: params.id,
          market: "1X2",
          selection: best?.pick || (pAway?.isTip ? "2" : pHome?.isTip ? "1" : "1"),
          confidence: best ? parseInt(best.confidence, 10) || 75 : 75,
          odd: best ? parseFloat(best.odd) || 1.85 : 1.85,
        },
      ],
      matchDetails,
    };
  }

  if (!fixture) {
    notFound();
  }

  // Ensure matchDetails is attached to fixture
  if (matchDetails && !fixture.matchDetails) {
    fixture.matchDetails = matchDetails;
  }

  return (
    <div style={{ background: "#08071a", minHeight: "100vh", color: "#ffffff" }}>
      <Navbar />
      <MatchDetailView fixture={fixture} />
    </div>
  );
}
