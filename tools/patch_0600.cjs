// 0.60.0: live scroll sync via the sync-file channel (industry-standard
// proportional mapping; browser-verified page logic)
// - page: __rbSetRatio(r) sets window.__scrollRatio and restores; a 250ms
//   poller fetches RichBarSync.js?cb=<now> (unique URL defeats caching);
//   the page computes its own max scroll, so ANY pane geometry adapts
// - plugin: OnScrollerPoll (300ms, pane-open only) computes the editor
//   ratio = scrollY / (totalLines - visibleLines) and writes the sync file
//   on change >= 0.5% (plain fwrite — no macros, no cold-start dependency)
// - end anchors + native scroll calls removed (ratio 0/1 clamp exactly)
// - duplicate emission line removed
// - version 0.59.0 -> 0.60.0
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( 'RichBarSync.js' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );
const Q = String.fromCharCode( 34 );

// A: member
{
	const a = '\tint m_nLastSentAnchor = -1;';
	if( !s.includes( a ) ){ console.log( 'A member miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\n' + T( 1 ) + 'double m_dLastSentRatio = -1.0;\t// last editor ratio written to the sync file' );
}

// B: StartScrollerPoll — seed the ratio
{
	const b = '\t\tm_nLastEditorY = (int)pt.y;';
	if( !s.includes( b ) ){ console.log( 'B seed miss' ); process.exit( 1 ); }
	s = s.replace( b, b + '\n' + T( 2 ) + 'm_dLastSentRatio = -1.0;' );
}

// C: OnScrollerPoll wholesale replacement
{
	const startMarker = '\t// the 300ms poll: editor scrolled? drive the Web bar natively';
	const endMarker = '\t// JSON/JS string escape for embedding the markdown source into the';
	const i = s.indexOf( startMarker );
	const j = s.indexOf( endMarker );
	if( i < 0 || j < 0 || j <= i ){ console.log( 'C span miss' ); process.exit( 1 ); }
	const nw = [
		'\t// the 300ms poll: proportional sync via the sync-file channel.',
		'\t// editor ratio = scrollY / (totalLines - visibleLines); on change',
		'\t// (>= 0.5%) it is written to RichBarSync.js and the preview page -',
		'\t// which polls the file - positions itself by its own real metrics.',
		'\t// Works for ANY pane geometry (width or height differences).',
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
		'\t\tdouble dDiff = dRatio - m_dLastSentRatio;',
		'\t\tif( dDiff < 0 )  dDiff = -dDiff;',
		'\t\tif( dDiff < 0.005 )  return;',
		'\t\tTCHAR szPath[ MAX_PATH ];',
		'\t\tTCHAR szBody[ 64 ];',
		'\t\tGetTempPath( MAX_PATH, szPath );',
		'\t\twcscat_s( szPath, MAX_PATH, L"RichBarSync.js" );',
		'\t\twsprintf( szBody, L"__rbSetRatio(%.4f);", dRatio );',
		'\t\tFILE* f = _wfopen( szPath, L"wb" );',
		'\t\tif( !f )  return;',
		'\t\tfwrite( szBody, sizeof( WCHAR ), wcslen( szBody ), f );',
		'\t\tfclose( f );',
		'\t\tm_dLastSentRatio = dRatio;',
		'\t\tRbLogF( ' + Q + 'scroll sync: ratio=%.4f' + Q + ', dRatio );',
		'\t}',
	].join( '\r\n' );
	s = s.slice( 0, i ) + nw + s.slice( j );
	console.log( 'C poll replaced' );
}

// D: page emission — add __rbSetRatio + poller after __rbRestore();, and
// remove the duplicated __scrollRatio line
{
	const dup = Q + 'window.__scrollRatio=' + Q + ' + sRatio + L' + Q + ';' + Q + ';\r\n' + Q + 'window.__scrollRatio=' + Q + ' + sRatio + L' + Q + ';\r\n';
	// simpler: find the doubled emission by content
	const dupA = '\t\t\t\tsHtml += L"window.__scrollRatio=" + sRatio + L";";\r\n';
	let count = 0, pos = 0;
	while( ( pos = s.indexOf( dupA, pos ) ) >= 0 ){ count++; pos += dupA.length; }
	// dedupe: keep only the FIRST emission, drop any duplicates after it
	let first = s.indexOf( dupA );
	while( true ){
		const second = s.indexOf( dupA, first + dupA.length );
		if( second < 0 )  break;
		s = s.slice( 0, second ) + s.slice( second + dupA.length );
	}
	first = s.indexOf( dupA );
	console.log( 'D: duplicate emission removed' );

	// add __rbSetRatio + poller after the __rbRestore(); call line
	const anchor = '\t\t\t\tsHtml += L"__rbRestore();";';
	if( !s.includes( anchor ) ){ console.log( 'D restore-anchor miss' ); process.exit( 1 ); }
	const nw = [
		anchor,
		'\t\t\t\tsHtml += L"function __rbSetRatio(r){window.__scrollRatio=r;__rbRestore();}";',
		'\t\t\t\tsHtml += L"window.__rbPoll=function(){var s=document.createElement(\'script\');s.src=\'RichBarSync.js?cb=\'+Date.now();document.body.appendChild(s);};";',
		'\t\t\t\tsHtml += L"setInterval(window.__rbPoll,250);";',
	].join( '\r\n' );
	s = s.replace( anchor, nw );
	console.log( 'D page emission ok' );
}

// E: version 0.59.0 -> 0.60.0
{
	const rc = 'E:/Projects/RichBar/RichBar/RichBar.rc';
	let r = fs.readFileSync( rc, 'utf8' );
	if( !r.includes( '0,59,0,0' ) ){ console.log( 'E rc miss' ); process.exit( 1 ); }
	r = r.split( '0,59,0,0' ).join( '0,60,0,0' );
	r = r.split( '0.59.0' ).join( '0.60.0' );
	fs.writeFileSync( rc, r, 'utf8' );
	const loc = 'E:/Projects/RichBar/RichBar/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( loc );
	if( buf[ 0 ] !== 0xFF || buf[ 1 ] !== 0xFE ){ console.log( 'E BOM miss' ); process.exit( 1 ); }
	let t = buf.toString( 'utf16le' );
	t = t.replace( /IDS_VERSION(\s+)"0\.59\.0"/, ( m, sp ) => 'IDS_VERSION' + sp + '"0.60.0"' );
	fs.writeFileSync( loc, Buffer.from( t, 'utf16le' ) );
	console.log( 'E versions bumped' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
