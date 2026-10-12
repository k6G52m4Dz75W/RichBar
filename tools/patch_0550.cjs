// 0.55.0: proportional sync, attempt 2 (with the 0.54.0 deadlock cured)
// - probe macro returns String(m) so hstrResult actually fills (0.54.0's
//   numeric return never populated it and the gated scroll froze)
// - probe limited to 3 attempts per render; after that the poll falls back
//   to the proven 0.53.1 relative-delta mode — never freezes again
// - proportional path: preview target = editor ratio x probed previewMax
// - version 0.53.1 -> 0.55.0
const fs = require( 'fs' );
const p = 'E:/Projects/RichBar/RichBar/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );
if( s.includes( 'm_nProbeFails' ) ) { console.log( 'already patched' ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );
const Q = String.fromCharCode( 34 );
const BS = String.fromCharCode( 92 );

// A: members
{
	const a = '\tint m_nLastEditorY = 0;';
	if( !s.includes( a ) ) { console.log( 'A member anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\n' + T( 1 ) + 'int m_nPreviewMaxPx = 0;\t\t// probed preview scrollable height in px' + '\n' + T( 1 ) + 'int m_nLastSentTargetPx = -1;\t// last px target sent to the preview' + '\n' + T( 1 ) + 'int m_nProbeFails = 0;\t\t// consecutive probe failures (per render)' );
}

// B: StartScrollerPoll — reset probe state per open/render
{
	const a = [
		T( 2 ) + 'm_nLastEditorY = (int)pt.y;\t// no jump on open',
	].join( '\r\n' );
	if( !s.includes( a ) ) { console.log( 'B anchor miss' ); process.exit( 1 ); }
	s = s.replace( a, a + '\r\n' + T( 2 ) + 'm_nPreviewMaxPx = 0;' + '\r\n' + T( 2 ) + 'm_nProbeFails = 0;' + '\r\n' + T( 2 ) + 'm_nLastSentTargetPx = -1;' );
}

// C: replace OnScrollerPoll wholesale
{
	const startMarker = '\t// the 300ms poll: editor scrolled? drive the Web bar natively';
	const endMarker = '\t// JSON/JS string escape for embedding the markdown source into the';
	const i = s.indexOf( startMarker );
	const j = s.indexOf( endMarker );
	if( i < 0 || j < 0 || j <= i ) { console.log( 'C span miss' ); process.exit( 1 ); }
	const nw = [
		'\t// the 300ms poll: proportional sync with a safe fallback.',
		'\t// editor ratio = scrollY / (totalLines - visibleLines); the preview',
		'\t// is driven to ratio x previewMax (probed natively). If the probe',
		'\t// fails 3 times (engine cold start, property issues) the poll',
		'\t// degrades to the proven relative-delta mode - never freezes.',
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
		'\t\tconst int nDelta = nY - m_nLastEditorY;',
		'\t\tm_nLastEditorY = nY;',
		'\t\tconst int nScrollable = (int)nLines - (int)sizePage.cy;',
		'\t\tdouble dRatio = 0.0;',
		'\t\tif( nScrollable > 0 ){',
		'\t\t\tdRatio = (double)nY / (double)nScrollable;',
		'\t\t\tif( dRatio < 0 )  dRatio = 0;',
		'\t\t\tif( dRatio > 1 )  dRatio = 1;',
		'\t\t}',
		'\t\tif( m_nPreviewMaxPx <= 0 ){',
		'\t\t\tif( m_nProbeFails < 3 ){',
		T( 3 ) + '\t// probe: jump to the end to read max, position to the ratio,',
		T( 3 ) + '\t// return the max AS A STRING (a numeric return never fills',
		T( 3 ) + '\t// hstrResult - the 0.54.0 deadlock)',
		'\t\t\t\tTCHAR szProbe[ 256 ];',
		'\t\t\t\twsprintf( szProbe, L"WebBar.scrollTo( 0, 99999999 ); var m = WebBar.scrollY; WebBar.scrollTo( 0, Math.round( %.4f * m ) ); return String(m);", dRatio );',
		'\t\t\t\tRUN_MACRO_INFO rmi;',
		'\t\t\t\tZeroMemory( &rmi, sizeof( rmi ) );',
		'\t\t\t\trmi.cbSize = sizeof( rmi );',
		'\t\t\t\trmi.nFlags = RUN_TEXT;',
		'\t\t\t\trmi.pszText = L' + Q + '#language=' + BS + Q + 'V8' + BS + Q + BS + 'n' + Q + ' + szProbe;',
		'\t\t\t\trmi.nDefMacroLang = MACRO_LANG_V8 | MACRO_SYNC_ONLY;',
		'\t\t\t\trmi.ptErrorPos.x = rmi.ptErrorPos.y = -1;',
		'\t\t\t\tHRESULT hr = (HRESULT)SendMessage( m_hWnd, EE_RUN_MACRO, 0, (LPARAM)&rmi );',
		'\t\t\t\tif( hr == S_OK && rmi.hstrResult ){',
		'\t\t\t\t\tLPCWSTR pMax = (LPCWSTR)GlobalLock( rmi.hstrResult );',
		'\t\t\t\t\tif( pMax ){',
		'\t\t\t\t\t\tm_nPreviewMaxPx = _wtoi( pMax );',
		'\t\t\t\t\t\tGlobalUnlock( rmi.hstrResult );',
		'\t\t\t\t\t\tGlobalFree( rmi.hstrResult );',
		'\t\t\t\t\t\tm_nLastSentTargetPx = (int)( dRatio * m_nPreviewMaxPx );\t// already positioned',
		'\t\t\t\t\t\tRbLogF( ' + Q + 'scroll probe: max=%d ratio=%.4f' + Q + ', m_nPreviewMaxPx, dRatio );',
		'\t\t\t\t\t}',
		'\t\t\t\t\telse {',
		'\t\t\t\t\t\tGlobalFree( rmi.hstrResult );',
		'\t\t\t\t\t}',
		'\t\t\t\t}',
		'\t\t\t\telse {',
		'\t\t\t\t\tm_nProbeFails++;',
		'\t\t\t\t\tRbLogF( ' + Q + 'scroll probe failed hr=0x%08X (%d)' + Q + ', (unsigned)hr, m_nProbeFails );',
		'\t\t\t\t}',
		'\t\t\t}',
		'\t\t\telse if( nDelta != 0 ){',
		'\t\t\t\t// fallback: the proven relative-delta mode',
		'\t\t\t\tconst int nPx = nDelta * m_nPreviewLinePx;',
		'\t\t\t\tTCHAR szMacro[ 128 ];',
		'\t\t\t\twsprintf( szMacro, L"WebBar.scrollBy( 0, %d );", nPx );',
		'\t\t\t\tRunWebBarMacro( szMacro );',
		'\t\t\t}',
		'\t\t\treturn;',
		'\t\t}',
		'\t\t// proportional path',
		'\t\tconst int nTarget = (int)( dRatio * m_nPreviewMaxPx );',
		'\t\tif( nTarget == m_nLastSentTargetPx )  return;',
		'\t\tm_nLastSentTargetPx = nTarget;',
		'\t\tTCHAR szMacro[ 128 ];',
		'\t\twsprintf( szMacro, L"WebBar.scrollTo( 0, %d );", nTarget );',
		'\t\tRunWebBarMacro( szMacro );',
		'\t}',
	].join( '\r\n' );
	s = s.slice( 0, i ) + nw + s.slice( j );
}

// D: version 0.53.1 -> 0.55.0
{
	const rc = 'E:/Projects/RichBar/RichBar/RichBar.rc';
	let r = fs.readFileSync( rc, 'utf8' );
	if( !r.includes( '0,53,1,0' ) ) { console.log( 'rc unexpected' ); process.exit( 1 ); }
	r = r.split( '0,53,1,0' ).join( '0,55,0,0' );
	r = r.split( '0.53.1' ).join( '0.55.0' );
	fs.writeFileSync( rc, r, 'utf8' );
	const loc = 'E:/Projects/RichBar/RichBar/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( loc );
	if( buf[ 0 ] !== 0xFF || buf[ 1 ] !== 0xFE ) { console.log( 'BOM miss' ); process.exit( 1 ); }
	let t = buf.toString( 'utf16le' );
	t = t.replace( /IDS_VERSION(\s+)"0\.53\.1"/, ( m, sp ) => 'IDS_VERSION' + sp + '"0.55.0"' );
	fs.writeFileSync( loc, Buffer.from( t, 'utf16le' ) );
	console.log( 'versions bumped to 0.55.0' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
