// record 0.53.1 revert + the 0.54.0 post-mortem in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.53.1 (2026-10-01, DEPLOYED + pushed — user test pending):** 0.54.0 REVERTED (user: preview completely frozen, worse than 0.53.0). POST-MORTEM of the 0.54.0 failure: the proportional design gated the ACTUAL scroll behind a probe — `if( m_nPreviewMaxPx <= 0 ) { probe } else { scrollTo }` — and the probe macro ended with `return m;` where m is a NUMBER. hstrResult only received the string from document.Text; a numeric return never populated it (or WebBar.scrollY property case is ScrollY not scrollY — unverified). Either way the probe never succeeded → m_nPreviewMaxPx stayed 0 → the scrollTo branch was UNREACHABLE forever → preview frozen. 0.53.0 worked because scrollBy had no result dependency. FIX REQUIREMENTS for the proportional retry (NOT yet implemented): (1) macro must `return String(m);` (2) decouple: after N failed probes fall back to the 0.53.0 scrollBy-delta mode (3) log probe failures with hr + hstrResult-null distinction. Git/changelog: reverted via checkout f16f799 -- RichBar.h + rc to 0,53,1,0; 0.54.0 changelog section retained above the 0.53.1 revert note.',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
