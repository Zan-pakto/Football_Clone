import { FootballDataProvider } from "./provider";
import {
  Fixture,
  FixtureFilter,
  OddsValue,
  TeamStats,
  Injury,
  Lineup,
  Prediction,
  LeagueGroupedFixtures,
  Country,
  League,
  Team,
} from "./types";

// Static Master Metadata
const COUNTRIES: Record<string, Country> = {
  england: { id: "country_eng", name: "England", code: "GB-ENG", flag: "https://flagcdn.com/w40/gb-eng.png" },
  spain: { id: "country_esp", name: "Spain", code: "ES", flag: "https://flagcdn.com/w40/es.png" },
  italy: { id: "country_ita", name: "Italy", code: "IT", flag: "https://flagcdn.com/w40/it.png" },
  germany: { id: "country_deu", name: "Germany", code: "DE", flag: "https://flagcdn.com/w40/de.png" },
  france: { id: "country_fra", name: "France", code: "FR", flag: "https://flagcdn.com/w40/fr.png" },
  europe: { id: "country_eur", name: "Europe", code: "EU", flag: "https://flagcdn.com/w40/eu.png" },
};

const LEAGUES: Record<string, League> = {
  premier_league: {
    id: "league_epl",
    name: "Premier League",
    countryId: "country_eng",
    country: COUNTRIES.england,
    logo: "https://media.api-sports.io/football/leagues/39.png",
    externalId: "39",
    isActive: true,
  },
  la_liga: {
    id: "league_laliga",
    name: "La Liga",
    countryId: "country_esp",
    country: COUNTRIES.spain,
    logo: "https://media.api-sports.io/football/leagues/140.png",
    externalId: "140",
    isActive: true,
  },
  serie_a: {
    id: "league_seriea",
    name: "Serie A",
    countryId: "country_ita",
    country: COUNTRIES.italy,
    logo: "https://media.api-sports.io/football/leagues/135.png",
    externalId: "135",
    isActive: true,
  },
  bundesliga: {
    id: "league_bundesliga",
    name: "Bundesliga",
    countryId: "country_deu",
    country: COUNTRIES.germany,
    logo: "https://media.api-sports.io/football/leagues/78.png",
    externalId: "78",
    isActive: true,
  },
  champions_league: {
    id: "league_ucl",
    name: "UEFA Champions League",
    countryId: "country_eur",
    country: COUNTRIES.europe,
    logo: "https://media.api-sports.io/football/leagues/2.png",
    externalId: "2",
    isActive: true,
  },
};

const TEAMS: Record<string, Team> = {
  arsenal: { id: "team_arsenal", name: "Arsenal", logo: "https://media.api-sports.io/football/teams/42.png", country: "England", externalId: "42" },
  chelsea: { id: "team_chelsea", name: "Chelsea", logo: "https://media.api-sports.io/football/teams/49.png", country: "England", externalId: "49" },
  man_city: { id: "team_mancity", name: "Manchester City", logo: "https://media.api-sports.io/football/teams/50.png", country: "England", externalId: "50" },
  liverpool: { id: "team_liverpool", name: "Liverpool", logo: "https://media.api-sports.io/football/teams/40.png", country: "England", externalId: "40" },
  tottenham: { id: "team_tottenham", name: "Tottenham", logo: "https://media.api-sports.io/football/teams/47.png", country: "England", externalId: "47" },
  aston_villa: { id: "team_astonvilla", name: "Aston Villa", logo: "https://media.api-sports.io/football/teams/66.png", country: "England", externalId: "66" },

  real_madrid: { id: "team_realmadrid", name: "Real Madrid", logo: "https://media.api-sports.io/football/teams/541.png", country: "Spain", externalId: "541" },
  barcelona: { id: "team_barcelona", name: "Barcelona", logo: "https://media.api-sports.io/football/teams/529.png", country: "Spain", externalId: "529" },
  atletico_madrid: { id: "team_atletico", name: "Atletico Madrid", logo: "https://media.api-sports.io/football/teams/530.png", country: "Spain", externalId: "530" },
  sevilla: { id: "team_sevilla", name: "Sevilla", logo: "https://media.api-sports.io/football/teams/536.png", country: "Spain", externalId: "536" },

  inter: { id: "team_inter", name: "Inter Milan", logo: "https://media.api-sports.io/football/teams/505.png", country: "Italy", externalId: "505" },
  milan: { id: "team_milan", name: "AC Milan", logo: "https://media.api-sports.io/football/teams/489.png", country: "Italy", externalId: "489" },
  juventus: { id: "team_juve", name: "Juventus", logo: "https://media.api-sports.io/football/teams/496.png", country: "Italy", externalId: "496" },
  napoli: { id: "team_napoli", name: "Napoli", logo: "https://media.api-sports.io/football/teams/492.png", country: "Italy", externalId: "492" },

  bayern: { id: "team_bayern", name: "Bayern Munich", logo: "https://media.api-sports.io/football/teams/157.png", country: "Germany", externalId: "157" },
  dortmund: { id: "team_dortmund", name: "Borussia Dortmund", logo: "https://media.api-sports.io/football/teams/165.png", country: "Germany", externalId: "165" },
  leverkusen: { id: "team_leverkusen", name: "Bayer Leverkusen", logo: "https://media.api-sports.io/football/teams/168.png", country: "Germany", externalId: "168" },
  leipzig: { id: "team_leipzig", name: "RB Leipzig", logo: "https://media.api-sports.io/football/teams/173.png", country: "Germany", externalId: "173" },
};

