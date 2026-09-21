async function parseFullMatchDetails() {
  const url = 'https://nerdytips.com/match-details/marseille-vs-paris-s-prediction-1311210';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  const res = await fetch(url, { headers });
  const html = await res.text();

  // 1. Extract Article Prose
  const proseMatch = html.match(/<div[^>]*class="[^"]*md-prose[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
  let previewText = [];
  let previewTitle = "";
  if (proseMatch) {
    const proseHtml = proseMatch[1];
    const h2 = proseHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    previewTitle = h2 ? h2[1].replace(/<[^>]+>/g, '').trim() : '';
    
    // Extract sections with their headings and paragraphs
    const paragraphs = [...proseHtml.matchAll(/<(?:p|h3)[^>]*>([\s\S]*?)<\/(?:p|h3)>/gi)].map(m => {
      const isH3 = m[0].startsWith('<h3');
      const text = m[1].replace(/<[^>]+>/g, '').trim();
      return { type: isH3 ? 'heading' : 'paragraph', text };
    });
    previewText = paragraphs;
  }

  // 2. Extract Stats Table (predicted vs actual)
  // e.g. xG, Ball Possession, Total Shots, Shots on Goal, Shots Off Goal, Corners, Yellow Cards, Fouls
  const statsRows = [];
  const statNames = ['xG', 'Ball Possession', 'Total Shots', 'Shots on Goal', 'Shots Off Goal', 'Corners', 'Yellow Cards', 'Fouls'];
  for (const name of statNames) {
    const reg = new RegExp(name + '\\s*Marseille:\\s*([\\d\\.%]+)\\s*Paris S:\\s*([\\d\\.%]+)', 'i');
    const m = html.match(reg);
    if (m) {
      statsRows.push({ stat: name, home: m[1], away: m[2] });
    }
  }

  // 3. Extract Match Tips (e.g. 1X2, Over/Under, BTTS, Double Chance)
  const tipCards = [...html.matchAll(/<div[^>]*class="[^"]*md-tip[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi)].map(m => {
    return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  });

  // 4. Extract Meta and Score Info
  const scoreMatch = html.match(/<div[^>]*class="[^"]*md-sc[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const score = scoreMatch ? scoreMatch[1].replace(/<[^>]+>/g, '').trim() : null;

  console.log('================================================================');
  console.log('   PARSED NERDYTIPS MATCH DETAILS & INSIGHTS');
  console.log('================================================================\n');
  console.log('Match URL:', url);
  console.log('Preview Article Title:', previewTitle);
  console.log('Total Prose Elements:', previewText.length);
  console.log('\n--- SAMPLE ARTICLE CONTENT ---');
  previewText.slice(0, 4).forEach((el, idx) => {
    if (el.type === 'heading') {
      console.log(`\n### ${el.text}`);
    } else {
      console.log(`\n${el.text}`);
    }
  });

  console.log('\n--- PREDICTED STATS TABLE ---');
  console.table(statsRows);

  // Clean up scratch files
  const result = {
    url,
    previewTitle,
    previewContent: previewText,
    predictedStats: statsRows,
  };
  require('fs').writeFileSync('d:/nigeria/backend/scratch_parsed_match_details.json', JSON.stringify(result, null, 2));
  console.log('\nFull JSON structure saved to backend/scratch_parsed_match_details.json');
}

parseFullMatchDetails();
