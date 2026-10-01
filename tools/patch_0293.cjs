// 0.29.3 patch:
// - prepend #language = "V8" directive to every in-memory macro
//   (nDefMacroLang proved insufficient: still REGDB_E_CLASSNOTREG — the
//   directive overrides the configured default engine deterministically)
// - engine sanity probe on preview-on click (var rbProbe = 1) logged separately
// - version 0.29.2 -> 0.29.3
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( '#language = ' ) )  fail( 'already patched' );

	// RunWebBarMacro: prepend the directive
	const aA = '\t\trmi.pszText = pszMacro;\r\n\t\trmi.nDefMacroLang = MACRO_LANG_V8 | MACRO_SYNC_ONLY;\t// V8: JScript (Chakra) COM class is unregistered on Win11 26200+';
	if( !s.includes( aA ) )  fail( 'RunWebBarMacro body anchor not found' );
	const nwA = [
		'\t\t// the directive OVERRIDES the configured default engine:',
		'\t\t// nDefMacroLang alone still hit REGDB_E_CLASSNOTREG (0x29.2 log)',
		'\t\ttstring sCode = _T("#language = \\"V8\\"\\r\\n");',
		'\t\tsCode += pszMacro;',
		'\t\trmi.pszText = sCode.c_str();',
		'\t\trmi.nDefMacroLang = MACRO_LANG_V8 | MACRO_SYNC_ONLY;',
	].join( '\r\n' );
	s = s.replace( aA, nwA );

	// probe on the preview-on branch
	const aB = [
		'\t\t\t\tif( bWant ){',
		'\t\t\t\t\tOpenWebBarPreview();',
		'\t\t\t\t}',
	].join( '\r\n' );
	if( !s.includes( aB ) )  fail( 'preview-on branch anchor not found' );
	const nwB = [
		'\t\t\t\tif( bWant ){',
		'\t\t\t\t\t// engine sanity probe: no EmEditor objects at all; a failure',
		'\t\t\t\t\t// here means the macro ENGINE is unavailable (vs a WebBar',
		'\t\t\t\t\t// object failure, which the next log line would show)',
		'\t\t\t\t\tRunWebBarMacro( _T("var rbProbe = 1;") );',
		'\t\t\t\t\tOpenWebBarPreview();',
		'\t\t\t\t}',
	].join( '\r\n' );
	s = s.replace( aB, nwB );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,29,2,0' ) )  fail( 'rc does not read 0,29,2,0' );
	s = s.split( '0,29,2,0' ).join( '0,29,3,0' );
	s = s.split( '0.29.2' ).join( '0.29.3' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.29\.2"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.29.2' );
	s = s.replace( re, 'IDS_VERSION$1"0.29.3"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
