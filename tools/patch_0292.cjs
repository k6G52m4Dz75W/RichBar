// 0.29.2 patch: macro language JScript -> V8
// REGDB_E_CLASSNOTREG (0x80040154, "没有注册类") on EE_RUN_MACRO with
// nDefMacroLang=MACRO_LANG_JSCRIPT: the legacy JScript/Chakra COM engine is
// gone on the user's Windows 11 26200. MACRO_LANG_V8 (=2, same slot as the
// old MACRO_LANG_CHAKRA) is EmEditor's built-in engine - no COM registration.
const fs = require( 'fs' );
const ROOT = 'E:/Projects/RichBar/RichBar';

function fail( msg ){ console.error( 'PATCH FAILED: ' + msg ); process.exit( 1 ); }

// ---------- RichBar.h ----------
{
	const p = ROOT + '/RichBar.h';
	let s = fs.readFileSync( p, 'utf8' );
	if( s.includes( 'MACRO_LANG_V8' ) )  fail( 'already patched' );

	// add the V8 define next to RUN_TEXT
	const aA = '#define RUN_TEXT\t\t\t\t1\t\t// EE_RUN_MACRO: pszText is the macro source';
	if( !s.includes( aA ) )  fail( 'RUN_TEXT define anchor not found' );
	s = s.replace( aA, aA + '\r\n' + [
		'#ifndef MACRO_LANG_V8',
		'#define MACRO_LANG_V8\t\t\t2\t\t// EE_RUN_MACRO: EmEditor built-in V8 engine (no COM registration)',
		'#endif',
	].join( '\r\n' ) );

	// switch the language
	const aB = '\t\trmi.nDefMacroLang = MACRO_LANG_JSCRIPT | MACRO_SYNC_ONLY;';
	if( !s.includes( aB ) )  fail( 'nDefMacroLang anchor not found' );
	s = s.replace( aB, '\t\trmi.nDefMacroLang = MACRO_LANG_V8 | MACRO_SYNC_ONLY;	// V8: JScript (Chakra) COM class is unregistered on Win11 26200+' );

	// update the helper comment
	s = s.split( '\t// run an in-memory JScript macro through EE_RUN_MACRO (no temp file).' )
		.join( '\t// run an in-memory V8 macro through EE_RUN_MACRO (no temp file).' );

	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.h patched' );
}

// ---------- RichBar.rc ----------
{
	const p = ROOT + '/RichBar.rc';
	let s = fs.readFileSync( p, 'utf8' );
	if( !s.includes( '0,29,1,0' ) )  fail( 'rc does not read 0,29,1,0' );
	s = s.split( '0,29,1,0' ).join( '0,29,2,0' );
	s = s.split( '0.29.1' ).join( '0.29.2' );
	fs.writeFileSync( p, s, 'utf8' );
	console.log( 'RichBar.rc bumped' );
}

// ---------- locale rc (UTF-16LE) ----------
{
	const p = ROOT + '/mui/RichBar_loce/richbar_loce.rc';
	const buf = fs.readFileSync( p );
	if( buf[0] !== 0xFF || buf[1] !== 0xFE )  fail( 'locale rc BOM missing' );
	let s = buf.toString( 'utf16le' );
	const re = /IDS_VERSION(\s+)"0\.29\.1"/;
	if( !re.test( s ) )  fail( 'IDS_VERSION not at 0.29.1' );
	s = s.replace( re, 'IDS_VERSION$1"0.29.2"' );
	fs.writeFileSync( p, Buffer.from( s, 'utf16le' ) );
	console.log( 'locale IDS_VERSION bumped' );
}

console.log( 'ALL PATCHES OK' );
