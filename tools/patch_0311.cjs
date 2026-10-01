// 0.31.1 patch: fix the first-click stall
// - MeasureViewColors: ONE BitBlt into a top-down DIB + in-memory scan
//   (the previous 1440 per-pixel GetPixel calls on the screen DC cost
//   ~ms EACH and stalled the first preview click for seconds)
// - V8 engine primed in the background 3s after startup so the first
//   preview click does not wait for the cold-start spawn
// - version 0.31.0 -> 0.31.1
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'IDT_V8_PRIME' ) )  fail( 'already patched' );

	// A: replace the sampling body of MeasureViewColors (between the size
	// guard and the final return)
	const aA = '\t\tif( cx < 120 || cy < 80 ){\r\n\t\t\treturn false;\r\n\t\t}\r\n\t\tHDC hdc = GetDC( NULL );';
	const iA = s.indexOf( aA );
	if( iA < 0 )  fail( 'MeasureViewColors head anchor not found' );
	const aAend = '\t\treturn true;';
	const iAend = s.indexOf( aAend, iA );
	if( iAend < 0 )  fail( 'MeasureViewColors tail anchor not found' );
	const nwA = [
		'\t\tif( cx < 120 || cy < 80 ){',
		'\t\t\treturn false;',
		'\t\t}',
		'\t\t// ONE BitBlt into a top-down DIB, then scan the buffer in memory:',
		'\t\t// per-pixel GetPixel on the screen DC costs ~milliseconds EACH',
		'\t\t// and the 1440-call grid stalled the first click for seconds',
		'\t\tBITMAPINFO bmi;',
		'\t\tZeroMemory( &bmi, sizeof( bmi ) );',
		'\t\tbmi.bmiHeader.biSize = sizeof( BITMAPINFOHEADER );',
		'\t\tbmi.bmiHeader.biWidth = cx;',
		'\t\tbmi.bmiHeader.biHeight = -cy;\t// top-down',
		'\t\tbmi.bmiHeader.biPlanes = 1;',
		'\t\tbmi.bmiHeader.biBitCount = 32;',
		'\t\tbmi.bmiHeader.biCompression = BI_RGB;',
		'\t\tvoid* pvBits = NULL;',
		'\t\tHDC hdcScreen = GetDC( NULL );',
		'\t\tif( !hdcScreen ){',
		'\t\t\treturn false;',
		'\t\t}',
		'\t\tHBITMAP hbm = CreateDIBSection( hdcScreen, &bmi, DIB_RGB_COLORS, &pvBits, NULL, 0 );',
		'\t\tif( !hbm ){',
		'\t\t\tReleaseDC( NULL, hdcScreen );',
		'\t\t\treturn false;',
		'\t\t}',
		'\t\tHDC hdcMem = CreateCompatibleDC( hdcScreen );',
		'\t\tHBITMAP hbmOld = (HBITMAP)SelectObject( hdcMem, hbm );',
		'\t\tBOOL bBlit = BitBlt( hdcMem, 0, 0, cx, cy, hdcScreen, rc.left, rc.top, SRCCOPY );',
		'\t\tReleaseDC( NULL, hdcScreen );',
		'\t\tbool bResult = false;',
		'\t\tif( bBlit && pvBits ){',
		'\t\t\tCOLORREF clrSeen[ 64 ];',
		'\t\t\tint nCount[ 64 ] = { 0 };',
		'\t\t\tint nFound = 0;',
		'\t\t\tconst DWORD* pdw = (const DWORD*)pvBits;',
		'\t\t\tfor( int y = 2; y < cy; y += 4 ){',
		'\t\t\t\tconst DWORD* prow = pdw + (size_t)y * cx;',
		'\t\t\t\tfor( int x = 2; x < cx; x += 4 ){',
		'\t\t\t\t\tDWORD dw = prow[ x ] & 0x00FFFFFF;',
		'\t\t\t\t\t// DIB memory bytes are B,G,R,X: convert to COLORREF',
		'\t\t\t\t\tCOLORREF c = ( ( dw & 0x000000FF ) << 16 ) | ( dw & 0x0000FF00 ) | ( ( dw & 0x00FF0000 ) >> 16 );',
		'\t\t\t\t\tint k;',
		'\t\t\t\t\tfor( k = 0; k < nFound; k++ ){',
		'\t\t\t\t\t\tif( clrSeen[ k ] == c ){',
		'\t\t\t\t\t\t\tnCount[ k ]++;',
		'\t\t\t\t\t\t\tbreak;',
		'\t\t\t\t\t\t}',
		'\t\t\t\t\t}',
		'\t\t\t\t\tif( k == nFound && nFound < 64 ){',
		'\t\t\t\t\t\tclrSeen[ nFound ] = c;',
		'\t\t\t\t\t\tnCount[ nFound ] = 1;',
		'\t\t\t\t\t\tnFound++;',
		'\t\t\t\t\t}',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t\tint nBack = -1;',
		'\t\t\tint nBackN = 0;',
		'\t\t\tfor( int k = 0; k < nFound; k++ ){',
		'\t\t\t\tif( nCount[ k ] > nBackN ){',
		'\t\t\t\t\tnBackN = nCount[ k ];',
		'\t\t\t\t\tnBack = k;',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t\tif( nBack >= 0 ){',
		'\t\t\t\t*pcrBack = clrSeen[ nBack ];',
		'\t\t\t\tint nR = GetRValue( *pcrBack ), nG = GetGValue( *pcrBack ), nB = GetBValue( *pcrBack );',
		'\t\t\t\tint nText = -1;',
		'\t\t\t\tint nTextN = 8;',
		'\t\t\t\tfor( int k = 0; k < nFound; k++ ){',
		'\t\t\t\t\tif( k == nBack )  continue;',
		'\t\t\t\t\tint dR = GetRValue( clrSeen[ k ] ) - nR;',
		'\t\t\t\t\tint dG = GetGValue( clrSeen[ k ] ) - nG;',
		'\t\t\t\t\tint dB = GetBValue( clrSeen[ k ] ) - nB;',
		'\t\t\t\t\tif( dR * dR + dG * dG + dB * dB < 60 * 60 )  continue;',
		'\t\t\t\t\tif( nCount[ k ] > nTextN ){',
		'\t\t\t\t\t\tnTextN = nCount[ k ];',
		'\t\t\t\t\t\tnText = k;',
		'\t\t\t\t\t}',
		'\t\t\t\t}',
		'\t\t\t\tif( nText >= 0 ){',
		'\t\t\t\t\t*pcrText = clrSeen[ nText ];',
		'\t\t\t\t}',
		'\t\t\t\tbResult = true;',
		'\t\t\t}',
		'\t\t}',
		'\t\tSelectObject( hdcMem, hbmOld );',
		'\t\tDeleteDC( hdcMem );',
		'\t\tDeleteObject( hbm );\r\n\t\treturn true;',
	].join( '\r\n' );
	s = s.slice( 0, iA ) + nwA + s.slice( iAend + aAend.length );

	// B: V8 prime helper after OnWebBarRetryTimer
	const aB = '\t\tif( m_sPendingMacro.empty() && m_hDlg ){\r\n\t\t\tKillTimer( m_hDlg, IDT_WEBBAR_RETRY );\r\n\t\t}\r\n\t}';
	const iB = s.indexOf( aB );
	if( iB < 0 )  fail( 'OnWebBarRetryTimer tail anchor not found' );
	const nwB = [
		'\t\tif( m_sPendingMacro.empty() && m_hDlg ){',
		'\t\t\tKillTimer( m_hDlg, IDT_WEBBAR_RETRY );',
		'\t\t}\r\n\t}',
		'',
		'\t// warm the V8 macro engine in the background so the FIRST preview',
		'\t// click does not wait for the cold-start spawn (the engine rejects',
		'\t// the first macro burst with 0x2000000B; a failed attempt still',
		'\t// triggers the spawn)',
		'\tvoid OnV8PrimeTimer()',
		'\t{',
		'\t\tRunWebBarMacro( _T("var rbPrime = 1;") );',
		'\t}',
	].join( '\r\n' );
	s = s.slice( 0, iB ) + nwB + s.slice( iB + aB.length );

	// C: schedule the prime in OnStartupRestore
	const aC = '\t\tm_bPanesRestored = true;';
	if( !s.includes( aC ) )  fail( 'OnStartupRestore anchor not found' );
	s = s.replace( aC, aC + '\r\n\t\tif( m_hDlg ){\r\n\t\t\tSetTimer( m_hDlg, IDT_V8_PRIME, 3000, NULL );\t// engine warmup\r\n\t\t}' );

	// D: timer branch after the WEBBAR_RETRY branch
	const aD = [
		'\t\t\telse if( wParam == IDT_WEBBAR_RETRY ){',
		'\t\t\t\tCMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));',
		'\t\t\t\tif( pFrame ){',
		'\t\t\t\t\tpFrame->OnWebBarRetryTimer();',
		'\t\t\t\t}',
		'\t\t\t\treturn 0;',
		'\t\t\t}',
	].join( '\r\n' );
	if( !s.includes( aD ) )  fail( 'timer branch anchor not found' );
	const nwD = aD + '\r\n' + [
		'\t\t\telse if( wParam == IDT_V8_PRIME ){',
		'\t\t\t\tKillTimer( hwnd, IDT_V8_PRIME );',
		'\t\t\t\tCMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));',
		'\t\t\t\tif( pFrame ){',
		'\t\t\t\t\tpFrame->OnV8PrimeTimer();',
		'\t\t\t\t}',
		'\t\t\t\treturn 0;',
		'\t\t\t}',
	].join( '\r\n' );
	s = s.replace( aD, nwD );

	// E: timer id
	const aE = '#define IDT_WEBBAR_RETRY\t\t8';
	if( !s.includes( aE ) )  fail( 'IDT_WEBBAR_RETRY anchor not found' );
	s = s.replace( aE, aE + '\r\n#define IDT_V8_PRIME\t\t\t9' );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,31,0,0' ) )  fail( 'rc does not read 0,31,0,0' );
	s = s.split( '0,31,0,0' ).join( '0,31,1,0' );
	s = s.split( '0.31.0' ).join( '0.31.1' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.31\.0"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.31.0' );
	s = s.replace( re, 'IDS_VERSION$1"0.31.1"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
