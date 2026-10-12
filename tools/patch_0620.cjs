// 0.62.0: live sync via the sync-file channel (probe confirmed?) — final
// design: the page polls RichBarSync.js?cb=<now> every 250ms; the plugin
// writes __rbSetRatio(r); whenever the editor ratio changes >= 0.5%.
// OnScrollerPoll becomes the ratio writer (no native scroll calls).
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( 'WriteScrollerSync' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );

// A: member
{
	const a = '\tint m_nLastEditorY = 0;';
	if( !s.includes( a ) ){ console.log( 'A miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\n' + T( 1 ) + 'double m_dLastSentRatio = -1.0;\t// last ratio written to RichBarSync.js' );
}

// B: WriteScrollerSync before OnScrollerPoll
{
	const a = '\tvoid OnScrollerPoll()';
	const i = s.indexOf( a );
	if( i < 0 ){ console.log( 'B anchor miss' ); process.exit( 1 ); }
	const nw = [
		T( 1 ) + '// write the editor scroll ratio for the preview page (it polls',
		T( 1 ) + '// this file and positions itself by its own real metrics)',
		T( 1 ) + 'void WriteScrollerSync( double dRatio )',
		T( 1 ) + '{',
		T( 2 ) + 'TCHAR szPath[ MAX_PATH ];',
		T( 2 ) + 'TCHAR szBody[ 64 ];',
		T( 2 ) + 'GetTempPath( MAX_PATH, szPath );',
		T( 2 ) + 'wcscat_s( szPath, MAX_PATH, L"RichBarSync.js" );',
		T( 2 ) + 'wsprintf( szBody, L"__rbSetRatio(%.4f);", dRatio );',
		T( 2 ) + 'FILE* f = _wfopen( szPath, L"wb" );',
		T( 2 ) + 'if( !f )  return;',
		T( 2 ) + 'fwrite( szBody, sizeof( WCHAR ), wcslen( szBody ), f );',
		T( 2 ) + 'fclose( f );',
		T( 2 ) + 'm_dLastSentRatio = dRatio;',
		T( 1 ) + '}',
		'',
	].join( '\r\n' ) + '\r\n';
	s = s.slice( 0, i ) + nw + s.slice( i );
	console.log( 'B writer added' );
}

// C: OnScrollerPoll — ratio writer (replaces the px model + anchors)
{
	const startMarker = '\t// the 300ms poll: width-ratio px sync (user model). The editor';
	const endMarker = '\t// JSON/JS string escape for embedding the markdown source into the';
	const i = s.indexOf( startMarker );
	const j = s.indexOf( endMarker );
	if( i < 0 || j < 0 || j <= i ){ console.log( 'C span miss' ); process.exit( 1 ); }
	const nw = [
		'\t// the 300ms poll: write the editor scroll ratio for the preview',
		'\t// page (it polls the file and positions itself by its own metrics)',
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
		'\t\tWriteScrollerSync( dRatio );',
		'\t}',
	].join( '\r\n' );
	s = s.slice( 0, i ) + nw + s.slice( j );
	console.log( 'C poll replaced' );
}

// D: StartScrollerPoll — seed the ratio
{
	const a = '\t\tm_nLastEditorY = (int)pt.y;';
	if( !s.includes( a ) ){ console.log( 'D seed miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\n' + T( 2 ) + 'm_dLastSentRatio = -1.0;' );
	console.log( 'D seed ok' );
}

// E: version 0.61.0 -> 0.62.0
{
	const rc = 'E:/Projects/RichBar/RichBar/RichBar.rc';
	let r = fs.readFileSync( rc, 'utf8' );
	if( !r.includes( '0,61,0,0' ) ){ console.log( 'E rc miss' ); process.exit( 1 ); }
	r = r.split( '0,61,0,0' ).join( '0,62,0,0' );
	r = r.split( '0.61.0' ).join( '0.62.0' );
	fs.writeFileSync( rc, r, 'utf8' );
	const loc = 'E:/Projects/RichBar/RichBar/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( loc );
	if( buf[ 0 ] !== 0xFF || buf[ 1 ] !== 0xFE ){ console.log( 'E BOM miss' ); process.exit( 1 ); }
	let t = buf.toString( 'utf16le' );
	t = t.replace( /IDS_VERSION(\s+)"0\.61\.0"/, ( m, sp ) => 'IDS_VERSION' + sp + '"0.62.0"' );
	fs.writeFileSync( loc, Buffer.from( t, 'utf16le' ) );
	console.log( 'E versions bumped' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
