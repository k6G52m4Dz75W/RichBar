// record 0.51.1 in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.51.1 (2026-10-01, 28f2d40, DEPLOYED + pushed — user test pending):** the deployed 0.51.0 was built from PRE-FIX source — the rebase conflict resolution (git checkout --ours RichBar.h during rebase --onto) took the ORIGIN side (rebase inverts ours/theirs: ours = the base you rebase onto) and silently discarded BOTH 0.51.0 fixes; user tested a 0.51.0-labeled DLL with the return-false bug still present (log: document.Text failed, NO falling-back line, NO preview write, NO scroll-sync line). Re-applied patch_0510_final.cjs + the known __rbPoll line fix; ALL fixes verified in source (fall-through / RichBarSync.js / no return-false / OnScrollerPoll / retry). CRITICAL GIT LESSON: during a rebase, ours = the upstream base and theirs = your own commit — inverted compared to merge. ALSO (user point, valid): a SHORT document gives both sides nothing to scroll — sync is only observable on a long document (chapter05.md); test with a long doc and scroll the editor first.',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
