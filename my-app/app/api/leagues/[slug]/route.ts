import { NextRequest, NextResponse } from "next/server";
import { toCachedLogoUrl } from "@/lib/logo-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");

  // 1. Try backend API first
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    const res = await fetch(`${backendUrl}/api/leagues/${encodeURIComponent(cleanSlug)}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.standings && data.standings.length > 0) {
        return NextResponse.json(data);
      }
    }
  } catch (err: any) {
    console.warn("[Next.js League Route] Backend unreachable, trying direct scrape fallback:", err.message);
  }

  // 2. Direct public GET fallback from nerdytips.com
  try {
    const urlsToTry = [
      `https://nerdytips.com/${cleanSlug}`,
      `https://nerdytips.com/football-predictions-for-${cleanSlug}`,
    ];
    if (cleanSlug === "championship") urlsToTry.push("https://nerdytips.com/football-predictions-for-championship-england");
    if (cleanSlug === "eredivisie") urlsToTry.push("https://nerdytips.com/football-predictions-for-eredivisie-netherlands");
    if (cleanSlug === "serie-b") urlsToTry.push("https://nerdytips.com/football-predictions-for-serie-b-italy");

    let html = "";
    for (const url of urlsToTry) {
      try {
        const resp = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          next: { revalidate: 1800 },
        });
        if (resp.ok) {
          const body = await resp.text();
          if (body.includes("tb-match") || body.includes("lgp-table")) {
            html = body;
            break;
          }
        }
      } catch {}
    }

    if (html) {
      // Parse Standings
      const standings: any[] = [];
      const tableMatch = html.match(/<table[^>]*class=["'][^"']*lgp-table[^"']*["'][\s\S]*?<\/table>/i);
      if (tableMatch) {
        const rows = Array.from(tableMatch[0].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi));
        for (const row of rows.slice(1)) {
          const rowContent = row[1];
          const posMatch = rowContent.match(/<td[^>]*class=["'][^"']*pos[^"']*["'][^>]*>(\d+)<\/td>/i) || rowContent.match(/<td[^>]*>(\d+)<\/td>/i);
          const teamLogoMatch = rowContent.match(/<img[^>]*(?:src|data-src)=["']([^"']*logos\/[^"']+)["'][^>]*>/i);
          const teamNameMatch = rowContent.match(/class=["'][^"']*(?:name|team)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|a|div)>/i) || rowContent.match(/<td[^>]*class=["'][^"']*team[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
          const cleanTeamName = teamNameMatch ? teamNameMatch[1].replace(/<[^>]+>/g, "").trim() : "";
          const cells = Array.from(rowContent.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)).map((m) => m[1].replace(/<[^>]+>/g, "").trim());

          const played = parseInt(cells[2], 10) || 0;
          const won = parseInt(cells[3], 10) || 0;
          const drawn = parseInt(cells[4], 10) || 0;
          const lost = parseInt(cells[5], 10) || 0;
          const goalsStr = cells[6] || "0:0";
          const [gfStr, gaStr] = goalsStr.split(":");
          const goalsFor = parseInt(gfStr, 10) || 0;
          const goalsAgainst = parseInt(gaStr, 10) || 0;
          const points = parseInt(cells[7], 10) || 0;

          const formMatches = Array.from(rowContent.matchAll(/class=["'][^"']*lgp-form--([wdl])[^"']*["']/gi)).map((m) => m[1].toUpperCase());
          const formLetters = formMatches.length > 0 ? formMatches : (cells[8] || "").split("").filter((c) => ["W", "D", "L"].includes(c.toUpperCase()));

          standings.push({
            rank: posMatch ? parseInt(posMatch[1], 10) : standings.length + 1,
            name: cleanTeamName,
            logo: toCachedLogoUrl(teamLogoMatch ? teamLogoMatch[1] : null),
            played,
            won,
            drawn,
            lost,
            goalsFor,
            goalsAgainst,
            goalDiff: goalsFor - goalsAgainst,
            points,
            form: formLetters.slice(0, 5),
          });
        }
      }

      // Parse Matches
      const matches: any[] = [];
      const rowRegex = /<a\b([^>]*\bhref=["'](?:https?:\/\/[^"']*)?(\/match-details\/[^"']+)["'][^>]*)>([\s\S]*?)<\/a>/gi;
      let matchExec: RegExpExecArray | null;
      while ((matchExec = rowRegex.exec(html)) !== null) {
        const fullAttrs = matchExec[1];
        const href = matchExec[2];
        const innerHtml = matchExec[3];

        const id = fullAttrs.match(/data-match=["']?(\d+)["']?/i)?.[1] || href.match(/-(\d+)(?:[?#]|$)/)?.[1] || "";
        const kick = fullAttrs.match(/data-kick=["']([^"']*)["']/i)?.[1] || "00:00";
        const rawStatus = fullAttrs.match(/data-status=["']([^"']*)["']/i)?.[1] || "upcoming";
        const srOnly = innerHtml.match(/<span class="sr-only">([\s\S]*?)<\/span>/)?.[1]?.trim() || "";

        let homeTeam = "";
        let awayTeam = "";
        const teamsMatch = srOnly.match(/^(.*?)\s+vs\s+(.*?),\s*(.*?),\s*kick-off/i);
        if (teamsMatch) {
          homeTeam = teamsMatch[1].trim();
          awayTeam = teamsMatch[2].trim();
        } else {
          const slugMatch = href.match(/\/match-details\/(.*?)-vs-(.*?)-prediction/);
          if (slugMatch) {
            homeTeam = slugMatch[1].replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
            awayTeam = slugMatch[2].replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
          }
        }

        const odds = { home: "1.75", draw: "3.50", away: "4.20" };
        const oddsMatch = srOnly.match(/Odds:\s*([\d\.]+)\s*home,\s*([\d\.]+)\s*draw,\s*([\d\.]+)\s*away/i);
        if (oddsMatch) {
          odds.home = oddsMatch[1];
          odds.draw = oddsMatch[2];
          odds.away = oddsMatch[3];
        }

        const logos = Array.from(innerHtml.matchAll(/<img[^>]*(?:src|data-src)=["']([^"']*logos\/[^"']+)["'][^>]*>/gi)).map((m) => m[1]);
        const homeLogo = toCachedLogoUrl(logos[0] || null);
        const awayLogo = toCachedLogoUrl(logos[1] || null);

        let homeScore: string | null = null;
        let awayScore: string | null = null;
        const scoreMatch = srOnly.match(/Final score\s*([\d\–\-]+)/i);
        if (scoreMatch) {
          const parts = scoreMatch[1].replace("–", "-").split("-");
          if (parts.length === 2) {
            homeScore = parts[0];
            awayScore = parts[1];
          }
        }

        // Predictions
        const btTt = innerHtml.match(/tbm-besttip[\s\S]*?data-tt=["']The best tip is ([^'"]+) with a trust of ([\d\.]+)\/10 and the odd is ([\d\.]+)["']/i);
        const bestTipPick = btTt ? btTt[1] : (srOnly.match(/Best tip:\s*(.*?),\s*odds/i)?.[1] || "1");
        const bestTipOdd = btTt ? btTt[3] : (srOnly.match(/odds\s*([\d\.]+)/i)?.[1] || "1.85");
        const bestTipRating = btTt ? parseFloat(btTt[2]) : 7.8;

        const isFinished = rawStatus.toLowerCase() === "won" || rawStatus.toLowerCase() === "lost" || rawStatus.toLowerCase() === "finished";
        const isLive = rawStatus.toLowerCase() === "live";

        matches.push({
          id,
          url: `/match/${id}`,
          leagueName: cleanSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          country: "International",
          flagUrl: null,
          homeTeam: homeTeam || "Home Team",
          awayTeam: awayTeam || "Away Team",
          homeLogo,
          awayLogo,
          kickTime: kick,
          status: isLive ? "live" : isFinished ? "won" : "upcoming",
          homeScore,
          awayScore,
          isLive,
          odds,
          rating: bestTipRating,
          confidence: `${Math.round(bestTipRating * 10)}%`,
          predictions: {
            pickScore: { pick: "1", odd: odds.home, rating: 7.5, isBest: false },
            goals: { pick: "Over 2.5", odd: "1.75", rating: 7.5, isBest: false },
            btts: { pick: "Yes", odd: "1.80", rating: 7.5, isBest: false },
            bestTip: {
              pick: bestTipPick,
              odd: bestTipOdd,
              rating: bestTipRating,
              marketLabel: "Top Tip",
              isBest: true,
            },
            bestMarket: "bestTip",
          },
        });
      }

      const upcomingMatches = matches.filter((m) => m.status === "upcoming" || m.status === "live");
      const recentMatches = matches.filter((m) => m.status !== "upcoming" && m.status !== "live");

      const leagueName = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").replace(/predictions/i, "").trim() || cleanSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      const leagueLogoMatch = html.match(/<img[^>]*(?:src|data-src)=["']([^"']*logos_leagues\/[^"']+)["'][^>]*>/i);
      const leagueLogo = toCachedLogoUrl(leagueLogoMatch ? leagueLogoMatch[1] : null);

      let finishedCount = recentMatches.length;
      let homeWins = 0, draws = 0, awayWins = 0, over15 = 0, over25 = 0, over35 = 0, btts = 0;
      for (const m of recentMatches) {
        const hs = parseInt(m.homeScore || "0", 10);
        const as = parseInt(m.awayScore || "0", 10);
        if (hs > as) homeWins++;
        else if (hs === as) draws++;
        else awayWins++;
        const tot = hs + as;
        if (tot > 1.5) over15++;
        if (tot > 2.5) over25++;
        if (tot > 3.5) over35++;
        if (hs > 0 && as > 0) btts++;
      }
      const fin = Math.max(1, finishedCount);

      return NextResponse.json({
        success: true,
        league: {
          id: cleanSlug,
          name: leagueName,
          country: "International",
          slug: cleanSlug,
          logo: leagueLogo,
          teamsCount: standings.length || 20,
        },
        kpis: {
          predictedMatches: matches.length,
          predictabilityRate: "78%",
          over25Rate: `${Math.round((over25 / fin) * 100)}%`,
          bttsRate: `${Math.round((btts / fin) * 100)}%`,
        },
        statistics: {
          homeWinsPct: Math.round((homeWins / fin) * 100),
          drawsPct: Math.round((draws / fin) * 100),
          awayWinsPct: Math.round((awayWins / fin) * 100),
          over15Pct: Math.round((over15 / fin) * 100),
          over25Pct: Math.round((over25 / fin) * 100),
          over35Pct: Math.round((over35 / fin) * 100),
          bttsPct: Math.round((btts / fin) * 100),
        },
        trends: {
          hotTeam: standings.length > 0 ? { name: standings[0].name, logo: standings[0].logo, wins: standings[0].won } : null,
          coldTeam: standings.length > 1 ? { name: standings[standings.length - 1].name, logo: standings[standings.length - 1].logo, losses: standings[standings.length - 1].lost } : null,
          constantTeam: standings.length > 2 ? { name: standings[1].name, logo: standings[1].logo } : null,
        },
        upcomingMatches: upcomingMatches.length > 0 ? upcomingMatches : matches.slice(0, 10),
        recentMatches,
        standings,
      });
    }
  } catch (err: any) {
    console.error("Direct league scrape error:", err);
  }

  return NextResponse.json({ success: false, error: "Failed to fetch league data" }, { status: 404 });
}
