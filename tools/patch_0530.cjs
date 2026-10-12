// 0.53.0: NATIVE live scroll sync via WebBar.scrollBy (v26.3+)
// - the file channel (RichBarSync.js + page poller) is REMOVED: the
//   browser-verified page logic worked, but the file:// delivery in the
//   real Web bar never updated (cache/permission semantics unknown)
// - NEW: the 300ms poll reads the editor scroll (EE_GET_SCROLL_POS on
//   m_hwndView); on delta it runs the NATIVE macro
//   "WebBar.scrollBy(0, deltaLines*linePx)" — same-process, no files
// - linePx = the injected preview font size x 1.6 (computed at render,
//   cached in m_nPreviewLinePx)
// - render-time restore stays page-side (inline __scrollRatio injection)
// - version 0.52.0 -> 0.53.0
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( !s.includes( 'RichBarSync.js' ) ) { console.log( 'channel missing — wrong base' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );
const Q = String.fromCharCode( 34 );
const SQ = String.fromCharCode( 39 );

// A: members — replace m_dLastSentRatio with the two native ones
{
	const a = '\tdouble m_dLastSentRatio = -1.0;\t// last ratio pushed to RichBarSync.js';
	if( !s.includes( a ) ) { console.log( 'A anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, [
		'\tint m_nLastEditorY = 0;\t\t// last editor scroll line seen by the poll',
		'\tint m_nPreviewLinePx = 26;\t// preview line height in px (font px x 1.6)',
	].join( '\n' ) );
}

// B: replace WriteScrollerSync/StartScrollerPoll/OnScrollerPoll wholesale
{
	const startMarker = '\t// write the scroll-ratio sync file consumed by the preview page';
	const endMarker = '\t// JSON/JS string escape for embedding the markdown source into the';
	const i = s.indexOf( startMarker );
	const j = s.indexOf( endMarker );
	if( i < 0 || j < 0 || j <= i ) { console.log( 'B span miss' ); process.exit( 1 ); }
	const nw = [
		T( 1 ) + '// remember the preview line height (px) for the scroll sync',
		T( 1 ) + 'void SetPreviewLinePx( int nPx )',
		T( 1 ) + '{',
		T( 2 ) + 'm_nPreviewLinePx = ( nPx > 8 ) ? ( nPx * 16 / 10 ) : 26;',
		T( 1 ) + '}',
		'',
		T( 1 ) + 'void StartScrollerPoll()',
		T( 1 ) + '{',
		T( 2 ) + 'POINT_PTR pt = { 0, 0 };',
		T( 2 ) + 'if( m_hwndView && IsWindow( m_hwndView ) ){',
		T( 3 ) + 'Editor_GetScrollPos( m_hwndView, &pt );',
		T( 2 ) + '}',
		T( 2 ) + 'm_nLastEditorY = (int)pt.y;\t// no jump on open',
		T( 2 ) + 'if( m_hDlg )  SetTimer( m_hDlg, IDT_SCROLLER_POLL, 300, NULL );',
		T( 1 ) + '}',
		'',
		T( 1 ) + '// the 300ms poll: editor scrolled? drive the Web bar natively',
		T( 1 ) + 'void OnScrollerPoll()',
		T( 1 ) + '{',
		T( 2 ) + 'if( !IsOfficialPaneVisible() )  return;',
		T( 2 ) + 'if( !m_hwndView || !IsWindow( m_hwndView ) )  return;',
		T( 2 ) + 'POINT_PTR pt = { 0, 0 };',
		T( 2 ) + 'Editor_GetScrollPos( m_hwndView, &pt );',
		T( 2 ) + 'const int nY = (int)pt.y;',
		T( 2 ) + 'const int nDelta = nY - m_nLastEditorY;',
		T( 2 ) + 'if( nDelta == 0 )  return;',
		T( 2 ) + 'm_nLastEditorY = nY;',
		T( 2 ) + 'const int nPx = nDelta * m_nPreviewLinePx;',
		T( 2 ) + 'TCHAR szMacro[ 128 ];',
		T( 2 ) + 'wsprintf( szMacro, L"WebBar.scrollBy( 0, %d );", nPx );',
		T( 2 ) + 'RunWebBarMacro( szMacro );\t// dropped frames are fine while scrolling',
		T( 1 ) + '}',
		'',
	].join( '\r\n' );
	s = s.slice( 0, i ) + nw + s.slice( j );
}

// C: page side — remove the file-channel lines, restore the inline ratio
{
	// C1: remove __rbSetRatio and the poller lines
	const drop = [
		'\t\t\t\tsHtml += L"function __rbSetRatio(r){window.__scrollRatio=r;__rbRestore();}";',
		'\t\t\t\tsHtml += L"window.__rbPoll=function(){var s=document.createElement(\'script\');s.src=\'RichBarSync.js?cb=\'+Date.now();document.body.appendChild(s);};";',
		'\t\t\t\tsHtml += L"setInterval(window.__rbPoll,250);";',
	];
	for( const d of drop ){
		if( !s.includes( d ) ) { console.log( 'C drop anchor miss: ' + d.slice( 0, 60 ) ); process.exit( 1 ); }
		s = s.replace( d + '\r\n', '' );
		s = s.replace( d + '\n', '' );
	}

	// C2: re-add the inline ratio injection after the __md close (line with
	// `sHtml += L"\";"` followed by the render line)
	const renderLine = s.indexOf( "document.getElementById('content').innerHTML=marked.parse" );
	if( renderLine < 0 ) { console.log( 'C2 render anchor miss' ); process.exit( 1 ); }
	const lineStart = s.lastIndexOf( '\r\n', renderLine ) + 2;
	const inject = T( 4 ) + 'sHtml += L"window.__scrollRatio=" + sRatio + L";";\r\n';
	s = s.slice( 0, lineStart ) + inject + s.slice( lineStart );
	// sRatio must be computed before it: move the szRatio block from after
	// JsEscape to before this injection — check where it sits now
	const iRatio = s.indexOf( 'TCHAR szRatio[ 64 ];' );
	const iInject = s.indexOf( 'sHtml += L"window.__scrollRatio=" + sRatio' );
	if( iRatio < 0 || iInject < 0 || iRatio > iInject ){
		// move the 3-line block
		const block = [
			T( 4 ) + 'TCHAR szRatio[ 64 ];',
			T( 4 ) + 'StringPrintf( szRatio, _countof( szRatio ), _T("%.4f"), dScrollRatio );',
			T( 4 ) + 'tstring sRatio = szRatio;',
		].join( '\r\n' ) + '\r\n';
		const iB = s.indexOf( block );
		if( iB < 0 ) { console.log( 'ratio block not found for move' ); process.exit( 1 ); }
		s = s.replace( block, '' );
		s = s.slice( 0, lineStart ) + block + s.slice( lineStart );
	}

	// C3: SetPreviewLinePx where nPx is computed in the MD branch
	const aC3 = '\t\t\t\tint nPx = MulDiv( nHeight, 96, nDpi );\t// device px -> CSS px';
	if( !s.includes( aC3 ) ) { console.log( 'C3 anchor miss' ); process.exit( 1 ); }
	s = s.replace( aC3, aC3 + '\r\n' + T( 4 ) + 'SetPreviewLinePx( nPx );' );
}

// D: version 0.52.0 -> 0.53.0
{
	const rc = 'E:/Projects/RichBar/RichBar/RichBar.rc';
	let r = fs.readFileSync( rc, 'utf8' );
	if( !r.includes( '0,52,0,0' ) )  fail( 'rc does not read 0,52,0,0' );
	r = r.split( '0,52,0,0' ).join( '0,53,0,0' );
	r = r.split( '0.52.0' ).join( '0.53.0' );
	fs.writeFileSync( rc, r, 'utf8' );
	const loc = 'E:/Projects/RichBar/RichBar/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( loc );
	if( buf[ 0 ] !== 0xFF || buf[ 1 ] !== 0xFE )  fail( 'locale rc BOM missing' );
	let t = buf.toString( 'utf16le' );
	t = t.replace( /IDS_VERSION(\s+)"0\.52\.0"/, ( m, sp ) => 'IDS_VERSION' + sp + '"0.53.0"' );
	fs.writeFileSync( loc, Buffer.from( t, 'utf16le' ) );
	console.log( 'versions bumped to 0.53.0' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
