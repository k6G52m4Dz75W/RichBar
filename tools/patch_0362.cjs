// 0.36.2 patch: diagnostics for the unsaved-doc pressed-state bug
// - SetPreviewDocOn logs the key + add/remove + resulting set
// - OnDocSyncTimer logs the key, want/pane/button state and the action
// (the registry shows only path keys ever landed - the untitled key's
// exact value at click vs reconcile time is the open question)
// - version 0.36.1 -> 0.36.2
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'set preview doc:' ) )  fail( 'already patched' );

	// A: SetPreviewDocOn logging
	const aA = [
		'\tvoid SetPreviewDocOn( bool bOn )',
		'\t{',
		'\t\ttstring sKey = CurrentDocKey();',
	].join( '\r\n' );
	if( !s.includes( aA ) )  fail( 'SetPreviewDocOn anchor not found' );
	const nwA = [
		'\tvoid SetPreviewDocOn( bool bOn )',
		'\t{',
		'\t\ttstring sKey = CurrentDocKey();',
		'\t\tRbLogF( "set preview doc: key=%S on=%d", sKey.c_str(), (int)bOn );',
	].join( '\r\n' );
	s = s.replace( aA, nwA );

	// A2: log the resulting set at the end of SetPreviewDocOn
	const aA2 = [
		'\t\tif( bOn ){',
		'\t\t\tm_vPreviewDocs.push_back( sKey );',
		'\t\t}',
		'\t}',
	].join( '\r\n' );
	if( !s.includes( aA2 ) )  fail( 'SetPreviewDocOn tail anchor not found' );
	s = s.replace( aA2, [
		'\t\tif( bOn ){',
		'\t\t\tm_vPreviewDocs.push_back( sKey );',
		'\t\t}',
		'\t\tRbLogF( "preview docs: %u keys", (unsigned)m_vPreviewDocs.size() );',
		'\t}',
	].join( '\r\n' ) );

	// B: OnDocSyncTimer logging
	const aB = [
		'\tvoid OnDocSyncTimer()',
		'\t{',
		'\t\tbool bWant = IsPreviewDocOn();',
		'\t\tbool bPane = IsOfficialPaneVisible();',
	].join( '\r\n' );
	if( !s.includes( aB ) )  fail( 'OnDocSyncTimer anchor not found' );
	const nwB = [
		'\tvoid OnDocSyncTimer()',
		'\t{',
		'\t\ttstring sSyncKey = CurrentDocKey();',
		'\t\tbool bWant = IsPreviewDocOn();',
		'\t\tbool bPane = IsOfficialPaneVisible();',
		'\t\tRbLogF( "doc sync: key=%S want=%d pane=%d btn=%d settled=%d", sSyncKey.c_str(), (int)bWant, (int)bPane, (int)m_bPreviewOn, (int)m_bStartupSettled );',
	].join( '\r\n' );
	s = s.replace( aB, nwB );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,36,1,0' ) )  fail( 'rc does not read 0,36,1,0' );
	s = s.split( '0,36,1,0' ).join( '0,36,2,0' );
	s = s.split( '0.36.1' ).join( '0.36.2' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.36\.1"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.36.1' );
	s = s.replace( re, 'IDS_VERSION$1"0.36.2"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
