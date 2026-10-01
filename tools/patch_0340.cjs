// 0.34.0 patch: per-document preview pressed-state memory + startup reconcile
// - PreviewDocs persisted in the profile (path keys only; untitled keys are
//   session-scope - untitled names are reused across sessions)
// - preview click records per-doc memory (SetPreviewDocOn)
// - doc switch (deferred 250ms, IDT_DOC_SYNC): reconcile the button AND the
//   pane to the target document's memory (open+render, or close)
// - startup (OnStartupRestore): doc memory ON -> re-render the pane
//   immediately (blank-restored-pane fix); OFF -> close the pane EmEditor
//   restored (no orphan browser over an empty startup)
// - version 0.33.3 -> 0.34.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( '_T("PreviewDocs")' ) )  fail( 'already patched' );

	// A: LoadProfile — read the persisted per-doc preview set
	const aA = '\t\t\tm_bPreviewOn = !!GetProfileInt( _T("PreviewOn"), FALSE );';
	if( !s.includes( aA ) )  fail( 'LoadProfile anchor not found' );
	const nwA = aA + '\r\n' + [
		'\t\t\t{',
		'\t\t\t\t// per-document preview memory (path keys only - untitled',
		'\t\t\t\t// names are reused across sessions, so they stay',
		'\t\t\t\t// session-scope)',
		'\t\t\t\tTCHAR szDocs[ 4096 ];',
		'\t\t\t\tGetProfileString( _T("PreviewDocs"), szDocs, _countof( szDocs ), _T("") );',
		'\t\t\t\tTCHAR* pszCtx = NULL;',
		'\t\t\t\tTCHAR* pszTok = wcstok_s( szDocs, _T("\\n"), &pszCtx );',
		'\t\t\t\twhile( pszTok ){',
		'\t\t\t\t\tif( wcschr( pszTok, _T(\'\\\\\') ) != NULL ){',
		'\t\t\t\t\t\tm_vPreviewDocs.push_back( pszTok );',
		'\t\t\t\t\t}',
		'\t\t\t\t\tpszTok = wcstok_s( NULL, _T("\\n"), &pszCtx );',
		'\t\t\t\t}',
		'\t\t\t}',
	].join( '\r\n' );
	s = s.replace( aA, nwA );

	// B: SaveProfile — write the set (path keys only)
	const aB = '\t\tWriteProfileInt( _T("PreviewOn"), !!m_bPreviewOn );';
	if( !s.includes( aB ) )  fail( 'SaveProfile anchor not found' );
	const nwB = aB + '\r\n' + [
		'\t\t{',
		'\t\t\t// persist the per-document preview memory (path keys only)',
		'\t\t\ttstring sDocs;',
		'\t\t\tfor( size_t i = 0; i < m_vPreviewDocs.size(); i++ ){',
		'\t\t\t\tif( m_vPreviewDocs[ i ].find( _T(\'\\\\\') ) == tstring::npos ){',
		'\t\t\t\t\tcontinue;',
		'\t\t\t\t}',
		'\t\t\t\tif( !sDocs.empty() ){',
		'\t\t\t\t\tsDocs += _T("\\n");',
		'\t\t\t\t}',
		'\t\t\t\tsDocs += m_vPreviewDocs[ i ];',
		'\t\t\t}',
		'\t\t\tWriteProfileString( _T("PreviewDocs"), sDocs.c_str() );',
		'\t\t}',
	].join( '\r\n' );
	s = s.replace( aB, nwB );

	// C: preview click records per-doc memory
	const aC = [
		'\t\t\t\tbool bWant = ( SendMessage( m_hwndToolbar, TB_GETSTATE, wParam, 0 ) & TBSTATE_CHECKED ) != 0;',
		'\t\t\t\tm_bPreviewOn = bWant;',
		'\t\t\t\tSaveProfile();',
	].join( '\r\n' );
	if( !s.includes( aC ) )  fail( 'preview click anchor not found' );
	const nwC = [
		'\t\t\t\tbool bWant = ( SendMessage( m_hwndToolbar, TB_GETSTATE, wParam, 0 ) & TBSTATE_CHECKED ) != 0;',
		'\t\t\t\tm_bPreviewOn = bWant;',
		'\t\t\t\tSetPreviewDocOn( bWant );\t// per-document pressed-state memory',
		'\t\t\t\tSaveProfile();',
	].join( '\r\n' );
	s = s.replace( aC, nwC );

	// D: doc-switch events also schedule the deferred reconcile
	const aD = '\t\t\tif( m_hDlg && IsOfficialPaneVisible() ){\r\n\t\t\t\tSetTimer( m_hDlg, IDT_PREVIEW_REFRESH, 1000, NULL );\t// the pane follows the document\r\n\t\t\t}';
	if( !s.includes( aD ) )  fail( 'doc-switch auto-refresh anchor not found' );
	s = s.replace( aD, aD + '\r\n\t\t\tif( m_hDlg ){\r\n\t\t\t\tSetTimer( m_hDlg, IDT_DOC_SYNC, 250, NULL );\t// deferred per-doc reconcile\r\n\t\t\t}' );

	// E: timer id
	const aE = '#define IDT_WEBBAR_RETRY\t\t8';
	if( !s.includes( aE ) )  fail( 'IDT_WEBBAR_RETRY anchor not found' );
	s = s.replace( aE, aE + '\r\n#define IDT_DOC_SYNC\t\t\t9' );

	// F: OnDocSyncTimer after OnPreviewAutoRefresh
	const aF = '\t\tOpenWebBarPreview();\r\n\t}\r\n\r\n\t// render the CURRENT buffer';
	if( !s.includes( aF ) )  fail( 'OnPreviewAutoRefresh tail anchor not found' );
	const nwF = [
		'\t\tOpenWebBarPreview();',
		'\t}',
		'',
		'\t// deferred doc-switch reconcile: the per-document preview memory',
		'\t// decides the button AND the pane (queries right at the switch',
		'\t// event read the PREVIOUS document - the 0.22.9 lesson)',
		'\tvoid OnDocSyncTimer()',
		'\t{',
		'\t\tbool bWant = IsPreviewDocOn();',
		'\t\tbool bPane = IsOfficialPaneVisible();',
		'\t\tif( m_bPreviewOn != bWant ){',
		'\t\t\tm_bPreviewOn = bWant;',
		'\t\t\tSaveProfile();',
		'\t\t\tApplyToggleStates();',
		'\t\t}',
		'\t\tif( bWant && !bPane ){',
		'\t\t\tOpenWebBarPreview();',
		'\t\t}',
		'\t\telse if( !bWant && bPane ){',
		'\t\t\tRunWebBarMacroStaged( _T("WebBar.Visible = false;") );',
		'\t\t}\r\n\t}\r\n\r\n\t// render the CURRENT buffer',
	].join( '\r\n' );
	s = s.replace( aF, nwF );

	// G: timer branch after the PREVIEW_REFRESH branch
	const aG = [
		'\t\t\telse if( wParam == IDT_PREVIEW_REFRESH ){',
		'\t\t\t\tKillTimer( hwnd, IDT_PREVIEW_REFRESH );',
		'\t\t\t\tCMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));',
		'\t\t\t\tif( pFrame ){',
		'\t\t\t\t\tpFrame->OnPreviewAutoRefresh();',
		'\t\t\t\t}',
		'\t\t\t\treturn 0;',
		'\t\t\t}',
	].join( '\r\n' );
	if( !s.includes( aG ) )  fail( 'PREVIEW_REFRESH timer branch anchor not found' );
	const nwG = aG + '\r\n' + [
		'\t\t\telse if( wParam == IDT_DOC_SYNC ){',
		'\t\t\t\tKillTimer( hwnd, IDT_DOC_SYNC );',
		'\t\t\t\tCMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));',
		'\t\t\t\tif( pFrame ){',
		'\t\t\t\t\tpFrame->OnDocSyncTimer();',
		'\t\t\t\t}',
		'\t\t\t\treturn 0;',
		'\t\t\t}',
	].join( '\r\n' );
	s = s.replace( aG, nwG );

	// H: startup reconcile
	const aH = [
		'\t\t// preview starts OFF: the Web-bar snapshot is per-click, there is',
		'\t\t// nothing meaningful to restore across sessions',
		'\t\tm_bPreviewOn = false;',
		'\t\tApplyToggleStates();',
	].join( '\r\n' );
	if( !s.includes( aH ) )  fail( 'startup preview block anchor not found' );
	const nwH = [
		'\t\t// startup preview reconcile (per-document memory, persisted for',
		'\t\t// saved files): a restored doc whose preview was ON re-renders',
		'\t\t// the pane immediately (blank-restored-pane fix); anything else',
		'\t\t// closes the pane EmEditor restored (no orphan browser over an',
		'\t\t// empty startup)',
		'\t\tconst bool bWant = IsPreviewDocOn();',
		'\t\tconst bool bPane = IsOfficialPaneVisible();',
		'\t\tm_bPreviewOn = bWant;',
		'\t\tApplyToggleStates();',
		'\t\tif( bWant ){',
		'\t\t\tOpenWebBarPreview();',
		'\t\t}',
		'\t\telse if( bPane ){',
		'\t\t\tRunWebBarMacroStaged( _T("WebBar.Visible = false;") );',
		'\t\t}',
	].join( '\r\n' );
	s = s.replace( aH, nwH );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,33,3,0' ) )  fail( 'rc does not read 0,33,3,0' );
	s = s.split( '0,33,3,0' ).join( '0,34,0,0' );
	s = s.split( '0.33.3' ).join( '0.34.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.33\.3"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.33.3' );
	s = s.replace( re, 'IDS_VERSION$1"0.34.0"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
