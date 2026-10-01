// 0.30.0 patch: preview page palette follows the editor theme
// - EI_GET_BAR_BACK_COLOR / EI_GET_BAR_TEXT_COLOR -> exact chrome colors
// - EI_IS_VERY_DARK heuristic fallback; light/dark accents for pre,
//   blockquote, hr and links
// - version 0.29.3 -> 0.30.0 (rc + IDS_VERSION)
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'theme: back=%S' ) )  fail( 'already patched' );

	const aA = [
		'\t\ttstring sHtml = L"<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><style>";',
		'\t\tsHtml += L"body{font-family:Segoe UI,Arial,sans-serif;margin:24px;line-height:1.6;color:#222;background:#fff;}";',
		'\t\tsHtml += L"h1{font-size:2em;} h2{font-size:1.5em;} h3,h4,h5,h6{font-size:1.2em;}";',
		'\t\tsHtml += L"pre,code{font-family:Consolas,monospace;} pre{background:#f6f6f6;padding:12px;border-radius:5px;white-space:pre-wrap;}";',
		'\t\tsHtml += L"blockquote{border-left:4px solid #ddd;margin:8px 0;padding:4px 16px;color:#555;}";',
		'\t\tsHtml += L"li{margin:2px 0;} hr{border:0;border-top:1px solid #ccc;}";',
		'\t\tsHtml += L"</style></head><body>";',
	].join( '\r\n' );
	if( !s.includes( aA ) )  fail( 'style block anchor not found' );

	const nwA = [
		'\t\t// match the page palette to the editor theme: the plug-in bar',
		'\t\t// background is the exact chrome color and the foreground flips',
		'\t\t// with its luminance (bar colors stay PINNED until relaunch - the',
		'\t\t// upstream dark<->light stickiness - so the page matches the',
		'\t\t// theme as of the render)',
		'\t\tCOLORREF crBack = GetBarBackColor();',
		'\t\tbool bLight = ( 299 * GetRValue( crBack ) + 587 * GetGValue( crBack ) + 114 * GetBValue( crBack ) ) / 1000 >= 128;',
		'\t\tTCHAR szBack[ 12 ];',
		'\t\twsprintf( szBack, _T("#%02X%02X%02X"), (unsigned)GetRValue( crBack ), (unsigned)GetGValue( crBack ), (unsigned)GetBValue( crBack ) );',
		'\t\tRbLogF( "theme: back=%S light=%d", szBack, (int)bLight );',
		'\t\ttstring sHtml = L"<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><style>";',
		'\t\tsHtml += L"body{font-family:Segoe UI,Arial,sans-serif;margin:24px;line-height:1.6;color:";',
		'\t\tsHtml += bLight ? L"#222222" : L"#D4D4D4";',
		'\t\tsHtml += L";background:";',
		'\t\tsHtml += szBack;',
		'\t\tsHtml += L";}";',
		'\t\tsHtml += L"h1{font-size:2em;} h2{font-size:1.5em;} h3,h4,h5,h6{font-size:1.2em;}";',
		'\t\tsHtml += bLight',
		'\t\t\t? L"pre,code{font-family:Consolas,monospace;} pre{background:#f6f6f6;padding:12px;border-radius:5px;white-space:pre-wrap;}"',
		'\t\t\t: L"pre,code{font-family:Consolas,monospace;} pre{background:#2d2d30;padding:12px;border-radius:5px;white-space:pre-wrap;}";',
		'\t\tsHtml += bLight',
		'\t\t\t? L"blockquote{border-left:4px solid #ddd;margin:8px 0;padding:4px 16px;color:#555;}"',
		'\t\t\t: L"blockquote{border-left:4px solid #555;margin:8px 0;padding:4px 16px;color:#aaa;}";',
		'\t\tsHtml += L"li{margin:2px 0;} hr{border:0;border-top:1px solid ";',
		'\t\tsHtml += bLight ? L"#ccc;}" : L"#555;}";',
		'\t\tsHtml += bLight ? L"a{color:#0366d6;}" : L"a{color:#4da3ff;}";',
		'\t\tsHtml += L"</style></head><body>";',
	].join( '\r\n' );
	s = s.replace( aA, nwA );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,29,3,0' ) )  fail( 'rc does not read 0,29,3,0' );
	s = s.split( '0,29,3,0' ).join( '0,30,0,0' );
	s = s.split( '0.29.3' ).join( '0.30.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.29\.3"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.29.3' );
	s = s.replace( re, 'IDS_VERSION$1"0.30.0"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
