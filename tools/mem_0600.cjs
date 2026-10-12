// record 0.60.0 final in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const Q = String.fromCharCode( 39 );
const entry = [
	'**0.60.0 FINAL (2026-10-01, fc8780d after rebase - DEPLOYED + pushed - user test pending):** live scroll sync = sync-file channel, rebuilt and re-landed after the 0.59.0 px-model failed (editor ~50% -> preview bottom: the absolute-px target overshot because the preview page is TALLER than the editor content estimate - default <p> margins + wrapping; 0.59.0 reverted). FINAL DESIGN (browser-verified page logic + industry-standard proportional mapping): page emits __rbSetRatio(r) (sets __scrollRatio + __rbRestore) + __rbPoll (script tag RichBarSync.js?cb=Date.now() - CACHE-BUSTER MANDATORY, the 0.51.x failure was its absence) + setInterval 250ms; plugin OnScrollerPoll (300ms) computes editor ratio = scrollY/(GetLines - PAGE_SIZE.cy) on m_hwndView and writes %TEMP%\\RichBarSync.js = __rbSetRatio(r); when the ratio delta >= 0.005 (plain fwrite, NO macros -> no V8 cold-start dependency). Ratio 0/1 clamp to exact page top/bottom (no end anchors needed). GIT REBASE LESSON (twice burned): during rebase, ours = the BASE you rebase onto, theirs = YOUR commit - checkout --ours/--theirs is INVERTED vs merge; also origin may have commits your local lacks - always fetch+rebase before pushing after divergences. Changelog top-section insertion: find the FIRST ## heading (not a hardcoded version anchor - versions drift).',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
