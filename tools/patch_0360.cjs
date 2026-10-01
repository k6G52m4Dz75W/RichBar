// 0.36.0 patch: the Markdown preview font follows the EDITOR text font
// - EI_GET_VIEW_FONT (382, v20.5+, returns the view's real HFONT; local
//   define since the vendored header predates it) -> GetObjectW -> face
//   name + size + weight/italic -> the preview body CSS uses them
// - device px -> CSS px via the doc DPI (WebView2 scales CSS px by DPI)
// - version 0.35.0 -> 0.36.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'EI_GET_VIEW_FONT' ) )  fail( 'already patched' );

	// A: local define
	const aA = [
		'#ifndef MACRO_LANG_V8',
		'#define MACRO_LANG_V8\t\t\t2\t\t// EE_RUN_MACRO: EmEditor built-in V8 engine (no COM registration)',
		'#endif',
	].join( '\r\n' );
	if( !s.includes( aA ) )  fail( 'V8 define anchor not found' );
	s = s.replace( aA, aA + '\r\n' + [
		'#ifndef EI_GET_VIEW_FONT',
		'#define EI_GET_VIEW_FONT\t\t382\t// EE_INFO: returns the editor view text HFONT (v20.5+)',
		'#endif',
	].join( '\r\n' ) );

	// B: dynamic preview font in the MD branch
	const aB = [
		'\t\t\tRbLogF( "theme: view back=%S fg=%S light=%d", szBack, szFg, (int)bLight );',
		'\t\t\tsHtml = L"<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><style>";',
		'\t\t\tsHtml += L"body{font-family:Segoe UI,Arial,sans-serif;margin:24px;line-height:1.6;color:";',
	].join( '\r\n' );
	if( !s.includes( aB ) )  fail( 'MD head anchor not found' );
	const nwB = [
		'\t\t\tRbLogF( "theme: view back=%S fg=%S light=%d", szBack, szFg, (int)bLight );',
		'\t\t\t// the preview font follows the EDITOR text font: EI_GET_VIEW_FONT',
		'\t\t\t// returns the view\'s real HFONT (face/size/weight/italic live in it)',
		'\t\t\tHFONT hViewFont = (HFONT)Editor_Info( m_hWnd, EI_GET_VIEW_FONT, 0 );',
		'\t\t\tLOGFONTW lfView;',
		'\t\t\tZeroMemory( &lfView, sizeof( lfView ) );',
		'\t\t\tconst bool bFont = hViewFont && GetObjectW( hViewFont, sizeof( lfView ), &lfView ) == sizeof( lfView ) && lfView.lfFaceName[ 0 ];',
		'\t\t\tsHtml = L"<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><style>";',
		'\t\t\tif( bFont ){',
		'\t\t\t\tint nHeight = lfView.lfHeight;',
		'\t\t\t\tif( nHeight < 0 )  nHeight = -nHeight;',
		'\t\t\t\telse if( nHeight > 0 )  nHeight = MulDiv( nHeight, 4, 5 );\t// cell height -> approx em',
		'\t\t\t\tint nDpi = (int)Editor_DocInfo( m_hWnd, 0, EI_GET_DPI, 0 );',
		'\t\t\t\tif( nDpi <= 0 )  nDpi = 96;',
		'\t\t\t\tint nPx = MulDiv( nHeight, 96, nDpi );\t// device px -> CSS px',
		'\t\t\t\tif( nPx < 9 )  nPx = 9;',
		'\t\t\t\tTCHAR szCss[ 256 ];',
		'\t\t\t\twsprintf( szCss, _T("body{font-family:\'%s\',Segoe UI,Arial,sans-serif;font-size:%dpx;"), (LPCWSTR)lfView.lfFaceName, (unsigned)nPx );',
		'\t\t\t\tsHtml += szCss;',
		'\t\t\t\tif( lfView.lfWeight >= FW_BOLD )  sHtml += L"font-weight:bold;";',
		'\t\t\t\tif( lfView.lfItalic )  sHtml += L"font-style:italic;";',
		'\t\t\t\tsHtml += L"line-height:1.6;margin:24px;color:";',
		'\t\t\t}',
		'\t\t\telse {',
		'\t\t\t\tsHtml += L"body{font-family:Segoe UI,Arial,sans-serif;margin:24px;line-height:1.6;color:";',
		'\t\t\t}',
	].join( '\r\n' );
	s = s.replace( aB, nwB );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,35,0,0' ) )  fail( 'rc does not read 0,35,0,0' );
	s = s.split( '0,35,0,0' ).join( '0,36,0,0' );
	s = s.split( '0.35.0' ).join( '0.36.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.35\.0"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.35.0' );
	s = s.replace( re, 'IDS_VERSION$1"0.36.0"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
