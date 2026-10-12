// record 0.62.0 in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.62.0 (2026-10-01, 8cfb96b - DEPLOYED + pushed - user test pending):** RESET to the 0.60.0 file-channel design (the 0.61.0 px-delta detour reverted; the file was a chimera of 0.60.0 comments + 0.59.0 px body from the multi-checkout rounds - fixed via full-file checkout fc8780d + rc repair). PROBE FILE PLACED: %TEMP%\\RichBarSync.js = __rbSetRatio(0.5); written while EmEditor was closed - on the user restart + preview open, if the page jumps to the MIDDLE within ~250ms, the file:// delivery channel WORKS (then the live writer is already in 0.62.0: OnScrollerPoll writes the ratio on change >= 0.5%); if the preview stays at top, file://+script-tag delivery is DEAD and the live sync needs a different channel (candidates: the page-side poller fetching a fixed name WITHOUT the query works but is stale-prone; a WebBar.ScrollY probe-jump macro - risky; or giving up live sync). DIAG ESTABLISHED: WebBar.ScrollY/scrollY read 0 at top (plausibly genuine); WebBar.scrollTo from macros = NEVER use (errors open the macro source as a doc tab); scrollBy units = px (user-confirmed visually).',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
