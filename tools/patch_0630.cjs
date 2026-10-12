// 0.63.0: title-channel calibration for the delta scroll sync
// - the preview page writes its real scrollable px into document.title
//   ("RB|<px>") at load and on resize; the plugin scans the bar window
//   tree for that title and derives pxPerEditorLine = titlePx / nScrollable
// - the poll then sends scrollBy(0, nDelta x pxPerEditorLine) — exact
//   proportional sync calibrated from the page's own metrics
// - fallback: m_nPreviewLinePx when the title is unreadable
// - version 0.62.1 -> 0.63.0 (the .h already carries the 0.63.0 marker
//   from the base restore; only the behavior changes here)
// NOTE: this patch expects the 0.58.0-base file restored by the previous
// git checkout (delta poll + end anchors + m_nPreviewLinePx member).
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( 'm_nPreviewMaxFromTitle' ) || s.includes( '__rbTitle' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );

// A: member — calibrated px per editor scroll line
{
	const a = '\tint m_nPreviewLinePx = 26;\t// preview line height in px (font px x 1.6)';
	if( !s.includes( a ) ){ console.log( 'A miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\n' + T( 1 ) + 'int m_nCalibratedLinePx = 0;\t// px per editor line from the page title (0 = uncalibrated)' );
}

// B: title reader — scan the bar window tree for "RB|<n>"
{
	const anchor = '\tvoid StartScrollerPoll()';
	const i = s.indexOf( anchor );
	if( i < 0 ){ console.log( 'B anchor miss' ); process.exit( 1 ); }
	const nw = [
		T( 1 ) + '// read "RB|<px>" from the preview page title (the page publishes',
		T( 1 ) + '// its scrollable height there); 0 = not readable yet',
		T( 1 ) + 'static BOOL CALLBACK FindTitleProc( HWND hwnd, LPARAM lParam )',
		T( 1 ) + '{',
		T( 2 ) + 'WCHAR szTitle[ 64 ];',
		T( 2 ) + 'int n = GetWindowText( hwnd, szTitle, 64 );',
		T( 2 ) + 'if( n >= 4 && wcsncmp( szTitle, L"RB|", 3 ) == 0 ){',
		T( 3 ) + '*(int*)lParam = _wtoi( szTitle + 3 );',
		T( 3 ) + 'return FALSE;',
		T( 2 ) + '}',
		T( 2 ) + 'return TRUE;',
		T( 1 ) + '}',
		'',
		T( 1 ) + 'int GetPreviewMaxFromTitle()',
		T( 1 ) + '{',
		T( 2 ) + 'int nMax = 0;',
		T( 2 ) + 'HWND hBar = m_hwndPreviewHost;',
		T( 2 ) + 'while( hBar && IsWindow( hBar ) ){',
		T( 3 ) + 'if( GetWindowText( hBar, NULL, 0 ) >= 4 ){',
		T( 4 ) + 'WCHAR szTitle[ 64 ];',
		T( 4 ) + 'GetWindowText( hBar, szTitle, 64 );',
		T( 4 ) + 'if( wcsncmp( szTitle, L"RB|", 3 ) == 0 ){',
		T( 5 ) + 'return _wtoi( szTitle + 3 );',
		T( 4 ) + '}',
		T( 4 ) + 'break;',
		T( 3 ) + '}',
		T( 3 ) + 'hBar = GetParent( hBar );',
		T( 2 ) + '}',
		T( 2 ) + 'EnumChildWindows( m_hWnd, FindTitleProc, (LPARAM)&nMax );',
		T( 2 ) + 'return nMax;',
		T( 1 ) + '}',
		'',
	].join( '\r\n' );
	s = s.slice( 0, i ) + nw + s.slice( i );
	console.log( 'B title reader added' );
}

// C: page emission — the title updater (after the __rbRestore(); line)
{
	const anchor = '\t\t\t\tsHtml += L"__rbRestore();";';
	if( !s.includes( anchor ) ){ console.log( 'C anchor miss' ); process.exit( 1 ); }
	const nw = [
		anchor,
		'\t\t\t\tsHtml += L"function __rbTitle(){try{document.title=\'RB|\'+String(document.body.scrollHeight-window.innerHeight);}catch(e){}}";',
		'\t\t\t\tsHtml += L"window.addEventListener(\'load\',__rbTitle);window.addEventListener(\'resize\',__rbTitle);setTimeout(__rbTitle,50);setTimeout(__rbTitle,500);";',
	].join( '\r\n' );
	s = s.replace( anchor, nw );
	console.log( 'C title emitter added' );
}

// D: poll — calibrate + use the calibrated px per line
{
	const old = [
		T( 2 ) + 'if( nDelta == 0 )  return;',
		T( 2 ) + 'const int nPx = nDelta * m_nPreviewLinePx;',
		T( 2 ) + 'wsprintf( szMacro, L"WebBar.scrollBy( 0, %d );", nPx );',
		T( 2 ) + 'RunWebBarMacro( szMacro );\t// dropped frames are fine while scrolling',
	].join( '\r\n' );
	if( !s.includes( old ) ){ console.log( 'D anchor miss' ); process.exit( 1 ); }
	const nw = [
		T( 2 ) + 'if( nDelta == 0 )  return;',
		T( 2 ) + '// px per editor line: calibrated from the page title when available',
		T( 2 ) + 'int nPxPerLine = m_nPreviewLinePx;',
		T( 2 ) + 'const int nPageMax = GetPreviewMaxFromTitle();',
		T( 2 ) + 'if( nPageMax > 0 && nScrollable > 0 ){',
		T( 3 ) + 'nPxPerLine = nPageMax / nScrollable;',
		T( 2 ) + '}',
		T( 2 ) + 'const int nPx = nDelta * nPxPerLine;',
		T( 2 ) + 'wsprintf( szMacro, L"WebBar.scrollBy( 0, %d );", nPx );',
		T( 2 ) + 'RunWebBarMacro( szMacro );\t// dropped frames are fine while scrolling',
	].join( '\r\n' );
	s = s.replace( old, nw );
	console.log( 'D poll calibrated' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
