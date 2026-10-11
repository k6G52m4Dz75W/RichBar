// record 0.51.0 in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 3d265e9, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.51.0 (2026-10-01, DEPLOYED + pushed — user test pending):** LIVE SCROLL SYNC implemented (user report: scrolling the main window never moved the preview — ROOT CAUSE: sync only applied at RENDER time; scrolling causes no re-render, so nothing ever pushed the new position; PLUS the 0.50.x log showed `document.Text failed hr=0x2000000B` on EVERY session first-burst and GetDocTextAll returned false → WritePreviewHtml early-returned → RichBarPreview.html was never rewritten → the pane showed the PREVIOUS session file). FIXES: (1) document.Text macro failure now FALLS THROUGH to the clipboard path (no early return; also the 0x2000000B cold-start window schedules ONE re-render attempt at 1200ms). (2) LIVE CHANNEL: IDT_SCROLLER_POLL(11) 300ms timer (pane-open only) reads EE_GET_SCROLL_POS/EE_GET_LINES, computes ratio, and on change writes %TEMP%\\RichBarSync.js containing `__rbSetRatio(r);`; the preview page defines __rbSetRatio (=set __scrollRatio + __rbRestore) and setInterval-polls the file with a reusable <script src=RichBarSync.js> element (same file:// mechanism as marked.js). Poll starts in OpenWebBarPreview (StartScrollerPoll). NOTE: naive brace scanners miscount braces inside C++ string literals — the 0.51.0 round broke the file twice via scanner-guided edits (stray braces); git checkout + minimal anchors recovered it.',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
