// 0.43.0 patch: CSS-variable bridge so the shipped VS Code themes render
// with OUR theme (colors/font), dark/light automatic
// - the bridge <style>:root{...}> is injected right before </head> in the
//   MD branch; it defines the --markdown-* and --vscode-* variables
//   vscode-markdown.css consumes (editor back/fore, code-block background,
//   widget border, editor font stack) plus --markdown-font-family/-size
//   mapped from the editor text font
// - harmless for other themes (variables simply unused)
// - version 0.42.1 -> 0.43.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( '--vscode-editor-background' ) )  fail( 'already patched' );

	const aA = '\t\t\tsHtml += L"</head><body>";';
	const iA = s.indexOf( aA );
	if( iA < 0 )  fail( 'head-close anchor not found' );
	const nwA = [
		'\t\t\t// bridge: CSS variables consumed by the shipped VS Code themes',
		'\t\t\t// (themes\\vscode-markdown.css), mapped to the editor theme -',
		'\t\t\t// other/user themes simply ignore them',
		'\t\t\tsHtml += L"<style>:root{";',
		'\t\t\tif( bFont ){',
		'\t\t\t\tint nHeight = lfView.lfHeight;',
		'\t\t\t\tif( nHeight < 0 )  nHeight = -nHeight;',
		'\t\t\t\telse if( nHeight > 0 )  nHeight = MulDiv( nHeight, 4, 5 );',
		'\t\t\t\tint nDpi = (int)Editor_DocInfo( m_hWnd, 0, EI_GET_DPI, 0 );',
		'\t\t\t\tif( nDpi <= 0 )  nDpi = 96;',
		'\t\t\t\tint nPx = MulDiv( nHeight, 96, nDpi );',
		'\t\t\t\tif( nPx < 9 )  nPx = 9;',
		'\t\t\t\tTCHAR szVar[ 384 ];',
		'\t\t\t\twsprintf( szVar, L"--markdown-font-family:\'%s\',\'Microsoft YaHei\',Segoe UI,Arial,sans-serif;--markdown-font-size:%dpx;", (LPCWSTR)lfView.lfFaceName, (unsigned)nPx );',
		'\t\t\t\tsHtml += szVar;',
		'\t\t\t}',
		'\t\t\tsHtml += L"--markdown-line-height:1.6;";',
		'\t\t\tTCHAR szThemeVar[ 192 ];',
		'\t\t\twsprintf( szThemeVar, L"--vscode-editor-background:%s;--vscode-editor-foreground:%s;", szBack, szFg );',
		'\t\t\tsHtml += szThemeVar;',
		'\t\t\tsHtml += bLight',
		'\t\t\t\t? L"--vscode-textCodeBlock-background:#f6f6f6;--vscode-widget-border:#ccc;--vscode-editor-font-family:Consolas,monospace;}"',
		'\t\t\t\t: L"--vscode-textCodeBlock-background:#2d2d30;--vscode-widget-border:#555;--vscode-editor-font-family:Consolas,monospace;}"',
		'\t\t\tsHtml += L"</style>";',
		'\t\t\tsHtml += L"</head><body>";',
	].join( '\r\n' );
	s = s.slice( 0, iA ) + nwA + s.slice( iA + aA.length );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,42,1,0' ) )  fail( 'rc does not read 0,42,1,0' );
	s = s.split( '0,42,1,0' ).join( '0,43,0,0' );
	s = s.split( '0.42.1' ).join( '0.43.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc version (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[ 0 ] !== 0xFF || buf[ 1 ] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.42\.1"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.42.1' );
	s = s.replace( re, 'IDS_VERSION$1"0.43.0"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
