// 0.65.0: proportional scroll sync via self-contained macros
// - every 300ms (pane open), compute the editor scroll ratio:
//   ratio = scrollY / (totalLines - visibleLines)
// - on ratio change >= 0.5%: run ONE macro that positions the preview:
//   "WebBar.scrollTo(0, 99999999); var m = WebBar.ScrollY;
//    WebBar.scrollTo(0, Math.round(ratio * m));"
//   The macro is self-contained: probe the max, then position — no
//   readback, no file channel, no hstrResult dependency.
// - end anchors: ratio 0 and 1 naturally clamp to the exact page
//   top/bottom through the browser's own clamping
// - version 0.64.0 -> 0.65.0
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( '__rbSyncRatio' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );
const Q = String.fromCharCode( 34 );

// A: members — replace the delta state with the ratio state
{
	const a = '\tint m_nLastEditorY = 0;';
	if( !s.includes( a ) ){ console.log( 'A miss' ); process.exit( 1 ); }
	s = s.replace( a, '\tdouble m_dLastSentRatio = -1.0;\t// last editor ratio synced (−1 = never)' );
	console.log( 'A members ok' );
}

// B: replace OnScrollerPoll wholesale
{
	const startMarker = '\t// the 300ms poll: editor scrolled? drive the Web bar natively';
	const endMarker = '\t// JSON/JS string escape for embedding the markdown source into the';
	const i = s.indexOf( startMarker );
	const j = s.indexOf( endMarker );
	if( i < 0 || j < 0 || j <= i ){ console.log( 'B span miss' ); process.exit( 1 ); }
	const nw = [
		'\t// the 300ms poll: proportional sync — both panes to the same',
		'\t// fraction of their scrollable range. ONE self-contained macro',
		'\t// probes the max and positions — no readback, no state.',
		'\tvoid OnScrollerPoll()',
		'\t{',
		'\t\tif( !IsOfficialPaneVisible() )  return;',
		'\t\tif( !m_hwndView || !IsWindow( m_hwndView ) )  return;',
		'\t\tPOINT_PTR pt = { 0, 0 };',
		'\t\tEditor_GetScrollPos( m_hwndView, &pt );',
		'\t\tUINT_PTR nLines = Editor_GetLines( m_hwndView, TRUE );',
		'\t\tSIZE_PTR sizePage = { 0, 0 };',
		'\t\tEditor_GetPageSize( m_hwndView, &sizePage );',
		'\t\tconst int nScrollable = (int)nLines - (int)sizePage.cy;',
		'\t\tif( nScrollable < 1 )  return;',
		'\t\tdouble dRatio = (double)pt.y / (double)nScrollable;',
		'\t\tif( dRatio < 0 )  dRatio = 0;',
		'\t\tif( dRatio > 1 )  dRatio = 1;',
		'\t\tif( m_dLastSentRatio >= 0 && dRatio == m_dLastSentRatio )  return;',
		'\t\tm_dLastSentRatio = dRatio;',
		'\t\tTCHAR szMacro[ 256 ];',
		'\t\twsprintf( szMacro, L"WebBar.scrollTo( 0, 99999999 ); var m = WebBar.ScrollY; WebBar.scrollTo( 0, Math.round( %.4f * m ) );", dRatio );',
		'\t\tRunWebBarMacro( szMacro );',
		'\t}',
	].join( '\r\n' );
	s = s.slice( 0, i ) + nw + s.slice( j );
	console.log( 'B OnScrollerPoll replaced' );
}

// C: page emission — remove the duplicate ratio line
{
	const dup = '\t\t\t\tsHtml += L' + Q + 'window.__scrollRatio=' + Q + ' + sRatio + L' + Q + ';\r\n\t\t\t\tsHtml += L' + Q + 'window.__scrollRatio=' + Q + ' + sRatio + L' + Q + ';\r\n';
	const single = '\t\t\t\tsHtml += L' + Q + 'window.__scrollRatio=' + Q + ' + sRatio + L' + Q + ';\r\n';
	if( s.includes( dup ) ){
		s = s.replace( dup, single );
		console.log( 'C: duplicate emission deduped' );
	}
}

// D: version 0.64.0 -> 0.65.0
{
	const rc = 'E:/Projects/RichBar/RichBar/RichBar.rc';
	let r = fs.readFileSync( rc, 'utf8' );
	if( !r.includes( '0,64,0,0' ) ){ console.log( 'D rc miss' ); process.exit( 1 ); }
	r = r.split( '0,64,0,0' ).join( '0,65,0,0' );
	r = r.split( '0.64.0' ).join( '0.65.0' );
	fs.writeFileSync( rc, r, 'utf8' );
	const loc = 'E:/Projects/RichBar/RichBar/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( loc );
	if( buf[ 0 ] !== 0xFF || buf[ 1 ] !== 0xFE ){ console.log( 'D BOM miss' ); process.exit( 1 ); }
	let t = buf.toString( 'utf16le' );
	t = t.replace( /IDS_VERSION(\s+)"0\.64\.0"/, ( m, sp ) => 'IDS_VERSION' + sp + '"0.65.0"' );
	fs.writeFileSync( loc, Buffer.from( t, 'utf16le' ) );
	console.log( 'D versions bumped' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
