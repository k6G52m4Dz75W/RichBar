// 0.61.0: direct px delta sync with the width-ratio scale (user model)
// - the poll computes the editor scroll delta (lines), converts to px
//   (delta x preview font CSS px x 1.6 line-height), scales by the pane
//   width ratio (editorW / previewW — the narrower side wraps more), and
//   feeds it straight to WebBar.scrollBy — no files, no page polling
// - members: m_nPreviewLineCssPx added (preview font CSS px, set at
//   render); m_dLastSentRatio removed (unused)
// - version 0.60.0 -> 0.61.0
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( 'm_nPreviewLineCssPx' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );
const Q = String.fromCharCode( 34 );

// A: members — swap m_dLastSentRatio for m_nPreviewLineCssPx
{
	const a = '\tdouble m_dLastSentRatio = -1.0;\t// last editor ratio written to the sync file';
	if( !s.includes( a ) ){ console.log( 'A member miss' ); process.exit( 1 ); }
	s = s.replace( a, '\tint m_nPreviewLineCssPx = 16;\t// preview font size in CSS px (set at render)' );
}

// B: StartScrollerPoll — drop the ratio seed
{
	const b = T( 2 ) + 'm_dLastSentRatio = -1.0;';
	if( !s.includes( b ) ){ console.log( 'B seed miss' ); process.exit( 1 ); }
	s = s.replace( b, '' );
}

// C: OnScrollerPoll — direct px delta model
{
	const i = s.indexOf( '\tvoid OnScrollerPoll()' );
	const j = s.indexOf( '\t// JSON/JS string escape', i );
	if( i < 0 || j < 0 || j <= i ){ console.log( 'C span miss' ); process.exit( 1 ); }
	const nw = [
		'\tvoid OnScrollerPoll()',
		'\t{',
		'\t\tif( !IsOfficialPaneVisible() )  return;',
		'\t\tif( !m_hwndView || !IsWindow( m_hwndView ) )  return;',
		'\t\tPOINT_PTR pt = { 0, 0 };',
		'\t\tEditor_GetScrollPos( m_hwndView, &pt );',
		'\t\tconst int nY = (int)pt.y;',
		'\t\tconst int nDelta = nY - m_nLastEditorY;',
		'\t\tif( nDelta == 0 )  return;',
		'\t\tm_nLastEditorY = nY;',
		'\t\t// px model with the pane width ratio (user proposal): the same',
		'\t\t// content wraps more in a narrower pane, so the preview scroll =',
		'\t\t// editor scroll px x (editorW / previewW)',
		'\t\tRECT rcView = { 0, 0, 0, 0 }, rcPrev = { 0, 0, 0, 0 };',
		'\t\tGetClientRect( m_hwndView, &rcView );',
		'\t\tint nWe = rcView.right - rcView.left;',
		'\t\tint nWp = 0;',
		'\t\tif( m_hwndPreviewHost && IsWindow( m_hwndPreviewHost ) ){',
		'\t\t\tGetClientRect( m_hwndPreviewHost, &rcPrev );',
		'\t\t\tnWp = rcPrev.right - rcPrev.left;',
		'\t\t}',
		'\t\tdouble dScale = ( nWe > 0 && nWp > 0 ) ? (double)nWe / (double)nWp : 1.0;',
		'\t\tconst int nPx = (int)( nDelta * m_nPreviewLineCssPx * 1.6 * dScale );',
		'\t\tTCHAR szMacro[ 128 ];',
		'\t\twsprintf( szMacro, L"WebBar.scrollBy( 0, %d );", nPx );',
		'\t\tRunWebBarMacro( szMacro );\t// dropped frames are fine while scrolling',
		'\t}',
	].join( '\r\n' );
	s = s.slice( 0, i ) + nw + s.slice( j );
	console.log( 'C poll replaced' );
}

// D: render — cache the preview font CSS px (reuse the block's nDpi)
{
	const a = T( 4 ) + 'int nPx = MulDiv( nHeight, 96, nDpi );';
	const iFirst = s.indexOf( a );
	if( iFirst < 0 ){ console.log( 'D anchor miss' ); process.exit( 1 ); }
	s = s.slice( 0, iFirst ) + a + '\r\n' + T( 4 ) + 'm_nPreviewLineCssPx = nPx;' + s.slice( iFirst + a.length );
	console.log( 'D render cache ok' );
}

// E: version 0.60.0 -> 0.61.0
{
	const rc = 'E:/Projects/RichBar/RichBar/RichBar.rc';
	let r = fs.readFileSync( rc, 'utf8' );
	if( !r.includes( '0,60,0,0' ) ){ console.log( 'E rc miss' ); process.exit( 1 ); }
	r = r.split( '0,60,0,0' ).join( '0,61,0,0' );
	r = r.split( '0.60.0' ).join( '0.61.0' );
	fs.writeFileSync( rc, r, 'utf8' );
	const loc = 'E:/Projects/RichBar/RichBar/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( loc );
	if( buf[ 0 ] !== 0xFF || buf[ 1 ] !== 0xFE ){ console.log( 'E BOM miss' ); process.exit( 1 ); }
	let t = buf.toString( 'utf16le' );
	t = t.replace( /IDS_VERSION(\s+)"0\.60\.0"/, ( m, sp ) => 'IDS_VERSION' + sp + '"0.61.0"' );
	fs.writeFileSync( loc, Buffer.from( t, 'utf16le' ) );
	console.log( 'E versions bumped' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
