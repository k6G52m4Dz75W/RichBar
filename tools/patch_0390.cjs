// 0.39.0 patch: markdown rendering via marked.js v18 (the same engine the
// official EmEditor preview uses, latest version)
// - WritePreviewHtml MD branch: if marked.umd.min.js sits beside our DLL,
//   the preview page references it (<script src>) and renders
//   window.__md = <JSON-escaped buffer> client-side (full GFM: tables,
//   fenced code, links, ordered lists, task lists, strikethrough)
// - the JS string is JSON/JS escaped with <,> as \u003c/\u003e so a
//   literal </script> in the text cannot break out
// - if the file is missing -> graceful fallback to the built-in line
//   converter (unchanged)
// - version 0.38.2 -> 0.39.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'JsEscape' ) )  fail( 'already patched' );

	// A: JsEscape helper before WritePreviewHtml
	const aA = '\tvoid WritePreviewHtml()\r\n\t{';
	if( !s.includes( aA ) )  fail( 'WritePreviewHtml anchor not found' );
	const nwA = [
		'\t// JSON/JS string escape for embedding the markdown source into the',
		'\t// preview page: < and > become \\u003c/\\u003e so a literal',
		'\t// "</script>" inside the text cannot terminate the script tag',
		'\ttstring JsEscape( const tstring& sIn )',
		'\t{',
		'\t\ttstring r;',
		'\t\tfor( size_t i = 0; i < sIn.size(); i++ ){',
		'\t\t\tWCHAR c = sIn[ i ];',
		'\t\t\tif( c == L\'\\\\\' )  r += L"\\\\\\\\";',
		'\t\t\telse if( c == L\'"\' )  r += L"\\\\\\"";',
		'\t\t\telse if( c == L\'\\n\' )  r += L"\\\\n";',
		'\t\t\telse if( c == L\'\\r\' ){ }\t// CRLF -> single \\n',
		'\t\t\telse if( c == L\'\\t\' )  r += L"\\\\t";',
		'\t\t\telse if( c == L\'<\' )  r += L"\\\\u003c";',
		'\t\t\telse if( c == L\'>\' )  r += L"\\\\u003e";',
		'\t\t\telse if( c == 0x2028 )  r += L"\\\\u2028";',
		'\t\t\telse if( c == 0x2029 )  r += L"\\\\u2029";',
		'\t\t\telse  r += c;',
		'\t\t}',
		'\t\treturn r;',
		'\t}',
		'',
		'\tvoid WritePreviewHtml()\r\n\t{',
	].join( '\r\n' );
	s = s.replace( aA, nwA );

	// B: table/img styles after the link style
	const aB = '\t\t\tsHtml += bLight ? L"a{color:#0366d6;}" : L"a{color:#4da3ff;}";';
	if( !s.includes( aB ) )  fail( 'link style anchor not found' );
	s = s.replace( aB, aB + '\r\n' + [
		'\t\t\tsHtml += bLight',
		'\t\t\t\t? L"table{border-collapse:collapse;} th,td{border:1px solid #ccc;padding:4px 10px;}"',
		'\t\t\t\t: L"table{border-collapse:collapse;} th,td{border:1px solid #555;padding:4px 10px;}";',
		'\t\t\tsHtml += L"img{max-width:100%;}";',
	].join( '\r\n' ) );

	// C: the render branch after </style></head><body>
	const aC = [
		'\t\t\tsHtml += L"</style></head><body>";',
		'\t\t\t// per-line conversion with list grouping',
	].join( '\r\n' );
	if( !s.includes( aC ) )  fail( 'head-close anchor not found' );
	const nwC = [
		'\t\t\tsHtml += L"</style></head><body>";',
		'\t\t\t// marked.js v18 (the same engine the official preview uses,',
		'\t\t\t// latest version): the library file sits beside our DLL; the',
		'\t\t\t// page references it and renders the embedded source. Missing',
		'\t\t\t// file -> the built-in line converter below takes over',
		'\t\t\ttstring sMarkedUrl;',
		'\t\t\tbool bMarked = false;',
		'\t\t\t{',
		'\t\t\t\tTCHAR szDll[ MAX_PATH ];',
		'\t\t\t\tif( GetModuleFileName( EEGetInstanceHandle(), szDll, MAX_PATH ) > 0 ){',
		'\t\t\t\t\tLPTSTR pEnd = szDll + lstrlen( szDll );',
		'\t\t\t\t\twhile( pEnd > szDll && pEnd[-1] != _T(\'\\\\\') )  pEnd--;',
		'\t\t\t\t\t*pEnd = 0;',
		'\t\t\t\t\tStringCat( szDll, MAX_PATH, _T("marked.umd.min.js") );',
		'\t\t\t\t\tif( GetFileAttributes( szDll ) != INVALID_FILE_ATTRIBUTES ){',
		'\t\t\t\t\t\tfor( LPTSTR p = szDll; *p; p++ ){',
		'\t\t\t\t\t\t\tif( *p == _T(\'\\\\\') )  *p = _T(\'/\');',
		'\t\t\t\t\t\t}',
		'\t\t\t\t\t\tsMarkedUrl = _T("file:///");',
		'\t\t\t\t\t\tUrlAppendEncoded( sMarkedUrl, szDll, true );',
		'\t\t\t\t\t\tbMarked = true;',
		'\t\t\t\t\t}',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t\tif( bMarked ){',
		'\t\t\t\t// the markdown source is embedded as a JSON/JS-escaped string;',
		'\t\t\t\t// marked parses it client-side (full GFM)',
		'\t\t\t\tsHtml += L"<div id=\\"content\\"></div>";',
		'\t\t\t\tsHtml += L"<script src=\\"" + sMarkedUrl + L"\\"></script>";',
		'\t\t\t\tsHtml += L"<script>window.__md=\\"";',
		'\t\t\t\tsHtml += JsEscape( sText );',
		'\t\t\t\tsHtml += L"\\";document.getElementById(\'content\').innerHTML=marked.parse(window.__md);</script>";',
		'\t\t\t\tsHtml += L"</body></html>";',
		'\t\t\t}',
		'\t\t\telse {',
		'\t\t\t// per-line conversion with list grouping (fallback)',
	].join( '\r\n' );
	s = s.replace( aC, nwC );

	// D: close the else around the old converter tail
	const aD = '\t\t\tif( bInList ){ sHtml += L"</ul>"; }\r\n\t\t\tsHtml += L"</body></html>";';
	if( !s.includes( aD ) )  fail( 'converter tail anchor not found' );
	s = s.replace( aD, '\t\t\tif( bInList ){ sHtml += L"</ul>"; }\r\n\t\t\tsHtml += L"</body></html>";\r\n\t\t\t}' );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,38,2,0' ) )  fail( 'rc does not read 0,38,2,0' );
	s = s.split( '0,38,2,0' ).join( '0,39,0,0' );
	s = s.split( '0.38.2' ).join( '0.39.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.38\.2"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.38.2' );
	s = s.replace( re, 'IDS_VERSION$1"0.39.0"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
