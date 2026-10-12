// record 0.59.0 final in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.59.0 FINAL (2026-10-01, 08d7dc5 — DEPLOYED + pushed — user test pending):** width-ratio px sync implemented on the 0.58.0 anchor base (user model, physics direction CORRECTED): editor scroll in CSS px = scroll lines x m_nEditorLineCssPx (editor line height via EI_GET_VIEW_FONT lfHeight abs x 96/DPI, cached at render in the bFont block — NOT the x4/5 font size); preview target = editor px x (W_edit/W_prev) via GetClientRect(m_hwndView)/GetClientRect(m_hwndPreviewHost); narrower preview → taller wrapped content → preview scrolls MORE (the user mental model said /2 — physics says ×2; visually verifiable in one test). Sent as `WebBar.scrollTo(0, target)` — absolute px self-corrects (clamps at ends). End anchors kept (GetLines − PAGE_SIZE.cy on m_hwndView). Multi-round editing chaos lesson (0.59.0 round): RichBar.h went through checkout-revert + 3 fixers with shifting line numbers — the ROBUST pattern that finally worked: content-anchored find (indexOf after OnScrollerPoll) + line splice + immediate re-dump verification; NEVER trust remembered line numbers. ALSO: locale rc version drift recurring (0.58.0 left behind when main rc bumped) — ALWAYS grep BOTH rc versions after any bump.',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
