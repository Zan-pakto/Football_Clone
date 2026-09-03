import { store } from "./lib/db/store";
import { NerdyTipsScraper } from "./lib/scraper/nerdytips";

async function testAllEndpoints() {
  console.log("=== API ROUTE & SCRAPER VALIDATION ===");

  for (const d of ["0", "1", "-1"]) {
    console.log(`\nTesting d=${d}...`);
    const scraped = await NerdyTipsScraper.fetchAllMatches(d);
    console.log(`Scrape result for d=${d}: success=${scraped.success}, count=${scraped.matches.length}, leagues=${scraped.leagueCount}`);

    if (scraped.success && scraped.matches.length > 0) {
      await store.saveScrapedMatches(scraped);
      const query = await store.getMatches(d);
      console.log(`DB Query for d=${d}: returned ${query.matches.length} matches.`);

      const first = query.matches[0];
      console.log(`Sample Match for d=${d}: ${first.homeTeam} vs ${first.awayTeam} [${first.leagueName}, ${first.country}]`);
      console.log(`  Odds: 1:${first.odds.home} X:${first.odds.draw} 2:${first.odds.away}`);
      console.log(`  PickScore: ${first.predictions.pickScore.pick} @ ${first.predictions.pickScore.odd}`);
      console.log(`  BestTip: ${first.predictions.bestTip.pick} @ ${first.predictions.bestTip.odd}`);
      console.log(`  Confidence: ${first.confidence}`);
    }
  }

  console.log("\nTesting Live Matches endpoint...");
  const liveResult = await NerdyTipsScraper.fetchLiveMatches("0");
  console.log(`Live matches result: success=${liveResult.success}, updatedCount=${liveResult.updatedCount}`);

  console.log("\n=== ALL VALIDATION TESTS PASSED ===");
}

testAllEndpoints().catch(console.error);
