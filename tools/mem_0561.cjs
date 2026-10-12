// record 0.56.1 in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.56.1 (2026-10-01, f68a340, DEPLOYED + pushed — user test pending):** 0.56.0 REVERTED (user: no sync AND the preview content displayed starting from the MIDDLE HORIZONTALLY — "横轴起始位置不对"). ANALYSIS of the 0.56.0 displacement: the probe macro ran `WebBar.scrollTo(0, 99999999)` and the preview content ended up HORIZONTALLY displaced — evidence that **WebBar.scrollTo arguments may not be (x, y) as documented, or scrollTo acts on the BAR/window rather than the document** (the manual is one line, no semantics). With ScrollY the property readback is also unverified. Scroll sync status: 0.53.1 delta mode = WORKS (moves with the editor, drifts to ~50% at editor-bottom due to linePx approximation + content wrapping); 0.56.1 = that working mode restored. NEXT STEP (NOT implemented — requires ground truth first): have the user run a diagnostic MACRO in EmEditor to dump the WebBar object (typeof WebBar.scrollTo, WebBar.ScrollY, WebBar.scrollY values after manual scrolling) — direct evidence of the API surface before any further code. ALSO the rc version replace ate the FILEVERSION keyword (match included the prefix) — rc repaired; version-replace scripts must replace ONLY the numeric tuple, never a match that includes the keyword.',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
