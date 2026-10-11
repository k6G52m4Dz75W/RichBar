// record 0.44.1 in memory (file-based, no inline escaping traps)
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.43.1 (2026-10-01, 6aa8e86, DEPLOYED + pushed — user test pending):**';
if( !s.includes( anchor ) ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.44.1 (2026-10-01, 90b1679, DEPLOYED + pushed — user test pending):** three fixes over 0.44.0:',
	'(1) Browse button REMOVED — the combo row is label+dropdown only (combo moved to x=96 w=142; the widened label had overlapped it); choosing Custom fires CBN_SELCHANGE which opens GetOpenFileNameW immediately, on OK the path goes into m_sPreviewCss + the Custom item text updates, on CANCEL the selection restores per m_sPreviewCss.',
	'(2) vscode-highlight.css REMOVED from themes (it styles highlight.js token classes which plain marked output never emits — not a complete markdown theme; user caught it).',
	'(3) themes dir now: paper-serif.css, emeditor-template.css (from the EmEditor install root), vscode-markdown.css.',
	'GENERATOR ESCAPING TABLE (hard-won this round): C++ char literal backslash = L + quote + TWO backslashes + quote; C++ string \\\\0 = backslash + 0; NEVER build a C++ string with single quotes (a multi-char literal eats the quote — use L"..." with raw double quotes inside a single-quoted JS string). UNICODE rc/UTF-16 files: patch via patchUtf16 with a BOM guard. RULE: when an inline -e patcher hits its own escaping wall twice, switch to a Write-tool .cjs file immediately (three rounds were burned re-deriving the same escapes).',
	'',
].join( '\n' );
s = s.slice( 0, s.indexOf( anchor ) ) + entry + s.slice( s.indexOf( anchor ) );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
