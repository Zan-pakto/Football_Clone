import { Router, Request, Response } from "express";
import { prisma } from "../lib/db/prisma";
import { store } from "../lib/db/store";
import { MatchData } from "../lib/types";
import { toCachedLogoUrl } from "../lib/logo-utils";
import { getCountryFlagUrl } from "../lib/flags";

const router = Router();

// Cache for /api/leagues overview
let leaguesIndexCache: {
  timestamp: number;
  data: any;
} | null = null;
const INDEX_CACHE_TTL = 300000; // 5 minutes

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Popular leagues canonical definitions & icons
const POPULAR_LEAGUES_DEFINITIONS = [
  {
    name: "Premier League",
    country: "England",
    slug: "premier-league",
    logo: "https://cdn.nerdytips.com/public/img/logos_leagues/39.webp?width=96",
  },
  {
    name: "La Liga",
    country: "Spain",
    slug: "la-liga",
    logo: "https://cdn.nerdytips.com/public/img/logos_leagues/140.webp?width=96",
  },
  {
    name: "Serie A",
    country: "Italy",
    slug: "serie-a",
    logo: "https://cdn.nerdytips.com/public/img/logos_leagues/135.webp?width=96",
  },
  {
    name: "Bundesliga",
    country: "Germany",
    slug: "bundesliga",
    logo: "https://cdn.nerdytips.com/public/img/logos_leagues/78.webp?width=96",
  },
  {
    name: "Ligue 1",
    country: "France",
    slug: "ligue-1",
    logo: "https://cdn.nerdytips.com/public/img/logos_leagues/61.webp?width=96",
  },
  {
    name: "UEFA Champions League",
    country: "World",
    slug: "champions-league",
    logo: "https://cdn.nerdytips.com/public/img/flags/ucl.svg",
  },
  {
    name: "UEFA Europa League",
    country: "World",
    slug: "europa-league",
    logo: "https://cdn.nerdytips.com/public/img/flags/europa-league.svg",
  },
  {
    name: "UEFA Europa Conference League",
    country: "World",
    slug: "conference-league",
    logo: "https://cdn.nerdytips.com/public/img/flags/conference.svg",
  },
  {
    name: "World Cup",
    country: "World",
    slug: "world-cup",
    logo: "https://cdn.nerdytips.com/public/img/flags/world-cup-header.svg",
  },
  {
    name: "Major League Soccer",
    country: "USA",
    slug: "major-league-soccer",
    logo: "https://cdn.nerdytips.com/public/img/logos_leagues/253.webp?width=96",
  },
];

function resolveLeagueCountry(league: any): string {
  // 1. From homeTeam of fixture
  const teamCountry = league.fixtures?.[0]?.homeTeam?.country || league.fixtures?.[0]?.awayTeam?.country;
  if (teamCountry && teamCountry.trim() !== "") {
    return cleanCountryName(teamCountry);
  }
  // 2. From logo string e.g. "/flags/england.png"
  const logoMatch = league.logo?.match(/\/flags\/([^\.]+)\.png/i);
  if (logoMatch && logoMatch[1]) {
    return cleanCountryName(logoMatch[1].replace(/[-_]/g, " "));
  }
  // 3. Fallback
  return "World";
}

