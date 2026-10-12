// 0.63.0 completion: apply the remaining pieces (member + title reader +
// page title emitter) — the poll middle calibration is already in place
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( '__rbTitle' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );
const Q = String.fromCharCode( 34 );
const SQ = String.fromCharCode( 39 );

// 1: member after m_nPreviewLinePx
{
	const a = '\tint m_nPreviewLinePx = 26;';
	if( !s.includes( a ) ){ console.log( '1 miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\n' + T( 1 ) + 'int m_nCalibratedLinePx = 0;\t// px per editor line from the page title (0 = not yet)' );
	console.log( '1 member ok' );
}

// 2: title reader before StartScrollerPoll
{
	const a = T( 1 ) + 'void StartScrollerPoll()';
	const i = s.indexOf( a );
	if( i < 0 ){ console.log( '2 miss' ); process.exit( 1 ); }
	const nw = [
		T( 1 ) + '// scan the bar window tree for the page-published "RB|<px>" title',
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
		T( 3 ) + 'WCHAR szTitle[ 64 ];',
		T( 3 ) + 'int n = GetWindowText( hBar, szTitle, 64 );',
		T( 3 ) + 'if( n >= 4 && wcsncmp( szTitle, L"RB|", 3 ) == 0 ){',
		T( 4 ) + 'return _wtoi( szTitle + 3 );',
		T( 3 ) + '}',
		T( 3 ) + 'hBar = GetParent( hBar );',
		T( 2 ) + '}',
		T( 2 ) + 'EnumChildWindows( m_hWnd, FindTitleProc, (LPARAM)&nMax );',
		T( 2 ) + 'return nMax;',
		T( 1 ) + '}',
		'',
	].join( '\n' );
	s = s.slice( 0, i ) + nw + s.slice( i );
	console.log( '2 title reader ok' );
}

// 3: page title emitter after the __rbRestore(); call
{
	const a = T( 4 ) + 'sHtml += L' + Q + '__rbRestore();' + Q + ';';
	if( !s.includes( a ) ){ console.log( '3 miss' ); process.exit( 1 ); }
	const emitter1 = T( 4 ) + 'sHtml += L' + Q + 'function __rbTitle(){try{document.title=' + Q + 'RB|' + Q + '+String(document.body.scrollHeight-window.innerHeight);}catch(e){}}' + Q + ';';
	const emitter2 = T( 4 ) + 'sHtml += L' + Q + 'window.addEventListener(' + SQ + 'load' + SQ + ',__rbTitle);window.addEventListener(' + SQ + 'resize' + SQ + ',__rbTitle);setTimeout(__rbTitle,50);setTimeout(__rbTitle,500);' + Q + ';';
	s = s.replace( a, a + '\r\n' + emitter1 + '\r\n' + emitter2 );
	console.log( '3 title emitter ok' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
