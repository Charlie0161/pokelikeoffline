// download-sprites.js
// Run ONCE at home on WiFi: node download-sprites.js
// Downloads all Gen I+II Pokémon sprites into sprites/pokemon/
// Skips files already downloaded so safe to re-run if interrupted

const https = require('https');
const fs = require('fs');
const path = require('path');

const POKEMON_COUNT = 251;
const SPRITE_DIR = path.join(__dirname, 'sprites', 'pokemon');

// Pokémon Showdown sprite URLs (same CDN the game already uses)
const frontUrl = name => `https://play.pokemonshowdown.com/sprites/gen5/${name}.png`;
const backUrl  = name => `https://play.pokemonshowdown.com/sprites/gen5-back/${name}.png`;

function download(url, dest) {
  return new Promise((resolve) => {
    if (fs.existsSync(dest)) return resolve('skipped');
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
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

function fetchName(id) {
  return new Promise((resolve) => {
    const req = https.get(
      `https://pokeapi.co/api/v2/pokemon/${id}`,
      { headers: { 'User-Agent': 'pokelike-offline-setup/1.0' } },
      res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try { resolve(JSON.parse(body).name); }
          catch { resolve(null); }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.setTimeout(10000, () => { req.destroy(); resolve(null); });
  });
}

async function main() {
  fs.mkdirSync(SPRITE_DIR, { recursive: true });

  console.log('Pokelike Sprite Downloader');
  console.log('==========================');
  console.log(`Saving to: ${SPRITE_DIR}`);
  console.log(`Fetching ${POKEMON_COUNT} Pokémon...\n`);

  let downloaded = 0, skipped = 0, failed = 0;

  for (let id = 1; id <= POKEMON_COUNT; id++) {
    const name = await fetchName(id);
    if (!name) {
      console.log(`  [${id}] Could not fetch name — skipping`);
      failed++;
      continue;
    }

    const frontDest = path.join(SPRITE_DIR, `${name}.png`);
    const backDest  = path.join(SPRITE_DIR, `${name}-back.png`);

    const frontResult = await download(frontUrl(name), frontDest);
    const backResult  = await download(backUrl(name),  backDest);

    if (frontResult === 'skipped') {
      skipped++;
    } else if (frontResult === 'ok') {
      downloaded++;
    } else {
      failed++;
    }

    process.stdout.write(`\r  Progress: ${id}/${POKEMON_COUNT} — ${name.padEnd(12)}`);
  }

  console.log('\n\n==========================');
  console.log(`Done!`);
  console.log(`  Downloaded: ${downloaded * 2} sprites (front + back)`);
  console.log(`  Skipped (already existed): ${skipped * 2}`);
  console.log(`  Failed: ${failed}`);
  console.log('\nNext step: open js/data.js and update sprite URLs (see guide).');
}

main().catch(console.error);
