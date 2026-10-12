// 0.51.2: scroll queries must target the VIEW window, not the frame
// (log proof: "scroll sync: y=0 lines=44 ratio=0.0000" while the user had
// scrolled — m_hWnd is the frame window which holds no scroll info;
// m_hwndView is the editor view from the plug-in OnCommand contract)
// - WritePreviewHtml ratio block: m_hWnd -> m_hwndView (GetScrollPos+GetLines)
// - OnScrollerPoll: same
// - OnScrollerPoll logs the pushed ratio when it changes
// - version 0.51.1 -> 0.51.2
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
const T = n => '\t'.repeat( n );

// A: ratio block in WritePreviewHtml
{
	const a = [
		T( 3 ) + 'POINT_PTR ptScroll = { 0, 0 };',
		T( 3 ) + 'Editor_GetScrollPos( m_hWnd, &ptScroll );',
		T( 3 ) + 'UINT_PTR nLines = Editor_GetLines( m_hWnd, TRUE );\t// logical lines',
	].join( '\r\n' );
	if( !s.includes( a ) ) { console.log( 'A anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, [
		T( 3 ) + 'POINT_PTR ptScroll = { 0, 0 };',
		T( 3 ) + 'Editor_GetScrollPos( m_hwndView, &ptScroll );\t// the VIEW scrolls, not the frame',
		T( 3 ) + 'UINT_PTR nLines = Editor_GetLines( m_hwndView, TRUE );\t// logical lines',
	].join( '\r\n' ) );
}

// B: OnScrollerPoll
{
	const a = [
		T( 2 ) + 'POINT_PTR ptScroll = { 0, 0 };',
		T( 2 ) + 'Editor_GetScrollPos( m_hWnd, &ptScroll );',
		T( 2 ) + 'UINT_PTR nLines = Editor_GetLines( m_hWnd, TRUE );',
	].join( '\r\n' );
	if( !s.includes( a ) ) { console.log( 'B anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, [
		T( 2 ) + 'POINT_PTR ptScroll = { 0, 0 };',
		T( 2 ) + 'Editor_GetScrollPos( m_hwndView, &ptScroll );\t// the VIEW scrolls, not the frame',
		T( 2 ) + 'UINT_PTR nLines = Editor_GetLines( m_hwndView, TRUE );',
	].join( '\r\n' ) );
}

// C: log the pushed ratio (inside WriteScrollerSync after the write)
{
	const a = T( 2 ) + 'm_dLastSentRatio = dRatio;';
	if( !s.includes( a ) ) { console.log( 'C anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\r\n' + T( 2 ) + 'RbLogF( "scroll push: ratio=%.4f", dRatio );' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( '0.51.2 patches OK' );
