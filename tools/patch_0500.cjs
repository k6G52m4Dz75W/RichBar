// 0.50.0: 26.3.0 modernization with old-version fallback (user-directed)
//
// Gate: HasNewApi() = Editor_GetVersion >= 26.3.0 (26.3.0 encodes as
// 26*1000+3*100+0 = 26300; EE_GET_VERSION returns major*1000+minor*100+build).
//
// 1. GetDocTextAll: NEW API runs an in-memory macro "return document.Text;"
//    and takes EE_RUN_MACRO's hstrResult (no clipboard, no selection dance,
//    works in Fast View mode); OLD path = the clipboard dance (kept verbatim
//    as fallback).
// 2. Scroll sync: WritePreviewHtml injects window.__scrollRatio (editor
//    scroll line / total lines via EE_GET_SCROLL_POS + EE_GET_LINES); the
//    preview page restores its scroll from it after render — preview stays
//    aligned with the editor. Manual preview scrolling between refreshes is
//    authoritative until the next refresh (sync, not lock).
// 3. Version 0.44.x/0.45.x -> 0.50.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';
const p = ROOT + '/RichBar.h';
let s = fs.readFileSync( p, 'utf8' );

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }
const T = n => '\t'.repeat( n );

if( s.includes( 'HasNewApi' ) )  fail( 'already patched' );

// ---------- A: member + gate helper ----------
{
	const a = '\tbool m_bStartupSettled = false;\t// pane open/close suppressed until the session restore finishes';
	if( !s.includes( a ) )  fail( 'member anchor not found' );
	s = s.replace( a, a + '\r\n\tbool m_bNewApi = false;\t\t// cached: EmEditor >= 26.3.0 (document.Text macro, WebBar scroll)' );

	// helper before GetDocTextAll
	const b = '\t// the whole document text, line by line (the SDK has no whole-text API)';
	if( !s.includes( b ) )  fail( 'GetDocTextAll comment anchor not found' );
	const helper = [
		'\t// EmEditor 26.3.0+ gate: macros run in Fast View mode and the',
		'\t// Document object gained Text/TextLength; WebBar gained scrollBy/',
		'\t// scrollTo/scrollX/scrollY. EE_GET_VERSION encodes major*1000+',
		'\t// minor*100+build (26.3.0 = 26300).',
		'\tbool HasNewApi()',
		'\t{',
		'\t\tif( !m_bNewApi ){',
		'\t\t\tm_bNewApi = ( Editor_GetVersion( m_hWnd ) >= 26300 );',
		'\t\t\tRbLogF( "new api gate: %d (version %u)", (int)m_bNewApi, Editor_GetVersion( m_hWnd ) );',
		'\t\t}',
		'\t\treturn m_bNewApi;',
		'\t}',
		'',
	].join( '\r\n' );
	s = s.slice( 0, s.indexOf( b ) ) + helper + s.slice( s.indexOf( b ) );
}

// ---------- B: GetDocTextAll new-API branch ----------
{
	const a = T( 2 ) + '// whole-document read via SelectAll + Copy (single-shot; the per-line';
	if( !s.includes( a ) )  fail( 'GetDocTextAll head anchor not found' );
	const nw = [
		T( 2 ) + 'if( HasNewApi() ){',
		T( 3 ) + '// 26.3+: document.Text via EE_RUN_MACRO — no clipboard, no',
		T( 3 ) + '// selection dance, and it works in Fast View mode. The macro\'s',
		T( 3 ) + '// return string arrives in rmi.hstrResult (GlobalFree by us).',
		T( 3 ) + 'RUN_MACRO_INFO rmi;',
		T( 3 ) + 'ZeroMemory( &rmi, sizeof( rmi ) );',
		T( 3 ) + 'rmi.cbSize = sizeof( rmi );',
		T( 3 ) + 'rmi.nFlags = RUN_TEXT;',
		T( 3 ) + 'rmi.pszText = L' + String.fromCharCode( 34 ) + '#language=' + String.fromCharCode( 92 ) + '"V8' + String.fromCharCode( 92 ) + '"' + String.fromCharCode( 92 ) + 'nreturn document.Text;"' + ';',
		T( 3 ) + 'rmi.nDefMacroLang = MACRO_LANG_V8 | MACRO_SYNC_ONLY;',
		T( 3 ) + 'rmi.ptErrorPos.x = rmi.ptErrorPos.y = -1;',
		T( 3 ) + 'HGLOBAL hText = NULL;',
		T( 3 ) + 'HRESULT hr = (HRESULT)SendMessage( m_hWnd, EE_RUN_MACRO, 0, (LPARAM)&rmi );',
		T( 3 ) + 'if( hr == S_OK && rmi.hstrResult ){',
		T( 4 ) + 'LPCWSTR pText = (LPCWSTR)GlobalLock( rmi.hstrResult );',
		T( 4 ) + 'if( pText ){',
		T( 5 ) + 'sText = pText;',
		T( 5 ) + 'GlobalUnlock( rmi.hstrResult );',
		T( 5 ) + 'GlobalFree( rmi.hstrResult );',
		T( 5 ) + 'RbLogF( "text via document.Text: %u chars", (unsigned)sText.size() );',
		T( 5 ) + 'return true;',
		T( 4 ) + '}',
		T( 4 ) + 'GlobalFree( rmi.hstrResult );',
		T( 3 ) + '}',
		T( 3 ) + 'RbLogF( "document.Text failed hr=0x%08X - clipboard fallback", (unsigned)hr );',
		T( 3 ) + 'return false;\t// do NOT touch the clipboard when the new API failed',
		T( 3 ) + '}',
			// new API failed (and nothing was touched): fall through to the
			// clipboard fallback below
		T( 2 ) + '// whole-document read via SelectAll + Copy (single-shot; the per-line',
	].join( '\r\n' );
	s = s.replace( a, nw );
}
// note: the OLD fallback clipboard path stays intact below (including its
// save/restore) — but it must never run when HasNewApi, hence the hard
// `return false` above.

