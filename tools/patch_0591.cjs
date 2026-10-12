// 0.59.1: width-ratio px sync on the CLEAN 0.58.0 base
// - editor scroll in px = scroll lines x editor line height (CSS px,
//   from EI_GET_VIEW_FONT cached at render)
// - preview target = editor px x (editorPaneW / previewPaneW) — the same
//   content wraps more in a narrower pane, so the narrower side scrolls
//   proportionally more; equal widths = 1:1
// - end anchors kept as the safety net
// - version 0.53.1(line) -> 0.59.x on the 0.58 base
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( 'm_nEditorLineCssPx' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );
const Q = String.fromCharCode( 34 );

// A: members (on the 0.53.1 base: m_nLastEditorY + m_nPreviewLinePx exist)
{
	const a = '\tint m_nPreviewLinePx = 26;\t// preview line height in px (font px x 1.6)';
	if( !s.includes( a ) )  fail( 'A member anchor miss' );
	const DQ = String.fromCharCode( 34 );
	s = s.replace( a, [
		'\tint m_nPreviewLinePx = 26;\t// fallback line px (delta mode)',
		'\tint m_nEditorLineCssPx = 16;\t// editor line height in CSS px (set at render)',
		'\tint m_nPreviewMaxPx = 0;\t// probed preview scrollable height in px',
		'\tint m_nLastSentTargetPx = -1;\t// last px target sent to the preview',
	].join( '\n' ) );
}

// B: replace the OnScrollerPoll middle branch: absolute px model
{
	const a = [
		T( 2 ) + 'const int nDelta = nY - m_nLastEditorY;',
		T( 2 ) + 'm_nLastEditorY = nY;',
		T( 2 ) + 'SIZE_PTR sizePage = { 0, 0 };',
		T( 2 ) + 'Editor_GetPageSize( m_hwndView, &sizePage );',
		T( 2 ) + 'const int nScrollable = (int)nLines - (int)sizePage.cy;',
	].join( '\r\n' );
	if( !s.includes( a ) )  fail( 'B head anchor miss' );
	const nw = [
		T( 2 ) + 'const int nDelta = nY - m_nLastEditorY;',
		T( 2 ) + 'm_nLastEditorY = nY;',
		T( 2 ) + 'SIZE_PTR sizePage = { 0, 0 };',
		T( 2 ) + 'Editor_GetPageSize( m_hwndView, &sizePage );',
		T( 2 ) + 'const int nScrollable = (int)nLines - (int)sizePage.cy;',
		T( 2 ) + '// width-ratio px model (user proposal): the same content',
		T( 2 ) + '// wraps more in a narrower pane, so the preview scroll (px) =',
		T( 2 ) + '// editor scroll (px) x (editorW / previewW)',
	].join( '\r\n' );
	s = s.replace( a, nw );

	// the middle body: replace the delta px lines with the absolute target
	const b = [
		T( 2 ) + 'if( nDelta == 0 )  return;',
		T( 2 ) + 'const int nPx = nDelta * m_nPreviewLinePx;',
		T( 2 ) + 'wsprintf( szMacro, L"WebBar.scrollBy( 0, %d );", nPx );',
		T( 2 ) + 'RunWebBarMacro( szMacro );\t// dropped frames are fine while scrolling',
	].join( '\r\n' );
	if( !s.includes( b ) )  fail( 'B body anchor miss' );
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
		T( 2 ) + 'TCHAR szMacro2[ 128 ];',
		T( 2 ) + 'wsprintf( szMacro2, L"WebBar.scrollTo( 0, %d );", nTarget );',
		T( 2 ) + 'RunWebBarMacro( szMacro2 );',
	].join( '\r\n' );
	s = s.replace( b, nb );
}
// NOTE on the model: WebBar.scrollTo(x, y) positions the preview page
// directly (proven: the probe jumps were visible), so an absolute px
// target self-corrects drift every poll. m_nEditorLineCssPx is set in
// WritePreviewHtml (section C of the 0.36.0-era font work).

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
