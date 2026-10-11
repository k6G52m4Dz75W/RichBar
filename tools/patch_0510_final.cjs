// 0.51.0 FINAL: fix the cold-start chain with the MINIMUM set of changes
//
// Root causes from the log:
//  R1. `document.Text` macro fails with 0x2000000B on the first burst
//      (the known V8 cold-start), and GetDocTextAll returns false ->
//      WritePreviewHtml returns early -> RichBarPreview.html is NEVER
//      rewritten -> the pane shows the previous session's file. The
//      scroll-sync render path never even runs.
//      FIX A: on macro failure, fall through to the clipboard fallback
//      (remove the early return false).
//      FIX B: retry the document.Text macro on the SAME 1s retry timer
//      the WebBar macro already uses — the second attempt always
//      succeeds once the engine is up, so within ~1s the macro path
//      takes over permanently.
//  R2. Scroll sync only applies at RENDER time; scrolling the editor
//      does not re-render, so scrolling alone never moves the preview.
//      FIX C: a 300ms poll (pane-open only) pushes ratio changes to
//      %TEMP%\RichBarSync.js; the preview page fetches it with a
//      reusable <script> tag (same file:// mechanism as marked.js).
// - version 0.50.2 -> 0.51.0
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( 'RichBarSync.js' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );
const Q = String.fromCharCode( 34 );
const SQ = String.fromCharCode( 39 );
const NL = '\n';
const RN = '\r\n';

// --- FIX A: fall through on macro failure ---
{
	const bad = T( 3 ) + 'return false;' + '\t// do NOT touch the clipboard when the new API failed';
	if( !s.includes( bad ) ) { console.log( 'A anchor miss' ); process.exit( 1 ); }
	s = s.replace( bad,
		T( 3 ) + 'RbLogF( ' + Q + 'falling back to the clipboard read' + Q + ' );'
	);
	// NOTE: the block's closing brace at line 2002 (T(3)+'}') then the
	// clipboard path follows OUTSIDE if(HasNewApi()). That is the desired
	// fall-through. Verify the structure: after replacement the code is
	//   RbLogF(...); }
	//   // whole-document read...
	// So the clipboard path runs for ANY version when the macro failed.
	// For <26.3 HasNewApi() is false and the clipboard path runs directly.
	// Both correct.
}

// --- FIX B: retry document.Text via the existing retry timer ---
{
	// RunWebBarMacroStaged retries m_sPendingMacro on IDT_WEBBAR_RETRY.
	// GetDocTextAll runs from the auto-refresh timer BEFORE the WebBar
	// macro — the same cold-start window. Simplest robust fix: if the
	// document.Text macro fails with 0x2000000B, schedule a preview
	// re-render (re-entry into WritePreviewHtml next second) instead of
	// silently falling back forever. We reuse IDT_PREVIEW_REFRESH.
	const a = '\t\t\tRbLogF( ' + Q + 'falling back to the clipboard read' + Q + ' );';
	if( !s.includes( a ) ) { console.log( 'B anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\n'
		+ T( 3 ) + 'if( hr == (HRESULT)0x2000000B && m_hDlg ){' + '\n'
		+ T( 4 ) + '// V8 cold-start: schedule ONE re-render attempt next second\n'
		+ T( 4 ) + 'static bool s_bRequeued = false;\n'
		+ T( 4 ) + 'if( !s_bRequeued ){' + '\n'
		+ T( 5 ) + 's_bRequeued = true;' + '\n'
		+ T( 5 ) + 'SetTimer( m_hDlg, IDT_PREVIEW_REFRESH, 1200, NULL );' + '\n'
		+ T( 4 ) + '}' + '\n'
		+ T( 3 ) + '}'
	);
}

// --- FIX C: the live scroll channel ---
{
	// C1: member
	const a1 = '\tbool m_bNewApi = false;';
	if( !s.includes( a1 ) ) { console.log( 'C1 anchor miss' ); process.exit( 1 ); }
	s = s.replace( a1, a1 + '\r\n' + T( 1 ) + 'double m_dLastSentRatio = -1.0;\t// last ratio pushed to RichBarSync.js' );

	// C2: timer id
	const a2 = '#define IDT_DOC_SYNC';
	const lines = s.split( NL );
	const i2 = lines.findIndex( l => l.startsWith( a2 ) );
	if( i2 < 0 ) { console.log( 'C2 anchor miss' ); process.exit( 1 ); }
	lines.splice( i2 + 1, 0, '#define IDT_SCROLLER_POLL' + '\t\t11' );
	s = lines.join( NL );

	// C3: helpers before JsEscape
	const a3 = '\t// JSON/JS string escape for embedding the markdown source into the';
	const i3 = s.indexOf( a3 );
	if( i3 < 0 ) { console.log( 'C3 anchor miss' ); process.exit( 1 ); }
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
	].join( RN );
	s = s.slice( 0, i3 ) + helpers + s.slice( i3 );

	// C4: timer dispatch before the DOC_SYNC branch
	const a4 = T( 2 ) + 'else if( wParam == IDT_DOC_SYNC ){';
	if( !s.includes( a4 ) ) { console.log( 'C4 anchor miss' ); process.exit( 1 ); }
	s = s.replace( a4,
		T( 2 ) + 'else if( wParam == IDT_SCROLLER_POLL ){' + RN
		+ T( 3 ) + 'CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));' + RN
		+ T( 3 ) + 'if( pFrame ){' + RN
		+ T( 4 ) + 'pFrame->OnScrollerPoll();' + RN
		+ T( 3 ) + '}' + RN
		+ T( 3 ) + 'return 0;' + RN
		+ T( 2 ) + '}' + RN
		+ a4 );

	// C5: page side — __rbSetRatio + poller after the __rbRestore() line
	const a5 = T( 4 ) + 'sHtml += L' + Q + '__rbRestore();' + Q + ';';
	if( !s.includes( a5 ) ) { console.log( 'C5 anchor miss' ); process.exit( 1 ); }
	const nw5 = [
		a5,
		T( 4 ) + 'sHtml += L' + Q + 'function __rbSetRatio(r){window.__scrollRatio=r;__rbRestore();}' + Q + ';',
		T( 4 ) + 'sHtml += L' + Q + 'window.__rbPoll=function(){var s=document.createElement(' + SQ + 'script' + SQ + ');s.src=' + SQ + 'RichBarSync.js' + SQ + ';document.body.appendChild(s);};'.replace( SQ, SQ ) + ';',
		T( 4 ) + 'sHtml += L' + Q + 'setInterval(window.__rbPoll,250);' + Q + ';',
	].join( RN );
	s = s.replace( a5, nw5 );

	// C6: start the poll when the pane opens
	const a6 = 'RbLogF( ' + Q + 'pane walk after open: visible=%d' + Q + ', (int)IsOfficialPaneVisible() );';
	const i6 = s.indexOf( a6 );
	if( i6 < 0 ) { console.log( 'C6 anchor miss' ); process.exit( 1 ); }
	const lineEnd = s.indexOf( NL, i6 );
	s = s.slice( 0, lineEnd + 1 ) + T( 2 ) + 'StartScrollerPoll();' + NL + s.slice( lineEnd + 1 );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
