// record the final 0.51.0 state in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.51.0 FINAL (2026-10-01, c74a545 after a rebase — DEPLOYED + pushed — user test pending):** LIVE SCROLL SYNC implemented. ROOT CAUSES from the log: (1) document.Text macro fails 0x2000000B on EVERY session first-burst → GetDocTextAll returned FALSE → WritePreviewHtml early-returned → RichBarPreview.html never rewritten → pane showed the PREVIOUS session file → scroll sync render path never ran at all. (2) Even when render ran, sync only applied at render time — scrolling never re-renders. FIXES: (A) document.Text failure FALLS THROUGH to the clipboard path (no early return) + 0x2000000B schedules ONE re-render at 1200ms (IDT_PREVIEW_REUSE). (B) LIVE CHANNEL: IDT_SCROLLER_POLL(11) 300ms (pane-open only) → OnScrollerPoll reads EE_GET_SCROLL_POS + EE_GET_LINES → on ratio change writes %TEMP%\\RichBarSync.js = "__rbSetRatio(r);"; the preview page defines __rbSetRatio (sets __scrollRatio + __rbRestore) and setInterval(250ms) appends <script src=RichBarSync.js> (reusable tag, same file:// mechanism as marked.js). Poll started in OpenWebBarPreview. REBASE LESSON: origin had 0.45.1a (changelog-only) that local lacked — rebase --onto resolved with RichBar.h ours (sync code), rc theirs (0.51.0). User test: scroll main window → preview follows within ~300ms.',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
