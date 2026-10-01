// 0.33.1 patch: fix the pane-presence walk (auto-refresh was dead because
// the guard never matched)
// - FindOfficialPaneProc: the v26 Web bar pane does NOT have the old
//  "EmEditorWebPreview2" class ("pane sync: visible=0" while open). Accept
//  any EmEditorWeb* class AND any Chrome_* (WebView2 browser) descendant —
//  the browser windows are the signature every variant shares.
// - diagnostic log after the pane-opening macro: "pane walk after open"
// - version 0.33.0 -> 0.33.1
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'pane walk after open' ) )  fail( 'already patched' );

	const aA = [
		'\tstatic BOOL CALLBACK FindOfficialPaneProc( HWND hwnd, LPARAM lParam )',
		'\t{',
		'\t\tWCHAR szCls[32];',
		'\t\tif( GetClassNameW( hwnd, szCls, _countof( szCls ) ) == 0 ||',
		'\t\t\tlstrcmpW( szCls, L"EmEditorWebPreview2" ) != 0 ){',
		'\t\t\treturn TRUE;',
		'\t\t}',
		'\t\t*(HWND*)lParam = hwnd;',
		'\t\treturn FALSE;',
		'\t}',
	].join( '\r\n' );
	if( !s.includes( aA ) )  fail( 'FindOfficialPaneProc anchor not found' );
	const nwA = [
		'\tstatic BOOL CALLBACK FindOfficialPaneProc( HWND hwnd, LPARAM lParam )',
		'\t{',
		'\t\tWCHAR szCls[ 64 ];',
		'\t\tif( GetClassNameW( hwnd, szCls, _countof( szCls ) ) == 0 ){',
		'\t\t\treturn TRUE;',
		'\t\t}',
		'\t\t// the class name drifted between EmEditor versions (the old match',
		'\t\t// was EmEditorWebPreview2 and the v26 Web bar pane no longer uses',
		'\t\t// it), so accept any EmEditorWeb* class AND any Chrome_* WebView2',
		'\t\t// window - the browser child is the signature every variant shares',
		'\t\tif( wcsncmp( szCls, L"EmEditorWeb", 11 ) == 0 ||',
		'\t\t\twcsncmp( szCls, L"Chrome_", 7 ) == 0 ){',
		'\t\t\t*(HWND*)lParam = hwnd;',
		'\t\t\treturn FALSE;',
		'\t\t}',
		'\t\treturn TRUE;',
		'\t}',
	].join( '\r\n' );
	s = s.replace( aA, nwA );

	// B: walk diagnostic after the pane-opening macro
	const aB = '\t\tRunWebBarMacroStaged( sMacro.c_str() );\r\n\t}';
	if( !s.includes( aB ) )  fail( 'OpenWebBarPreview tail anchor not found' );
	s = s.replace( aB, '\t\tRunWebBarMacroStaged( sMacro.c_str() );\r\n\t\tRbLogF( "pane walk after open: visible=%d", (int)IsOfficialPaneVisible() );\r\n\t}' );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,33,0,0' ) )  fail( 'rc does not read 0,33,0,0' );
	s = s.split( '0,33,0,0' ).join( '0,33,1,0' );
	s = s.split( '0.33.0' ).join( '0.33.1' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.33\.0"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.33.0' );
	s = s.replace( re, 'IDS_VERSION$1"0.33.1"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
