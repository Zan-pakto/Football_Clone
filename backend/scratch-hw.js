const fs = require('fs');

async function inspectHitAndWin() {
  const res = await fetch('https://nerdytips.com/hitandwin', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();
  console.log('HTML length:', html.length);

  // Look for match containers or data attributes
  const dataMatches = html.match(/data-m="([^"]+)"/g) || [];
  console.log('data-m matches:', dataMatches.length);

  // Look for classes containing hw
  const hwClasses = html.match(/class="[^"]*hw-[^"]*"/g) || [];
  console.log('hw classes:', Array.from(new Set(hwClasses)).slice(0, 30));

  const matchRegex = /<div class="hw-match(?:[^"]*)">([\s\S]*?)<\/div>\s*(?=<div class="hw-match"|<\/div>\s*<\/div>\s*<aside)/gi;
  const rawMatches = [];
  let m;
  while ((m = matchRegex.exec(html)) !== null) {
    rawMatches.push(m[1]);
  }
  console.log('Found raw hw-match blocks:', rawMatches.length);

  const parsed = [];
  rawMatches.forEach((block, idx) => {
    const noMatch = block.match(/class="hw-match__no">(\d+)</);
    const timeMatch = block.match(/class="hw-match__time">([^<]+)(?:<span class="hw-match__day">([^<]+)<\/span>)?/);
    
    // Extract teams: <a class="hw-team" ...><img src="..." ...><span>TeamName</span></a>
    const teamMatches = Array.from(block.matchAll(/<a class="hw-team"[^>]*>(?:<img[^>]*src="([^"]*)"[^>]*>)?<span>([^<]+)<\/span><\/a>/g));
    const homeTeam = teamMatches[0] ? { name: teamMatches[0][2].trim(), logo: teamMatches[0][1] || null } : { name: 'Home', logo: null };
    const awayTeam = teamMatches[1] ? { name: teamMatches[1][2].trim(), logo: teamMatches[1][1] || null } : { name: 'Away', logo: null };

    // Extract picks: <label class="hw-pick"><input type="radio" name="pick[1638365]" value="1"><span class="hw-pick__k">1</span><span class="hw-pick__o num">2.62</span></label>
    const idMatch = block.match(/name="pick\[(\d+)\]"/);
    const matchId = idMatch ? idMatch[1] : `hw_${idx + 1}`;

    const pick1Match = block.match(/value="1"[\s\S]*?class="hw-pick__o[^"]*">([\d\.]+)</);
    const pickXMatch = block.match(/value="X"[\s\S]*?class="hw-pick__o[^"]*">([\d\.]+)</);
    const pick2Match = block.match(/value="2"[\s\S]*?class="hw-pick__o[^"]*">([\d\.]+)</);

    parsed.push({
      index: noMatch ? parseInt(noMatch[1], 10) : idx + 1,
      id: matchId,
      time: timeMatch ? timeMatch[1].trim() : '--:--',
      dayLabel: timeMatch && timeMatch[2] ? timeMatch[2].trim() : undefined,
      homeTeam,
      awayTeam,
      odds: {
        '1': pick1Match ? pick1Match[1] : '2.10',
        'X': pickXMatch ? pickXMatch[1] : '3.10',
        '2': pick2Match ? pick2Match[1] : '3.20',
      }
    });
  });

  console.log('Successfully parsed matches count:', parsed.length);
  console.log('Sample parsed 1:', parsed[0]);
  console.log('Sample parsed 5:', parsed[4]);
  console.log('Sample parsed 10:', parsed[9]);
}

inspectHitAndWin().catch(console.error);
