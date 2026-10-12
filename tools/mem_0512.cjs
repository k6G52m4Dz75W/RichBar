// record 0.51.2 in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.51.2 (2026-10-01, b773aa9, DEPLOYED + pushed — user test pending):** the 0.51.1 diagnostics finally landed ("scroll sync: y=0 lines=44 ratio=0.0000" while the user HAD scrolled) → root cause: **EE_GET_SCROLL_POS / EE_GET_LINES were sent to m_hWnd (the FRAME window) which holds no view scroll info — y always 0**. FIX: both queries (WritePreviewHtml ratio block AND OnScrollerPoll) now target **m_hwndView** (the view from the plug-in OnCommand contract). ALSO: OnScrollerPoll had NO logging — added "scroll push: ratio=%.4f" in WriteScrollerSync. LESSON: EE_* view messages must go to the VIEW window; m_hWnd (frame) silently returns zeros for some (GetLines worked by luck/routing, ScrollPos did not) — zero-results from a view query on the frame are a routing bug, not "user did not scroll".',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
