// Run with subset-font installed and the lucide-static 1.47.0 font directory as argument.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const subsetFont = require('subset-font');
const manifest = require('./lucide-icons.json');
async function main() {
  if (!process.argv[2]) throw new Error('Usage: node tools/subset-lucide.cjs <font-directory>');
  const source = path.resolve(process.argv[2]);
  const full = fs.readFileSync(path.join(source, 'lucide.ttf'));
  const hash = crypto.createHash('sha256').update(full).digest('hex');
  if (hash !== '02c067fc7421d844aca1e9d9dbb44188dbca0309eca7e98096ce06ca526acded') {
    throw new Error('Expected verified lucide-static 1.47.0 font; review mappings before upgrading.');
  }
  const codepoints = JSON.parse(fs.readFileSync(path.join(source, 'codepoints.json'), 'utf8'));
  const names = [...new Set([...manifest.markdown, ...manifest.html])];
  const chars = names.map(name => {
    if (!Number.isInteger(codepoints[name])) throw new Error(`Missing codepoint: ${name}`);
    return String.fromCodePoint(codepoints[name]);
  }).join('');
  const subset = await subsetFont(full, chars, { targetFormat: 'sfnt' });
  fs.writeFileSync(path.join(__dirname, '..', 'lucide_subset.ttf'), subset);
  console.log(`${names.length} glyphs; ${subset.length} bytes; SHA256 ${crypto.createHash('sha256').update(subset).digest('hex')}`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
