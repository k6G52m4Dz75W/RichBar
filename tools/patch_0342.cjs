// 0.34.2 patch: fix the INVERTED pane-walk condition (0.33.2 regression)
// "if( Chrome_ mismatch )" accepted the FIRST NON-Chrome child (logged:
// msctls_statusbar32) -> IsOfficialPaneVisible() was always true ->
// auto-refresh opened the pane during startup and displaced the
// session-restore panel, and re-opened panes the user had closed.
// version 0.34.1 -> 0.34.2
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'keep walking' ) )  fail( 'already patched' );

	const aA = [
		'\t\tif( wcsncmp( szCls, L"Chrome_", 7 ) != 0 ){',
		'\t\t\t*(HWND*)lParam = hwnd;',
		'\t\t\treturn FALSE;',
		'\t\t}',
	].join( '\r\n' );
	if( !s.includes( aA ) )  fail( 'inverted condition anchor not found' );
	const nwA = [
		'\t\tif( wcsncmp( szCls, L"Chrome_", 7 ) != 0 ){',
		'\t\t\treturn TRUE;\t// not a WebView2 window: keep walking',
		'\t\t}',
		'\t\t*(HWND*)lParam = hwnd;',
		'\t\treturn FALSE;',
	].join( '\r\n' );
	s = s.replace( aA, nwA );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,34,1,0' ) )  fail( 'rc does not read 0,34,1,0' );
	s = s.split( '0,34,1,0' ).join( '0,34,2,0' );
	s = s.split( '0.34.1' ).join( '0.34.2' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.34\.1"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.34.1' );
	s = s.replace( re, 'IDS_VERSION$1"0.34.2"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
