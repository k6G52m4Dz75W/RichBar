// 0.51.0: live scroll sync via a sync-file channel + cold-start fixes
//
// 1. GetDocTextAll: on document.Text macro failure (cold start 0x2000000B)
//    FALL THROUGH to the clipboard path instead of returning false (the
//    stale-file regression from 0.50.x); log the fall-through.
// 2. Sync channel: the plugin writes %TEMP%\RichBarSync.js
//    ("__rbSetRatio(0.42);") whenever the editor scroll ratio changes
//    (300ms poll, pane-open only); the preview page defines __rbSetRatio
//    and polls the file with a reusable <script> element (file:// script
//    tags are proven — marked.umd.min.js loads this way).
// 3. Render-time __scrollRatio injection removed (the channel supersedes it).
// - version 0.50.1 -> 0.51.0
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( 'RichBarSync.js' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );

// A: member + timer id
{
	const a = '\tbool m_bNewApi = false;\t\t// cached: EmEditor >= 26.3.0 (document.Text macro, WebBar scroll)';
	if( !s.includes( a ) ) { console.log( 'member anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\r\n\tdouble m_dLastSentRatio = -1.0;\t// last ratio pushed to RichBarSync.js' );
}
{
	const a = '#define IDT_DOC_SYNC\t\t\t9';
	if( !s.includes( a ) ) { console.log( 'IDT anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\r\n#define IDT_SCROLLER_POLL\t\t11' );
}

// B: GetDocTextAll — fall through on macro failure
{
	const bad = '\t\t\treturn false;\t// do NOT touch the clipboard when the new API failed';
	if( !s.includes( bad ) ) { console.log( 'return-false anchor miss' ); process.exit( 1 ); }
	s = s.replace( bad, '\t\t\tRbLogF( "falling back to the clipboard read" );' );
}

// C: helpers before WritePreviewHtml (after JsEscape's closing brace)
{
	const a = '\t// JSON/JS string escape for embedding the markdown source into the';
	const i = s.indexOf( a );
	if( i < 0 ) { console.log( 'JsEscape anchor miss' ); process.exit( 1 ); }
	const helpers = [
		'\t// write the scroll-ratio sync file consumed by the preview page',
		'\tvoid WriteScrollerSync( double dRatio )',
		'\t{',
		'\t\tTCHAR szPath[ MAX_PATH ];',
		'\t\tTCHAR szBody[ 64 ];',
		'\t\tGetTempPath( MAX_PATH, szPath );',
		'\t\twcscat_s( szPath, MAX_PATH, L"RichBarSync.js" );',
		'\t\twsprintf( szBody, L"__rbSetRatio(%.4f);", dRatio );',
		'\t\tFILE* f = _wfopen( szPath, L"wb" );',
		'\t\tif( !f )  return;',
		'\t\tfwrite( szBody, sizeof( WCHAR ), wcslen( szBody ), f );',
		'\t\tfclose( f );',
		'\t\tm_dLastSentRatio = dRatio;',
		'\t}',
		'',
		'\tvoid StartScrollerPoll()',
		'\t{',
		'\t\tm_dLastSentRatio = -1.0;\t// force the first write',
		'\t\tif( m_hDlg )  SetTimer( m_hDlg, IDT_SCROLLER_POLL, 300, NULL );',
		'\t}',
		'',
		'\t// the 300ms scroller poll: push ratio changes to the preview page',
		'\tvoid OnScrollerPoll()',
		'\t{',
		'\t\tif( !IsOfficialPaneVisible() )  return;',
		'\t\tPOINT_PTR ptScroll = { 0, 0 };',
		'\t\tEditor_GetScrollPos( m_hWnd, &ptScroll );',
		'\t\tUINT_PTR nLines = Editor_GetLines( m_hWnd, TRUE );',
		'\t\tif( nLines < 2 )  return;',
		'\t\tdouble dRatio = (double)ptScroll.y / (double)( nLines - 1 );',
		'\t\tif( dRatio < 0 )  dRatio = 0;',
		'\t\tif( dRatio > 1 )  dRatio = 1;',
		'\t\tif( dRatio == m_dLastSentRatio )  return;',
		'\t\tWriteScrollerSync( dRatio );',
		'\t}',
		'',
	].join( '\r\n' );
	s = s.slice( 0, i ) + helpers + s.slice( i );
}

// D: WritePreviewHtml — remove the render-time __scrollRatio injection
{
	const bad = '\t\t\t\tsHtml += L"window.__scrollRatio=" + sRatio + L";";\n';
	if( !s.includes( bad ) ) { console.log( 'ratio-injection anchor miss' ); process.exit( 1 ); }
	s = s.replace( bad, '' );
}

// E: page script — __rbSetRatio + the poller, appended after the restore line
{
	const a = 'sHtml += L"if(typeof window.__scrollRatio===\'number\'){var h=document.body.scrollHeight-window.innerHeight;window.scrollTo(0,window.__scrollRatio*h);}";';
	if( !s.includes( a ) ) { console.log( 'page script anchor miss' ); process.exit( 1 ); }
	const nw = [
		'\t\t\tsHtml += L"function __rbSetRatio(r){window.__scrollRatio=r;__rbRestore();}";',
		'\t\t\tsHtml += L"window.__rbPoll=function(){var s=document.createElement(\'script\');s.src=\'RichBarSync.js?cb=\'+Date.now();document.body.appendChild(s);};";',
		'\t\t\tsHtml += L"setInterval(window.__rbPoll,250);";',
	].join( '\r\n' );
	s = s.replace( a, a + '\r\n' + nw );
}

// F: timer dispatch
{
	const a = '\t\telse if( wParam == IDT_DOC_SYNC ){';
	if( !s.includes( a ) ) { console.log( 'timer dispatch anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, '\t\telse if( wParam == IDT_SCROLLER_POLL ){\r\n\t\t\tCMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));\r\n\t\t\tif( pFrame ){\r\n\t\t\t\tpFrame->OnScrollerPoll();\r\n\t\t\t}\r\n\t\t\treturn 0;\r\n\t\t}\r\n' + a );
}

// G: start the poll when the pane opens (OpenWebBarPreview tail)
{
	const a = '\t\tRunWebBarMacroStaged( sMacro.c_str() );\r\n\t\tRbLogF( "pane walk after open: visible=%d", (int)IsOfficialPaneVisible() );';
	if( !s.includes( a ) ) { console.log( 'OpenWebBarPreview tail anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\r\n\t\tStartScrollerPoll();' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
