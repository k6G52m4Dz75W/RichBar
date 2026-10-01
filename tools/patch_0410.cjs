// 0.41.0 patch: user-defined preview CSS theme
// - convention: %APPDATA%\Emurasoft\EmEditor\RichBar\preview.css
// - if present, appended as a SECOND <style> after the built-in theme
//   (user rules override; unset properties keep the built-in behavior)
// - absent -> unchanged (zero-config default)
// - logged once per render: "user css: <path or absent>"
// - version 0.40.1 -> 0.41.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'preview.css' ) )  fail( 'already patched' );

	const aA = '\t\t\tsHtml += L"</style></head><body>";';
	if( !s.includes( aA ) )  fail( 'style-close anchor not found' );
	const nwA = [
		'\t\t\tsHtml += L"</style>";',
		'\t\t\t// USER THEME: %APPDATA%\\Emurasoft\\EmEditor\\RichBar\\preview.css',
		'\t\t\t// is appended AFTER the built-in styles, so its rules override',
		'\t\t\t// them; absent file -> the built-in theme stands alone',
		'\t\t\t{',
		'\t\t\t\tTCHAR szCss[ MAX_PATH ];',
		'\t\t\t\tif( SUCCEEDED( SHGetFolderPathW( NULL, CSIDL_APPDATA, NULL, 0, szCss ) ) ){',
		'\t\t\t\t\twcscat_s( szCss, MAX_PATH, L"\\\\Emurasoft\\\\EmEditor\\\\RichBar" );',
		'\t\t\t\t\tSHCreateDirectoryExW( NULL, szCss, NULL );\t// no-op if exists',
		'\t\t\t\t\twcscat_s( szCss, MAX_PATH, L"\\\\preview.css" );',
		'\t\t\t\t\tsHtml += L"<style>";',
		'\t\t\t\t\tFILE* fCss = _wfopen( szCss, L"rb" );',
		'\t\t\t\t\tif( fCss ){',
		'\t\t\t\t\t\tTCHAR szLine[ 2048 ];',
		'\t\t\t\t\t\twhile( fgetws( szLine, _countof( szLine ), fCss ) ){',
		'\t\t\t\t\t\t\t// escape & and < so raw CSS cannot close the tag',
		'\t\t\t\t\t\t\tfor( TCHAR* q = szLine; *q; q++ ){',
		'\t\t\t\t\t\t\t\tif( *q == L\'&\' )  sHtml += L"&amp;";',
		'\t\t\t\t\t\t\t\telse if( *q == L\'<\' )  sHtml += L"&lt;";',
		'\t\t\t\t\t\t\t\telse  sHtml += *q;',
		'\t\t\t\t\t\t\t}',
		'\t\t\t\t\t\t}',
		'\t\t\t\t\t\tfclose( fCss );',
		'\t\t\t\t\t\tRbLogF( "user css: %S", szCss );',
		'\t\t\t\t\t}',
		'\t\t\t\t\telse {',
		'\t\t\t\t\t\tRbLogF( "user css: absent" );',
		'\t\t\t\t\t}',
		'\t\t\t\t\tsHtml += L"</style>";',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t\tsHtml += L"</head><body>";',
	].join( '\r\n' );
	s = s.replace( aA, nwA );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,40,1,0' ) )  fail( 'rc does not read 0,40,1,0' );
	s = s.split( '0,40,1,0' ).join( '0,41,0,0' );
	s = s.split( '0.40.1' ).join( '0.41.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.40\.1"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.40.1' );
	s = s.replace( re, 'IDS_VERSION$1"0.41.0"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
