// 0.59.0: width-ratio px sync (user proposal)
// - editor scroll in px = scroll lines x editor line height (CSS px)
// - preview target = editor px x (editorPaneWidth / previewPaneWidth):
//   the same content at the same font wraps more in a narrower pane, so
//   the narrower side scrolls MORE; docking bottom (equal widths) gives
//   scale = 1 naturally
// - end anchors kept (exact top/bottom when the scale is off)
// - version 0.56.1 -> 0.59.0
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( 'm_nPreviewLineCssPx' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );

// A: member swap
{
	const a = '\tint m_nPreviewLinePx = 26;\t// preview line height in px (font px x 1.6)';
	if( !s.includes( a ) ) { console.log( 'A member anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, '\tint m_nPreviewLineCssPx = 16;\t// preview font size in CSS px (set at render)' );
}

// B: replace OnScrollerPoll wholesale
{
	const startMarker = '\t// the 300ms poll: editor scrolled? drive the Web bar natively';
	const endMarker = '\t// JSON/JS string escape for embedding the markdown source into the';
	const i = s.indexOf( startMarker );
	const j = s.indexOf( endMarker );
	if( i < 0 || j < 0 || j <= i ) { console.log( 'B span miss' ); process.exit( 1 ); }
	const nw = [
		'\t// the 300ms poll: width-ratio px sync (user model). The editor',
		'\t// scroll in lines x the editor line height (CSS px) gives the',
		'\t// editor scroll in px; the preview wraps the same content at its',
		'\t// own width, so it needs editorPx x (editorW / previewW). Docking',
		'\t// bottom (equal widths) yields scale = 1. End anchors pin the',
		'\t// exact ends regardless of the approximation.',
		'\tvoid OnScrollerPoll()',
		'\t{',
		'\t\tif( !IsOfficialPaneVisible() )  return;',
		'\t\tif( !m_hwndView || !IsWindow( m_hwndView ) )  return;',
		'\t\tPOINT_PTR pt = { 0, 0 };',
		'\t\tEditor_GetScrollPos( m_hwndView, &pt );',
		'\t\tUINT_PTR nLines = Editor_GetLines( m_hwndView, TRUE );',
		'\t\tSIZE_PTR sizePage = { 0, 0 };',
		'\t\tEditor_GetPageSize( m_hwndView, &sizePage );',
		'\t\tconst int nY = (int)pt.y;',
		'\t\tconst int nScrollable = (int)nLines - (int)sizePage.cy;',
		T( 2 ) + '\t// end anchors: the two most noticeable positions are exact',
		'\t\tTCHAR szMacro[ 128 ];',
		'\t\tif( nY >= nScrollable ){',
		'\t\t\tif( m_nLastSentAnchor != 2 ){',
		'\t\t\t\twsprintf( szMacro, L"WebBar.scrollBy( 0, 99999999 );" );',
		'\t\t\t\tRunWebBarMacro( szMacro );',
		'\t\t\t\tm_nLastSentAnchor = 2;',
		'\t\t\t}',
		'\t\t\tm_nLastEditorY = nY;',
		'\t\t\treturn;',
		'\t\t}',
		'\t\tif( nY <= 0 ){',
		'\t\t\tif( m_nLastSentAnchor != 0 ){',
		'\t\t\t\twsprintf( szMacro, L"WebBar.scrollBy( 0, -99999999 );" );',
		'\t\t\t\tRunWebBarMacro( szMacro );',
		'\t\t\t\tm_nLastSentAnchor = 0;',
		'\t\t\t}',
		'\t\t\tm_nLastEditorY = nY;',
		'\t\t\treturn;',
		'\t\t}',
		'\t\tconst int nDelta = nY - m_nLastEditorY;',
		'\t\tif( nDelta == 0 )  return;',
		'\t\tm_nLastEditorY = nY;',
		'\t\tRECT rcView = { 0, 0, 0, 0 }, rcPrev = { 0, 0, 0, 0 };',
		'\t\tGetClientRect( m_hwndView, &rcView );',
		'\t\tdouble dScale = 1.0;',
		'\t\tint nWe = rcView.right - rcView.left;',
		'\t\tint nWp = 0;',
		'\t\tif( m_hwndPreviewHost && IsWindow( m_hwndPreviewHost ) ){',
		'\t\t\tGetClientRect( m_hwndPreviewHost, &rcPrev );',
		'\t\t\tnWp = rcPrev.right - rcPrev.left;',
		'\t\t}',
		'\t\tif( nWe > 0 && nWp > 0 )  dScale = (double)nWe / (double)nWp;',
		'\t\tconst int nPx = (int)( nDelta * m_nPreviewLineCssPx * 1.6 * dScale );',
		'\t\twsprintf( szMacro, L"WebBar.scrollBy( 0, %d );", nPx );',
		'\t\tRunWebBarMacro( szMacro );\t// dropped frames are fine while scrolling',
		'\t}',
	].join( '\r\n' );
	s = s.slice( 0, i ) + nw + s.slice( j );
}

// C: cache the preview font CSS px at render
{
	const a = T( 4 ) + 'int nPx = MulDiv( nHeight, 96, nDpi );\t// device px -> CSS px';
	if( !s.includes( a ) ) { console.log( 'C anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\r\n' + T( 4 ) + 'm_nPreviewLineCssPx = nPx;' );
}

// D: version 0.56.1 -> 0.59.0
{
	const rc = 'E:/Projects/RichBar/RichBar/RichBar.rc';
	let r = fs.readFileSync( rc, 'utf8' );
	if( !r.includes( '0,58,0,0' ) ) { console.log( 'rc unexpected' ); process.exit( 1 ); }
	r = r.split( '0,58,0,0' ).join( '0,59,0,0' );
	r = r.split( '0.58.0' ).join( '0.59.0' );
	fs.writeFileSync( rc, r, 'utf8' );
	const loc = 'E:/Projects/RichBar/RichBar/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( loc );
	if( buf[ 0 ] !== 0xFF || buf[ 1 ] !== 0xFE ) { console.log( 'BOM miss' ); process.exit( 1 ); }
	let t = buf.toString( 'utf16le' );
	t = t.replace( /IDS_VERSION(\s+)"0\.56\.1"/, ( m, sp ) => 'IDS_VERSION' + sp + '"0.59.0"' );
	fs.writeFileSync( loc, Buffer.from( t, 'utf16le' ) );
	console.log( 'versions bumped to 0.59.0' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