function getTodayUTC(): string {
  return new Date().toISOString().split("T")[0];
}

function getOffsetDateUTC(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

export class MockFootballProvider implements FootballDataProvider {
  private generateMockFixtures(date: string): Fixture[] {
    const today = getTodayUTC();
    const yesterday = getOffsetDateUTC(-1);
    const tomorrow = getOffsetDateUTC(1);

    const isToday = date === today || date === "0" || date === "";
    const isYesterday = date === yesterday || date === "-1";
    const isTomorrow = date === tomorrow || date === "1";

    const targetDate = isToday ? today : isYesterday ? yesterday : isTomorrow ? tomorrow : date;

    const baseMatches = [
      // ── EPL MATCHES ──
      {
        id: `mock_epl_1_${targetDate}`,
        externalId: `ext_epl_1_${targetDate}`,
        league: LEAGUES.premier_league,
        homeTeam: TEAMS.arsenal,
        awayTeam: TEAMS.chelsea,
        kickoffTime: `${targetDate}T15:00:00Z`,
        status: isYesterday ? "FINISHED" : isToday ? "LIVE" : "UPCOMING",
        elapsed: isYesterday ? "FT" : isToday ? "68'" : null,
        homeScore: isYesterday ? 3 : isToday ? 2 : null,
        awayScore: isYesterday ? 1 : isToday ? 1 : null,
        venue: "Emirates Stadium, London",
        odds: { home: 1.65, draw: 3.80, away: 5.25, over: 1.72, under: 2.10, bookmaker: "Bet365" },
        predictions: [
          { fixtureId: `mock_epl_1_${targetDate}`, market: "1X2" as const, selection: "1", confidence: 84, probability: 0.84, odd: 1.65, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_epl_1_${targetDate}`, market: "OVER_UNDER" as const, selection: "Over 2.5", confidence: 78, probability: 0.78, odd: 1.72, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_epl_1_${targetDate}`, market: "BTTS" as const, selection: "Yes", confidence: 75, probability: 0.75, odd: 1.80, isPremium: true, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
        ],
      },
      {
        id: `mock_epl_2_${targetDate}`,
        externalId: `ext_epl_2_${targetDate}`,
        league: LEAGUES.premier_league,
        homeTeam: TEAMS.liverpool,
        awayTeam: TEAMS.man_city,
        kickoffTime: `${targetDate}T17:30:00Z`,
        status: isYesterday ? "FINISHED" : isToday ? "UPCOMING" : "UPCOMING",
        elapsed: isYesterday ? "FT" : null,
        homeScore: isYesterday ? 2 : null,
        awayScore: isYesterday ? 2 : null,
        venue: "Anfield, Liverpool",
        odds: { home: 2.40, draw: 3.50, away: 2.80, over: 1.60, under: 2.30, bookmaker: "Betway" },
        predictions: [
          { fixtureId: `mock_epl_2_${targetDate}`, market: "1X2" as const, selection: "1X", confidence: 82, probability: 0.82, odd: 1.45, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_epl_2_${targetDate}`, market: "OVER_UNDER" as const, selection: "Over 2.5", confidence: 80, probability: 0.80, odd: 1.60, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_epl_2_${targetDate}`, market: "BTTS" as const, selection: "Yes", confidence: 88, probability: 0.88, odd: 1.55, isPremium: true, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
        ],
      },
      {
        id: `mock_epl_3_${targetDate}`,
        externalId: `ext_epl_3_${targetDate}`,
        league: LEAGUES.premier_league,
        homeTeam: TEAMS.tottenham,
        awayTeam: TEAMS.aston_villa,
        kickoffTime: `${targetDate}T19:45:00Z`,
        status: isYesterday ? "FINISHED" : isToday ? "LIVE" : "UPCOMING",
        elapsed: isYesterday ? "FT" : isToday ? "32'" : null,
        homeScore: isYesterday ? 1 : isToday ? 0 : null,
        awayScore: isYesterday ? 2 : isToday ? 1 : null,
        venue: "Tottenham Hotspur Stadium, London",
        odds: { home: 2.05, draw: 3.60, away: 3.40, over: 1.65, under: 2.20, bookmaker: "Unibet" },
        predictions: [
          { fixtureId: `mock_epl_3_${targetDate}`, market: "1X2" as const, selection: "12", confidence: 76, probability: 0.76, odd: 1.30, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_epl_3_${targetDate}`, market: "OVER_UNDER" as const, selection: "Over 2.5", confidence: 80, probability: 0.80, odd: 1.65, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_epl_3_${targetDate}`, market: "BTTS" as const, selection: "Yes", confidence: 82, probability: 0.82, odd: 1.62, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
        ],
      },

      // ── LA LIGA MATCHES ──
      {
        id: `mock_laliga_1_${targetDate}`,
        externalId: `ext_laliga_1_${targetDate}`,
        league: LEAGUES.la_liga,
        homeTeam: TEAMS.real_madrid,
        awayTeam: TEAMS.barcelona,
        kickoffTime: `${targetDate}T20:00:00Z`,
        status: isYesterday ? "FINISHED" : isToday ? "UPCOMING" : "UPCOMING",
        elapsed: isYesterday ? "FT" : null,
        homeScore: isYesterday ? 3 : null,
        awayScore: isYesterday ? 2 : null,
        venue: "Santiago Bernabéu, Madrid",
        odds: { home: 1.95, draw: 3.75, away: 3.60, over: 1.55, under: 2.40, bookmaker: "Pinnacle" },
        predictions: [
          { fixtureId: `mock_laliga_1_${targetDate}`, market: "1X2" as const, selection: "1", confidence: 85, probability: 0.85, odd: 1.95, isPremium: true, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_laliga_1_${targetDate}`, market: "OVER_UNDER" as const, selection: "Over 2.5", confidence: 88, probability: 0.88, odd: 1.55, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_laliga_1_${targetDate}`, market: "BTTS" as const, selection: "Yes", confidence: 91, probability: 0.91, odd: 1.50, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
        ],
      },
      {
        id: `mock_laliga_2_${targetDate}`,
        externalId: `ext_laliga_2_${targetDate}`,
        league: LEAGUES.la_liga,
        homeTeam: TEAMS.atletico_madrid,
        awayTeam: TEAMS.sevilla,
        kickoffTime: `${targetDate}T18:30:00Z`,
        status: isYesterday ? "FINISHED" : isToday ? "LIVE" : "UPCOMING",
        elapsed: isYesterday ? "FT" : isToday ? "82'" : null,
        homeScore: isYesterday ? 2 : isToday ? 1 : null,
        awayScore: isYesterday ? 0 : isToday ? 0 : null,
        venue: "Civitas Metropolitano, Madrid",
        odds: { home: 1.55, draw: 4.10, away: 6.00, over: 1.90, under: 1.90, bookmaker: "Bet365" },
        predictions: [
          { fixtureId: `mock_laliga_2_${targetDate}`, market: "1X2" as const, selection: "1", confidence: 88, probability: 0.88, odd: 1.55, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_laliga_2_${targetDate}`, market: "OVER_UNDER" as const, selection: "Under 2.5", confidence: 82, probability: 0.82, odd: 1.90, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_laliga_2_${targetDate}`, market: "BTTS" as const, selection: "No", confidence: 79, probability: 0.79, odd: 1.85, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
        ],
      },

      // ── SERIE A MATCHES ──
      {
        id: `mock_seriea_1_${targetDate}`,
        externalId: `ext_seriea_1_${targetDate}`,
        league: LEAGUES.serie_a,
        homeTeam: TEAMS.inter,
        awayTeam: TEAMS.juventus,
        kickoffTime: `${targetDate}T19:45:00Z`,
        status: isYesterday ? "FINISHED" : isToday ? "UPCOMING" : "UPCOMING",
        elapsed: isYesterday ? "FT" : null,
        homeScore: isYesterday ? 1 : null,
        awayScore: isYesterday ? 0 : null,
        venue: "San Siro, Milan",
        odds: { home: 1.85, draw: 3.40, away: 4.50, over: 2.05, under: 1.75, bookmaker: "Bet365" },
        predictions: [
          { fixtureId: `mock_seriea_1_${targetDate}`, market: "1X2" as const, selection: "1X", confidence: 86, probability: 0.86, odd: 1.50, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_seriea_1_${targetDate}`, market: "OVER_UNDER" as const, selection: "Under 2.5", confidence: 81, probability: 0.81, odd: 1.75, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_seriea_1_${targetDate}`, market: "BTTS" as const, selection: "No", confidence: 78, probability: 0.78, odd: 1.90, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
        ],
      },
      {
        id: `mock_seriea_2_${targetDate}`,
        externalId: `ext_seriea_2_${targetDate}`,
        league: LEAGUES.serie_a,
        homeTeam: TEAMS.milan,
        awayTeam: TEAMS.napoli,
        kickoffTime: `${targetDate}T14:00:00Z`,
        status: isYesterday ? "FINISHED" : isToday ? "FINISHED" : "UPCOMING",
        elapsed: isYesterday || isToday ? "FT" : null,
        homeScore: isYesterday || isToday ? 2 : null,
        awayScore: isYesterday || isToday ? 1 : null,
        venue: "San Siro, Milan",
        odds: { home: 2.25, draw: 3.30, away: 3.20, over: 1.85, under: 1.95, bookmaker: "Bwin" },
        predictions: [
          { fixtureId: `mock_seriea_2_${targetDate}`, market: "1X2" as const, selection: "1", confidence: 79, probability: 0.79, odd: 2.25, isPremium: false, status: isYesterday || isToday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_seriea_2_${targetDate}`, market: "OVER_UNDER" as const, selection: "Over 2.5", confidence: 82, probability: 0.82, odd: 1.85, isPremium: false, status: isYesterday || isToday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_seriea_2_${targetDate}`, market: "BTTS" as const, selection: "Yes", confidence: 85, probability: 0.85, odd: 1.70, isPremium: false, status: isYesterday || isToday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
        ],
      },

      // ── BUNDESLIGA MATCHES ──
      {
        id: `mock_bundesliga_1_${targetDate}`,
        externalId: `ext_bundesliga_1_${targetDate}`,
        league: LEAGUES.bundesliga,
        homeTeam: TEAMS.bayern,
        awayTeam: TEAMS.dortmund,
        kickoffTime: `${targetDate}T17:30:00Z`,
        status: isYesterday ? "FINISHED" : isToday ? "UPCOMING" : "UPCOMING",
        elapsed: isYesterday ? "FT" : null,
        homeScore: isYesterday ? 4 : null,
        awayScore: isYesterday ? 2 : null,
        venue: "Allianz Arena, Munich",
        odds: { home: 1.45, draw: 5.00, away: 5.75, over: 1.35, under: 3.10, bookmaker: "Bet365" },
        predictions: [
          { fixtureId: `mock_bundesliga_1_${targetDate}`, market: "1X2" as const, selection: "1", confidence: 89, probability: 0.89, odd: 1.45, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_bundesliga_1_${targetDate}`, market: "OVER_UNDER" as const, selection: "Over 3.5", confidence: 84, probability: 0.84, odd: 1.95, isPremium: true, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_bundesliga_1_${targetDate}`, market: "BTTS" as const, selection: "Yes", confidence: 88, probability: 0.88, odd: 1.50, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
        ],
      },
      {
        id: `mock_bundesliga_2_${targetDate}`,
        externalId: `ext_bundesliga_2_${targetDate}`,
        league: LEAGUES.bundesliga,
        homeTeam: TEAMS.leverkusen,
        awayTeam: TEAMS.leipzig,
        kickoffTime: `${targetDate}T14:30:00Z`,
        status: isYesterday ? "FINISHED" : isToday ? "LIVE" : "UPCOMING",
        elapsed: isYesterday ? "FT" : isToday ? "54'" : null,
        homeScore: isYesterday ? 3 : isToday ? 2 : null,
        awayScore: isYesterday ? 2 : isToday ? 2 : null,
        venue: "BayArena, Leverkusen",
        odds: { home: 1.75, draw: 4.00, away: 4.20, over: 1.50, under: 2.50, bookmaker: "Tipico" },
        predictions: [
          { fixtureId: `mock_bundesliga_2_${targetDate}`, market: "1X2" as const, selection: "1X", confidence: 85, probability: 0.85, odd: 1.25, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_bundesliga_2_${targetDate}`, market: "OVER_UNDER" as const, selection: "Over 2.5", confidence: 88, probability: 0.88, odd: 1.50, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_bundesliga_2_${targetDate}`, market: "BTTS" as const, selection: "Yes", confidence: 92, probability: 0.92, odd: 1.80, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
        ],
      },

      // ── UEFA CHAMPIONS LEAGUE ──
      {
        id: `mock_ucl_1_${targetDate}`,
        externalId: `ext_ucl_1_${targetDate}`,
        league: LEAGUES.champions_league,
        homeTeam: TEAMS.real_madrid,
        awayTeam: TEAMS.man_city,
        kickoffTime: `${targetDate}T20:00:00Z`,
        status: isYesterday ? "FINISHED" : isToday ? "UPCOMING" : "UPCOMING",
        elapsed: isYesterday ? "FT" : null,
        homeScore: isYesterday ? 1 : null,
        awayScore: isYesterday ? 1 : null,
        venue: "Santiago Bernabéu, Madrid",
        odds: { home: 2.70, draw: 3.50, away: 2.50, over: 1.65, under: 2.20, bookmaker: "Bet365" },
        predictions: [
          { fixtureId: `mock_ucl_1_${targetDate}`, market: "1X2" as const, selection: "1X", confidence: 84, probability: 0.84, odd: 1.52, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_ucl_1_${targetDate}`, market: "OVER_UNDER" as const, selection: "Over 2.5", confidence: 87, probability: 0.87, odd: 1.65, isPremium: true, status: isYesterday ? "LOSS" as const : "PENDING" as const, source: "AI_ENGINE" },
          { fixtureId: `mock_ucl_1_${targetDate}`, market: "BTTS" as const, selection: "Yes", confidence: 89, probability: 0.89, odd: 1.55, isPremium: false, status: isYesterday ? "WIN" as const : "PENDING" as const, source: "AI_ENGINE" },
        ],
      },
    ];

    return baseMatches.map((m) => ({
      id: m.id,
      externalId: m.externalId,
      leagueId: m.league.id,
      league: m.league,
      homeTeamId: m.homeTeam.id,
      homeTeam: m.homeTeam,
      awayTeamId: m.awayTeam.id,
      awayTeam: m.awayTeam,
      matchDate: targetDate,
      kickoffTime: m.kickoffTime,
      status: m.status as any,
      elapsed: m.elapsed,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      venue: m.venue,
      odds: m.odds,
      predictions: m.predictions,
      forms: {
        home: { teamId: m.homeTeam.id, form: "WWDWW", points: 42, position: 2 },
        away: { teamId: m.awayTeam.id, form: "WDWWL", points: 39, position: 3 },
      },
      stats: {
        home: { teamId: m.homeTeam.id, season: "2024/2025", played: 20, wins: 14, draws: 4, losses: 2, goalsFor: 44, goalsAgainst: 18, cleanSheets: 9, failedToScore: 2 },
        away: { teamId: m.awayTeam.id, season: "2024/2025", played: 20, wins: 12, draws: 5, losses: 3, goalsFor: 38, goalsAgainst: 22, cleanSheets: 7, failedToScore: 3 },
      },
      injuries: [
        { teamId: m.homeTeam.id, playerName: "M. Odegaard", reason: "Ankle Sprain", status: "Doubtful" },
        { teamId: m.awayTeam.id, playerName: "R. James", reason: "Hamstring", status: "Out" },
      ],
      lineups: {
        home: {
          fixtureId: m.id,
          teamType: "HOME",
          formation: "4-3-3",
          startingXl: [
            { name: "D. Raya", number: 22, position: "G" },
            { name: "B. White", number: 4, position: "D" },
            { name: "W. Saliba", number: 2, position: "D" },
            { name: "Gabriel", number: 6, position: "D" },
            { name: "J. Timber", number: 12, position: "D" },
            { name: "T. Partey", number: 5, position: "M" },
            { name: "D. Rice", number: 41, position: "M" },
            { name: "M. Odegaard", number: 8, position: "M" },
            { name: "B. Saka", number: 7, position: "F" },
            { name: "K. Havertz", number: 29, position: "F" },
            { name: "G. Martinelli", number: 11, position: "F" },
          ],
        },
        away: {
          fixtureId: m.id,
          teamType: "AWAY",
          formation: "4-2-3-1",
          startingXl: [
            { name: "R. Sanchez", number: 1, position: "G" },
            { name: "M. Gusto", number: 27, position: "D" },
            { name: "W. Fofana", number: 29, position: "D" },
            { name: "L. Colwill", number: 6, position: "D" },
            { name: "M. Cucurella", number: 3, position: "D" },
            { name: "M. Caicedo", number: 25, position: "M" },
            { name: "R. Lavia", number: 45, position: "M" },
            { name: "N. Madueke", number: 11, position: "M" },
            { name: "C. Palmer", number: 20, position: "M" },
            { name: "J. Sancho", number: 19, position: "M" },
            { name: "N. Jackson", number: 15, position: "F" },
          ],
        },
      },
    }));
  }

  async getFixtures(date: string, filter?: FixtureFilter): Promise<Fixture[]> {
    let list = this.generateMockFixtures(date);

    if (filter) {
      if (filter.status && filter.status !== "ALL") {
        list = list.filter((m) => m.status === filter.status);
      }
      if (filter.country && filter.country !== "all") {
        const cLower = filter.country.toLowerCase();
        list = list.filter((m) => m.league?.country?.name.toLowerCase() === cLower || m.league?.country?.code?.toLowerCase() === cLower);
      }
      if (filter.league && filter.league !== "all") {
        const lLower = filter.league.toLowerCase();
        list = list.filter((m) => m.league?.name.toLowerCase().includes(lLower) || m.league?.id === filter.league);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(
          (m) =>
            m.homeTeam.name.toLowerCase().includes(q) ||
            m.awayTeam.name.toLowerCase().includes(q) ||
            m.league?.name.toLowerCase().includes(q)
        );
      }
    }

    return list;
  }

  async getGroupedFixtures(date: string, filter?: FixtureFilter): Promise<LeagueGroupedFixtures[]> {
    const fixtures = await this.getFixtures(date, filter);
    const groupsMap = new Map<string, LeagueGroupedFixtures>();

    for (const f of fixtures) {
      if (!f.league) continue;
      const key = f.league.id;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          league: f.league,
          country: f.league.country || COUNTRIES.europe,
          fixtures: [],
        });
      }
      groupsMap.get(key)!.fixtures.push(f);
    }

    return Array.from(groupsMap.values());
  }

  async getFixtureById(id: string): Promise<Fixture | null> {
    const all = [
      ...this.generateMockFixtures(getTodayUTC()),
      ...this.generateMockFixtures(getOffsetDateUTC(-1)),
      ...this.generateMockFixtures(getOffsetDateUTC(1)),
    ];
    return all.find((f) => f.id === id || f.externalId === id) || all[0] || null;
  }

  async getLiveFixtures(): Promise<Fixture[]> {
    const todayFixtures = this.generateMockFixtures(getTodayUTC());
    return todayFixtures.filter((f) => f.status === "LIVE");
  }

  async getOdds(fixtureId: string): Promise<OddsValue | null> {
    const f = await this.getFixtureById(fixtureId);
    return f?.odds || null;
  }

  async getTeamStats(teamId: string): Promise<TeamStats | null> {
    return {
      teamId,
      season: "2024/2025",
      played: 20,
      wins: 13,
      draws: 4,
      losses: 3,
      goalsFor: 41,
      goalsAgainst: 19,
      cleanSheets: 8,
      failedToScore: 2,
    };
  }

  async getInjuries(teamId: string): Promise<Injury[]> {
    return [
      { teamId, playerName: "Captain Player", reason: "Knee Injury", status: "Out" },
      { teamId, playerName: "Key Striker", reason: "Hamstring Strain", status: "Doubtful" },
    ];
  }

  async getLineups(fixtureId: string): Promise<{ home?: Lineup; away?: Lineup }> {
    const f = await this.getFixtureById(fixtureId);
    return f?.lineups || {};
  }

  async getPredictions(fixtureId: string): Promise<Prediction[]> {
    const f = await this.getFixtureById(fixtureId);
    return f?.predictions || [];
  }
}

export const mockFootballProvider = new MockFootballProvider();
