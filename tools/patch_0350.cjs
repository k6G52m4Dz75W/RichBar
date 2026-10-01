// 0.35.0 patch: HTML documents render DIRECTLY in the preview
// - WritePreviewHtml branches on the mode: MD = the themed per-line
//   conversion pipeline; HTML = the buffer text IS the page, written
//   verbatim (the markdown pipeline would mangle the tags)
// - version 0.34.2 -> 0.35.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'the buffer IS the page' ) )  fail( 'already patched' );

	const start = '\t\t// left = editor, right = preview: identical colors via the official';
	const end = '\t\tsHtml += L"</body></html>";';
	const i = s.indexOf( start );
	if( i < 0 )  fail( 'span start anchor not found' );
	const j = s.indexOf( end, i );
	if( j < 0 )  fail( 'span end anchor not found' );
	const jEnd = j + end.length;

	const L = [
		'\t\ttstring sHtml;',
		'\t\tif( m_iMode == MODE_MD ){',
		'\t\t\t// markdown: convert the buffer per line, themed like the view',
		'\t\t\t// left = editor, right = preview: identical colors via the official',
		'\t\t\t// EE_GET_COLOR query (SMART_COLOR_NORMAL = the view\'s normal text)',
		'\t\t\t// - one fast SendMessage, no pixel sampling',
		'\t\t\tCOLORREF crBack = CLR_INVALID;',
		'\t\t\tCOLORREF crText = CLR_INVALID;',
		'\t\t\t{',
		'\t\t\t\tint nAttr = 0;',
		'\t\t\t\tif( Editor_GetColor( m_hWnd, FALSE, SMART_COLOR_NORMAL, &crText, &crBack, &nAttr ) ){',
		'\t\t\t\t\tif( crBack == DEFAULT_COLOR ){',
		'\t\t\t\t\t\tcrBack = GetSysColor( COLOR_WINDOW );',
		'\t\t\t\t\t}',
		'\t\t\t\t\tif( crText == DEFAULT_COLOR ){',
		'\t\t\t\t\t\tcrText = GetSysColor( COLOR_WINDOWTEXT );',
		'\t\t\t\t\t}',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t\tif( crBack == CLR_INVALID || crBack == TRANSPARENT_COLOR || crBack == DEFAULT_COLOR ){',
		'\t\t\t\tcrBack = GetBarBackColor();\t// fallback: the plug-in bar color',
		'\t\t\t}',
		'\t\t\tbool bLight = ( 299 * GetRValue( crBack ) + 587 * GetGValue( crBack ) + 114 * GetBValue( crBack ) ) / 1000 >= 128;',
		'\t\t\tTCHAR szBack[ 12 ];',
		'\t\t\tTCHAR szFg[ 12 ];',
		'\t\t\twsprintf( szBack, _T("#%02X%02X%02X"), (unsigned)GetRValue( crBack ), (unsigned)GetGValue( crBack ), (unsigned)GetBValue( crBack ) );',
		'\t\t\tif( crText == CLR_INVALID || crText == TRANSPARENT_COLOR || crText == DEFAULT_COLOR ){',
		'\t\t\t\t// automatic/unknown text: derive from the background',
		'\t\t\t\twsprintf( szFg, _T("#%02X%02X%02X"), (unsigned)( bLight ? 0x22 : 0xD4 ), (unsigned)( bLight ? 0x22 : 0xD4 ), (unsigned)( bLight ? 0x22 : 0xD4 ) );',
		'\t\t\t}',
		'\t\t\telse {',
		'\t\t\t\twsprintf( szFg, _T("#%02X%02X%02X"), (unsigned)GetRValue( crText ), (unsigned)GetGValue( crText ), (unsigned)GetBValue( crText ) );',
		'\t\t\t}',
		'\t\t\tRbLogF( "theme: view back=%S fg=%S light=%d", szBack, szFg, (int)bLight );',
		'\t\t\tsHtml = L"<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><style>";',
		'\t\t\tsHtml += L"body{font-family:Segoe UI,Arial,sans-serif;margin:24px;line-height:1.6;color:";',
		'\t\t\tsHtml += szFg;',
		'\t\t\tsHtml += L";background:";',
		'\t\t\tsHtml += szBack;',
		'\t\t\tsHtml += L";}";',
		'\t\t\tsHtml += L"h1{font-size:2em;} h2{font-size:1.5em;} h3,h4,h5,h6{font-size:1.2em;}";',
		'\t\t\tsHtml += bLight',
		'\t\t\t\t? L"pre,code{font-family:Consolas,monospace;} pre{background:#f6f6f6;padding:12px;border-radius:5px;white-space:pre-wrap;}"',
		'\t\t\t\t: L"pre,code{font-family:Consolas,monospace;} pre{background:#2d2d30;padding:12px;border-radius:5px;white-space:pre-wrap;}";',
		'\t\t\tsHtml += bLight',
		'\t\t\t\t? L"blockquote{border-left:4px solid #ddd;margin:8px 0;padding:4px 16px;color:#555;}"',
		'\t\t\t\t: L"blockquote{border-left:4px solid #555;margin:8px 0;padding:4px 16px;color:#aaa;}";',
		'\t\t\tsHtml += L"li{margin:2px 0;} hr{border:0;border-top:1px solid ";',
		'\t\t\tsHtml += bLight ? L"#ccc;}" : L"#555;}";',
		'\t\t\tsHtml += bLight ? L"a{color:#0366d6;}" : L"a{color:#4da3ff;}";',
		'\t\t\tsHtml += L"</style></head><body>";',
		'\t\t\t// per-line conversion with list grouping',
		'\t\t\tsize_t pos = 0;',
		'\t\t\tbool bInList = false;',
		'\t\t\twhile( pos <= sText.size() ){',
		'\t\t\t\tsize_t nl = sText.find( L"\\n", pos );',
		'\t\t\t\ttstring sLine = sText.substr( pos, ( nl == tstring::npos ? sText.size() : nl ) - pos );',
		'\t\t\t\tif( !sLine.empty() && sLine[sLine.size()-1] == L\'\\r\' )  sLine.erase( sLine.size()-1 );',
		'\t\t\t\ttstring sOut;',
		'\t\t\t\tMdToHtmlLine( sLine, sOut );',
		'\t\t\t\tbool bIsLi = sOut.compare( 0, 4, L"<li>" ) == 0;',
		'\t\t\t\tif( bIsLi && !bInList ){ sHtml += L"<ul>"; bInList = true; }',
		'\t\t\t\tif( !bIsLi && bInList ){ sHtml += L"</ul>"; bInList = false; }',
		'\t\t\t\tsHtml += sOut;',
		'\t\t\t\tif( nl == tstring::npos )  break;',
		'\t\t\t\tpos = nl + 1;',
		'\t\t\t}',
		'\t\t\tif( bInList ){ sHtml += L"</ul>"; }',
		'\t\t\tsHtml += L"</body></html>";',
		'\t\t}',
		'\t\telse {',
		'\t\t\t// HTML: the buffer IS the page - the browser renders it directly',
		'\t\t\t// (the markdown pipeline would mangle the tags)',
		'\t\t\tsHtml = sText;',
		'\t\t}',
	].join( '\r\n' );
	s = s.slice( 0, i ) + L + s.slice( jEnd );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,34,2,0' ) )  fail( 'rc does not read 0,34,2,0' );
	s = s.split( '0,34,2,0' ).join( '0,35,0,0' );
	s = s.split( '0.34.2' ).join( '0.35.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.34\.2"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.34.2' );
	s = s.replace( re, 'IDS_VERSION$1"0.35.0"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
