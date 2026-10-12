// 0.54.0: PROPORTIONAL scroll sync (both panes to the same fraction of
// their scrollable range — adapts to any docking/pane size)
// - editor ratio = scrollY / (totalLines - visibleLines)
//   (EE_GET_SCROLL_POS + EE_GET_LINES + EE_GET_PAGE_SIZE on m_hwndView)
// - preview max px probed ONCE per render via the native macro
//   "WebBar.scrollTo(0, 99999999); var m = WebBar.scrollY;
//    WebBar.scrollTo(0, Math.round(RATIO * m)); return m;" — probe +
//    position in one macro, no flicker; hstrResult returns the probed max
// - poll: target = ratio * previewMax; skip when |target - last| < 4px
// - removes the line-delta members (m_nLastEditorY/m_nPreviewLinePx)
// - version 0.53.0 -> 0.54.0
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( 'm_nPreviewMaxPx' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );
const Q = String.fromCharCode( 34 );
const BS = String.fromCharCode( 92 );
function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// A: members
{
	const a = '\tint m_nLastEditorY = 0;\t\t// last editor scroll line seen by the poll\n\tint m_nPreviewLinePx = 26;\t// preview line height in px (font px x 1.6)';
	if( !s.includes( a ) )  fail( 'A anchor miss' );
	s = s.replace( a, [
		'\tint m_nPreviewMaxPx = 0;\t// probed preview scrollable height in px',
		'\tint m_nLastSentTargetPx = -1;\t// last px target sent to the preview',
	].join( '\n' ) );
}

// B: replace SetPreviewLinePx + StartScrollerPoll + OnScrollerPoll
{
	const startMarker = '\t// remember the preview line height (px) for the scroll sync';
	const endMarker = '\t// JSON/JS string escape for embedding the markdown source into the';
	const i = s.indexOf( startMarker );
	const j = s.indexOf( endMarker );
	if( i < 0 || j < 0 || j <= i )  fail( 'B span miss' );
	const nw = [
		T( 1 ) + 'void StartScrollerPoll()',
		T( 1 ) + '{',
		T( 2 ) + 'm_nPreviewMaxPx = 0;\t// re-probe after every open/render',
		T( 2 ) + 'm_nLastSentTargetPx = -1;',
		T( 2 ) + 'if( m_hDlg )  SetTimer( m_hDlg, IDT_SCROLLER_POLL, 300, NULL );',
		T( 1 ) + '}',
		'',
		T( 1 ) + '// the 300ms poll: proportional sync — both panes to the same',
		T( 1 ) + '// fraction of their scrollable range (adapts to pane size)',
		T( 1 ) + 'void OnScrollerPoll()',
		T( 1 ) + '{',
		T( 2 ) + 'if( !IsOfficialPaneVisible() )  return;',
		T( 2 ) + 'if( !m_hwndView || !IsWindow( m_hwndView ) )  return;',
		T( 2 ) + 'POINT_PTR pt = { 0, 0 };',
		T( 2 ) + 'Editor_GetScrollPos( m_hwndView, &pt );',
		T( 2 ) + 'UINT_PTR nLines = Editor_GetLines( m_hwndView, TRUE );',
		T( 2 ) + 'SIZE_PTR sizePage = { 0, 0 };',
		T( 2 ) + 'Editor_GetPageSize( m_hwndView, &sizePage );',
		T( 2 ) + 'const int nScrollable = (int)nLines - (int)sizePage.cy;',
		T( 2 ) + 'if( nScrollable < 1 )  return;\t// the editor cannot scroll',
		T( 2 ) + 'double dRatio = (double)pt.y / (double)nScrollable;',
		T( 2 ) + 'if( dRatio < 0 )  dRatio = 0;',
		T( 2 ) + 'if( dRatio > 1 )  dRatio = 1;',
		T( 2 ) + 'if( m_nPreviewMaxPx <= 0 ){',
		T( 3 ) + '// probe the preview scrollable height once per render, and',
		T( 3 ) + '// position it in the SAME macro (no bottom-flicker)',
		T( 3 ) + 'TCHAR szProbe[ 256 ];',
		T( 3 ) + 'wsprintf( szProbe, L"WebBar.scrollTo( 0, 99999999 ); var m = WebBar.scrollY; WebBar.scrollTo( 0, Math.round( %.4f * m ) ); return m;", dRatio );',
		T( 3 ) + 'RUN_MACRO_INFO rmi;',
		T( 3 ) + 'ZeroMemory( &rmi, sizeof( rmi ) );',
		T( 3 ) + 'rmi.cbSize = sizeof( rmi );',
		T( 3 ) + 'rmi.nFlags = RUN_TEXT;',
		T( 3 ) + 'rmi.pszText = L' + Q + '#language=' + BS + Q + 'V8' + BS + Q + BS + 'n' + Q + ' + szProbe;',
		T( 3 ) + 'rmi.nDefMacroLang = MACRO_LANG_V8 | MACRO_SYNC_ONLY;',
		T( 3 ) + 'rmi.ptErrorPos.x = rmi.ptErrorPos.y = -1;',
		T( 3 ) + 'HRESULT hr = (HRESULT)SendMessage( m_hWnd, EE_RUN_MACRO, 0, (LPARAM)&rmi );',
		T( 3 ) + 'if( hr == S_OK && rmi.hstrResult ){',
		T( 4 ) + 'LPCWSTR pMax = (LPCWSTR)GlobalLock( rmi.hstrResult );',
		T( 4 ) + 'if( pMax ){',
		T( 5 ) + 'm_nPreviewMaxPx = _wtoi( pMax );',
		T( 5 ) + 'GlobalUnlock( rmi.hstrResult );',
		T( 5 ) + 'GlobalFree( rmi.hstrResult );',
		T( 5 ) + 'RbLogF( "scroll probe: max=%d ratio=%.4f", m_nPreviewMaxPx, dRatio );',
		T( 4 ) + '}',
		T( 4 ) + 'else {',
		T( 5 ) + 'GlobalFree( rmi.hstrResult );',
		T( 4 ) + '}',
		T( 3 ) + '}',
		T( 2 ) + '}',
		T( 2 ) + 'else {',
		T( 3 ) + 'const int nTarget = (int)( dRatio * m_nPreviewMaxPx );',
		T( 3 ) + 'if( nTarget == m_nLastSentTargetPx )  return;',
		T( 3 ) + 'm_nLastSentTargetPx = nTarget;',
		T( 3 ) + 'TCHAR szMacro[ 128 ];',
		T( 3 ) + 'wsprintf( szMacro, L"WebBar.scrollTo( 0, %d );", nTarget );',
		T( 3 ) + 'RunWebBarMacro( szMacro );',
		T( 2 ) + '}',
		T( 1 ) + '}',
		'',
	].join( '\r\n' );
	s = s.slice( 0, i ) + nw + s.slice( j );
}

