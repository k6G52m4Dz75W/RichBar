// 0.37.0 patch: three-state per-document preview memory (fixes state
// bleeding between documents)
// - the 0.36.3 adoption stomped every visited doc to ON while the pane was
//   open (user-reported: closing chapter05's preview leaked into
//   untitled-2 and vice versa)
// - NEW model: explicit ON list + explicit OFF list; a doc in NEITHER list
//   (never touched) INHERITS the pane's live state. Only clicks write
//   memory; switching never does.
//   chapter05 ON -> untitled-2 created (untouched: inherits open) ->
//   close on chapter05 (explicit OFF) -> untitled-2 (untouched, pane now
//   closed: inherits closed) -> stays closed. Open on untitled-2
//   (explicit ON) -> chapter05 (explicit OFF) -> stays closed. ALL FOUR
//   user steps now behave independently.
// - both lists persist (PreviewDocs / PreviewDocsOff)
// - version 0.36.3 -> 0.37.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'm_vPreviewOffDocs' ) )  fail( 'already patched' );

	// A: member
	const aA = '\tvector<tstring> m_vPreviewDocs;\t// documents (by name key) whose preview the user turned ON';
	if( !s.includes( aA ) )  fail( 'member anchor not found' );
	s = s.replace( aA, aA + '\r\n\tvector<tstring> m_vPreviewOffDocs;\t// documents whose preview the user explicitly turned OFF' );

	// B: IsPreviewDocOn -> three-state
	const aB = [
		'\tbool IsPreviewDocOn()',
		'\t{',
		'\t\ttstring sKey = CurrentDocKey();',
		'\t\tfor( size_t i = 0; i < m_vPreviewDocs.size(); i++ ){',
		'\t\t\tif( m_vPreviewDocs[i] == sKey ){',
		'\t\t\t\treturn true;',
		'\t\t\t}',
		'\t\t}',
		'\t\treturn false;',
		'\t}',
	].join( '\r\n' );
	if( !s.includes( aB ) )  fail( 'IsPreviewDocOn anchor not found' );
	const nwB = [
		'\tbool IsPreviewDocOn()',
		'\t{',
		'\t\ttstring sKey = CurrentDocKey();',
		'\t\tfor( size_t i = 0; i < m_vPreviewDocs.size(); i++ ){',
		'\t\t\tif( m_vPreviewDocs[i] == sKey ){',
		'\t\t\t\treturn true;',
		'\t\t\t}',
		'\t\t}',
		'\t\tfor( size_t i = 0; i < m_vPreviewOffDocs.size(); i++ ){',
		'\t\t\tif( m_vPreviewOffDocs[i] == sKey ){',
		'\t\t\t\treturn false;',
		'\t\t\t}',
		'\t\t}',
		'\t\t// never touched: inherit the pane\'s live state',
		'\t\treturn IsOfficialPaneVisible();',
		'\t}',
	].join( '\r\n' );
	s = s.replace( aB, nwB );

	// C: SetPreviewDocOn -> two-list version
	const iC = s.indexOf( '\tvoid SetPreviewDocOn( bool bOn )' );
	if( iC < 0 )  fail( 'SetPreviewDocOn start anchor not found' );
	const aCend = '\t\tRbLogF( "preview docs: %u keys", (unsigned)m_vPreviewDocs.size() );\r\n\t}';
	const iCend = s.indexOf( aCend, iC );
	if( iCend < 0 )  fail( 'SetPreviewDocOn end anchor not found' );
	const nwC = [
		'\tvoid SetPreviewDocOn( bool bOn )',
		'\t{',
		'\t\ttstring sKey = CurrentDocKey();',
		'\t\tRbLogF( "set preview doc: key=%S on=%d", AsciiLogKey( sKey ).c_str(), (int)bOn );',
		'\t\t// drop the key from the OPPOSITE list first',
		'\t\tstd::vector<tstring>& vFrom = bOn ? m_vPreviewOffDocs : m_vPreviewDocs;',
		'\t\tfor( size_t i = 0; i < vFrom.size(); i++ ){',
		'\t\t\tif( vFrom[ i ] == sKey ){',
		'\t\t\t\tvFrom.erase( vFrom.begin() + i );',
		'\t\t\t\tbreak;',
		'\t\t\t}',
		'\t\t}',
		'\t\tstd::vector<tstring>& vTo = bOn ? m_vPreviewDocs : m_vPreviewOffDocs;',
		'\t\tfor( size_t i = 0; i < vTo.size(); i++ ){',
		'\t\t\tif( vTo[ i ] == sKey ){',
		'\t\t\t\tRbLogF( "preview docs: %u+%u keys", (unsigned)m_vPreviewDocs.size(), (unsigned)m_vPreviewOffDocs.size() );',
		'\t\t\t\treturn;\t// already recorded',
		'\t\t\t}',
		'\t\t}',
		'\t\tvTo.push_back( sKey );',
		'\t\tRbLogF( "preview docs: %u+%u keys", (unsigned)m_vPreviewDocs.size(), (unsigned)m_vPreviewOffDocs.size() );\r\n\t}',
	].join( '\r\n' );
	s = s.slice( 0, iC ) + nwC + s.slice( iCend + aCend.length );

	// D: LoadProfile — load the OFF list after the ON list
	const aD = [
		'\t\t\t\twhile( pszTok ){',
		'\t\t\t\t\tm_vPreviewDocs.push_back( pszTok );',
		'\t\t\t\t\tpszTok = wcstok_s( NULL, _T("\\n"), &pszCtx );',
		'\t\t\t\t}',
	].join( '\r\n' );
	if( !s.includes( aD ) )  fail( 'LoadProfile ON-list anchor not found' );
	const nwD = aD + '\r\n' + [
		'\t\t\t\tGetProfileString( _T("PreviewDocsOff"), szDocs, _countof( szDocs ), _T("") );',
		'\t\t\t\tpszCtx = NULL;',
		'\t\t\t\tpszTok = wcstok_s( szDocs, _T("\\n"), &pszCtx );',
		'\t\t\t\twhile( pszTok ){',
		'\t\t\t\t\tm_vPreviewOffDocs.push_back( pszTok );',
		'\t\t\t\t\tpszTok = wcstok_s( NULL, _T("\\n"), &pszCtx );',
		'\t\t\t\t}',
	].join( '\r\n' );
	s = s.replace( aD, nwD );

	// E: SaveProfile — write the OFF list after the ON list
	const aE = '\t\t\tWriteProfileString( _T("PreviewDocs"), sDocs.c_str() );\r\n\t\t}';
	if( !s.includes( aE ) )  fail( 'SaveProfile ON-list anchor not found' );
	const nwE = [
		'\t\t\tWriteProfileString( _T("PreviewDocs"), sDocs.c_str() );',
		'\t\t\ttstring sOff;',
		'\t\t\tfor( size_t i = 0; i < m_vPreviewOffDocs.size(); i++ ){',
		'\t\t\t\tif( !sOff.empty() ){',
		'\t\t\t\t\tsOff += _T("\\n");',
		'\t\t\t\t}',
		'\t\t\t\tsOff += m_vPreviewOffDocs[ i ];',
		'\t\t\t}',
		'\t\t\tWriteProfileString( _T("PreviewDocsOff"), sOff.c_str() );\r\n\t\t}',
	].join( '\r\n' );
	s = s.replace( aE, nwE );

	// F: OnDocSyncTimer — drop the adoption; pure per-doc memory
	const aF = [
		'\t\tif( !m_bStartupSettled ){',
		'\t\t\t// restore window: we never open/close the pane here, but the',
		'\t\t\t// button and the doc memory must stay CONSISTENT with whatever',
		'\t\t\t// the pane shows - a switch during the window used to leave',
		'\t\t\t// pane-open with the button unpressed (user report)',
		'\t\t\tif( bPane ){',
		'\t\t\t\tm_bPreviewOn = true;',
		'\t\t\t\tSetPreviewDocOn( true );\t// the pane is showing this doc: adopt it',
		'\t\t\t}',
		'\t\t\telse {',
		'\t\t\t\tm_bPreviewOn = false;\t// pane closed: button up (memory kept)',
		'\t\t\t}',
		'\t\t\tApplyToggleStates();',
		'\t\t\treturn;',
		'\t\t}',
		'\t\tif( m_bPreviewOn != bWant ){',
		'\t\t\tm_bPreviewOn = bWant;',
		'\t\t\tSaveProfile();',
		'\t\t\tApplyToggleStates();',
		'\t\t}',
	].join( '\r\n' );
	if( !s.includes( aF ) )  fail( 'OnDocSyncTimer adoption anchor not found' );
	const nwF = [
		'\t\t// the button follows the DOCUMENT\'s own state (explicit or',
		'\t\t// inherited); switching NEVER writes memory - that was the',
		'\t\t// state-bleeding bug',
		'\t\tm_bPreviewOn = bWant;',
		'\t\tApplyToggleStates();',
		'\t\tif( !m_bStartupSettled ){',
		'\t\t\treturn;\t// restore window: the pane is never touched',
		'\t\t}',
	].join( '\r\n' );
	s = s.replace( aF, nwF );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,36,3,0' ) )  fail( 'rc does not read 0,36,3,0' );
	s = s.split( '0,36,3,0' ).join( '0,37,0,0' );
	s = s.split( '0.36.3' ).join( '0.37.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.36\.3"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.36.3' );
	s = s.replace( re, 'IDS_VERSION$1"0.37.0"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
