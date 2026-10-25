// record 0.65.0 anchor sync in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.65.0 ANCHOR SYNC (2026-10-01, 73b7d99 - DEPLOYED + pushed - user test pending):** the industry-standard anchor+interpolation design (per the user-provided research doc on Joplin/VSCode/ByteMD): (1) PAGE renders with data-source-line on every top-level block — marked.lexer tokens + a custom renderer; token start line = line count before src.indexOf(token.raw) (VERIFIED end-to-end in node: h1/p/ul/pre/blockquote all got correct lines). (2) PAGE builds __rbMap = [{l, y}] from [data-source-line] getBoundingClientRect at load/resize; __rbScrollToLine(l) does binary search + linear interpolation + window.scrollTo (self-scroll works in-page). (3) CHANNEL: the plugin navigates WebBar.Open(file:///...#L<line>) — same-document hash navigation fires hashchange WITHOUT reloading; the page listens and scrolls itself. The plugin OnScrollerPoll (300ms) reads the editor top line (EE_GET_SCROLL_POS y = line on m_hwndView) and on change >= 1 line sends the hash navigation via RunWebBarMacroStaged. THE KEY INSIGHT: WebBar.Open with only a hash change does not reload the page (standard browser behavior) — this is the working plugin->page channel that the sync-file never provided. Emulator lessons applied: NO backslash escapes in the C++ wide literals (String.fromCharCode(10)/(34) in JS instead), no embedded double quotes.',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
