// record 0.62.1 in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.62.1 (2026-10-01, 56b880e - DEPLOYED + pushed - user test pending):** the file-channel poller now fetches RichBarSync.js PLAIN (query string REMOVED): the 0.62.0 poller used RichBarSync.js?cb=Date.now() and the fetch SILENTLY FAILED in the WebView2 file:// context (the C++ side wrote the file correctly - log proved ratios 0..1 tracked - but the page never moved; marked.umd.min.js loads fine because it has NO query). HYPOTHESIS: WebView2 file:// loader does not strip query strings (unlike browser http) - the literal name RichBarSync.js?cb=123 does not exist. If 0.62.1 still fails, next candidate: WebView2 blocks file:// subresources with queries; then the fallback is a fixed-name file + accepting possible staleness, or a WebBar.ScrollY probe-jump macro.',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
