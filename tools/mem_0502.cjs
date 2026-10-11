// record 0.50.2 in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const i = s.indexOf( '**0.45.2 (2026-10-01, 3d265e9' );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.50.2 (2026-10-01, deployed + pushed — user test pending):** scroll sync STILL did not move (user: 没有真正滚动起来). TWO hardening changes: (1) the scroll restore now runs in a load handler PLUS 100/400ms retries (browsers can reset scroll at navigation completion, overriding a mid-parse scrollTo); the restore also guards h>0. (2) RbLogF of the ratio inputs at computation: "scroll sync: y=%u lines=%u ratio=%.4f" — ptScroll.y units (lines vs pixels) and whether m_hWnd (the FRAME, not the view) routes EE_GET_SCROLL_POS correctly are the two OPEN hypotheses if the ratio is wrong/zero. NOTE: the 0.50.2 rc bump round shipped BEFORE the code patch applied (anchor mismatch — the ratio block indentation differed from memory); always re-verify anchors against the CURRENT file, not remembered formatting.',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
