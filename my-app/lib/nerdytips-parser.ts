export interface FullMatchDetails {
  matchId: string;
  hero: {
    countryFlag: string | null;
    country: string;
    leagueName: string;
    homeTeam: { name: string; logo: string | null; marketValue?: string };
    awayTeam: { name: string; logo: string | null; marketValue?: string };
    date: string;
    time: string;
    homeScore: string | null;
    awayScore: string | null;
    status: string;
    odds1x2: Array<{ label: string; isTip: boolean; odd: string }>;
    keyMoments: Array<{
      isStage: boolean;
      minute: string | null;
      score: string | null;
      player: string | null;
      type: "stage" | "goal" | "red" | "event";
      side: "home" | "away";
      rawText: string;
    }>;
  };
  tips: {
    warning: string | null;
    bestTip?: {
      pick: string;
      odd: string;
      explanation: string;
      confidence: string;
    };
    cards: Array<{
      title: string;
      pick: string | null;
      odd: string | null;
      confidence: string | null;
      score: { home: string; away: string } | null;
    }>;
  };
  statistics: Array<{
    label: string;
    home: string;
    away: string;
    homeLead: boolean;
    awayLead: boolean;
  }>;
  form: Array<{
    label: string;
    home: string;
    away: string;
    homeLead: boolean;
    awayLead: boolean;
  }>;
  h2h: {
    tally: {
      homeWins: string;
      draws: string;
      awayWins: string;
      homeRatio: string;
      drawRatio: string;
      awayRatio: string;
    };
    matches: Array<{
      date: string;
      team1: { name: string; logo: string; score: string; isWin: boolean } | null;
      team2: { name: string; logo: string; score: string; isWin: boolean } | null;
    }>;
  };
  recentMatches: {
    home: {
      name: string;
      crest: string | null;
      form: string[];
      matches: Array<{
        url: string;
        badge: string;
        date: string;
        homeTeam: { name: string; logo: string } | null;
        awayTeam: { name: string; logo: string } | null;
        homeScore: string;
        awayScore: string;
        odd1: string;
        odd2: string;
      }>;
    };
    away: {
      name: string;
      crest: string | null;
      form: string[];
      matches: Array<{
        url: string;
        badge: string;
        date: string;
        homeTeam: { name: string; logo: string } | null;
        awayTeam: { name: string; logo: string } | null;
        homeScore: string;
        awayScore: string;
        odd1: string;
        odd2: string;
      }>;
    };
  };
  standings: {
    leagueName: string;
    leagueLogo: string | null;
    rows: Array<{
      isCurrent: boolean;
      rank: string;
      zoneClass: string;
      teamName: string;
      teamLogo: string | null;
      played: string;
      goals: string;
      points: string;
    }>;
  };
}

