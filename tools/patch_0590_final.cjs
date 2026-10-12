// 0.59.0 FINAL clean patch on the 0.58.0 base:
// - members: +m_nEditorLineCssPx (16), +m_nLastSentTargetPx (-1)
// - OnScrollerPoll middle: absolute px model with the pane width ratio
// - render: cache the editor line CSS px
// - locale IDS_VERSION 0.58.0 -> 0.59.0 (the main rc is already 0.59.0)
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( 'm_nEditorLineCssPx' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );
const Q = String.fromCharCode( 34 );

// A: members
{
	const a = '\tint m_nPreviewLinePx = 26;\t// preview line height in px (font px x 1.6)';
	if( !s.includes( a ) ){ console.log( 'A miss' ); process.exit( 1 ); }
	s = s.replace( a, [
		'\tint m_nPreviewLinePx = 26;\t// fallback line px (delta mode)',
		'\tint m_nEditorLineCssPx = 16;\t// editor line height in CSS px (set at render)',
		'\tint m_nLastSentTargetPx = -1;\t// last px target sent to the preview',
	].join( '\n' ) );
	console.log( 'A members ok' );
}

// B: OnScrollerPoll middle — absolute px model with the width ratio
{
	const b = [
		T( 2 ) + 'if( nDelta == 0 )  return;',
		T( 2 ) + 'const int nPx = nDelta * m_nPreviewLinePx;',
		T( 2 ) + 'wsprintf( szMacro, L"WebBar.scrollBy( 0, %d );", nPx );',
		T( 2 ) + 'RunWebBarMacro( szMacro );\t// dropped frames are fine while scrolling',
	].join( '\r\n' );
	if( !s.includes( b ) ){ console.log( 'B miss' ); process.exit( 1 ); }
	const nb = [
		T( 2 ) + 'RECT rcView = { 0, 0, 0, 0 }, rcPrev = { 0, 0, 0, 0 };',
		T( 2 ) + 'GetClientRect( m_hwndView, &rcView );',
		T( 2 ) + 'int nWe = rcView.right - rcView.left;',
		T( 2 ) + 'int nWp = 0;',
		T( 2 ) + 'if( m_hwndPreviewHost && IsWindow( m_hwndPreviewHost ) ){',
		T( 3 ) + 'GetClientRect( m_hwndPreviewHost, &rcPrev );',
		T( 3 ) + 'nWp = rcPrev.right - rcPrev.left;',
		T( 2 ) + '}',
		T( 2 ) + 'double dScale = ( nWe > 0 && nWp > 0 ) ? (double)nWe / (double)nWp : 1.0;',
		T( 2 ) + 'const int nTarget = (int)( nY * m_nEditorLineCssPx * dScale );',
		T( 2 ) + 'if( nTarget == m_nLastSentTargetPx )  return;',
		T( 2 ) + 'm_nLastSentTargetPx = nTarget;',
		T( 2 ) + 'wsprintf( szMacro, L"WebBar.scrollTo( 0, %d );", nTarget );',
		T( 2 ) + 'RunWebBarMacro( szMacro );',
	].join( '\r\n' );
	s = s.replace( b, nb );
	console.log( 'B poll body ok' );
}

// C: render — cache the editor line CSS px (reuses the block's nDpi)
{
	const a = T( 4 ) + 'int nPx = MulDiv( nHeight, 96, nDpi );';
	const iFirst = s.indexOf( a );	// first occurrence = WritePreviewHtml's bFont block
	if( iFirst < 0 ){ console.log( 'C miss' ); process.exit( 1 ); }
	s = s.slice( 0, iFirst ) + a + '\r\n' + T( 4 ) + 'm_nEditorLineCssPx = MulDiv( nHeight, 96, nDpi );' + s.slice( iFirst + a.length );
	console.log( 'C render cache ok' );
}

// D: locale version
{
	const loc = 'E:/Projects/RichBar/RichBar/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( loc );
	if( buf[ 0 ] !== 0xFF || buf[ 1 ] !== 0xFE ){ console.log( 'BOM miss' ); process.exit( 1 ); }
	let t = buf.toString( 'utf16le' );
	t = t.replace( /IDS_VERSION(\s+)"0\.58\.0"/, ( m, sp ) => 'IDS_VERSION' + sp + '"0.59.0"' );
	fs.writeFileSync( loc, Buffer.from( t, 'utf16le' ) );
	console.log( 'D locale ok' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
