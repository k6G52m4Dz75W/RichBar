// 0.30.1 patch:
// - WebBar macro RETRY: the V8 engine rejects the first macro burst after
//   process start with 0x2000000B (every session's first preview click);
//   failures are re-run on a 1s timer (6 attempts)
// - real-pixel theme detection: MeasureBarBackColor() samples the toolbar
//   pixels (modal color) instead of the pinned EI_GET_BAR_BACK_COLOR value
// - probe macro removed (retry supersedes it)
// - version 0.30.0 -> 0.30.1
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'IDT_WEBBAR_RETRY' ) )  fail( 'already patched' );

	// A: timer id
	const aA = '#define IDT_WEB_NAVIGATE\t\t7';
	if( !s.includes( aA ) )  fail( 'IDT anchor not found' );
	s = s.replace( aA, aA + '\r\n#define IDT_WEBBAR_RETRY\t\t8' );

	// B: members
	const aB = '\ttstring m_sPreviewUrl;\t\t// staged preview URL';
	if( !s.includes( aB ) )  fail( 'member anchor not found' );
	s = s.replace( aB, aB + '\r\n\ttstring m_sPendingMacro;\t// WebBar macro awaiting retry (V8 engine not ready)\r\n\tint m_nMacroRetries = 0;' );

	// C: helpers after RunWebBarMacro (insert before OpenWebBarPreview comment)
	const aC = '\t// render the CURRENT buffer into the stable preview file and navigate';
	if( !s.includes( aC ) )  fail( 'OpenWebBarPreview comment anchor not found' );
	const helpers = [
		'\t// the V8 macro engine rejects the FIRST macro burst after process',
		'\t// start with 0x2000000B (every session\'s first preview click fails;',
		'\t// a few seconds later everything succeeds) - retry on a timer',
		'\tvoid RunWebBarMacroStaged( const TCHAR* pszMacro )',
		'\t{',
		'\t\tHRESULT hr = RunWebBarMacro( pszMacro );',
		'\t\tif( hr == S_OK ){',
		'\t\t\tm_sPendingMacro.clear();',
		'\t\t\treturn;',
		'\t\t}',
		'\t\tm_sPendingMacro = pszMacro;',
		'\t\tm_nMacroRetries = 6;',
		'\t\tif( m_hDlg ){',
		'\t\t\tSetTimer( m_hDlg, IDT_WEBBAR_RETRY, 1000, NULL );',
		'\t\t}',
		'\t}',
		'',
		'\tvoid OnWebBarRetryTimer()',
		'\t{',
		'\t\tif( m_sPendingMacro.empty() )  return;',
		'\t\tHRESULT hr = RunWebBarMacro( m_sPendingMacro.c_str() );',
		'\t\tif( hr == S_OK ){',
		'\t\t\tRbLogF( "webbar retry: SUCCEEDED" );',
		'\t\t\tm_sPendingMacro.clear();',
		'\t\t}',
		'\t\telse if( --m_nMacroRetries <= 0 ){',
		'\t\t\tRbLogF( "webbar retry: gave up" );',
		'\t\t\tm_sPendingMacro.clear();',
		'\t\t}',
		'\t\telse if( m_hDlg ){',
		'\t\t\tSetTimer( m_hDlg, IDT_WEBBAR_RETRY, 1000, NULL );',
		'\t\t}',
		'\t\tif( m_sPendingMacro.empty() && m_hDlg ){',
		'\t\t\tKillTimer( m_hDlg, IDT_WEBBAR_RETRY );',
		'\t\t}',
		'\t}',
		'',
		'\t// the REAL painted toolbar background: EI_GET_BAR_BACK_COLOR stays',
		'\t// pinned across theme switches until relaunch (upstream), so sample',
		'\t// the actual toolbar pixels and take the most frequent color',
		'\tCOLORREF MeasureBarBackColor()',
		'\t{',
		'\t\tif( !m_hwndToolbar || !IsWindow( m_hwndToolbar ) || !IsWindowVisible( m_hwndToolbar ) ){',
		'\t\t\treturn CLR_INVALID;',
		'\t\t}',
		'\t\tRECT rc;',
		'\t\tif( !GetWindowRect( m_hwndToolbar, &rc ) ){',
		'\t\t\treturn CLR_INVALID;',
		'\t\t}',
		'\t\tint cx = rc.right - rc.left;',
		'\t\tint cy = rc.bottom - rc.top;',
		'\t\tif( cx < 40 || cy < 12 ){',
		'\t\t\treturn CLR_INVALID;',
		'\t\t}',
		'\t\tHDC hdc = GetDC( NULL );',
		'\t\tif( !hdc ){',
		'\t\t\treturn CLR_INVALID;',
		'\t\t}',
		'\t\tCOLORREF clrSeen[ 16 ];',
		'\t\tint nCount[ 16 ] = { 0 };',
		'\t\tint nFound = 0;',
		'\t\tfor( int iy = cy / 4; iy < cy; iy += cy / 2 + 1 ){',
		'\t\t\tfor( int ix = cx / 8; ix < cx; ix += cx / 8 + 1 ){',
		'\t\t\t\tCOLORREF c = GetPixel( hdc, rc.left + ix, rc.top + iy );',
		'\t\t\t\tif( c == CLR_INVALID )  continue;',
		'\t\t\t\tint k;',
		'\t\t\t\tfor( k = 0; k < nFound; k++ ){',
		'\t\t\t\t\tif( clrSeen[ k ] == c ){',
		'\t\t\t\t\t\tnCount[ k ]++;',
		'\t\t\t\t\t\tbreak;',
		'\t\t\t\t\t}',
		'\t\t\t\t}',
		'\t\t\t\tif( k == nFound && nFound < 16 ){',
		'\t\t\t\t\tclrSeen[ nFound ] = c;',
		'\t\t\t\t\tnCount[ nFound ] = 1;',
		'\t\t\t\t\tnFound++;',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t}',
		'\t\tReleaseDC( NULL, hdc );',
		'\t\tint nBest = -1;',
		'\t\tint nBestN = 0;',
		'\t\tfor( int k = 0; k < nFound; k++ ){',
		'\t\t\tif( nCount[ k ] > nBestN ){',
		'\t\t\t\tnBestN = nCount[ k ];',
		'\t\t\t\tnBest = k;',
		'\t\t\t}',
		'\t\t}',
		'\t\treturn ( nBest >= 0 ) ? clrSeen[ nBest ] : (COLORREF)CLR_INVALID;',
		'\t}',
		'',
		'\t// render the CURRENT buffer into the stable preview file and navigate',
	].join( '\r\n' );
	s = s.replace( aC, helpers );

	// D: WritePreviewHtml uses the measured color first
	const aD = '\t\tCOLORREF crBack = GetBarBackColor();\r\n\t\tbool bLight = ( 299 * GetRValue( crBack )';
	if( !s.includes( aD ) )  fail( 'theme block anchor not found' );
	const nwD = [
		'\t\tCOLORREF crBack = MeasureBarBackColor();',
		'\t\tif( crBack == CLR_INVALID ){',
		'\t\t\tcrBack = GetBarBackColor();\t// toolbar hidden: pinned API value',
		'\t\t}',
		'\t\tbool bLight = ( 299 * GetRValue( crBack )',
	].join( '\r\n' );
	s = s.replace( aD, nwD );
	// finish the bLight line (the tail of the original line follows "GetRValue( crBack )")
	s = s.replace( '\t\tbool bLight = ( 299 * GetRValue( crBack ) + 587 * GetGValue( crBack ) + 114 * GetBValue( crBack ) ) / 1000 >= 128;',
		'\t\tbool bLight = ( 299 * GetRValue( crBack ) + 587 * GetGValue( crBack ) + 114 * GetBValue( crBack ) ) / 1000 >= 128;' );

	// E: call sites -> staged; remove the probe
	const aE = [
		'\t\t\t\tif( bWant ){',
		'\t\t\t\t\t// engine sanity probe: no EmEditor objects at all; a failure',
		'\t\t\t\t\t// here means the macro ENGINE is unavailable (vs a WebBar',
		'\t\t\t\t\t// object failure, which the next log line would show)',
		'\t\t\t\t\tRunWebBarMacro( _T("var rbProbe = 1;") );',
		'\t\t\t\t\tOpenWebBarPreview();',
		'\t\t\t\t}',
		'\t\t\t\telse {',
		'\t\t\t\t\tRunWebBarMacro( _T("WebBar.Visible = false;") );',
		'\t\t\t\t}',
	].join( '\r\n' );
	if( !s.includes( aE ) )  fail( 'preview branch anchor not found' );
	const nwE = [
		'\t\t\t\tif( bWant ){',
		'\t\t\t\t\tOpenWebBarPreview();',
		'\t\t\t\t}',
		'\t\t\t\telse {',
		'\t\t\t\t\tRunWebBarMacroStaged( _T("WebBar.Visible = false;") );',
		'\t\t\t\t}',
	].join( '\r\n' );
	s = s.replace( aE, nwE );

	const aF = '\t\tRunWebBarMacro( sMacro.c_str() );';
	if( !s.includes( aF ) )  fail( 'OpenWebBarMacro call anchor not found' );
	s = s.replace( aF, '\t\tRunWebBarMacroStaged( sMacro.c_str() );' );

	// G: WM_TIMER branch (after the FIRST IDT_WEB_NAVIGATE branch)
	const aG = [
		'\t\t\telse if( wParam == IDT_WEB_NAVIGATE ){',
		'\t\t\t\tKillTimer( hwnd, IDT_WEB_NAVIGATE );',
		'\t\t\t\tCMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));',
		'\t\t\t\tif( pFrame ){',
		'\t\t\t\t\tpFrame->OnWebNavigateTimer();',
		'\t\t\t\t}',
		'\t\t\t\treturn 0;',
		'\t\t\t}',
	].join( '\r\n' );
	const iG = s.indexOf( aG );
	if( iG < 0 )  fail( 'timer branch anchor not found' );
	const nwG = aG + '\r\n' + [
		'\t\t\telse if( wParam == IDT_WEBBAR_RETRY ){',
		'\t\t\t\tCMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));',
		'\t\t\t\tif( pFrame ){',
		'\t\t\t\t\tpFrame->OnWebBarRetryTimer();',
		'\t\t\t\t}',
		'\t\t\t\treturn 0;',
		'\t\t\t}',
	].join( '\r\n' );
	s = s.slice( 0, iG ) + nwG + s.slice( iG + aG.length );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,30,0,0' ) )  fail( 'rc does not read 0,30,0,0' );
	s = s.split( '0,30,0,0' ).join( '0,30,1,0' );
	s = s.split( '0.30.0' ).join( '0.30.1' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.30\.0"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.30.0' );
	s = s.replace( re, 'IDS_VERSION$1"0.30.1"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