// C: remove the SetPreviewLinePx call in WritePreviewHtml
{
	const a = T( 4 ) + 'SetPreviewLinePx( nPx );\r\n';
	if( s.includes( a ) ){ s = s.replace( a, '' ); console.log( 'C: call removed (CRLF)' ); }
	else {
		const b = T( 4 ) + 'SetPreviewLinePx( nPx );\n';
		if( s.includes( b ) ){ s = s.replace( b, '' ); console.log( 'C: call removed (LF)' ); }
		else console.log( 'C: SetPreviewLinePx call not found (ok if absent)' );
	}
}

// D: version 0.53.0 -> 0.54.0
{
	const rc = 'E:/Projects/RichBar/RichBar/RichBar.rc';
	let r = fs.readFileSync( rc, 'utf8' );
	if( !r.includes( '0,53,0,0' ) )  fail( 'rc does not read 0,53,0,0' );
	r = r.split( '0,53,0,0' ).join( '0,54,0,0' );
	r = r.split( '0.53.0' ).join( '0.54.0' );
	fs.writeFileSync( rc, r, 'utf8' );
	const loc = 'E:/Projects/RichBar/RichBar/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( loc );
	if( buf[ 0 ] !== 0xFF || buf[ 1 ] !== 0xFE )  fail( 'locale rc BOM missing' );
	let t = buf.toString( 'utf16le' );
	t = t.replace( /IDS_VERSION(\s+)"0\.53\.0"/, ( m, sp ) => 'IDS_VERSION' + sp + '"0.54.0"' );
	fs.writeFileSync( loc, Buffer.from( t, 'utf16le' ) );
	console.log( 'versions bumped to 0.54.0' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
