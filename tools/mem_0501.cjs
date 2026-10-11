// record 0.50.1 in memory (file-based)
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const i = s.indexOf( '**0.47.0 (2026-10-01, f88dd42' );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.50.1 (2026-10-01, e6aa1cd, DEPLOYED + pushed — user test pending):** scroll-sync bug: the injected window.__scrollRatio=... statement was emitted BETWEEN the __md opening quote and its close (JsEscape(sText), then ratio, then the close+parse line) — the ratio assignment became PART of the __md markdown string (rendered as a paragraph; the variable was never set). FIX: emission order = __md open, escaped text, CLOSE __md, ratio statement, innerHTML=marked.parse(...), scroll restore, </script>. Verified the emitted page sequence line-by-line. RULE for multi-statement JS injection: after emitting an unclosed string opener, the next emission that must execute as CODE cannot come until the string is explicitly closed.',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
