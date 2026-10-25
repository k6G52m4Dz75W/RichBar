// record 0.65.1 in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.65.1 (2026-10-01, f6d471d - DEPLOYED + pushed - user test pending):** two renderer bugs fixed after node-side simulation caught them: (1) the injected attribute value was built as a LITERAL containing String.fromCharCode(34) text (function name as text) — fixed by a Q var holding the quote char and string concat; (2) the tag replace consumed only /^<([a-z0-9]+)/ WITHOUT the closing bracket, so the replacement appended its own closing bracket before the original one -> double bracket garbled the ENTIRE page into visible raw text with a leading bracket char (the user-reported "everything prefixed with >"). Fixed: match and consume /^<([a-z0-9]+)>/. SIMULATION-DRIVEN DEVELOPMENT WORKED: the tools/fix_renderer_v3.cjs harness (build the exact emitted JS -> new Function -> run against the shipped marked -> inspect output) caught both bugs before this build; the end-to-end sim now shows perfect data-source-line values (h1=0, p=2, h2=4, ul=6, p=9).',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
