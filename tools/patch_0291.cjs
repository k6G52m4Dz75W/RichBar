// 0.29.1 patch:
// - EE_RUN_MACRO fixed: nFlags=RUN_TEXT (+MACRO_SYNC_ONLY); 0 = no source -> E_FAIL
// - CMD_PREVIEW: three stacked duplicate branches -> ONE WebBar-based branch
// - CMD_REFRESH_PREVIEW body -> shared OpenWebBarPreview()
// - startup/doc-switch 23275 preview posts removed (obsolete official-pane model)
// - log %s -> %S for wide strings (single-char truncation fix)
// - version 0.29.0 -> 0.29.1 (rc + IDS_VERSION)
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }
function cut( s, i ){ return s.slice( 0, i ); }

// ---------- RichBar.h (utf8, CRLF) ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'OpenWebBarPreview' ) )  fail( 'RichBar.h already patched' );

	// --- A: RUN_TEXT / MACRO_SYNC_ONLY defines after EEID_MARKDOWN_PREVIEW ---
	const aA = '#define EEID_MARKDOWN_PREVIEW';
	const iA = s.indexOf( aA );
	if( iA < 0 )  fail( 'EEID_MARKDOWN_PREVIEW anchor not found' );
	const iAeol = s.indexOf( '\r\n', iA );
	if( iAeol < 0 )  fail( 'EEID_MARKDOWN_PREVIEW line end not found' );
	const defines = '\r\n' + [
		'#ifndef RUN_TEXT',
		'#define RUN_TEXT\t\t\t\t1\t\t// EE_RUN_MACRO: pszText is the macro source',
		'#endif',
		'#ifndef MACRO_SYNC_ONLY',
		'#define MACRO_SYNC_ONLY\t\t\t0x00000200\t// EE_RUN_MACRO: run synchronously',
		'#endif',
	].join( '\r\n' );
	s = cut( s, iAeol ) + defines + s.slice( iAeol );

	// --- B: helpers before WritePreviewHtml ---
	const aB = '\tvoid WritePreviewHtml()\r\n';
	const iB = s.indexOf( aB );
	if( iB < 0 )  fail( 'WritePreviewHtml anchor not found' );
	const helpers = [
		'\t// run an in-memory JScript macro through EE_RUN_MACRO (no temp file).',
		'\t// nFlags MUST be RUN_TEXT: 0 selects no source and EmEditor fails the',
		'\t// whole call with E_FAIL (0x80004005 in the 0.29.0 log)',
		'\tHRESULT RunWebBarMacro( const TCHAR* pszMacro )',
		'\t{',
		'\t\tRUN_MACRO_INFO rmi;',
		'\t\tZeroMemory( &rmi, sizeof( rmi ) );',
		'\t\trmi.cbSize = sizeof( rmi );',
		'\t\trmi.nFlags = RUN_TEXT;',
		'\t\trmi.pszText = pszMacro;',
		'\t\trmi.nDefMacroLang = MACRO_LANG_JSCRIPT | MACRO_SYNC_ONLY;',
		'\t\trmi.ptErrorPos.x = rmi.ptErrorPos.y = -1;',
		'\t\tHRESULT hr = (HRESULT)SendMessage( m_hWnd, EE_RUN_MACRO, 0, (LPARAM)&rmi );',
		'\t\tRbLogF( "webbar macro hr=0x%08X: %S", (unsigned)hr, pszMacro );',
		'\t\treturn hr;',
		'\t}',
		'',
		'\t// render the CURRENT buffer into the stable preview file and navigate',
		'\t// the built-in Web bar to it via the WebBar macro object; the ?t= stamp',
		'\t// makes every URL unique so the browser cannot show a cached page',
		'\tvoid OpenWebBarPreview()',
		'\t{',
		'\t\tWritePreviewHtml();',
		'\t\tTCHAR szPath[ MAX_PATH ];',
		'\t\tGetTempPath( MAX_PATH, szPath );',
		'\t\tStringCat( szPath, MAX_PATH, _T("RichBarPreview.html") );',
		'\t\tfor( LPTSTR p = szPath; *p; p++ ){',
		'\t\t\tif( *p == _T(\'\\\\\') )  *p = _T(\'/\');',
		'\t\t}',
		'\t\ttstring sUrl = _T("file:///");',
		'\t\tUrlAppendEncoded( sUrl, szPath, true );',
		'\t\tTCHAR szTick[ 32 ];',
		'\t\twsprintf( szTick, _T("?t=%u"), GetTickCount() );',
		'\t\tsUrl += szTick;',
		'\t\ttstring sMacro = _T("WebBar.Visible = true; WebBar.Open( \\"");',
		'\t\tsMacro += sUrl;',
		'\t\tsMacro += _T("\\" );");',
		'\t\tRunWebBarMacro( sMacro.c_str() );',
		'\t}',
		'',
		'\tvoid WritePreviewHtml()\r\n',
	].join( '\r\n' );
	s = cut( s, iB ) + helpers + s.slice( iB + aB.length );	// helpers already ends with the anchor+eol

	// --- C: three stacked CMD_PREVIEW branches -> one ---
	const aC = '\t\t\telse if( cmd.m_iCmd == CMD_PREVIEW ){';
	const iC = s.indexOf( aC );
	if( iC < 0 )  fail( 'first CMD_PREVIEW branch not found' );
	const aCend = '\t\t\t\telse if( cmd.m_iCmd == CMD_REFRESH_PREVIEW ){';
	const iCend = s.indexOf( aCend, iC );
	if( iCend < 0 )  fail( 'refresh branch anchor (chain end) not found' );
	const newPreview = [
		'\t\t\telse if( cmd.m_iCmd == CMD_PREVIEW ){',
		'\t\t\t\t// preview = the built-in Web bar showing OUR rendered snapshot.',
		'\t\t\t\t// our own WebView2 pane never rendered inside EmEditor\'s',
		'\t\t\t\t// process, and the official pane only shows saved-file',
		'\t\t\t\t// snapshots - the WebBar macro object drives the built-in pane',
		'\t\t\t\tbool bWant = ( SendMessage( m_hwndToolbar, TB_GETSTATE, wParam, 0 ) & TBSTATE_CHECKED ) != 0;',
		'\t\t\t\tm_bPreviewOn = bWant;',
		'\t\t\t\tSaveProfile();',
		'\t\t\t\tApplyToggleStates();',
		'\t\t\t\tRbLogF( "preview click: want=%d -> webbar", (int)bWant );',
		'\t\t\t\tif( bWant ){',
		'\t\t\t\t\tOpenWebBarPreview();',
		'\t\t\t\t}',
		'\t\t\t\telse {',
		'\t\t\t\t\tRunWebBarMacro( _T("WebBar.Visible = false;") );',
		'\t\t\t\t}',
		'\t\t\t}',
		'',
	].join( '\r\n' );
	s = cut( s, iC ) + newPreview + s.slice( iCend );

	// --- D: refresh branch body -> shared helper ---
	const aD = '\t\t\t\telse if( cmd.m_iCmd == CMD_REFRESH_PREVIEW ){';
	const iD = s.indexOf( aD );
	if( iD < 0 )  fail( 'refresh branch not found' );
	const aDend = 'RbLogF( "webbar open hr=0x%08X: %s", (unsigned)hrMacro, sUrl.c_str() );';
	const iDend = s.indexOf( aDend, iD );
	if( iDend < 0 )  fail( 'refresh branch old log anchor not found' );
	const newRefresh = [
		'\t\t\t\telse if( cmd.m_iCmd == CMD_REFRESH_PREVIEW ){',
		'\t\t\t\t\t// same path as the preview-on click: re-render the buffer',
		'\t\t\t\t\t// and re-navigate the built-in Web bar (fresh content)',
		'\t\t\t\t\tOpenWebBarPreview();',
	].join( '\r\n' );
	s = cut( s, iD ) + newRefresh + s.slice( iDend + aDend.length );

	// --- E: startup restore drops the 23275 preview post ---
	const aE = [
		'\t\tif( m_bPreviewOn && !IsOfficialPaneVisible() ){',
		'\t\t\tRbLogF( "startup restore: preview (mode=%d) -> official 23275", m_iMode );',
		'\t\t\tPostMessage( m_hWnd, WM_COMMAND, MAKEWPARAM( EEID_MARKDOWN_PREVIEW, 0 ), 0 );',
		'\t\t}',
		'\t\tSyncPreviewToPane();\t// EmEditor may have restored the pane itself; align the button',
	].join( '\r\n' );
	if( !s.includes( aE ) )  fail( 'startup restore block not found' );
	const newStartup = [
		'\t\t// preview starts OFF: the Web-bar snapshot is per-click, there is',
		'\t\t// nothing meaningful to restore across sessions',
		'\t\tm_bPreviewOn = false;',
		'\t\tApplyToggleStates();',
	].join( '\r\n' );
	s = s.replace( aE, newStartup );

	// --- F: doc-switch reconcile drops the 23275 post ---
	const aF = [
		'\t\t\t{',
		'\t\t\t\tbool bWant = IsPreviewDocOn();',
		'\t\t\t\tbool bPane = IsOfficialPaneVisible();',
		'\t\t\t\tm_bPreviewOn = bWant;',
		'\t\t\t\tif( bWant != bPane ){',
		'\t\t\t\t\tRbLogF( "doc switch: preview want=%d pane=%d -> 23275", (int)bWant, (int)bPane );',
		'\t\t\t\t\tPostMessage( m_hWnd, WM_COMMAND, MAKEWPARAM( EEID_MARKDOWN_PREVIEW, 0 ), 0 );',
		'\t\t\t\t}',
		'\t\t\t}',
	].join( '\r\n' );
	if( !s.includes( aF ) )  fail( 'doc-switch preview block not found' );
	const newDocSwitch = [
		'\t\t\t// preview is a manual snapshot in the Web bar now: a doc switch',
		'\t\t\t// leaves the pane content until the next refresh/preview click',
	].join( '\r\n' );
	s = s.replace( aF, newDocSwitch );

	// --- G: wide-string log fixes in WritePreviewHtml ---
	s = s.split( 'RbLogF( "preview write FAILED (%s)", szPath );' ).join( 'RbLogF( "preview write FAILED (%S)", szPath );' );
	s = s.split( 'RbLogF( "preview write: %u bytes -> %s", (unsigned)cbW, szPath );' ).join( 'RbLogF( "preview write: %u bytes -> %S", (unsigned)cbW, szPath );' );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,29,0,0' ) )  fail( 'rc does not read 0,29,0,0' );
	s = s.split( '0,29,0,0' ).join( '0,29,1,0' );
	s = s.split( '0.29.0' ).join( '0.29.1' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.29\.0"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.29.0' );
	s = s.replace( re, 'IDS_VERSION$1"0.29.1"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
