// record 0.64.1 in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.64.1 (2026-10-01, c31b660 - DEPLOYED + pushed - user test pending):** REVERT to the confirmed-working 0.58.0 delta sync (line-delta x m_nPreviewLinePx + end anchors), abandoning the 0.59-0.62 scroll sync experiments entirely. LESSON: the width-ratio model (0.59/0.61) and the file channel (0.60) and the ScrollY probe (0.55/0.56) all failed for different reasons; the delta+anchors approach is the only one the user confirmed working. Accept the mid-range drift.',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
