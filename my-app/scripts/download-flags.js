const fs = require('fs');
const path = require('path');

const FLAGS_DIR = path.join(__dirname, '..', 'public', 'flags');

// Ensure directory exists
if (!fs.existsSync(FLAGS_DIR)) {
  fs.mkdirSync(FLAGS_DIR, { recursive: true });
}

// Country name overrides and aliases to ensure 100% football country matching
const CUSTOM_COUNTRY_MAP = {
  'england': 'gb-eng',
  'scotland': 'gb-sct',
  'wales': 'gb-wls',
  'northern-ireland': 'gb-nir',
  'kosovo': 'xk',
  'usa': 'us',
  'united-states': 'us',
  'south-korea': 'kr',
  'korea-republic': 'kr',
  'north-macedonia': 'mk',
  'czech-republic': 'cz',
  'dr-congo': 'cd',
  'congo-dr': 'cd',
  'cote-d-ivoire': 'ci',
  'ivory-coast': 'ci',
  'bosnia-and-herzegovina': 'ba',
  'bosnia-herzegovina': 'ba',
  'bosnia': 'ba',
  'cape-verde': 'cv',
  'curacao': 'cw',
  'world': 'world',
  'international': 'world',
  'europe': 'europe',
};

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function downloadFlags() {
  console.log('Fetching official flag codes database from flagcdn...');
  const res = await fetch('https://flagcdn.com/en/codes.json');
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching codes.json`);
  const codes = await res.json();

  // Also add UK home nations
  codes['gb-eng'] = 'England';
  codes['gb-sct'] = 'Scotland';
  codes['gb-wls'] = 'Wales';
  codes['gb-nir'] = 'Northern Ireland';
  codes['xk'] = 'Kosovo';

  const downloadQueue = [];

  for (const [code, countryName] of Object.entries(codes)) {
    const slug = slugify(countryName);
    downloadQueue.push({ code, slug, name: countryName });
  }

  // Add custom aliases
  for (const [aliasSlug, code] of Object.entries(CUSTOM_COUNTRY_MAP)) {
    if (code !== 'world' && code !== 'europe') {
      downloadQueue.push({ code, slug: aliasSlug, name: aliasSlug });
    }
  }

  console.log(`Found ${downloadQueue.length} flags/aliases to download into ${FLAGS_DIR}...`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  // Process in batches of 20 concurrent downloads
  const BATCH_SIZE = 20;
  for (let i = 0; i < downloadQueue.length; i += BATCH_SIZE) {
    const batch = downloadQueue.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async ({ code, slug }) => {
        const slugFilePath = path.join(FLAGS_DIR, `${slug}.png`);
        const codeFilePath = path.join(FLAGS_DIR, `${code}.png`);

        // Check if file already exists with non-zero size
        if (fs.existsSync(slugFilePath) && fs.statSync(slugFilePath).size > 100) {
          skipped++;
          return;
        }

        try {
          const imgUrl = `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
          const imgRes = await fetch(imgUrl);
          if (imgRes.ok) {
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            fs.writeFileSync(slugFilePath, buffer);
            if (!fs.existsSync(codeFilePath)) {
              fs.writeFileSync(codeFilePath, buffer);
            }
            downloaded++;
          } else {
            failed++;
          }
        } catch (e) {
          failed++;
        }
      })
    );
  }

  console.log(`\n🎉 Flag sync completed!`);
  console.log(`- Downloaded: ${downloaded}`);
  console.log(`- Already existed: ${skipped}`);
  console.log(`- Failed: ${failed}`);
  console.log(`- Total files in ${FLAGS_DIR}: ${fs.readdirSync(FLAGS_DIR).length}`);
}

downloadFlags().catch(console.error);