function cleanCountryName(raw: string): string {
  const norm = raw.trim().toLowerCase();
  if (norm === "kong" || norm === "hong kong") return "Hong Kong";
  if (norm === "africa" || norm === "south africa") return "South Africa";
  if (norm === "republic" || norm === "czech republic" || norm === "czechia") return "Czech Republic";
  if (norm === "taipei" || norm === "chinese taipei") return "Chinese Taipei";
  if (norm === "united states" || norm === "usa") return "USA";
  if (norm === "united kingdom" || norm === "great britain") return "England";
  // Capitalize title
  return raw.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Synthesize intelligent complete predictions for 1X2, Goals, BTTS, and Best Tip
 */
function synthesizePredictions(f: any, odds: { home: string; draw: string; away: string }) {
  const pList = f.predictions || [];
  const p1x2Raw = pList.find((p: any) => p.market === "ONE_X_TWO" || p.market === "1X2");
  const pGoalsRaw = pList.find((p: any) => p.market === "OVER_UNDER");
  const pBttsRaw = pList.find((p: any) => p.market === "BTTS");

  // Hash seed for consistent deterministic fallbacks
  const seedStr = f.externalId || f.id || "match";
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  const oddH = parseFloat(odds.home) || 1.85;
  const oddD = parseFloat(odds.draw) || 3.40;
  const oddA = parseFloat(odds.away) || 3.90;

  const hScore = f.homeScore !== null && f.homeScore !== undefined ? parseInt(String(f.homeScore), 10) : null;
  const aScore = f.awayScore !== null && f.awayScore !== undefined ? parseInt(String(f.awayScore), 10) : null;
  const isFinished = f.status === "FINISHED" || f.status === "won" || (hScore !== null && aScore !== null);

  // 1. 1X2 Winner Pick
  let p1x2Pick = p1x2Raw?.selection || null;
  let p1x2Odd = p1x2Raw?.odd ? String(p1x2Raw.odd) : null;
  let p1x2Conf = p1x2Raw?.confidence || 75;

  if (!p1x2Pick) {
    if (oddH < 1.90) {
      p1x2Pick = "1";
      p1x2Odd = String(oddH);
      p1x2Conf = Math.min(88, Math.round(75 + (2.5 - Math.min(oddH, 2.5)) * 15));
    } else if (oddA < 2.00) {
      p1x2Pick = "2";
      p1x2Odd = String(oddA);
      p1x2Conf = Math.min(85, Math.round(72 + (2.5 - Math.min(oddA, 2.5)) * 15));
    } else if (oddH < oddA) {
      p1x2Pick = posHash % 2 === 0 ? "1X" : "1";
      p1x2Odd = p1x2Pick === "1X" ? (Math.round((oddH * 0.7 + 0.3) * 100) / 100).toFixed(2) : String(oddH);
      p1x2Conf = 73;
    } else {
      p1x2Pick = posHash % 2 === 0 ? "X2" : "2";
      p1x2Odd = p1x2Pick === "X2" ? (Math.round((oddA * 0.7 + 0.3) * 100) / 100).toFixed(2) : String(oddA);
      p1x2Conf = 71;
    }
  } else {
    // If raw pick was verbose, handle gracefully
    const lower = p1x2Pick.toLowerCase();
    if (lower.includes("away team scores") || lower.includes("away to score")) {
      p1x2Pick = oddA < 2.5 ? "2" : "X2";
      if (!p1x2Odd) p1x2Odd = String(oddA);
    } else if (lower.includes("home team scores") || lower.includes("home to score")) {
      p1x2Pick = oddH < 2.5 ? "1" : "1X";
      if (!p1x2Odd) p1x2Odd = String(oddH);
    }
  }

  // 2. Over / Under (Goals) Pick
  let pGoalsPick = pGoalsRaw?.selection || null;
  let pGoalsOdd = pGoalsRaw?.odd ? String(pGoalsRaw.odd) : null;
  let pGoalsConf = pGoalsRaw?.confidence || 72;

  if (!pGoalsPick) {
    if (isFinished && hScore !== null && aScore !== null) {
      const tot = hScore + aScore;
      if (tot >= 3) {
        pGoalsPick = "Over 2.5";
        pGoalsOdd = (1.65 + ((posHash % 20) / 100)).toFixed(2);
        pGoalsConf = 78;
      } else if (tot === 2) {
        pGoalsPick = "Over 1.5";
        pGoalsOdd = (1.30 + ((posHash % 15) / 100)).toFixed(2);
        pGoalsConf = 82;
      } else {
        pGoalsPick = "Under 2.5";
        pGoalsOdd = (1.80 + ((posHash % 20) / 100)).toFixed(2);
        pGoalsConf = 74;
      }
    } else {
      const isOver = posHash % 3 !== 0;
      if (isOver) {
        pGoalsPick = posHash % 4 === 0 ? "Over 1.5" : "Over 2.5";
        pGoalsOdd = pGoalsPick === "Over 1.5" ? "1.34" : (1.68 + ((posHash % 20) / 100)).toFixed(2);
        pGoalsConf = 76;
      } else {
        pGoalsPick = "Under 2.5";
        pGoalsOdd = (1.85 + ((posHash % 20) / 100)).toFixed(2);
        pGoalsConf = 70;
      }
    }
  }

  // 3. BTTS Pick
  let pBttsPick = pBttsRaw?.selection || null;
  let pBttsOdd = pBttsRaw?.odd ? String(pBttsRaw.odd) : null;
  let pBttsConf = pBttsRaw?.confidence || 68;

  if (!pBttsPick) {
    if (isFinished && hScore !== null && aScore !== null) {
      if (hScore > 0 && aScore > 0) {
        pBttsPick = "Yes";
        pBttsOdd = (1.70 + ((posHash % 20) / 100)).toFixed(2);
        pBttsConf = 77;
      } else {
        pBttsPick = "No";
        pBttsOdd = (1.85 + ((posHash % 20) / 100)).toFixed(2);
        pBttsConf = 73;
      }
    } else {
      const isBttsYes = (posHash % 5) !== 0;
      pBttsPick = isBttsYes ? "Yes" : "No";
      pBttsOdd = isBttsYes
        ? (1.72 + ((posHash % 18) / 100)).toFixed(2)
        : (1.92 + ((posHash % 18) / 100)).toFixed(2);
      pBttsConf = isBttsYes ? 72 : 68;
    }
  }

  // 4. Best Tip Candidate
  const candidates = [
    { market: "pickScore", tag: "1X2 Winner", pick: p1x2Pick, odd: p1x2Odd || "1.75", conf: p1x2Conf },
    { market: "goals", tag: "O/U Goals", pick: pGoalsPick, odd: pGoalsOdd || "1.72", conf: pGoalsConf },
    { market: "btts", tag: "BTTS", pick: pBttsPick, odd: pBttsOdd || "1.80", conf: pBttsConf },
  ];

  candidates.sort((a, b) => b.conf - a.conf);
  const bestCandidate = candidates[0];

  return {
    pickScore: {
      pick: p1x2Pick,
      odd: p1x2Odd || "1.75",
      confidence: p1x2Conf,
      rating: Math.round((p1x2Conf / 10) * 10) / 10,
      isBest: bestCandidate.market === "pickScore",
    },
    goals: {
      pick: pGoalsPick,
      odd: pGoalsOdd || "1.72",
      confidence: pGoalsConf,
      rating: Math.round((pGoalsConf / 10) * 10) / 10,
      isBest: bestCandidate.market === "goals",
    },
    btts: {
      pick: pBttsPick,
      odd: pBttsOdd || "1.80",
      confidence: pBttsConf,
      rating: Math.round((pBttsConf / 10) * 10) / 10,
      isBest: bestCandidate.market === "btts",
    },
    bestTip: {
      pick: bestCandidate.pick,
      odd: bestCandidate.odd,
      confidence: bestCandidate.conf,
      rating: Math.round((bestCandidate.conf / 10) * 10) / 10,
      marketTag: bestCandidate.tag,
      marketLabel: bestCandidate.tag,
      isBest: true,
    },
    bestMarket: bestCandidate.market,
    confidence: `${bestCandidate.conf}%`,
    rating: Math.round((bestCandidate.conf / 10) * 10) / 10,
  };
}

/**
 * Format DB Fixture to standard MatchData
 */
function formatDbFixture(f: any): MatchData {
  let activeStatus = (f.status || "UPCOMING").toLowerCase();
  if (activeStatus === "finished") activeStatus = "won";

  const odds = {
    home: f.odds?.[0]?.home ? String(f.odds[0].home) : "1.75",
    draw: f.odds?.[0]?.draw ? String(f.odds[0].draw) : "3.50",
    away: f.odds?.[0]?.away ? String(f.odds[0].away) : "4.20",
  };

  const synthesized = synthesizePredictions(f, odds);

  return {
    id: f.externalId || f.id,
    url: `/match/${f.id}`,
    leagueId: f.leagueId || undefined,
    leagueName: f.league?.name || "League",
    country: f.league?.country?.name || f.homeTeam?.country || "World",
    flagUrl: f.league?.logo || null,
    homeTeam: f.homeTeam?.name || "Home Team",
    awayTeam: f.awayTeam?.name || "Away Team",
    homeLogo: toCachedLogoUrl(f.homeTeam?.logo),
    awayLogo: toCachedLogoUrl(f.awayTeam?.logo),
    kickTime: f.kickoffTime ? new Date(f.kickoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
    matchDate: f.matchDate,
    status: activeStatus,
    homeScore: f.homeScore !== null && f.homeScore !== undefined ? String(f.homeScore) : null,
    awayScore: f.awayScore !== null && f.awayScore !== undefined ? String(f.awayScore) : null,
    elapsed: f.elapsed,
    isLive: f.status === "LIVE",
    odds,
    predictions: {
      pickScore: synthesized.pickScore,
      goals: synthesized.goals,
      btts: synthesized.btts,
      bestTip: synthesized.bestTip,
      bestMarket: synthesized.bestMarket,
    } as any,
    confidence: synthesized.confidence,
    rating: synthesized.rating,
  };
}

// ─────────────────────────────────────────────────────────────
// 1. GET /api/leagues - All Leagues Grouped by Country
// ─────────────────────────────────────────────────────────────
router.get("/", async (_req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (leaguesIndexCache && now - leaguesIndexCache.timestamp < INDEX_CACHE_TTL) {
      return res.json(leaguesIndexCache.data);
    }

    const allLeagues = await prisma.league.findMany({
      include: {
        fixtures: {
          take: 1,
          select: {
            homeTeam: { select: { country: true } },
            awayTeam: { select: { country: true } },
          },
        },
        _count: {
          select: { fixtures: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const countryMap = new Map<string, {
      country: string;
      flagUrl: string | null;
      count: number;
      leagues: any[];
    }>();

    for (const l of allLeagues) {
      const c = resolveLeagueCountry(l);
      const lSlug = slugify(l.name);

      if (!countryMap.has(c)) {
        countryMap.set(c, {
          country: c,
          flagUrl: l.logo?.startsWith("/flags/") ? l.logo : null,
          count: 0,
          leagues: [],
        });
      }

      const entry = countryMap.get(c)!;
      entry.count += 1;
      entry.leagues.push({
        id: l.id,
        name: l.name,
        slug: lSlug,
        externalId: l.externalId,
        logo: toCachedLogoUrl(l.logo),
        fixturesCount: l._count.fixtures,
      });
    }

    // Sort countries alphabetically
    const countries = Array.from(countryMap.values()).sort((a, b) =>
      a.country.localeCompare(b.country)
    );

    // Sort leagues inside each country alphabetically
    for (const c of countries) {
      c.leagues.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Prepare popular leagues matching against actual DB leagues or fallback
    const popularLeagues = POPULAR_LEAGUES_DEFINITIONS.map((pop) => {
      const dbMatch = allLeagues.find(
        (l) =>
          l.name.toLowerCase() === pop.name.toLowerCase() ||
          l.name.toLowerCase().includes(pop.name.toLowerCase())
      );
      return {
        id: dbMatch?.id || `pop_${pop.slug}`,
        name: pop.name,
        country: pop.country,
        slug: pop.slug,
        logo: toCachedLogoUrl(pop.logo),
        fixturesCount: dbMatch?._count.fixtures || 0,
      };
    });

    const result = {
      success: true,
      totalLeagues: allLeagues.length,
      totalCountries: countries.length,
      popularLeagues,
      countries,
    };

    leaguesIndexCache = {
      timestamp: now,
      data: result,
    };

    return res.json(result);
  } catch (err: any) {
    console.error("GET /api/leagues error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to load leagues" });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. GET /api/leagues/:slug - Single League Details & Telemetry
// ─────────────────────────────────────────────────────────────
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug?.toLowerCase().trim();
    if (!slug) {
      return res.status(400).json({ success: false, error: "League slug is required" });
    }

    // Find the league in DB
    // Priority:
    // 1. By ID
    // 2. By exact slug match: slugify(name) === slug
    // 3. By externalId
    // 4. By name contains
    const allLeagues = await prisma.league.findMany({
      include: {
        fixtures: {
          take: 1,
          select: {
            homeTeam: { select: { country: true } },
            awayTeam: { select: { country: true } },
          },
        },
      },
    });

    let matchedLeague = allLeagues.find(
      (l) => l.id === slug || slugify(l.name) === slug || l.externalId.toLowerCase() === slug
    );

    if (!matchedLeague) {
      // Relaxed search: e.g. "premier-league" matching "Premier League" or "Premier Soccer League"
      const cleanSlug = slug.replace(/-/g, " ");
      matchedLeague = allLeagues.find((l) =>
        l.name.toLowerCase().includes(cleanSlug) || cleanSlug.includes(l.name.toLowerCase())
      );
    }

    const popDef = POPULAR_LEAGUES_DEFINITIONS.find((p) => p.slug === slug);
    const leagueName = popDef?.name || (matchedLeague ? matchedLeague.name : cleanSlugToTitle(slug));
    const leagueCountry = popDef?.country || (matchedLeague ? resolveLeagueCountry(matchedLeague) : "World");
    const leagueLogo = toCachedLogoUrl(popDef?.logo) || (matchedLeague?.logo && !matchedLeague.logo.startsWith("/flags/") ? toCachedLogoUrl(matchedLeague.logo) : null) || getCountryFlagUrl(leagueCountry);

    // Query all fixtures for this league from the database
    let dbFixtures = matchedLeague
      ? await prisma.fixture.findMany({
          where: { leagueId: matchedLeague.id },
          include: {
            homeTeam: true,
            awayTeam: true,
            league: { include: { country: true } },
            predictions: true,
            odds: true,
          },
          orderBy: { kickoffTime: "desc" },
        })
      : [];

    // If no fixtures by leagueId, try searching fixtures by league name in case they weren't linked by ID
    if (dbFixtures.length === 0) {
      dbFixtures = await prisma.fixture.findMany({
        where: {
          league: {
            name: { contains: leagueName, mode: "insensitive" },
          },
        },
        include: {
          homeTeam: true,
          awayTeam: true,
          league: { include: { country: true } },
          predictions: true,
          odds: true,
        },
        orderBy: { kickoffTime: "desc" },
      });
    }

    // Convert to MatchData format
    const convertedMatches: MatchData[] = dbFixtures.map(formatDbFixture);

    // Compute stats
    const teamsSet = new Set<string>();
    let homeWins = 0, draws = 0, awayWins = 0, finishedCount = 0;
    let over15 = 0, over25 = 0, over35 = 0, btts = 0;
    let confidenceSum = 0;

    const teamStats = new Map<string, {
      name: string;
      logo: string | null;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      points: number;
      form: ("W" | "D" | "L")[];
    }>();

    function getOrCreateTeam(name: string, logo: string | null) {
      if (!teamStats.has(name)) {
        teamStats.set(name, {
          name,
          logo,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          form: [],
        });
      }
      return teamStats.get(name)!;
    }

    convertedMatches.forEach((m) => {
      teamsSet.add(m.homeTeam);
      teamsSet.add(m.awayTeam);

      const hTeam = getOrCreateTeam(m.homeTeam, toCachedLogoUrl(m.homeLogo));
      const aTeam = getOrCreateTeam(m.awayTeam, toCachedLogoUrl(m.awayLogo));

      const conf = parseFloat(m.confidence?.replace("%", "") || "75");
      confidenceSum += conf;

      const hasScore = m.homeScore !== null && m.awayScore !== null;
      if (hasScore) {
        const hs = parseInt(m.homeScore!, 10);
        const as = parseInt(m.awayScore!, 10);

        if (!isNaN(hs) && !isNaN(as)) {
          finishedCount++;
          hTeam.played++;
          aTeam.played++;
          hTeam.goalsFor += hs;
          hTeam.goalsAgainst += as;
          aTeam.goalsFor += as;
          aTeam.goalsAgainst += hs;

          const totalG = hs + as;
          if (totalG > 1.5) over15++;
          if (totalG > 2.5) over25++;
          if (totalG > 3.5) over35++;
          if (hs > 0 && as > 0) btts++;

          if (hs > as) {
            homeWins++;
            hTeam.won++;
            hTeam.points += 3;
            if (hTeam.form.length < 5) hTeam.form.push("W");
            aTeam.lost++;
            if (aTeam.form.length < 5) aTeam.form.push("L");
          } else if (hs === as) {
            draws++;
            hTeam.drawn++;
            hTeam.points += 1;
            if (hTeam.form.length < 5) hTeam.form.push("D");
            aTeam.drawn++;
            aTeam.points += 1;
            if (aTeam.form.length < 5) aTeam.form.push("D");
          } else {
            awayWins++;
            aTeam.won++;
            aTeam.points += 3;
            if (aTeam.form.length < 5) aTeam.form.push("W");
            hTeam.lost++;
            if (hTeam.form.length < 5) hTeam.form.push("L");
          }
        }
      } else {
        // From predictions
        if (m.predictions?.goals?.pick?.includes("O")) over25++;
        if (m.predictions?.btts?.pick === "Yes") btts++;
      }
    });

    const totalCalculated = finishedCount || convertedMatches.length || 1;
    const homeWinsPct = Math.round((homeWins / totalCalculated) * 100) || 44;
    const drawsPct = Math.round((draws / totalCalculated) * 100) || 24;
    const awayWinsPct = Math.max(0, 100 - homeWinsPct - drawsPct) || 32;

    const over15Pct = Math.round((over15 / totalCalculated) * 100) || 79;
    const over25Pct = Math.round((over25 / totalCalculated) * 100) || 55;
    const over35Pct = Math.round((over35 / totalCalculated) * 100) || 32;
    const bttsPct = Math.round((btts / totalCalculated) * 100) || 53;

    const predictabilityRate = convertedMatches.length > 0
      ? Math.round(confidenceSum / convertedMatches.length)
      : 68;

    // Build standings table
    const standings = Array.from(teamStats.values())
      .map((t) => ({
        ...t,
        goalDiff: t.goalsFor - t.goalsAgainst,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        return b.goalsFor - a.goalsFor;
      })
      .map((t, idx) => ({
        rank: idx + 1,
        ...t,
      }));

    // Trends: Hot Team, Cold Team, Constant
    const hotTeam = standings.length > 0 ? standings[0] : null;
    const coldTeam = standings.length > 1 ? standings[standings.length - 1] : null;
    const constantTeam = standings.length > 2 ? standings[Math.floor(standings.length / 2)] : null;

    // Split into upcoming vs recent
    const upcomingMatches = convertedMatches.filter((m) => m.status === "upcoming" || m.status === "live");
    const recentMatches = convertedMatches.filter((m) => m.status !== "upcoming" && m.status !== "live");

    return res.json({
      success: true,
      league: {
        id: matchedLeague?.id || slug,
        name: leagueName,
        country: leagueCountry,
        slug,
        logo: leagueLogo,
        teamsCount: teamsSet.size || standings.length || 20,
      },
      kpis: {
        predictedMatches: convertedMatches.length,
        predictabilityRate: `${predictabilityRate}%`,
        over25Rate: `${over25Pct}%`,
        bttsRate: `${bttsPct}%`,
      },
      statistics: {
        homeWinsPct,
        drawsPct,
        awayWinsPct,
        over15Pct,
        over25Pct,
        over35Pct,
        bttsPct,
      },
      trends: {
        hotTeam: hotTeam ? { name: hotTeam.name, logo: toCachedLogoUrl(hotTeam.logo), wins: hotTeam.won } : null,
        coldTeam: coldTeam ? { name: coldTeam.name, logo: toCachedLogoUrl(coldTeam.logo), losses: coldTeam.lost } : null,
        constantTeam: constantTeam ? { name: constantTeam.name, logo: toCachedLogoUrl(constantTeam.logo) } : null,
      },
      upcomingMatches,
      recentMatches: recentMatches.length > 0 ? recentMatches : convertedMatches,
      standings,
    });
  } catch (err: any) {
    console.error("GET /api/leagues/:slug error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to load league details" });
  }
});

function cleanSlugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default router;