export function cleanText(str?: string | null): string {
  if (!str) return "";
  return str
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseNerdyMatchHtml(html: string, matchId: string): FullMatchDetails {
  const details: FullMatchDetails = {
    matchId,
    hero: {
      countryFlag: null,
      country: "International",
      leagueName: "League",
      homeTeam: { name: "Home Team", logo: null, marketValue: "" },
      awayTeam: { name: "Away Team", logo: null, marketValue: "" },
      date: "",
      time: "",
      homeScore: null,
      awayScore: null,
      status: "Upcoming",
      odds1x2: [],
      keyMoments: [],
    },
    tips: {
      warning: null,
      cards: [],
    },
    statistics: [],
    form: [],
    h2h: {
      tally: {
        homeWins: "0",
        draws: "0",
        awayWins: "0",
        homeRatio: "33%",
        drawRatio: "33%",
        awayRatio: "33%",
      },
      matches: [],
    },
    recentMatches: {
      home: { name: "", crest: null, form: [], matches: [] },
      away: { name: "", crest: null, form: [], matches: [] },
    },
    standings: {
      leagueName: "",
      leagueLogo: null,
      rows: [],
    },
  };

  // 1. Breadcrumbs & League
  const leagueImg = html.match(/class="md-hero"[\s\S]*?<img src="([^"]+)"[^>]*alt="([^"]*)"/i);
  const leagueNameMatch = html.match(/class="lgl[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
  if (leagueImg) {
    details.hero.countryFlag = leagueImg[1];
    details.hero.country = leagueImg[2] || "International";
  }
  if (leagueNameMatch) {
    details.hero.leagueName = cleanText(leagueNameMatch[1]);
  }

  // 2. Teams & Market Values
  const heroGridMatch = html.match(/class="grid grid-cols-\[1fr_auto_1fr\][^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div class="md-1x2row/i);
  if (heroGridMatch) {
    const gridHtml = heroGridMatch[1];
    const teamLinks = [...gridHtml.matchAll(/<a href="\/team\/[^"]*"([\s\S]*?)<\/a>/gi)];
    if (teamLinks.length >= 2) {
      const hHtml = teamLinks[0][1];
      const aHtml = teamLinks[1][1];

      const hLogo = hHtml.match(/<img src="([^"]+)"/i);
      const hName = hHtml.match(/class="md-tname[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const hVal = hHtml.match(/class="text-\[11px\][^"]*"[^>]*>([\s\S]*?)<\/span>/i);

      const aLogo = aHtml.match(/<img src="([^"]+)"/i);
      const aName = aHtml.match(/class="md-tname[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const aVal = aHtml.match(/class="text-\[11px\][^"]*"[^>]*>([\s\S]*?)<\/span>/i);

      details.hero.homeTeam = {
        name: hName ? cleanText(hName[1]) : "Home Team",
        logo: hLogo ? hLogo[1] : null,
        marketValue: hVal ? cleanText(hVal[1]) : "",
      };
      details.hero.awayTeam = {
        name: aName ? cleanText(aName[1]) : "Away Team",
        logo: aLogo ? aLogo[1] : null,
        marketValue: aVal ? cleanText(aVal[1]) : "",
      };
    }
  }

  // 3. Date, Time, Scores, Status
  const dateMatch = html.match(/class="md-date"[^>]*><span[^>]*>([^<]+)<\/span><strong[^>]*>([^<]+)<\/strong>/i);
  const scoreHMatch = html.match(/data-score-h[^>]*>([^<]+)<\/span>/i);
  const scoreAMatch = html.match(/data-score-a[^>]*>([^<]+)<\/span>/i);
  const statusMatch = html.match(/data-md-status[^>]*>([\s\S]*?)<\/span>/i);

  if (dateMatch) {
    details.hero.date = cleanText(dateMatch[1]);
    details.hero.time = cleanText(dateMatch[2]);
  }
  if (scoreHMatch) details.hero.homeScore = cleanText(scoreHMatch[1]);
  if (scoreAMatch) details.hero.awayScore = cleanText(scoreAMatch[1]);
  if (statusMatch) details.hero.status = cleanText(statusMatch[1]);

  // 4. 1X2 Odds Row
  const odds1x2Matches = [...html.matchAll(/<span class="md-1x2([^"]*)"><span class="md-1x2__l">([^<]+)<\/span><span class="md-1x2__o">([\s\S]*?)<\/span><\/span>/gi)];
  details.hero.odds1x2 = odds1x2Matches.map((m) => {
    const rawO = cleanText(m[3]);
    const num = rawO.match(/(\d+\.\d+|\d+)/);
    return {
      label: cleanText(m[2]),
      isTip: m[1].includes("md-1x2--tip"),
      odd: num ? num[1] : rawO,
    };
  });

  // 5. Key Moments
  const momentsMatches = [...html.matchAll(/<li class="md-ev__(stage|row)([^"]*)"[^>]*>([\s\S]*?)<\/li>/gi)];
  details.hero.keyMoments = momentsMatches.map((m) => {
    const isStage = m[1] === "stage";
    const minMatch = m[3].match(/class="md-ev__min"[^>]*>([\s\S]*?)<\/span>/i);
    const scoreMatch = m[3].match(/class="md-ev__sc"[^>]*>([\s\S]*?)<\/i>/i);
    const nameMatch = m[3].match(/class="md-ev__name"[^>]*>([\s\S]*?)<\/span>/i);
    const isGoal = m[2].includes("is-goal");
    const isRed = m[2].includes("is-red");
    const isAway = m[2].includes("is-away") || m[2].includes("is-a");
    return {
      isStage,
      minute: minMatch ? cleanText(minMatch[1]) : null,
      score: scoreMatch ? cleanText(scoreMatch[1]) : null,
      player: nameMatch ? cleanText(nameMatch[1]) : null,
      type: isStage ? "stage" : isGoal ? "goal" : isRed ? "red" : "event",
      side: isAway ? "away" : "home",
      rawText: cleanText(m[3]),
    };
  });

  // 6. Section #tips
  const warnMatch = html.match(/class="md-warn"[\s\S]*?class="md-pcard__tip[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
  details.tips.warning = warnMatch ? cleanText(warnMatch[1]) : null;

  const bestPick = html.match(/class="md-best[\s\S]*?class="md-best__tip">([^<]+)<\/span>/i);
  const bestOdd = html.match(/class="md-best__odd"[^>]*>[\s\S]*?(\d+\.\d+|\d+)<\/span>/i);
  const bestExpl = html.match(/class="md-best__expl-in">([^<]+)<\/span>/i);
  const bestConf = html.match(/class="md-best[\s\S]*?class="md-conf__val">([\s\S]*?)<\/span>/i);

  if (bestPick) {
    details.tips.bestTip = {
      pick: cleanText(bestPick[1]),
      odd: bestOdd ? bestOdd[1] : "",
      explanation: bestExpl ? cleanText(bestExpl[1]) : "",
      confidence: bestConf ? cleanText(bestConf[1]) : "",
    };
  }

  const pcardMatches = [...html.matchAll(/<div class="md-pcard">([\s\S]*?)<\/div><\/div>/gi)];
  details.tips.cards = [];
  for (const pc of pcardMatches) {
    const lbl = pc[1].match(/class="md-pcard__label">([^<]+)<\/span>/i);
    const tip = pc[1].match(/class="md-pcard__tip">([^<]+)<\/span>/i);
    const odd = pc[1].match(/class="md-pcard__odd"[^>]*>[\s\S]*?(\d+\.\d+|\d+)<\/span>/i);
    const conf = pc[1].match(/class="md-conf__val">([\s\S]*?)<\/span>/i);
    const score = pc[1].match(/class="md-score"[\s\S]*?<b class="md-score__n">(\d+)<\/b>[\s\S]*?<b class="md-score__n">(\d+)<\/b>/i);

    details.tips.cards.push({
      title: lbl ? cleanText(lbl[1]) : "",
      pick: tip ? cleanText(tip[1]) : null,
      odd: odd ? odd[1] : null,
      confidence: conf ? cleanText(conf[1]) : null,
      score: score ? { home: score[1], away: score[2] } : null,
    });
  }

  // 7. Section #statistics
  const statsSec = html.match(/<section id="statistics"[\s\S]*?<\/section>/i);
  if (statsSec) {
    const rows = [...statsSec[0].matchAll(/<div class="md-ps__row"><span class="md-ps__lbl"><span>([^<]+)<\/span><\/span><span class="md-ps__v md-ps__v--h([^"]*)">[\s\S]*?<\/span>([^<]+)<\/span><span class="md-ps__v md-ps__v--a([^"]*)">[\s\S]*?<\/span>([^<]+)<\/span>/gi)];
    details.statistics = rows.map((r) => ({
      label: cleanText(r[1]),
      home: cleanText(r[3]),
      away: cleanText(r[5]),
      homeLead: r[2].includes("is-lead"),
      awayLead: r[4].includes("is-lead"),
    }));
  }

  // 8. Section #form
  const formSec = html.match(/<section id="form"[\s\S]*?<\/section>/i);
  if (formSec) {
    const rows = [...formSec[0].matchAll(/<div class="md-ps__row"><span class="md-ps__lbl"><span>([^<]+)<\/span><\/span><span class="md-ps__v md-ps__v--h([^"]*)">[\s\S]*?<\/span>([^<]+)<\/span><span class="md-ps__v md-ps__v--a([^"]*)">[\s\S]*?<\/span>([^<]+)<\/span>/gi)];
    details.form = rows.map((r) => ({
      label: cleanText(r[1]),
      home: cleanText(r[3]),
      away: cleanText(r[5]),
      homeLead: r[2].includes("is-lead"),
      awayLead: r[4].includes("is-lead"),
    }));
  }

  // 9. Section #h2h
  const h2hSec = html.match(/<section id="h2h"[\s\S]*?<\/section>/i);
  if (h2hSec) {
    const hN = h2hSec[0].match(/class="md-h2h__n md-h2h__n--h">(\d+)<\/span>/i);
    const dN = h2hSec[0].match(/class="md-h2h__n md-h2h__n--d">(\d+)<\/span>/i);
    const aN = h2hSec[0].match(/class="md-h2h__n md-h2h__n--a">(\d+)<\/span>/i);
    const barH = h2hSec[0].match(/class="md-h2h__seg md-h2h__seg--h"\s+style="width:([^"]+)"/i);
    const barD = h2hSec[0].match(/class="md-h2h__seg md-h2h__seg--d"\s+style="width:([^"]+)"/i);
    const barA = h2hSec[0].match(/class="md-h2h__seg md-h2h__seg--a"\s+style="width:([^"]+)"/i);

    details.h2h.tally = {
      homeWins: hN ? hN[1] : "0",
      draws: dN ? dN[1] : "0",
      awayWins: aN ? aN[1] : "0",
      homeRatio: barH ? barH[1] : "33%",
      drawRatio: barD ? barD[1] : "33%",
      awayRatio: barA ? barA[1] : "33%",
    };

    const matches = [...h2hSec[0].matchAll(/<div class="md-rm[^"]*"><span class="md-rm__date"[^>]*>([^<]+)<\/span><div class="md-rm__teams">([\s\S]*?)<\/div><\/div>/gi)];
    details.h2h.matches = matches.map((m) => {
      const date = cleanText(m[1]);
      const t = [...m[2].matchAll(/<div class="md-rm__team([^"]*)">[\s\S]*?<img src="([^"]+)"[\s\S]*?<span class="md-rm__name">([^<]+)<\/span><span class="md-rm__score">(\d+)<\/span>/gi)];
      return {
        date,
        team1: t[0] ? { name: cleanText(t[0][3]), logo: t[0][2], score: t[0][4], isWin: t[0][1].includes("is-win") } : null,
        team2: t[1] ? { name: cleanText(t[1][3]), logo: t[1][2], score: t[1][4], isWin: t[1][1].includes("is-win") } : null,
      };
    });
  }

  // 10. Section #recent-matches
  const rmSec = html.match(/<section id="recent-matches"[\s\S]*?<\/section>/i);
  if (rmSec) {
    const cols = [...rmSec[0].matchAll(/<div class="md-formcol"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="md-formcol"|<\/div>\s*<\/section>)/gi)];
    const parseCol = (colHtml: string) => {
      const crest = colHtml.match(/class="md-formcol__crest"[^>]*src="([^"]+)"/i);
      const name = colHtml.match(/class="md-formcol__name">([^<]+)<\/span>/i);
      const formDots = [...colHtml.matchAll(/<span class="tm-form\s+tm-form--[wld]">([WLD])<\/span>/gi)].map((m) => m[1]);
      const rowMatches = [...colHtml.matchAll(/<a href="([^"]*)" class="md-formrow[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)];
      const matches = rowMatches.map((rm) => {
        const formBadge = rm[2].match(/class="tm-form\s+tm-form--[wld]"[^>]*>([WLD])<\/span>/i);
        const date = rm[2].match(/class="md-fmeta__date"[^>]*>([^<]+)<\/span>/i);
        const teams = [...rm[2].matchAll(/<span class="md-fteam[^"]*">[\s\S]*?<img src="([^"]+)"[\s\S]*?<span class="md-fteam__n">([^<]+)<\/span><\/span>/gi)];
        const scores = [...rm[2].matchAll(/<span class="md-fscore__n[^"]*">(\d+)<\/span>/gi)];
        const odds = [...rm[2].matchAll(/<span class="md-fodds__o">([\s\S]*?)<\/span>/gi)];
        return {
          url: rm[1],
          badge: formBadge ? formBadge[1] : "",
          date: date ? cleanText(date[1]) : "",
          homeTeam: teams[0] ? { name: cleanText(teams[0][2]), logo: teams[0][1] } : null,
          awayTeam: teams[1] ? { name: cleanText(teams[1][2]), logo: teams[1][1] } : null,
          homeScore: scores[0] ? scores[0][1] : "",
          awayScore: scores[1] ? scores[1][1] : "",
          odd1: odds[0] ? cleanText(odds[0][1]) : "",
          odd2: odds[1] ? cleanText(odds[1][1]) : "",
        };
      });
      return {
        name: name ? cleanText(name[1]) : "",
        crest: crest ? crest[1] : null,
        form: formDots,
        matches,
      };
    };

    if (cols[0]) details.recentMatches.home = parseCol(cols[0][1]);
    if (cols[1]) details.recentMatches.away = parseCol(cols[1][1]);
  }

  // 11. Section #standings
  const stSec = html.match(/<section id="standings"[\s\S]*?<\/section>/i);
  if (stSec) {
    const stTitle = stSec[0].match(/<span class="truncate text-sm font-bold text-heading">([^<]+)<\/span>/i);
    const stLogo = stSec[0].match(/<img src="([^"]+)"[^>]*class="[^"]*rounded-\[3px\]/i);
    details.standings.leagueName = stTitle ? cleanText(stTitle[1]) : "";
    details.standings.leagueLogo = stLogo ? stLogo[1] : null;

    const rows = [...stSec[0].matchAll(/<tr class="md-st__row([^"]*)">([\s\S]*?)<\/tr>/gi)];
    details.standings.rows = rows.map((r) => {
      const isCurrent = r[1].includes("is-current");
      const rank = r[2].match(/class="md-st__rank">[\s\S]*?(\d+)<\/td>/i);
      const zone = r[2].match(/class="md-st__zone\s+([^"]+)"/i);
      const teamLogo = r[2].match(/class="md-st__logo"[^>]*src="([^"]+)"/i);
      const teamName = r[2].match(/class="md-st__name">([^<]+)<\/span>/i);
      const nums = [...r[2].matchAll(/<td class="md-st__n[^"]*">([^<]+)<\/td>/gi)];
      return {
        isCurrent,
        rank: rank ? rank[1] : "",
        zoneClass: zone ? zone[1] : "",
        teamName: teamName ? cleanText(teamName[1]) : "",
        teamLogo: teamLogo ? teamLogo[1] : null,
        played: nums[0] ? cleanText(nums[0][1]) : "",
        goals: nums[1] ? cleanText(nums[1][1]) : "",
        points: nums[2] ? cleanText(nums[2][1]) : "",
      };
    });
  }

  return details;
}

export async function fetchNerdyMatchDetails(matchId: string): Promise<FullMatchDetails | null> {
  const url = `https://nerdytips.com/match-details/${matchId}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 60 },
      redirect: "follow",
    });

    if (!res.ok) return null;
    const html = await res.text();
    return parseNerdyMatchHtml(html, matchId);
  } catch (e) {
    console.error(`[fetchNerdyMatchDetails] Failed to fetch match ${matchId}:`, e);
    return null;
  }
}
