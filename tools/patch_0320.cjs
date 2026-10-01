// 0.32.0 patch: theme colors via the official EE_GET_COLOR query
// - WritePreviewHtml: Editor_GetColor(SMART_COLOR_NORMAL) -> the view's
//   normal text+background colors (one fast SendMessage; DEFAULT_COLOR /
//   TRANSPARENT_COLOR resolved, GetBarBackColor fallback)
// - DELETE MeasureViewColors + MeasureBarBackColor (pixel sampling stalled
//   the UI - clicks and startup)
// - DELETE the V8 startup prime (its synchronous EE_RUN_MACRO blocked the
//   toolbar display)
// - version 0.31.1 -> 0.32.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'SMART_COLOR_NORMAL, &crText' ) )  fail( 'already patched' );

	// A: theme block -> EE_GET_COLOR
	const aA = [
		'\t\t// left = editor, right = preview: make both sides IDENTICAL by',
		'\t\t// sampling the edit view itself (view -> toolbar -> bar API)',
		'\t\tCOLORREF crBack = CLR_INVALID;',
		'\t\tCOLORREF crText = CLR_INVALID;',
		'\t\tMeasureViewColors( &crBack, &crText );',
		'\t\tif( crBack == CLR_INVALID ){',
		'\t\t\tcrBack = MeasureBarBackColor();',
		'\t\t}',
		'\t\tif( crBack == CLR_INVALID ){',
		'\t\t\tcrBack = GetBarBackColor();\t// toolbars hidden: pinned API value',
		'\t\t}',
	].join( '\r\n' );
	if( !s.includes( aA ) )  fail( 'theme block head anchor not found' );
	const nwA = [
		'\t\t// left = editor, right = preview: identical colors via the official',
		'\t\t// EE_GET_COLOR query (SMART_COLOR_NORMAL = the view\'s normal text)',
		'\t\t// - one fast SendMessage, no pixel sampling',
		'\t\tCOLORREF crBack = CLR_INVALID;',
		'\t\tCOLORREF crText = CLR_INVALID;',
		'\t\t{',
		'\t\t\tint nAttr = 0;',
		'\t\t\tif( Editor_GetColor( m_hWnd, FALSE, SMART_COLOR_NORMAL, &crText, &crBack, &nAttr ) ){',
		'\t\t\t\tif( crBack == DEFAULT_COLOR ){',
		'\t\t\t\t\tcrBack = GetSysColor( COLOR_WINDOW );',
		'\t\t\t\t}',
		'\t\t\t\tif( crText == DEFAULT_COLOR ){',
		'\t\t\t\t\tcrText = GetSysColor( COLOR_WINDOWTEXT );',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t}',
		'\t\tif( crBack == CLR_INVALID || crBack == TRANSPARENT_COLOR || crBack == DEFAULT_COLOR ){',
		'\t\t\tcrBack = GetBarBackColor();\t// fallback: the plug-in bar color',
		'\t\t}',
	].join( '\r\n' );
	s = s.replace( aA, nwA );

	// A2: the crText invalid-guard also matches the new special values
	const aA2 = '\t\tif( crText == CLR_INVALID ){';
	if( !s.includes( aA2 ) )  fail( 'crText guard anchor not found' );
	s = s.replace( aA2, '\t\tif( crText == CLR_INVALID || crText == TRANSPARENT_COLOR || crText == DEFAULT_COLOR ){' );

	// B: delete MeasureBarBackColor + MeasureViewColors (contiguous span)
	const iB1 = s.indexOf( '\t// the REAL painted toolbar background' );
	const iB2 = s.indexOf( '\t// render the CURRENT buffer' );
	if( iB1 < 0 || iB2 < 0 || iB2 <= iB1 )  fail( 'sampler span anchors not found' );
	s = s.slice( 0, iB1 ) + s.slice( iB2 );

	// C: remove the V8 prime function (it sits between OnWebBarRetryTimer
	// and whatever follows; after step B that is the OpenWebBarPreview comment)
	const iC = s.indexOf( '\t// warm the V8 macro engine' );
	const iCend = s.indexOf( '\t// render the CURRENT buffer', iC );
	if( iC < 0 || iCend < 0 || iCend <= iC )  fail( 'prime function span anchors not found' );
	s = s.slice( 0, iC ) + s.slice( iCend );

	// D: remove the startup prime scheduling
	const aD = '\t\tm_bPanesRestored = true;\r\n\t\tif( m_hDlg ){\r\n\t\t\tSetTimer( m_hDlg, IDT_V8_PRIME, 3000, NULL );\t// engine warmup\r\n\t\t}';
	if( !s.includes( aD ) )  fail( 'startup prime scheduling anchor not found' );
	s = s.replace( aD, '\t\tm_bPanesRestored = true;' );

	// E: remove the IDT_V8_PRIME timer branch
	const aE = [
		'\t\t\telse if( wParam == IDT_V8_PRIME ){',
		'\t\t\t\tKillTimer( hwnd, IDT_V8_PRIME );',
		'\t\t\t\tCMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));',
		'\t\t\t\tif( pFrame ){',
		'\t\t\t\t\tpFrame->OnV8PrimeTimer();',
		'\t\t\t\t}',
		'\t\t\t\treturn 0;',
		'\t\t\t}\r\n',
	].join( '\r\n' );
	if( !s.includes( aE ) )  fail( 'prime timer branch anchor not found' );
	s = s.replace( aE, '' );

	// F: remove the IDT define
	const aF = '\r\n#define IDT_V8_PRIME\t\t\t9';
	if( !s.includes( aF ) )  fail( 'IDT_V8_PRIME define anchor not found' );
	s = s.replace( aF, '' );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,31,1,0' ) )  fail( 'rc does not read 0,31,1,0' );
	s = s.split( '0,31,1,0' ).join( '0,32,0,0' );
	s = s.split( '0.31.1' ).join( '0.32.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.31\.1"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.31.1' );
	s = s.replace( re, 'IDS_VERSION$1"0.32.0"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
