// record 0.52.0 final in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.52.0 FINAL (2026-10-01, 4701d77 after rebase — DEPLOYED + pushed — user test pending):** the LIVE SCROLL SYNC defect found by BROWSER TESTING (browser-use + a local HTTP server serving the exact C++-emitted page + a simulated RichBarSync.js): **the page-side channel works end-to-end** — file update, then the 250ms poll picks it up, then __rbSetRatio, then real scrolling. The actual blocker: **the poll script tag had NO cache-buster** (s.src was the bare RichBarSync.js), so the browser served the FIRST fetch from cache forever and later disk writes never reached the page. FIX: s.src = RichBarSync.js?cb=Date.now(). NOTE: the test server sent Cache-Control:no-cache and it worked — the file:// (real) case should be at least as permissive with a query-string change, but WebView2 file:// caching is unverified; if sync still fails, add a manifest-counter fallback. ALSO: the 0.51.2 m_hwndView query change auto-merged and is KEPT in 0.52.0 (only the version blocks conflicted); the user reported 0.51.2 broke the preview-button pressed state — if it recurs on 0.52.0, revert Editor_GetScrollPos/GetLines to m_hWnd (the 0.51.1 form kept the pressed state working). TEST INSTRUCTION for the user: sync needs a SCROLLABLE document (chapter05.md); a short doc has nothing to scroll on either side.',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
