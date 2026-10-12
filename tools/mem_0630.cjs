// record 0.63.0 final in memory
const fs = require( 'fs' );
const p = 'C:/Users/yicki/.zcode/cli/memories/projects/richbar-06f8e4d3903970c2/memory/richbar-emeditor-sdk-commands.md';
let s = fs.readFileSync( p, 'utf8' );
const anchor = '**0.45.2 (2026-10-01, 02e82b4, D';
const i = s.indexOf( anchor );
if( i < 0 ){ console.log( 'ANCHOR MISS' ); process.exit( 1 ); }
const entry = [
	'**0.63.0 (2026-10-01, 99f18d0 - DEPLOYED + pushed - user test pending):** title-channel calibration for the delta sync. Page: __rbTitle() sets document.title = RB marker<scrollable px> at load+resize+timeouts; plugin: GetPreviewMaxFromTitle() scans m_hwndPreviewHost ancestors + EnumChildWindows(m_hWnd) for a title starting RB|, parses the px; poll middle: pxPerLine = max/nScrollable (fallback m_nPreviewLinePx). End anchors + everything else from 0.58.0 kept. Title emitted as document.title=\\'RB|\\'+... (single quotes - the inner double quotes break the C++ L"..." literal). GetWindowText readback from WebView2 Chrome_WidgetWin windows UNVERIFIED - if it returns 0/empty the fallback silently holds. BASE NOTE: 0.58.0 = delta mode + end anchors, user-confirmed scrolling works (drift: preview bottom at editor ~75%).',
	'',
].join( '\n' );
s = s.slice( 0, i ) + entry + s.slice( i );
fs.writeFileSync( p, s, 'utf8' );
console.log( 'memory updated' );
