// 0.38.0 patch: per-document preview memory REFINED (user-directed)
// - SAVED documents (path key) own a STICKY state: initialized from the
//   pane on the first visit, then changed only by clicks; switching
//   never rewrites it
// - UNSAVED documents (title-only key) purely inherit the pane state at
//   switch time; clicks toggle the pane but write no memory
// - GetPreviewDocState/SetPreviewDocKey replace IsPreviewDocOn's inline
//   logic; SetPreviewDocOn (click) filters unsaved keys out
// - version 0.37.0 -> 0.38.0
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'GetPreviewDocState' ) )  fail( 'already patched' );

	// A: replace IsPreviewDocOn + SetPreviewDocOn with the new trio
	const iA = s.indexOf( '\tbool IsPreviewDocOn()' );
	if( iA < 0 )  fail( 'IsPreviewDocOn start anchor not found' );
	const iAend = s.indexOf( '\tbool IsOfficialPaneVisible()', iA );
	if( iAend < 0 )  fail( 'IsOfficialPaneVisible anchor not found' );
	const nwA = [
		'\t// explicit per-document preview state: true = the key is recorded',
		'\t// and bOn carries it; false = never touched',
		'\tbool GetPreviewDocState( const tstring& sKey, bool& bOn )',
		'\t{',
		'\t\tfor( size_t i = 0; i < m_vPreviewDocs.size(); i++ ){',
		'\t\t\tif( m_vPreviewDocs[ i ] == sKey ){',
		'\t\t\t\tbOn = true;',
		'\t\t\t\treturn true;',
		'\t\t\t}',
		'\t\t}',
		'\t\tfor( size_t i = 0; i < m_vPreviewOffDocs.size(); i++ ){',
		'\t\t\tif( m_vPreviewOffDocs[ i ] == sKey ){',
		'\t\t\t\tbOn = false;',
		'\t\t\t\treturn true;',
		'\t\t\t}',
		'\t\t}',
		'\t\treturn false;',
		'\t}',
		'',
		'\t// write the explicit state: move the key between the two lists',
		'\tvoid SetPreviewDocKey( const tstring& sKey, bool bOn )',
		'\t{',
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
		'\t\t\t\treturn;\t// already recorded',
		'\t\t\t}',
		'\t\t}',
		'\t\tvTo.push_back( sKey );',
		'\t}',
		'',
		'\t// click path: only SAVED documents (path keys) get sticky memory;',
		'\t// unsaved documents inherit the pane and are never remembered',
		'\tvoid SetPreviewDocOn( bool bOn )',
		'\t{',
		'\t\ttstring sKey = CurrentDocKey();',
		'\t\tRbLogF( "set preview doc: key=%S on=%d", AsciiLogKey( sKey ).c_str(), (int)bOn );',
		'\t\tif( sKey.find( _T(\'\\\\\') ) == tstring::npos ){',
		'\t\t\tRbLogF( "preview docs: unsaved - not remembered" );',
		'\t\t\treturn;',
		'\t\t}',
		'\t\tSetPreviewDocKey( sKey, bOn );',
		'\t\tRbLogF( "preview docs: %u+%u keys", (unsigned)m_vPreviewDocs.size(), (unsigned)m_vPreviewOffDocs.size() );\r\n\t}\r\n\r\n',
	].join( '\r\n' );
	s = s.slice( 0, iA ) + nwA + s.slice( iAend );

	// B: OnDocSyncTimer — sticky saved / inherit unsaved
	const iB = s.indexOf( '\tvoid OnDocSyncTimer()' );
	if( iB < 0 )  fail( 'OnDocSyncTimer start anchor not found' );
	const aBend = '\t// render the CURRENT buffer';
	const iBend = s.indexOf( aBend, iB );
	if( iBend < 0 )  fail( 'OnDocSyncTimer end anchor not found' );
	const nwB = [
		'\tvoid OnDocSyncTimer()',
		'\t{',
		'\t\ttstring sSyncKey = CurrentDocKey();',
		'\t\tconst bool bSaved = sSyncKey.find( _T(\'\\\\\') ) != tstring::npos;',
		'\t\tbool bPane = IsOfficialPaneVisible();',
		'\t\tbool bWant;',
		'\t\tif( bSaved ){',
		'\t\t\t// saved documents own a STICKY state: initialize it from the',
		'\t\t\t// pane on the first visit, then only clicks change it',
		'\t\t\tif( !GetPreviewDocState( sSyncKey, bWant ) ){',
		'\t\t\t\tbWant = bPane;',
		'\t\t\t\tSetPreviewDocKey( sSyncKey, bWant );',
		'\t\t\t\tSaveProfile();',
		'\t\t\t\tRbLogF( "doc sync: initialized sticky %S = %d", AsciiLogKey( sSyncKey ).c_str(), (int)bWant );',
		'\t\t\t}',
		'\t\t}',
		'\t\telse {',
		'\t\t\tbWant = bPane;\t// unsaved: inherit the pane (user-directed)',
		'\t\t}',
		'\t\tRbLogF( "doc sync: key=%S saved=%d want=%d pane=%d btn=%d settled=%d", AsciiLogKey( sSyncKey ).c_str(), (int)bSaved, (int)bWant, (int)bPane, (int)m_bPreviewOn, (int)m_bStartupSettled );',
		'\t\tm_bPreviewOn = bWant;',
		'\t\tApplyToggleStates();',
		'\t\tif( !m_bStartupSettled ){',
		'\t\t\treturn;\t// restore window: the pane is never opened/closed by us',
		'\t\t}',
		'\t\tif( bWant && !bPane ){',
		'\t\t\tOpenWebBarPreview();',
		'\t\t}',
		'\t\telse if( !bWant && bPane ){',
		'\t\t\tRunWebBarMacroStaged( _T("WebBar.Visible = false;") );',
		'\t\t}\r\n\t}\r\n\r\n',
	].join( '\r\n' );
	s = s.slice( 0, iB ) + nwB + s.slice( iBend );

	// C: startup button — saved+explicit -> memory; else the restored pane
	const aC = '\t\tm_bPreviewOn = IsPreviewDocOn();';
	if( !s.includes( aC ) )  fail( 'startup button anchor not found' );
	const nwC = [
		'\t\t{',
		'\t\t\ttstring sKey = CurrentDocKey();',
		'\t\t\tbool bState = false;',
		'\t\t\tm_bPreviewOn = ( sKey.find( _T(\'\\\\\') ) != tstring::npos && GetPreviewDocState( sKey, bState ) ) ? bState : IsOfficialPaneVisible();',
		'\t\t}',
	].join( '\r\n' );
	s = s.replace( aC, nwC );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,37,0,0' ) )  fail( 'rc does not read 0,37,0,0' );
	s = s.split( '0,37,0,0' ).join( '0,38,0,0' );
	s = s.split( '0.37.0' ).join( '0.38.0' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.37\.0"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.37.0' );
	s = s.replace( re, 'IDS_VERSION$1"0.38.0"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
