import { NerdyTipsScraper } from "./lib/scraper/nerdytips";
import { store } from "./lib/db/store";
import { prisma } from "./lib/db/prisma";

async function testDatabasePipeline() {
  console.log("1. Fetching matches via NerdyTipsScraper...");
  const scrapeResult = await NerdyTipsScraper.fetchAllMatches("0");
  console.log(`Scraped ${scrapeResult.matches.length} matches from ${scrapeResult.leagueCount} leagues.`);

  console.log("2. Persisting matches to PostgreSQL via store.saveScrapedMatches()...");
  await store.saveScrapedMatches(scrapeResult);

  console.log("3. Verifying database table counts...");
  const matchCount = await prisma.match.count();
  const teamCount = await prisma.team.count();
  const leagueCount = await prisma.league.count();
  const predCount = await prisma.prediction.count();
  const logCount = await prisma.scrapeLog.count();

  console.log("Database Stats:");
  console.log(`  Matches in DB: ${matchCount}`);
  console.log(`  Teams in DB: ${teamCount}`);
  console.log(`  Leagues in DB: ${leagueCount}`);
  console.log(`  Predictions in DB: ${predCount}`);
  console.log(`  Scrape Logs in DB: ${logCount}`);

  console.log("\n4. Testing UPSERT behavior (running saveScrapedMatches again)...");
  await store.saveScrapedMatches(scrapeResult);

  const matchCountAfter = await prisma.match.count();
  console.log(`  Matches in DB after duplicate run: ${matchCountAfter} (Must equal ${matchCount})`);

  if (matchCountAfter === matchCount) {
    console.log("UPSERT test PASSED: No duplicate records created!");
  } else {
    console.error("UPSERT test FAILED: Duplicates detected.");
  }

  console.log("\n5. Querying store.getMatches('0')...");
  const queryResult = await store.getMatches("0");
  console.log(`Retrieved ${queryResult.matches.length} matches from database.`);
  console.log("Sample DB match:", JSON.stringify(queryResult.matches[0], null, 2));

  await prisma.$disconnect();
}

testDatabasePipeline().catch(console.error);
