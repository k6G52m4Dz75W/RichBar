// 0.34.1 patch: make startup 100% hands-off (opening the preview pane
// during startup DISPLACES EmEditor's session-restore panel — user report)
// - OnStartupRestore: button state ONLY, no pane open/close calls
// - 10s settle window (IDT_STARTUP_SETTLE): OnDocSyncTimer updates the
//   button only until settled
// - when the window ends, ONE full reconcile runs (restore is long done:
//   memory-ON doc -> open+render; otherwise close a restored pane, which
//   covers the empty-startup case)
// - auto-refresh untouched (render-only, pane-open guarded)
// - version 0.34.0 -> 0.34.1
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'm_bStartupSettled' ) )  fail( 'already patched' );

	// A: member
	const aA = '\tint m_nMacroRetries = 0;';
	if( !s.includes( aA ) )  fail( 'member anchor not found' );
	s = s.replace( aA, aA + '\r\n\tbool m_bStartupSettled = false;\t// pane open/close suppressed until the session restore finishes' );

	// B: timer id
	const aB = '#define IDT_DOC_SYNC\t\t\t9';
	if( !s.includes( aB ) )  fail( 'IDT_DOC_SYNC anchor not found' );
	s = s.replace( aB, aB + '\r\n#define IDT_STARTUP_SETTLE\t\t10' );

	// C: OnStartupRestore — hands-off; schedule the settle reconcile
	const aC = [
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
	if( !s.includes( aC ) )  fail( 'startup reconcile anchor not found' );
	const nwC = [
		'\t\t// startup is HANDS-OFF: opening/closing the preview pane here',
		'\t\t// DISPLACES EmEditor\'s session-restore panel (user report). The',
		'\t\t// button follows the per-document memory; the pane is reconciled',
		'\t\t// once the settle window ends (see IDT_STARTUP_SETTLE)',
		'\t\tm_bPreviewOn = IsPreviewDocOn();',
		'\t\tApplyToggleStates();',
		'\t\tif( m_hDlg ){',
		'\t\t\tSetTimer( m_hDlg, IDT_STARTUP_SETTLE, 10000, NULL );',
		'\t\t}',
	].join( '\r\n' );
	s = s.replace( aC, nwC );

	// D: OnDocSyncTimer — button only until settled
	const aD = [
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
		'\t\t}\r\n\t}',
	].join( '\r\n' );
	if( !s.includes( aD ) )  fail( 'OnDocSyncTimer anchor not found' );
	const nwD = [
		'\t\tbool bWant = IsPreviewDocOn();',
		'\t\tbool bPane = IsOfficialPaneVisible();',
		'\t\tif( m_bPreviewOn != bWant ){',
		'\t\t\tm_bPreviewOn = bWant;',
		'\t\t\tSaveProfile();',
		'\t\t\tApplyToggleStates();',
		'\t\t}',
		'\t\tif( !m_bStartupSettled ){',
		'\t\t\treturn;\t// restore window: the pane is never touched',
		'\t\t}',
		'\t\tif( bWant && !bPane ){',
		'\t\t\tOpenWebBarPreview();',
		'\t\t}',
		'\t\telse if( !bWant && bPane ){',
		'\t\t\tRunWebBarMacroStaged( _T("WebBar.Visible = false;") );',
		'\t\t}\r\n\t}',
		'',
		'\t// the settle window ended: the session restore is long done, so ONE',
		'\t// full reconcile is now safe (memory-ON doc -> open+render;',
		'\t// otherwise close a pane EmEditor restored - the empty-startup case)',
		'\tvoid OnStartupSettle()',
		'\t{',
		'\t\tm_bStartupSettled = true;',
		'\t\tOnDocSyncTimer();',
		'\t}',
	].join( '\r\n' );
	s = s.replace( aD, nwD );

	// E: timer branch after the DOC_SYNC branch
	const aE = [
		'\t\t\telse if( wParam == IDT_DOC_SYNC ){',
		'\t\t\t\tKillTimer( hwnd, IDT_DOC_SYNC );',
		'\t\t\t\tCMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));',
		'\t\t\t\tif( pFrame ){',
		'\t\t\t\t\tpFrame->OnDocSyncTimer();',
		'\t\t\t\t}',
		'\t\t\t\treturn 0;',
		'\t\t\t}',
	].join( '\r\n' );
	if( !s.includes( aE ) )  fail( 'DOC_SYNC timer branch anchor not found' );
	const nwE = aE + '\r\n' + [
		'\t\t\telse if( wParam == IDT_STARTUP_SETTLE ){',
		'\t\t\t\tKillTimer( hwnd, IDT_STARTUP_SETTLE );',
		'\t\t\t\tCMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));',
		'\t\t\t\tif( pFrame ){',
		'\t\t\t\t\tpFrame->OnStartupSettle();',
		'\t\t\t\t}',
		'\t\t\t\treturn 0;',
		'\t\t\t}',
	].join( '\r\n' );
	s = s.replace( aE, nwE );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,34,0,0' ) )  fail( 'rc does not read 0,34,0,0' );
	s = s.split( '0,34,0,0' ).join( '0,34,1,0' );
	s = s.split( '0.34.0' ).join( '0.34.1' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.34\.0"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.34.0' );
	s = s.replace( re, 'IDS_VERSION$1"0.34.1"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
