// record 0.65.0 in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.65.0 (2026-10-01, 9239e0e - DEPLOYED + pushed - user test pending):** PROPORTIONAL LIVE SCROLL SYNC via self-contained macros. OnScrollerPoll (300ms) computes editor ratio = scrollY/(GetLines - PAGE_SIZE.cy) on m_hwndView; on ratio change it runs ONE macro: `WebBar.scrollTo(0, 99999999); var m = WebBar.ScrollY; WebBar.scrollTo(0, Math.round(%.4f * m));` - probe max, position by ratio, no readback, no hstrResult. The macro is self-contained (single JS turn, browser paints only the final position - no bottom-flash). Title emitter (__rbTitle) also added: publishes the preview scrollable px in document.title. End anchors removed (ratio 0/1 naturally clamp). DEPLOY includes the title emitter patch that was previously missing.',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
