import { NerdyTipsScraper } from '../lib/scraper/nerdytips';
import { checkPredictionWon } from '../components/MatchRow';

async function main() {
  const result = await NerdyTipsScraper.fetchAllMatches('0');
  console.log('Total Scraped Matches:', result.matches.length);

  const rawWon = result.matches.filter(m => m.status === 'won');
  const bestTipWon = result.matches.filter(m => {
    const isFin = m.status === 'won' || m.status === 'lost' || m.status === 'fin' || m.elapsed === 'FT' || (m.homeScore !== null && m.awayScore !== null && m.homeScore !== '' && m.awayScore !== '');
    return m.status === 'won' || (isFin && checkPredictionWon(m.predictions?.bestTip?.pick, m.homeScore, m.awayScore) === true);
  });

  const pickScoreWon = result.matches.filter(m => {
    const isFin = m.status === 'won' || m.status === 'lost' || m.status === 'fin' || m.elapsed === 'FT' || (m.homeScore !== null && m.awayScore !== null && m.homeScore !== '' && m.awayScore !== '');
    return isFin && checkPredictionWon(m.predictions?.pickScore?.pick, m.homeScore, m.awayScore) === true;
  });

  console.log('\n--- MATCH COUNTS ---');
  console.log('Raw status === "won":', rawWon.length);
  console.log('BestTip Won:', bestTipWon.length);
  console.log('PickScore Won:', pickScoreWon.length);

  console.log('\n--- Matches where status === "won" BUT bestTipWon === false/null ---');
  result.matches.forEach(m => {
    if (m.status === 'won') {
      const bw = checkPredictionWon(m.predictions?.bestTip?.pick, m.homeScore, m.awayScore);
      const pw = checkPredictionWon(m.predictions?.pickScore?.pick, m.homeScore, m.awayScore);
      if (bw !== true) {
        console.log(`- ${m.homeTeam} vs ${m.awayTeam} (${m.homeScore}-${m.awayScore}): status=${m.status}, bestTip="${m.predictions?.bestTip?.pick}" (eval: ${bw}), pickScore="${m.predictions?.pickScore?.pick}" (eval: ${pw})`);
      }
    }
  });

  console.log('\n--- Matches where bestTipWon === true BUT status !== "won" ---');
  result.matches.forEach(m => {
    const isFin = m.status === 'won' || m.status === 'lost' || m.status === 'fin' || m.elapsed === 'FT' || (m.homeScore !== null && m.awayScore !== null && m.homeScore !== '' && m.awayScore !== '');
    const bw = checkPredictionWon(m.predictions?.bestTip?.pick, m.homeScore, m.awayScore);
    if (isFin && bw === true && m.status !== 'won') {
      console.log(`- ${m.homeTeam} vs ${m.awayTeam} (${m.homeScore}-${m.awayScore}): status=${m.status}, bestTip="${m.predictions?.bestTip?.pick}"`);
    }
  });
}

main();
