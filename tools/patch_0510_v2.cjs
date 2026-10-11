// 0.51.0: live scroll sync (RichBarSync.js channel) + cold-start read fix
// 1. GetDocTextAll: on document.Text failure FALL THROUGH to the clipboard
//    path (the stray `return false` killed the whole preview write on
//    cold start — the pane kept showing a stale file)
// 2. Live scroll channel: a 300ms poll reads the editor scroll position;
//    on change it writes %TEMP%\RichBarSync.js ("__rbSetRatio(r);") which
//    the preview page picks up with a reusable <script> element (file://
//    script tags are proven — marked.umd.min.js loads this way)
// 3. The render-time __scrollRatio injection is removed (superseded)
// - version 0.50.1 -> 0.51.0
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( 'RichBarSync.js' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => String.fromCharCode( 9 ).repeat( n );
const Q = String.fromCharCode( 34 );      // "
const SQ = String.fromCharCode( 39 );     // '
const BS = String.fromCharCode( 92 );     // backslash

// A: member
{
	const a = '\tbool m_bNewApi = false;';
	if( !s.includes( a ) ) { console.log( 'A member anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\n' + T( 1 ) + 'double m_dLastSentRatio = -1.0;\t// last ratio pushed to RichBarSync.js' );
}

// B: GetDocTextAll — replace the early return with a fall-through
{
	const bad = T( 3 ) + 'return false;\t// do NOT touch the clipboard when the new API failed';
	if( !s.includes( bad ) ) { console.log( 'B anchor miss' ); process.exit( 1 ); }
	s = s.replace( bad, T( 3 ) + 'RbLogF( "falling back to the clipboard read" );\n' + T( 2 ) + '}' );
	// note: the `}` closes if(HasNewApi()); the clipboard path below now runs
}

// C: helpers before JsEscape
{
	const a = '\t// JSON/JS string escape for embedding the markdown source into the';
	const i = s.indexOf( a );
	if( i < 0 ) { console.log( 'C anchor miss' ); process.exit( 1 ); }
	const helpers = [
		T( 1 ) + '// write the scroll-ratio sync file consumed by the preview page',
		T( 1 ) + 'void WriteScrollerSync( double dRatio )',
		T( 1 ) + '{',
		T( 2 ) + 'TCHAR szPath[ MAX_PATH ];',
		T( 2 ) + 'TCHAR szBody[ 64 ];',
		T( 2 ) + 'GetTempPath( MAX_PATH, szPath );',
		T( 2 ) + 'wcscat_s( szPath, MAX_PATH, L"RichBarSync.js" );',
		T( 2 ) + 'wsprintf( szBody, L"__rbSetRatio(%.4f);", dRatio );',
		T( 2 ) + 'FILE* f = _wfopen( szPath, L"wb" );',
		T( 2 ) + 'if( !f )  return;',
		T( 2 ) + 'fwrite( szBody, sizeof( WCHAR ), wcslen( szBody ), f );',
		T( 2 ) + 'fclose( f );',
		T( 2 ) + 'm_dLastSentRatio = dRatio;',
		T( 1 ) + '}',
		'',
		T( 1 ) + 'void StartScrollerPoll()',
		T( 1 ) + '{',
		T( 2 ) + 'm_dLastSentRatio = -1.0;\t// force the first write',
		T( 2 ) + 'if( m_hDlg )  SetTimer( m_hDlg, IDT_SCROLLER_POLL, 300, NULL );',
		T( 1 ) + '}',
		'',
		T( 1 ) + '// the 300ms scroller poll: push ratio changes to the preview page',
		T( 1 ) + 'void OnScrollerPoll()',
		T( 1 ) + '{',
		T( 2 ) + 'if( !IsOfficialPaneVisible() )  return;',
		T( 2 ) + 'POINT_PTR ptScroll = { 0, 0 };',
		T( 2 ) + 'Editor_GetScrollPos( m_hWnd, &ptScroll );',
		T( 2 ) + 'UINT_PTR nLines = Editor_GetLines( m_hWnd, TRUE );',
		T( 2 ) + 'if( nLines < 2 )  return;',
		T( 2 ) + 'double dRatio = (double)ptScroll.y / (double)( nLines - 1 );',
		T( 2 ) + 'if( dRatio < 0 )  dRatio = 0;',
		T( 2 ) + 'if( dRatio > 1 )  dRatio = 1;',
		T( 2 ) + 'if( dRatio == m_dLastSentRatio )  return;',
		T( 2 ) + 'WriteScrollerSync( dRatio );',
		T( 1 ) + '}',
		'',
	].join( '\n' );
	s = s.slice( 0, i ) + helpers + s.slice( i );
}

// D: page script — __rbSetRatio + poller after the __rbRestore() call line
{
	const a = T( 4 ) + 'sHtml += L' + Q + '__rbRestore();' + Q + ';';
	if( !s.includes( a ) ) { console.log( 'D anchor miss' ); process.exit( 1 ); }
	const nw = a + '\n' + [
		T( 4 ) + 'sHtml += L' + Q + 'function __rbSetRatio(r){window.__scrollRatio=r;__rbRestore();}' + Q + ';',
		T( 4 ) + 'sHtml += L' + Q + 'window.__rbPoll=function(){var s=document.createElement(' + SQ + 'script' + SQ + ');s.src=' + SQ + 'RichBarSync.js?cb=' + Q + '+Date.now();document.body.appendChild(s);};'.replace( /\x27/g, String.fromCharCode( 39 ) ) + ';',
		T( 4 ) + 'sHtml += L' + Q + 'setInterval(window.__rbPoll,250);' + Q + ';',
	].join( '\n' );
	s = s.replace( a, nw );
}

// E: timer dispatch
{
	const a = T( 2 ) + 'else if( wParam == IDT_DOC_SYNC ){';
	if( !s.includes( a ) ) { console.log( 'E anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, T( 2 ) + 'else if( wParam == IDT_SCROLLER_POLL ){\n'
		+ T( 3 ) + 'CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));\n'
		+ T( 3 ) + 'if( pFrame ){\n'
		+ T( 4 ) + 'pFrame->OnScrollerPoll();\n'
		+ T( 3 ) + '}\n'
		+ T( 3 ) + 'return 0;\n'
		+ T( 2 ) + '}\n'
		+ a );
}

// F: timer id
{
	const a = '#define IDT_DOC_SYNC';
	if( !s.includes( a ) ) { console.log( 'F anchor miss' ); process.exit( 1 ); }
	// find the exact define line and append after it
	const lines = s.split( '\n' );
	const i = lines.findIndex( l => l.startsWith( '#define IDT_DOC_SYNC' ) );
	lines.splice( i + 1, 0, '#define IDT_SCROLLER_POLL' + String.fromCharCode( 9 ).repeat( 2 ) + '11' );
	s = lines.join( '\n' );
}

// G: start the poll when the pane opens
{
	const a = '\t\tStartScrollerPoll();';
	if( s.includes( a ) ) { console.log( 'G already present' ); }
	else {
		const anchor = 'RbLogF( "pane walk after open: visible=%d", (int)IsOfficialPaneVisible() );';
		const i = s.indexOf( anchor );
		if( i < 0 ) { console.log( 'G anchor miss' ); process.exit( 1 ); }
		const lineEnd = s.indexOf( '\n', i );
		s = s.slice( 0, lineEnd + 1 ) + T( 2 ) + 'StartScrollerPoll();\n' + s.slice( lineEnd + 1 );
	}
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
