// 0.31.0 patch: preview page matches the EDIT VIEW exactly (left = editor,
// right = preview)
// - MeasureViewColors(): samples the view's real pixels via a dense GetPixel
//   grid; background = modal color, text = dominant color far from the
//   background (glyph cores carry the exact text color; no theme color API
//   exists and the bar API stays pinned until relaunch)
// - WritePreviewHtml: view colors -> toolbar pixels -> bar API fallbacks;
//   the body text color now comes from the sampled view text
// - version 0.30.1 -> 0.31.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'MeasureViewColors' ) )  fail( 'already patched' );

	// A: insert MeasureViewColors after MeasureBarBackColor
	const aA = '\t\treturn ( nBest >= 0 ) ? clrSeen[ nBest ] : (COLORREF)CLR_INVALID;\r\n\t}';
	const iA = s.indexOf( aA );
	if( iA < 0 )  fail( 'MeasureBarBackColor tail anchor not found' );
	const insertA = [
		'\t\treturn ( nBest >= 0 ) ? clrSeen[ nBest ] : (COLORREF)CLR_INVALID;\r\n\t}',
		'',
		'\t// the REAL edit-view colors (left pane): a dense GetPixel grid over',
		'\t// the view; background = the modal color, text = the dominant color',
		'\t// far from the background (glyph cores carry the exact text color).',
		'\t// There is NO theme-color query API and the bar API stays pinned',
		'\t// until relaunch, so live pixels are the only truthful source',
		'\tbool MeasureViewColors( COLORREF* pcrBack, COLORREF* pcrText )',
		'\t{',
		'\t\t*pcrBack = CLR_INVALID;',
		'\t\t*pcrText = CLR_INVALID;',
		'\t\tif( !m_hwndView || !IsWindow( m_hwndView ) || !IsWindowVisible( m_hwndView ) ){',
		'\t\t\treturn false;',
		'\t\t}',
		'\t\tRECT rc;',
		'\t\tif( !GetWindowRect( m_hwndView, &rc ) ){',
		'\t\t\treturn false;',
		'\t\t}',
		'\t\tint cx = rc.right - rc.left;',
		'\t\tint cy = rc.bottom - rc.top;',
		'\t\tif( cx < 120 || cy < 80 ){',
		'\t\t\treturn false;',
		'\t\t}',
		'\t\tHDC hdc = GetDC( NULL );',
		'\t\tif( !hdc ){',
		'\t\t\treturn false;',
		'\t\t}',
		'\t\tCOLORREF clrSeen[ 32 ];',
		'\t\tint nCount[ 32 ] = { 0 };',
		'\t\tint nFound = 0;',
		'\t\tconst int nCols = 48;',
		'\t\tconst int nRows = 30;',
		'\t\tfor( int iy = 1; iy <= nRows; iy++ ){',
		'\t\t\tint y = rc.top + iy * cy / ( nRows + 1 );',
		'\t\t\tfor( int ix = 1; ix <= nCols; ix++ ){',
		'\t\t\t\tCOLORREF c = GetPixel( hdc, rc.left + ix * cx / ( nCols + 1 ), y );',
		'\t\t\t\tif( c == CLR_INVALID )  continue;',
		'\t\t\t\tint k;',
		'\t\t\t\tfor( k = 0; k < nFound; k++ ){',
		'\t\t\t\t\tif( clrSeen[ k ] == c ){',
		'\t\t\t\t\t\tnCount[ k ]++;',
		'\t\t\t\t\t\tbreak;',
		'\t\t\t\t\t}',
		'\t\t\t\t}',
		'\t\t\t\tif( k == nFound && nFound < 32 ){',
		'\t\t\t\t\tclrSeen[ nFound ] = c;',
		'\t\t\t\t\tnCount[ nFound ] = 1;',
		'\t\t\t\t\tnFound++;',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t}',
		'\t\tReleaseDC( NULL, hdc );',
		'\t\tint nBack = -1;',
		'\t\tint nBackN = 0;',
		'\t\tfor( int k = 0; k < nFound; k++ ){',
		'\t\t\tif( nCount[ k ] > nBackN ){',
		'\t\t\t\tnBackN = nCount[ k ];',
		'\t\t\t\tnBack = k;',
		'\t\t\t}',
		'\t\t}',
		'\t\tif( nBack < 0 )  return false;',
		'\t\t*pcrBack = clrSeen[ nBack ];',
		'\t\t// text: the dominant color clearly separated from the background',
		'\t\tint nR = GetRValue( *pcrBack ), nG = GetGValue( *pcrBack ), nB = GetBValue( *pcrBack );',
		'\t\tint nText = -1;',
		'\t\tint nTextN = 8;',
		'\t\tfor( int k = 0; k < nFound; k++ ){',
		'\t\t\tif( k == nBack )  continue;',
		'\t\t\tint dR = GetRValue( clrSeen[ k ] ) - nR;',
		'\t\t\tint dG = GetGValue( clrSeen[ k ] ) - nG;',
		'\t\t\tint dB = GetBValue( clrSeen[ k ] ) - nB;',
		'\t\t\tif( dR * dR + dG * dG + dB * dB < 60 * 60 )  continue;',
		'\t\t\tif( nCount[ k ] > nTextN ){',
		'\t\t\t\tnTextN = nCount[ k ];',
		'\t\t\t\tnText = k;',
		'\t\t\t}',
		'\t\t}',
		'\t\tif( nText >= 0 ){',
		'\t\t\t*pcrText = clrSeen[ nText ];',
		'\t\t}',
		'\t\treturn true;\r\n\t}',
	].join( '\r\n' );
	s = s.slice( 0, iA ) + insertA + s.slice( iA + aA.length );

	// B: theme block in WritePreviewHtml -> view colors with fallbacks
	const aB = [
		'\t\tCOLORREF crBack = MeasureBarBackColor();',
		'\t\tif( crBack == CLR_INVALID ){',
		'\t\t\tcrBack = GetBarBackColor();\t// toolbar hidden: pinned API value',
		'\t\t}',
		'\t\tbool bLight = ( 299 * GetRValue( crBack ) + 587 * GetGValue( crBack ) + 114 * GetBValue( crBack ) ) / 1000 >= 128;',
		'\t\tTCHAR szBack[ 12 ];',
		'\t\twsprintf( szBack, _T("#%02X%02X%02X"), (unsigned)GetRValue( crBack ), (unsigned)GetGValue( crBack ), (unsigned)GetBValue( crBack ) );',
		'\t\tRbLogF( "theme: back=%S light=%d", szBack, (int)bLight );',
		'\t\ttstring sHtml = L"<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><style>";',
		'\t\tsHtml += L"body{font-family:Segoe UI,Arial,sans-serif;margin:24px;line-height:1.6;color:";',
		'\t\tsHtml += bLight ? L"#222222" : L"#D4D4D4";',
	].join( '\r\n' );
	if( !s.includes( aB ) )  fail( 'theme block anchor not found' );
	const nwB = [
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
		'\t\tbool bLight = ( 299 * GetRValue( crBack ) + 587 * GetGValue( crBack ) + 114 * GetBValue( crBack ) ) / 1000 >= 128;',
		'\t\tTCHAR szBack[ 12 ];',
		'\t\tTCHAR szFg[ 12 ];',
		'\t\twsprintf( szBack, _T("#%02X%02X%02X"), (unsigned)GetRValue( crBack ), (unsigned)GetGValue( crBack ), (unsigned)GetBValue( crBack ) );',
		'\t\tif( crText == CLR_INVALID ){',
		'\t\t\t// no text sampled (empty document): derive from the background',
		'\t\t\twsprintf( szFg, _T("#%02X%02X%02X"), (unsigned)( bLight ? 0x22 : 0xD4 ), (unsigned)( bLight ? 0x22 : 0xD4 ), (unsigned)( bLight ? 0x22 : 0xD4 ) );',
		'\t\t}',
		'\t\telse {',
		'\t\t\twsprintf( szFg, _T("#%02X%02X%02X"), (unsigned)GetRValue( crText ), (unsigned)GetGValue( crText ), (unsigned)GetBValue( crText ) );',
		'\t\t}',
		'\t\tRbLogF( "theme: view back=%S fg=%S light=%d", szBack, szFg, (int)bLight );',
		'\t\ttstring sHtml = L"<!DOCTYPE html><html><head><meta charset=\\"utf-8\\"><style>";',
		'\t\tsHtml += L"body{font-family:Segoe UI,Arial,sans-serif;margin:24px;line-height:1.6;color:";',
		'\t\tsHtml += szFg;',
	].join( '\r\n' );
	s = s.replace( aB, nwB );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,30,1,0' ) )  fail( 'rc does not read 0,30,1,0' );
	s = s.split( '0,30,1,0' ).join( '0,31,0,0' );
	s = s.split( '0.30.1' ).join( '0.31.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.30\.1"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.30.1' );
	s = s.replace( re, 'IDS_VERSION$1"0.31.0"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
