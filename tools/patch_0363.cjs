// 0.36.3 patch:
// - the CRT default locale truncates %S at the first non-ASCII character,
//   hiding everything after the key in the diagnostics (and the keys ARE
//   Chinese) -> ASCII-safe key logging
// - the restore-window reconcile now keeps button AND memory consistent
//   with the pane: pane open -> the current doc is adopted as preview-on
//   (button pressed, remembered; the settle reconcile then never closes a
//   pane in use); pane closed -> button up, memory NOT erased
// - version 0.36.2 -> 0.36.3
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'AsciiLogKey' ) )  fail( 'already patched' );

	// A: ASCII-safe key helper after CurrentDocKey
	const aA = [
		'\t\treturn tstring( _T("<untitled>") );\t// untitled documents share one slot',
		'\t}',
	].join( '\r\n' );
	if( !s.includes( aA ) )  fail( 'CurrentDocKey tail anchor not found' );
	const nwA = [
		'\t\treturn tstring( _T("<untitled>") );\t// untitled documents share one slot',
		'\t}',
		'',
		'\t// ASCII-safe copy for the log: the CRT\'s default locale truncates',
		'\t// %S at the first non-ASCII character, hiding the rest of the line',
		'\ttstring AsciiLogKey( const tstring& sKey )',
		'\t{',
		'\t\ttstring sLog = sKey;',
		'\t\tfor( size_t i = 0; i < sLog.size(); i++ ){',
		'\t\t\tif( (unsigned) sLog[ i ] > 127 ){',
		'\t\t\t\tsLog[ i ] = _T(\'?\');',
		'\t\t\t}',
		'\t\t}',
		'\t\treturn sLog;',
		'\t}',
	].join( '\r\n' );
	s = s.replace( aA, nwA );

	// B: SetPreviewDocOn log -> ASCII-safe
	const aB = '\t\tRbLogF( "set preview doc: key=%S on=%d", sKey.c_str(), (int)bOn );';
	if( !s.includes( aB ) )  fail( 'SetPreviewDocOn log anchor not found' );
	s = s.replace( aB, '\t\tRbLogF( "set preview doc: key=%S on=%d", AsciiLogKey( sKey ).c_str(), (int)bOn );' );

	// C: OnDocSyncTimer — ASCII-safe log + adoption during the restore window
	const aC = [
		'\t\ttstring sSyncKey = CurrentDocKey();',
		'\t\tbool bWant = IsPreviewDocOn();',
		'\t\tbool bPane = IsOfficialPaneVisible();',
		'\t\tRbLogF( "doc sync: key=%S want=%d pane=%d btn=%d settled=%d", sSyncKey.c_str(), (int)bWant, (int)bPane, (int)m_bPreviewOn, (int)m_bStartupSettled );',
		'\t\tif( m_bPreviewOn != bWant ){',
		'\t\t\tm_bPreviewOn = bWant;',
		'\t\t\tSaveProfile();',
		'\t\t\tApplyToggleStates();',
		'\t\t}',
		'\t\tif( !m_bStartupSettled ){',
		'\t\t\treturn;\t// restore window: the pane is never touched',
		'\t\t}',
	].join( '\r\n' );
	if( !s.includes( aC ) )  fail( 'OnDocSyncTimer anchor not found' );
	const nwC = [
		'\t\ttstring sSyncKey = CurrentDocKey();',
		'\t\tbool bWant = IsPreviewDocOn();',
		'\t\tbool bPane = IsOfficialPaneVisible();',
		'\t\tRbLogF( "doc sync: key=%S want=%d pane=%d btn=%d settled=%d", AsciiLogKey( sSyncKey ).c_str(), (int)bWant, (int)bPane, (int)m_bPreviewOn, (int)m_bStartupSettled );',
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
	s = s.replace( aC, nwC );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,36,2,0' ) )  fail( 'rc does not read 0,36,2,0' );
	s = s.split( '0,36,2,0' ).join( '0,36,3,0' );
	s = s.split( '0.36.2' ).join( '0.36.3' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.36\.2"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.36.2' );
	s = s.replace( re, 'IDS_VERSION$1"0.36.3"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
