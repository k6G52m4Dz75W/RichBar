// 0.33.0 patch: auto-refresh (typing-pause debounce) + refresh button removed
// - EVENT_CHANGE: re-arm the debounce ONLY while the preview pane is really
//   open (self-correcting: a manually closed pane is never re-opened); 1s
// - doc switch/config change/open also re-render the pane (same debounce)
// - IDT_PREVIEW_REFRESH timer branch -> OnPreviewAutoRefresh (re-render +
//   re-navigate via the proven WebBar path)
// - GetDocTextAll: save/restore the user's clipboard text (auto-refresh
//   fires frequently; SelectAll+Copy must not clobber it)
// - refresh button removed from BOTH default button arrays (the command
//   handler stays: stale persisted CmdArrays still route it correctly)
// - version 0.32.0 -> 0.33.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'OnPreviewAutoRefresh' ) )  fail( 'already patched' );

	// A: EVENT_CHANGE debounce guarded + 1s
	const aA = [
		'\t\tif( nEvent & EVENT_CHANGE ){',
		'\t\t\t// every buffer modification re-arms the debounce; one WebView2',
		'\t\t\t// reload fires when the typing pauses (see ReloadLivePreview)',
		'\t\t\tif( m_hDlg ){',
		'\t\t\t\tSetTimer( m_hDlg, IDT_PREVIEW_REFRESH, 400, NULL );',
		'\t\t\t}',
		'\t\t}',
	].join( '\r\n' );
	if( !s.includes( aA ) )  fail( 'EVENT_CHANGE anchor not found' );
	const nwA = [
		'\t\tif( nEvent & EVENT_CHANGE ){',
		'\t\t\t// every buffer modification re-arms the debounce; one Web-bar',
		'\t\t\t// re-navigation fires when the typing pauses. Only while the',
		'\t\t\t// pane is REALLY open: a pane closed from its own UI is never',
		'\t\t\t// re-opened by typing',
		'\t\t\tif( m_hDlg && IsOfficialPaneVisible() ){',
		'\t\t\t\tSetTimer( m_hDlg, IDT_PREVIEW_REFRESH, 1000, NULL );',
		'\t\t\t}',
		'\t\t}',
	].join( '\r\n' );
	s = s.replace( aA, nwA );

	// B: doc switch / config change / file open also re-renders the pane
	const aB = '\t\t\tm_iModeOverride = -1;\r\n\t\t\tint iNewMode = DetectMode();';
	if( !s.includes( aB ) )  fail( 'doc-switch anchor not found' );
	s = s.replace( aB, aB + '\r\n\t\t\tif( m_hDlg && IsOfficialPaneVisible() ){\r\n\t\t\t\tSetTimer( m_hDlg, IDT_PREVIEW_REFRESH, 1000, NULL );\t// the pane follows the document\r\n\t\t\t}' );

	// C: OnPreviewAutoRefresh after OnWebBarRetryTimer
	const aC = '\t\tif( m_sPendingMacro.empty() && m_hDlg ){\r\n\t\t\tKillTimer( m_hDlg, IDT_WEBBAR_RETRY );\r\n\t\t}\r\n\t}\r\n\r\n\t// render the CURRENT buffer';
	if( !s.includes( aC ) )  fail( 'OnWebBarRetryTimer tail anchor not found' );
	const nwC = [
		'\t\tif( m_sPendingMacro.empty() && m_hDlg ){',
		'\t\t\tKillTimer( m_hDlg, IDT_WEBBAR_RETRY );',
		'\t\t}\r\n\t}',
		'',
		'\t// the typing-pause debounce fired: re-render the CURRENT buffer and',
		'\t// re-navigate the Web bar through the proven macro path (the pane',
		'\t// check happens at the event sites - a closed pane is never reopened)',
		'\tvoid OnPreviewAutoRefresh()',
		'\t{',
		'\t\tif( !IsOfficialPaneVisible() ){',
		'\t\t\treturn;',
		'\t\t}',
		'\t\tOpenWebBarPreview();',
		'\t}\r\n\r\n\t// render the CURRENT buffer',
	].join( '\r\n' );
	s = s.replace( aC, nwC );

	// D: timer branch after the WEBBAR_RETRY branch
	const aD = [
		'\t\t\telse if( wParam == IDT_WEBBAR_RETRY ){',
		'\t\t\t\tCMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));',
		'\t\t\t\tif( pFrame ){',
		'\t\t\t\t\tpFrame->OnWebBarRetryTimer();',
		'\t\t\t\t}',
		'\t\t\t\treturn 0;',
		'\t\t\t}',
	].join( '\r\n' );
	if( !s.includes( aD ) )  fail( 'timer branch anchor not found' );
	const nwD = aD + '\r\n' + [
		'\t\t\telse if( wParam == IDT_PREVIEW_REFRESH ){',
		'\t\t\t\tKillTimer( hwnd, IDT_PREVIEW_REFRESH );',
		'\t\t\t\tCMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));',
		'\t\t\t\tif( pFrame ){',
		'\t\t\t\t\tpFrame->OnPreviewAutoRefresh();',
		'\t\t\t\t}',
		'\t\t\t\treturn 0;',
		'\t\t\t}',
	].join( '\r\n' );
	s = s.replace( aD, nwD );

	// E: GetDocTextAll — clipboard save/restore
	const aE1 = '\t\t// The user\'s selection/caret is saved first and restored at the end\r\n\t\tPOINT_PTR ptSaveA = { -1, -1 }, ptSaveB = { -1, -1 };';
	if( !s.includes( aE1 ) )  fail( 'GetDocTextAll head anchor not found' );
	const nwE1 = [
		'\t\t// The user\'s selection/caret is saved first and restored at the end.',
		'\t\t// The CLIPBOARD text is saved too and restored at the end: the',
		'\t\t// SelectAll+Copy below clobbers it, and auto-refresh fires while',
		'\t\t// the user is editing (other clipboard formats are lost either',
		'\t\t// way - Copy replaces everything - but the text comes back)',
		'\t\ttstring sClipSave;',
		'\t\tif( OpenClipboard( m_hWnd ) ){',
		'\t\t\tHANDLE hClip = GetClipboardData( CF_UNICODETEXT );',
		'\t\t\tif( hClip ){',
		'\t\t\t\tLPCWSTR pClip = (LPCWSTR)GlobalLock( hClip );',
		'\t\t\t\tif( pClip ){',
		'\t\t\t\t\tsClipSave = pClip;',
		'\t\t\t\t\tGlobalUnlock( hClip );',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t\tCloseClipboard();',
		'\t\t}',
		'\t\tPOINT_PTR ptSaveA = { -1, -1 }, ptSaveB = { -1, -1 };',
	].join( '\r\n' );
	s = s.replace( aE1, nwE1 );

	const aE2 = '? TRUE : FALSE );\r\n\t\treturn bOK;\r\n\t}\r\n\r\n\tvoid ServeBufferResponse';
	if( !s.includes( aE2 ) )  fail( 'GetDocTextAll tail anchor not found' );
	const nwE2 = [
		'? TRUE : FALSE );',
		'\t\t// restore the user\'s clipboard text (we are the owner now; other',
		'\t\t// formats were already destroyed by the Copy above)',
		'\t\tif( !sClipSave.empty() && OpenClipboard( m_hWnd ) ){',
		'\t\t\tEmptyClipboard();',
		'\t\t\tHGLOBAL hClipNew = GlobalAlloc( GMEM_MOVEABLE, ( sClipSave.size() + 1 ) * sizeof( WCHAR ) );',
		'\t\t\tif( hClipNew ){',
		'\t\t\t\tLPVOID pClipNew = GlobalLock( hClipNew );',
		'\t\t\t\tif( pClipNew ){',
		'\t\t\t\t\tCopyMemory( pClipNew, sClipSave.c_str(), ( sClipSave.size() + 1 ) * sizeof( WCHAR ) );',
		'\t\t\t\t\tGlobalUnlock( hClipNew );',
		'\t\t\t\t\tSetClipboardData( CF_UNICODETEXT, hClipNew );\t// system owns it on success',
		'\t\t\t\t}',
		'\t\t\t\telse {',
		'\t\t\t\t\tGlobalFree( hClipNew );',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t\tCloseClipboard();',
		'\t\t}\r\n\t\treturn bOK;\r\n\t}\r\n\r\n\tvoid ServeBufferResponse',
	].join( '\r\n' );
	s = s.replace( aE2, nwE2 );

	// F: remove the refresh button from the default arrays
	const aF1 = '\r\n\t{ 50, CMD_REFRESH_PREVIEW, ID_REFRESH_PREVIEW, L"", L"" },';
	if( !s.includes( aF1 ) )  fail( 'HTML refresh button anchor not found' );
	s = s.replace( aF1, '' );
	const aF2 = '\r\n\t{ 23, CMD_REFRESH_PREVIEW, L"Refresh Preview", L"", L"", 0, 0 },';
	if( !s.includes( aF2 ) )  fail( 'MD refresh button anchor not found' );
	s = s.replace( aF2, '' );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,32,0,0' ) )  fail( 'rc does not read 0,32,0,0' );
	s = s.split( '0,32,0,0' ).join( '0,33,0,0' );
	s = s.split( '0.32.0' ).join( '0.33.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.32\.0"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.32.0' );
	s = s.replace( re, 'IDS_VERSION$1"0.33.0"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
