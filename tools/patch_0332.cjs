// 0.33.2 patch: simplify the pane walk (user directive: no legacy class
// compatibility - the preview never worked before 0.29.x, so only the
// current v26 matters)
// - FindOfficialPaneProc: Chrome_* (WebView2 browser child) is the ONLY
//   signature - it is what the pane actually is, not a class-name guess
// - IsOfficialPaneVisible: log the hit class once per session so the real
//   pane window name gets pinned in the log
// - version 0.33.1 -> 0.33.2
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'pane walk: hit class' ) )  fail( 'already patched' );

	const aA = [
		'\t\t// the class name drifted between EmEditor versions (the old match',
		'\t\t// was EmEditorWebPreview2 and the v26 Web bar pane no longer uses',
		'\t\t// it), so accept any EmEditorWeb* class AND any Chrome_* WebView2',
		'\t\t// window - the browser child is the signature every variant shares',
		'\t\tif( wcsncmp( szCls, L"EmEditorWeb", 11 ) == 0 ||',
		'\t\t\twcsncmp( szCls, L"Chrome_", 7 ) == 0 ){',
	].join( '\r\n' );
	if( !s.includes( aA ) )  fail( 'FindOfficialPaneProc match anchor not found' );
	const nwA = [
		'\t\t// the pane hosts a WebView2 browser: its Chrome_* windows are the',
		'\t\t// signature that identifies it, regardless of the host class name',
		'\t\t// (window class names drift between EmEditor versions)',
		'\t\tif( wcsncmp( szCls, L"Chrome_", 7 ) != 0 ){',
	].join( '\r\n' );
	s = s.replace( aA, nwA );

	const aB = [
		'\tbool IsOfficialPaneVisible()',
		'\t{',
		'\t\tHWND hwndPane = NULL;',
		'\t\tEnumChildWindows( m_hWnd, FindOfficialPaneProc, (LPARAM)&hwndPane );',
		'\t\treturn hwndPane != NULL;',
		'\t}',
	].join( '\r\n' );
	if( !s.includes( aB ) )  fail( 'IsOfficialPaneVisible anchor not found' );
	const nwB = [
		'\tbool IsOfficialPaneVisible()',
		'\t{',
		'\t\tHWND hwndPane = NULL;',
		'\t\tEnumChildWindows( m_hWnd, FindOfficialPaneProc, (LPARAM)&hwndPane );',
		'\t\t// log the pane\'s real window class once: pins the actual name',
		'\t\tstatic bool s_bWalkLogged = false;',
		'\t\tif( hwndPane && !s_bWalkLogged ){',
		'\t\t\ts_bWalkLogged = true;',
		'\t\t\tWCHAR szCls[ 64 ];',
		'\t\t\tGetClassNameW( hwndPane, szCls, _countof( szCls ) );',
		'\t\t\tRbLogF( "pane walk: hit class %S", szCls );',
		'\t\t}',
		'\t\treturn hwndPane != NULL;',
		'\t}',
	].join( '\r\n' );
	s = s.replace( aB, nwB );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,33,1,0' ) )  fail( 'rc does not read 0,33,1,0' );
	s = s.split( '0,33,1,0' ).join( '0,33,2,0' );
	s = s.split( '0.33.1' ).join( '0.33.2' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.33\.1"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.33.1' );
	s = s.replace( re, 'IDS_VERSION$1"0.33.2"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
