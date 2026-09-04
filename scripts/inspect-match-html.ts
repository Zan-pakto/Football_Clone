import { extractLeagueGroups } from '../lib/scraper/parser';

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'X-Requested-With': 'XMLHttpRequest',
  };

  const mainRes = await fetch('https://nerdytips.com/all-matches?d=0', { headers: { 'User-Agent': headers['User-Agent'] } });
  const mainHtml = await mainRes.text();
  const leagues = extractLeagueGroups(mainHtml);
  const egyptGroup = leagues.find(l => l.leagueName.includes('Second League') || l.country.includes('Egypt'));

  if (!egyptGroup) {
    console.log('Egypt group not found in leagues. Available leagues:', leagues.map(l => l.leagueName).slice(0, 10));
    return;
  }

  console.log('Fetching rows for groupKey:', egyptGroup.groupKey);
  const rowsRes = await fetch(`https://nerdytips.com/all-matches/rows?g=${egyptGroup.groupKey}&d=0`, { headers });
  const json = await rowsRes.json();
  const html = json.groups?.[egyptGroup.groupKey] || '';
  console.log('\n--- RAW HTML FOR EGYPT SECOND LEAGUE ---');
  console.log(html);
}

test();
