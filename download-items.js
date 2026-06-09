// download-items.js
// Run ONCE at home on WiFi: node download-items.js
// Downloads all item sprites into sprites/items/
// Safe to re-run — skips files already downloaded.

const https = require('https');
const fs = require('fs');
const path = require('path');

const ITEMS_DIR = path.join(__dirname, 'sprites', 'items');
const BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';

// All item IDs used in the game
const ITEM_SLUGS = [
  'lucky-egg', 'life-orb', 'choice-band', 'choice-specs', 'metronome',
  'scope-lens', 'rocky-helmet', 'shell-bell', 'eviolite', 'sharp-beak',
  'charcoal', 'mystic-water', 'magnet', 'miracle-seed', 'twisted-spoon',
  'black-belt', 'soft-sand', 'silver-powder', 'hard-stone', 'dragon-fang',
  'poison-barb', 'spell-tag', 'silk-scarf', 'metal-coat', 'black-glasses',
  'pixie-plate', 'assault-vest', 'choice-scarf', 'leftovers', 'expert-belt',
  'focus-sash', 'wide-lens', 'quick-claw', 'kings-rock', 'lagging-tail',
  'adrenaline-orb', 'red-card', 'loaded-dice',
  // Usable items
  'max-revive', 'full-restore', 'rare-candy', 'moon-stone', 'tm-normal', 'escape-rope',
];

function download(url, dest) {
  return new Promise((resolve) => {
    if (fs.existsSync(dest)) return resolve('skipped');
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'pokelike-offline-setup' } }, res => {
      if (res.statusCode !== 200) {
        file.close(); try { fs.unlinkSync(dest); } catch {}
        return resolve('missing');
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve('ok')));
    }).on('error', err => {
      try { fs.unlinkSync(dest); } catch {}
      resolve('error: ' + err.message);
    });
  });
}

async function main() {
  fs.mkdirSync(ITEMS_DIR, { recursive: true });
  console.log('Pokelike Item Sprite Downloader');
  console.log('================================');
  console.log(`Saving to: ${ITEMS_DIR}\n`);

  let downloaded = 0, skipped = 0, failed = 0;

  for (let i = 0; i < ITEM_SLUGS.length; i++) {
    const slug = ITEM_SLUGS[i];
    const dest = path.join(ITEMS_DIR, `${slug}.png`);
    const result = await download(BASE_URL + slug + '.png', dest);
    if (result === 'ok') downloaded++;
    else if (result === 'skipped') skipped++;
    else { failed++; console.log(`  FAILED: ${slug} (${result})`); }
    process.stdout.write(`\r  ${i + 1}/${ITEM_SLUGS.length} — ${slug.padEnd(24)}`);
  }

  console.log('\n\n================================');
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Skipped:    ${skipped}`);
  console.log(`Failed:     ${failed}`);
  console.log('\nDone! Item sprites saved to sprites/items/');
}

main().catch(console.error);
