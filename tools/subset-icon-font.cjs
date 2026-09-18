// Regenerates remixicon_subset.ttf from an unpacked Remix Icon release.
// Usage: node tools/subset-icon-font.cjs <RemixIcon fonts directory>
// Requires subset-font resolvable (NODE_PATH or local node_modules).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const subsetFont = require('subset-font');
const manifest = require('./remix-icons.json');
// Official remixicon.ttf of the pinned release (RemixIcon 4.9.1).
const REMIX_TTF_SHA256 = 'cdff268662c834fbe023a8d34f77e2842c50025b093bc827c9b71adefc81b256';
async function main() {
  if (!process.argv[2]) throw new Error('Usage: node tools/subset-icon-font.cjs <RemixIcon fonts directory>');
  const source = path.resolve(process.argv[2]);
  const full = fs.readFileSync(path.join(source, 'remixicon.ttf'));
  const hash = crypto.createHash('sha256').update(full).digest('hex');
  if (hash !== REMIX_TTF_SHA256) {
    throw new Error(`Unexpected remixicon.ttf (SHA256 ${hash}); review tools/remix-icons.json mappings against the new release before regenerating.`);
  }
  // Codepoints come from the release's own stylesheet, keyed by icon name.
  const css = fs.readFileSync(path.join(source, 'remixicon.css'), 'utf8');
  const codepoints = {};
  const re = new RegExp('\\.ri-([a-z0-9-]+):before\\s*\\{\\s*content:\\s*"\\\\([0-9a-f]+)"', 'g');
  for (const m of css.matchAll(re)) codepoints[m[1]] = parseInt(m[2], 16);
  const names = [...new Set([...manifest.markdown, ...manifest.html])];
  const chars = names.map(name => {
    if (!Number.isInteger(codepoints[name])) throw new Error(`Missing codepoint for: ${name}`);
    return String.fromCodePoint(codepoints[name]);
  }).join('');
  const subset = await subsetFont(full, chars, { targetFormat: 'sfnt' });
  fs.writeFileSync(path.join(__dirname, '..', 'remixicon_subset.ttf'), subset);
  console.log(`${names.length} glyphs; ${subset.length} bytes; SHA256 ${crypto.createHash('sha256').update(subset).digest('hex')}`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