// ---------- C: scroll sync in WritePreviewHtml ----------
{
	// C1: compute the ratio at the top of the MD branch (after GetDocTextAll)
	const a = T( 2 ) + 'tstring sHtml;';
	if( !s.includes( a ) )  fail( 'sHtml decl anchor not found' );
	const nw = [
		T( 2 ) + 'tstring sHtml;',
		T( 2 ) + '// editor scroll ratio (0..1) for preview sync',
		T( 2 ) + 'double dScrollRatio = 0.0;',
		T( 2 ) + '{',
		T( 3 ) + 'POINT_PTR ptScroll = { 0, 0 };',
		T( 3 ) + 'Editor_GetScrollPos( m_hWnd, &ptScroll );',
		T( 3 ) + 'UINT_PTR nLines = Editor_GetLines( m_hWnd, TRUE );\t// logical lines',
		T( 3 ) + 'if( nLines > 1 ){',
		T( 4 ) + 'dScrollRatio = (double)ptScroll.y / (double)( nLines - 1 );',
		T( 4 ) + 'if( dScrollRatio < 0 )  dScrollRatio = 0;',
		T( 4 ) + 'if( dScrollRatio > 1 )  dScrollRatio = 1;',
		T( 3 ) + '}',
		T( 2 ) + '}',
	].join( '\r\n' );
	s = s.replace( a, nw );

	// C2: inject into the marked script (before the parse call)
	const b = 'sHtml += L"\\";document.getElementById(\'content\').innerHTML=marked.parse(NormalizeSingleNewlines(window.__md),{breaks:true,gfm:true});</script>";';
	if( !s.includes( b ) )  fail( 'marked parse anchor not found' );
	const nb = [
		'sHtml += L"\\";',
		'sHtml += L"window.__scrollRatio=' + String.fromCharCode( 36 ) + 'RATIO' + String.fromCharCode( 36 ) + ';"',
		'sHtml += L"\\";document.getElementById(\'content\').innerHTML=marked.parse(NormalizeSingleNewlines(window.__md),{breaks:true,gfm:true});',
		'sHtml += L"if(typeof window.__scrollRatio===\'number\'){var h=document.body.scrollHeight-window.innerHeight;window.scrollTo(0,window.__scrollRatio*h);}"</script>";',
	].join( '\r\n' );
	// resolve the $RATIO$ placeholder with 4-decimal precision
	const szVar = 'TCHAR szRatio[ 64 ];\r\n\t\t\tStringPrintf( szRatio, _countof( szRatio ), _T("%.4f"), dScrollRatio );\r\n\t\t\ttstring sRatio = szRatio;\r\n';
	const nbResolved = nb.split( "$RATIO$" ).join( '" + sRatio + "' );
	s = s.replace( b, szVar + '\r\n' + nbResolved );
}

// ---------- D: versions ----------
{
	const rc = ROOT + '/RichBar.rc';
	let r = fs.readFileSync( rc, 'utf8' );
	const re = /0,4[0-9],0,0/;
	if( !re.test( r ) )  fail( 'rc version anchor not found' );
	const cur = r.match( /0,4[0-9],0,0/ )[ 0 ];	// e.g. 0,47,0,0
	r = r.split( cur ).join( '0,50,0,0' );
	r = r.split( '0.' + cur.split( ',' )[ 1 ] + '.' + '0' ).join( '0.50.0' );
	// robust: replace any 0.4x.0
	r = r.replace( /0\.4[0-9]\.0/g, '0.50.0' );
	fs.writeFileSync( rc, r, 'utf8' );
	console.log( 'rc bumped', cur, '-> 0,50,0,0' );

	const loc = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( loc );
	if( buf[ 0 ] !== 0xFF || buf[ 1 ] !== 0xFE )  fail( 'locale rc BOM missing' );
	let t = buf.toString( 'utf16le' );
	t = t.replace( /IDS_VERSION(\s+)"0\.4[0-9]\.[01]"/, ( m, sp ) => 'IDS_VERSION' + sp + '"0.50.0"' );
	fs.writeFileSync( loc, Buffer.from( t, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

fs.writeFileSync( p, s, 'utf8' );
console.log( 'ALL PATCHES OK' );
